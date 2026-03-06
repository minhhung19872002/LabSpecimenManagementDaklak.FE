import { useState, useEffect, useCallback, useMemo } from "react";
import { message, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { laboratoryTaskService } from "../../../services/laboratoryTaskService";
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  GetLaboratoryTaskListDto,
  TaskStatusStatisticsDto,
} from "../../../types/laboratoryTask";
import { PATH_ROUTES, STORAGE_KEYS } from "../../../constants";
import { getTaskManagementColumns } from "../components/columns";
import { useActionPermission } from "../../../hooks/useActionPermission";

export const useTaskManagementList = () => {
  const navigate = useNavigate();

  // Check quyền theo Permission Matrix - chỉ QLKT có quyền xóa (assignTesting bao gồm quyền xóa)
  const { canAll: canDeletePermission } = useActionPermission('tasks', 'assignTesting');

  const [tasks, setTasks] = useState<LaboratoryTaskDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    LaboratoryTaskStatus | undefined
  >(undefined);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  const currentUser = useMemo(() => {
    try {
      const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch {
      return null;
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (!currentUser) return;

      const params: GetLaboratoryTaskListDto = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        status: statusFilter,
        search: searchText || undefined,
      };

      const result = await laboratoryTaskService.getList(params);

      setTasks(result.items);
      setPagination((prev) => {
        if (prev.total === result.totalCount) return prev;
        return { ...prev, total: result.totalCount };
      });
    } catch (error) {
      console.error("Failed to load laboratory tasks:", error);
      message.error("Không thể tải danh sách công việc. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.current,
    pagination.pageSize,
    statusFilter,
    searchText,
    currentUser,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics - loaded separately from API (not affected by filters)
  const [stats, setStats] = useState({
    total: 0,
    underEvaluation: 0,
    waitingCustomerResponse: 0,
    accepted: 0,
    assigned: 0,
    inProgress: 0,
    waitingApproval: 0,
    approved: 0,
    sentToQuality: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const result: TaskStatusStatisticsDto = await laboratoryTaskService.getTaskStatusStatistics();
      setStats({
        total: result.total,
        underEvaluation: result.underEvaluation,
        waitingCustomerResponse: result.waitingCustomerResponse,
        accepted: result.fullyAccepted + result.partialAccepted,
        assigned: result.assigned,
        inProgress: result.inProgress,
        waitingApproval: result.waitingApproval,
        approved: result.approved,
        sentToQuality: result.sentToQuality,
      });
    } catch (error) {
      console.error("Failed to load task statistics:", error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(
      value === "all" ? undefined : (Number(value) as LaboratoryTaskStatus)
    );
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleTableChange = useCallback((paginationConfig: {
    current?: number;
    pageSize?: number;
  }) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current || prev.current,
      pageSize: paginationConfig.pageSize || prev.pageSize,
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    setSearchText("");
    setStatusFilter(undefined);
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData();
    loadStats();
  }, [loadData, loadStats]);

  const handleDelete = useCallback(
    (id: string) => {
      Modal.confirm({
        title: "Xác nhận xóa",
        content: "Bạn có chắc chắn muốn xóa công việc này?",
        okText: "Xóa",
        okType: "danger",
        cancelText: "Hủy",
        centered: true,
        onOk: async () => {
          try {
            await laboratoryTaskService.delete(id);
            message.success("Xóa công việc thành công");
            loadData();
            loadStats();
          } catch (error) {
            console.error("Failed to delete task:", error);
            message.error("Không thể xóa công việc. Vui lòng thử lại.");
          }
        },
      });
    },
    [loadData, loadStats]
  );

  const handleRowDoubleClick = useCallback(
    (record: LaboratoryTaskDto) => {
      navigate(PATH_ROUTES.tasks.detail(record.id));
    },
    [navigate]
  );

  // Helper to check if task is urgent (< 5 days remaining and not done)
  const isTaskUrgent = useCallback((record: LaboratoryTaskDto) => {
    if (!record.requestCompletionDate) return false;
    if (
      record.status === LaboratoryTaskStatus.Approved ||
      record.status === LaboratoryTaskStatus.SentToQuality
    )
      return false;
    const daysRemaining = dayjs(record.requestCompletionDate).diff(
      dayjs(),
      "day"
    );
    return daysRemaining < 5;
  }, []);

  // Helper to check if task has been waiting too long (>= 2 days since transfer and still UnderEvaluation)
  const isTaskDelayed = useCallback((record: LaboratoryTaskDto) => {
    if (!record.transferDate) return false;
    if (record.status !== LaboratoryTaskStatus.UnderEvaluation) return false;
    const daysSinceTransfer = dayjs().diff(dayjs(record.transferDate), "day");
    return daysSinceTransfer >= 2;
  }, []);

  const getRowClassName = useCallback(
    (record: LaboratoryTaskDto) => {
      if (isTaskUrgent(record)) return "urgent-row";
      if (isTaskDelayed(record)) return "delayed-row";
      return "";
    },
    [isTaskUrgent, isTaskDelayed]
  );

  const columns = useMemo(
    () => getTaskManagementColumns({
      onDelete: handleDelete,
      canDeletePermission,
    }),
    [handleDelete, canDeletePermission]
  );

  return {
    // State
    tasks,
    loading,
    searchText,
    statusFilter,
    pagination,
    stats,
    columns,

    // Handlers
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleStatusFilterChange,
    handleTableChange,
    handleRefresh,
    handleDelete,
    handleRowDoubleClick,
    getRowClassName,
  };
};
