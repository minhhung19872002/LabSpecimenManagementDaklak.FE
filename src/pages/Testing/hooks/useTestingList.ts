import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { testingService } from "../../../services/testingService";
import { laboratoryTaskService } from "../../../services/laboratoryTaskService";
import {
  TestingListDto,
  TestingStatus,
  TestingTabType,
} from "../../../types/testing";
import { UserLookupDto } from "../../../types/laboratoryTask";
import { getTestingColumns } from "../components/columns";

export const useTestingList = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TestingListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestingStatus | undefined>(
    undefined
  );
  const [technicianFilter, setTechnicianFilter] = useState<string[]>([]);

  // Active tab state
  const [activeTab, setActiveTab] = useState<TestingTabType>(
    TestingTabType.MyAssignments
  );

  // Technicians for filter dropdown
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Load technicians for filter
  useEffect(() => {
    const loadTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const result = await laboratoryTaskService.getTechniciansByLaboratory();
        setTechnicians(result || []);
      } catch (error) {
        console.error("Failed to load technicians:", error);
      } finally {
        setLoadingTechnicians(false);
      }
    };
    loadTechnicians();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await testingService.getList({
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        tab: activeTab,
        search: searchText || undefined,
        statuses: statusFilter !== undefined ? [statusFilter] : undefined,
        technicianIds:
          technicianFilter.length > 0 ? technicianFilter : undefined,
      });

      setTasks(result.items);
      setPagination((prev) => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error("Failed to load testing tasks:", error);
      message.error("Không thể tải danh sách xét nghiệm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.current,
    pagination.pageSize,
    activeTab,
    searchText,
    statusFilter,
    technicianFilter,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics
  const stats = useMemo(
    () => ({
      total: pagination.total,
      notStarted: tasks.filter((t) => t.testingStatus === TestingStatus.NotStarted)
        .length,
      inProgress: tasks.filter(
        (t) => t.testingStatus === TestingStatus.InProgress
      ).length,
      pendingApproval: tasks.filter(
        (t) => t.testingStatus === TestingStatus.PendingApproval
      ).length,
      rejected: tasks.filter((t) => t.testingStatus === TestingStatus.Rejected)
        .length,
      completed: tasks.filter((t) => t.testingStatus === TestingStatus.Completed)
        .length,
    }),
    [tasks, pagination.total]
  );

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleStatusFilterChange = useCallback(
    (value: TestingStatus | undefined) => {
      setStatusFilter(value);
      setPagination((prev) => ({ ...prev, current: 1 }));
    },
    []
  );

  const handleTechnicianFilterChange = useCallback((values: string[]) => {
    setTechnicianFilter(values);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(Number(key) as TestingTabType);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleTableChange = useCallback(
    (paginationConfig: { current?: number; pageSize?: number }) => {
      setPagination((prev) => ({
        ...prev,
        current: paginationConfig.current || prev.current,
        pageSize: paginationConfig.pageSize || prev.pageSize,
      }));
    },
    []
  );

  const handleRefresh = useCallback(() => {
    setSearchText("");
    setStatusFilter(undefined);
    setTechnicianFilter([]);
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData();
  }, [loadData]);

  const handleRowDoubleClick = useCallback(
    (record: TestingListDto) => {
      // Truyền viewMode=lab khi xem từ tab "Công việc của Lab" (All)
      const viewMode = activeTab === TestingTabType.All ? "lab" : "my";
      navigate(`/testing/${record.laboratoryTaskId}?view=${viewMode}`);
    },
    [navigate, activeTab]
  );

  const getRowClassName = useCallback((record: TestingListDto) => {
    // Highlight đỏ cho:
    // 1. Hợp đồng khẩn cấp (isUrgent) và chưa hoàn thành
    // 2. Trạng thái "Chưa bắt đầu" hoặc "Đang thử nghiệm"
    const isUrgentAndNotCompleted =
      record.isUrgent && record.testingStatus !== TestingStatus.Completed;
    const isNotStartedOrInProgress =
      record.testingStatus === TestingStatus.NotStarted ||
      record.testingStatus === TestingStatus.InProgress;

    return isUrgentAndNotCompleted || isNotStartedOrInProgress ? "urgent-row" : "";
  }, []);

  const columns = useMemo(() => getTestingColumns(), []);

  return {
    // State
    tasks,
    loading,
    searchText,
    statusFilter,
    technicianFilter,
    technicians,
    loadingTechnicians,
    pagination,
    stats,
    columns,
    activeTab,

    // Handlers
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleStatusFilterChange,
    handleTechnicianFilterChange,
    handleTabChange,
    handleTableChange,
    handleRefresh,
    handleRowDoubleClick,
    getRowClassName,
  };
};
