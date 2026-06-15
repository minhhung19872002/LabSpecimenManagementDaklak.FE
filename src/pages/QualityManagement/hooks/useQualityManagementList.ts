import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { qualityManagementService } from "../../../services/qualityManagementService";
import { laboratoryService, LaboratoryDto } from "../../../services/masterDataService";
import {
  QualityManagementTaskDto,
  QualityManagementStatus,
  QualityManagementStatisticsDto,
  QualityTaskType,
} from "../../../types/qualityManagement";
import { getQualityManagementColumns } from "../components/columns";

export const useQualityManagementList = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<QualityManagementTaskDto[]>([]);
  const [statistics, setStatistics] =
    useState<QualityManagementStatisticsDto | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sorting, setSorting] = useState("ContractDate desc");
  const [statusFilter, setStatusFilter] = useState<
    QualityManagementStatus | undefined
  >(undefined);
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [laboratoryIds, setLaboratoryIds] = useState<string[]>([]);
  const [laboratories, setLaboratories] = useState<LaboratoryDto[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Load master data
  useEffect(() => {
    laboratoryService.getActive().then(setLaboratories).catch(console.error);
  }, []);

  // History Modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] =
    useState<QualityManagementTaskDto | null>(null);

  // Change Approval Modal
  const [changeApprovalModalVisible, setChangeApprovalModalVisible] =
    useState(false);
  const [selectedChangeApprovalTaskId, setSelectedChangeApprovalTaskId] =
    useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksResult, statsResult] = await Promise.all([
        qualityManagementService.getList({
          skipCount: (pagination.current - 1) * pagination.pageSize,
          maxResultCount: pagination.pageSize,
          sorting,
          search: searchText || undefined,
          status: statusFilter,
          isOverdue: overdueFilter || undefined,
          fromDate: dateRange?.[0]?.startOf('day').format('YYYY-MM-DD') || undefined,
          toDate: dateRange?.[1]?.endOf('day').format('YYYY-MM-DD') || undefined,
          laboratoryIds: laboratoryIds.length > 0 ? laboratoryIds : undefined,
        }),
        qualityManagementService.getStatistics(),
      ]);

      setTasks(tasksResult.items);
      setPagination((prev) => ({ ...prev, total: tasksResult.totalCount }));
      setStatistics(statsResult);
    } catch (error) {
      console.error("Error loading data:", error);
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, sorting, statusFilter, overdueFilter, dateRange, laboratoryIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSorting(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleStatusFilter = useCallback(
    (value: QualityManagementStatus | undefined) => {
      setStatusFilter(value);
      setOverdueFilter(false);
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    []
  );

  const handleOverdueFilter = useCallback(
    (value: boolean) => {
      setOverdueFilter(value);
      if (value) setStatusFilter(undefined);
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    []
  );

  const handleDateRangeChange = useCallback(
    (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
      if (dates && dates[0] && dates[1]) {
        setDateRange([dates[0], dates[1]]);
      } else {
        setDateRange(null);
      }
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    []
  );

  const handleLaboratoryChange = useCallback(
    (values: string[]) => {
      setLaboratoryIds(values);
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    []
  );

  const handleTableChange = useCallback(
    (paginationConfig: { current?: number; pageSize?: number }) => {
      setPagination((prev) => ({
        current: paginationConfig.current || prev.current,
        pageSize: paginationConfig.pageSize || prev.pageSize,
        total: prev.total,
      }));
    },
    []
  );

  const handleRowDoubleClick = useCallback(
    (record: QualityManagementTaskDto) => {
      if (record.taskType === QualityTaskType.ChangeApproval) {
        setSelectedChangeApprovalTaskId(record.id);
        setChangeApprovalModalVisible(true);
      } else {
        navigate(`/quality-management/${record.id}`);
      }
    },
    [navigate]
  );

  const handleViewHistory = useCallback(
    (record: QualityManagementTaskDto, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedTask(record);
      setHistoryModalVisible(true);
    },
    []
  );

  const handleViewChangeApproval = useCallback(
    (record: QualityManagementTaskDto, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedChangeApprovalTaskId(record.id);
      setChangeApprovalModalVisible(true);
    },
    []
  );

  // Check if row is urgent (RequestCompletionDate - now <= 2 days)
  const isUrgent = useCallback((record: QualityManagementTaskDto): boolean => {
    if (!record.requestCompletionDate) return false;
    // Không cảnh báo urgent nếu đã HandedOver (hoàn thành)
    if (record.status === QualityManagementStatus.HandedOver) return false;
    const daysRemaining = dayjs(record.requestCompletionDate).diff(
      dayjs(),
      "day"
    );
    return daysRemaining <= 2;
  }, []);

  const closeHistoryModal = useCallback(() => {
    setHistoryModalVisible(false);
    setSelectedTask(null);
  }, []);

  const closeChangeApprovalModal = useCallback(() => {
    setChangeApprovalModalVisible(false);
    setSelectedChangeApprovalTaskId(null);
  }, []);

  const columns = useMemo(
    () =>
      getQualityManagementColumns({
        onViewHistory: handleViewHistory,
        onViewChangeApproval: handleViewChangeApproval,
      }),
    [handleViewHistory, handleViewChangeApproval]
  );

  return {
    // State
    loading,
    tasks,
    statistics,
    searchText,
    sorting,
    statusFilter,
    overdueFilter,
    dateRange,
    laboratoryIds,
    laboratories,
    pagination,
    historyModalVisible,
    selectedTask,
    changeApprovalModalVisible,
    selectedChangeApprovalTaskId,
    columns,

    // Handlers
    loadData,
    handleSearch,
    handleSortChange,
    handleStatusFilter,
    handleOverdueFilter,
    handleDateRangeChange,
    handleLaboratoryChange,
    handleTableChange,
    handleRowDoubleClick,
    handleViewHistory,
    handleViewChangeApproval,
    isUrgent,
    closeHistoryModal,
    closeChangeApprovalModal,
  };
};
