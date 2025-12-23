import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Form, message, Modal } from "antd";
import dayjs from "dayjs";
import {
  useGetLaboratoryTaskListQuery,
  useUpdateLaboratoryTaskMutation,
  useDeleteLaboratoryTaskMutation,
} from "../../../store/api/laboratoryTaskApi";
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  UpdateLaboratoryTaskDto,
} from "../../../types/laboratoryTask";

export const useTaskManagementList = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LaboratoryTaskStatus | undefined>(undefined);

  // Modal states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LaboratoryTaskDto | null>(null);
  const [updateForm] = Form.useForm();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  // RTK Query hooks
  const {
    data: taskData,
    isLoading: loading,
    isFetching,
    refetch,
  } = useGetLaboratoryTaskListQuery({
    skipCount: (pagination.current - 1) * pagination.pageSize,
    maxResultCount: pagination.pageSize,
    status: statusFilter,
    search: debouncedSearch || undefined,
  });

  const [updateTask, { isLoading: isUpdating }] = useUpdateLaboratoryTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteLaboratoryTaskMutation();

  const tasks = taskData?.items || [];
  const totalCount = taskData?.totalCount || 0;

  // Statistics
  const stats = useMemo(() => ({
    total: totalCount,
    notAssigned: tasks.filter((t) => t.status === LaboratoryTaskStatus.NotAssignedMethod).length,
    assigned: tasks.filter((t) => t.status === LaboratoryTaskStatus.AssignedMethod).length,
    testing: tasks.filter((t) => t.status === LaboratoryTaskStatus.Testing).length,
    pendingApproval: tasks.filter((t) => t.status === LaboratoryTaskStatus.PendingApproval).length,
    approved: tasks.filter((t) => t.status === LaboratoryTaskStatus.Approved).length,
    resultSent: tasks.filter((t) => t.status === LaboratoryTaskStatus.ResultSent).length,
  }), [tasks, totalCount]);

  const handleSearch = (value: string) => {
    setDebouncedSearch(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? undefined : (Number(value) as LaboratoryTaskStatus));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleRefresh = () => {
    setSearchText("");
    setDebouncedSearch("");
    setStatusFilter(undefined);
    setPagination((prev) => ({ ...prev, current: 1 }));
    refetch();
  };

  const handleOpenUpdateModal = (record: LaboratoryTaskDto) => {
    setSelectedTask(record);
    updateForm.setFieldsValue({
      testDate: record.testDate ? dayjs(record.testDate) : null,
      notes: record.notes,
    });
    setUpdateModalVisible(true);
  };

  const handleCloseUpdateModal = () => {
    setUpdateModalVisible(false);
  };

  const handleUpdateTask = async () => {
    try {
      const values = await updateForm.validateFields();
      if (!selectedTask) return;

      const updateData: UpdateLaboratoryTaskDto = {
        testDate: values.testDate ? values.testDate.format("YYYY-MM-DD") : undefined,
        notes: values.notes,
      };

      await updateTask({ id: selectedTask.id, data: updateData }).unwrap();
      message.success("Cập nhật công việc thành công");
      setUpdateModalVisible(false);
    } catch (error) {
      console.error("Failed to update task:", error);
      message.error("Không thể cập nhật công việc. Vui lòng thử lại.");
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa công việc này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteTask(id).unwrap();
          message.success("Xóa công việc thành công");
        } catch (error) {
          console.error("Failed to delete task:", error);
          message.error("Không thể xóa công việc. Vui lòng thử lại.");
        }
      },
    });
  };

  const handleRowDoubleClick = (record: LaboratoryTaskDto) => {
    navigate(`/task/${record.id}`);
  };

  return {
    // Data
    tasks,
    totalCount,
    stats,
    loading,
    isFetching,
    isUpdating,
    isDeleting,

    // Filter states
    searchText,
    setSearchText,
    statusFilter,
    pagination,

    // Modal states
    updateModalVisible,
    selectedTask,
    updateForm,

    // Handlers
    handleSearch,
    handleStatusFilterChange,
    handleTableChange,
    handleRefresh,
    handleOpenUpdateModal,
    handleCloseUpdateModal,
    handleUpdateTask,
    handleDelete,
    handleRowDoubleClick,
  };
};
