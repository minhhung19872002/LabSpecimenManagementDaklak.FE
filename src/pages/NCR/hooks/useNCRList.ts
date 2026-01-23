import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import {
  ncrService,
  NCRDto,
  CreateNCRDto,
  UpdateNCRDto,
  NCRType,
  NCRSeverity,
  NCRStatus,
} from "../../../services/ncrService";
import {
  departmentService,
  DepartmentDto,
} from "../../../services/masterDataService";
import { ncrSchema, NCRFormData } from "../schemas";
import { getNCRColumns } from "../components/columns";

export interface NCRDisplay extends NCRDto {
  reportedByName?: string;
  assignedToName?: string;
  closedByName?: string;
}

export const NCR_TYPES = [
  { value: NCRType.Equipment, label: "Thiết bị", color: "#FA8C16" },
  { value: NCRType.Process, label: "Quy trình", color: "#EB2F96" },
  { value: NCRType.Personnel, label: "Nhân sự", color: "#722ED1" },
  { value: NCRType.Environment, label: "Môi trường", color: "#13C2C2" },
  { value: NCRType.Material, label: "Vật liệu", color: "#1890FF" },
  { value: NCRType.Other, label: "Khác", color: "#8C8C8C" },
];

export const SEVERITY_CONFIG: Record<number, { color: string; text: string }> = {
  [NCRSeverity.Minor]: { color: "#52C41A", text: "Nhẹ" },
  [NCRSeverity.Major]: { color: "#FA8C16", text: "Nghiêm trọng" },
  [NCRSeverity.Critical]: { color: "#F5222D", text: "Rất nghiêm trọng" },
};

export const STATUS_CONFIG: Record<number, { color: string; text: string }> = {
  [NCRStatus.Open]: { color: "#F5222D", text: "Mở" },
  [NCRStatus.InProgress]: { color: "#1890FF", text: "Đang xử lý" },
  [NCRStatus.Resolved]: { color: "#FA8C16", text: "Đã giải quyết" },
  [NCRStatus.Closed]: { color: "#52C41A", text: "Đã đóng" },
  [NCRStatus.Cancelled]: { color: "#8C8C8C", text: "Đã hủy" },
};

export const useNCRList = () => {
  // List state
  const [data, setData] = useState<NCRDisplay[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Search & filter
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<NCRStatus | undefined>(undefined);

  // Stats
  const [openCount, setOpenCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NCRDisplay | null>(null);
  const [selectedItem, setSelectedItem] = useState<NCRDisplay | null>(null);

  // React Hook Form
  const form = useForm<NCRFormData>({
    resolver: yupResolver(ncrSchema),
    defaultValues: {
      type: NCRType.Other,
      severity: NCRSeverity.Minor,
      status: NCRStatus.Open,
    },
  });

  // Load stats (all NCRs without filter)
  const loadStats = useCallback(async () => {
    try {
      const response = await ncrService.getList({ maxResultCount: 1000 });
      const allData = response.items;
      setOpenCount(allData.filter((n) => n.status === NCRStatus.Open).length);
      setInProgressCount(allData.filter((n) => n.status === NCRStatus.InProgress).length);
      setClosedCount(allData.filter((n) => n.status === NCRStatus.Closed).length);
    } catch (error) {
      console.error("Failed to load NCR stats:", error);
    }
  }, []);

  // Load data with filters
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ncrService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "creationTime desc",
        search: searchText || undefined,
        status: statusFilter,
      });
      setData(response.items);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("Failed to load NCRs:", error);
      message.error("Không thể tải danh sách NCR. Vui lòng thử lại.");
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter]);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getActive();
      setDepartments(response.items);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadDepartments();
  }, [loadStats, loadDepartments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSearch = useCallback(() => {
    setSearchText(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: NCRStatus | undefined) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.reset({
      title: "",
      description: "",
      type: NCRType.Other,
      severity: NCRSeverity.Minor,
      status: NCRStatus.Open,
      department: "",
      relatedEntityCode: "",
      assignedToId: "",
      rootCause: "",
      correctiveAction: "",
      preventiveAction: "",
      dueDate: dayjs().add(7, "day").toDate(),
      notes: "",
    });
    setIsModalOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    (record: NCRDisplay) => {
      if (record.status === NCRStatus.Closed || record.status === NCRStatus.Cancelled) {
        return;
      }
      setEditingItem(record);
      form.reset({
        title: record.title,
        description: record.description,
        type: record.type,
        severity: record.severity,
        status: record.status,
        department: record.department || "",
        relatedEntityCode: record.relatedEntityCode || "",
        assignedToId: record.assignedToId || "",
        rootCause: record.rootCause || "",
        correctiveAction: record.correctiveAction || "",
        preventiveAction: record.preventiveAction || "",
        dueDate: record.dueDate ? new Date(record.dueDate) : new Date(),
        notes: record.notes || "",
      });
      setIsModalOpen(true);
    },
    [form]
  );

  const handleView = useCallback((record: NCRDisplay) => {
    setSelectedItem(record);
    setIsDetailOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await ncrService.delete(id);
        message.success("Đã xóa NCR");
        loadData();
        loadStats();
      } catch (error) {
        console.error("Failed to delete NCR:", error);
        message.error("Không thể xóa NCR. Vui lòng thử lại.");
      }
    },
    [loadData, loadStats]
  );

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.reset();
  }, [form]);

  const handleModalSubmit = useCallback(
    async (formData: NCRFormData) => {
      try {
        if (editingItem) {
          const updateData: UpdateNCRDto = {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            severity: formData.severity,
            status: formData.status,
            assignedToId: formData.assignedToId || undefined,
            department: formData.department || undefined,
            relatedEntityCode: formData.relatedEntityCode || undefined,
            rootCause: formData.rootCause || undefined,
            correctiveAction: formData.correctiveAction || undefined,
            preventiveAction: formData.preventiveAction || undefined,
            dueDate: dayjs(formData.dueDate).toISOString(),
            notes: formData.notes || undefined,
          };
          await ncrService.update(editingItem.id, updateData);
          message.success("Đã cập nhật NCR");
        } else {
          const createData: CreateNCRDto = {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            severity: formData.severity,
            department: formData.department || undefined,
            relatedEntityCode: formData.relatedEntityCode || undefined,
            dueDate: dayjs(formData.dueDate).toISOString(),
            notes: formData.notes || undefined,
          };
          await ncrService.create(createData);
          message.success("Đã tạo NCR mới");
        }

        setIsModalOpen(false);
        form.reset();
        loadData();
        loadStats();
      } catch (error) {
        console.error("Failed to save NCR:", error);
        message.error("Không thể lưu NCR. Vui lòng thử lại.");
      }
    },
    [editingItem, form, loadData, loadStats]
  );

  const handleDetailClose = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedItem(null);
  }, []);

  // Columns
  const columns = useMemo(
    () =>
      getNCRColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete]
  );

  return {
    // Data
    data,
    departments,
    loading,
    totalCount,
    currentPage,
    pageSize,

    // Stats
    openCount,
    inProgressCount,
    closedCount,

    // Search & filter
    searchInput,
    statusFilter,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusFilterChange,
    handlePageChange,

    // Modal
    isModalOpen,
    isDetailOpen,
    editingItem,
    selectedItem,
    form,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
    handleDetailClose,

    // Table
    columns,
    loadData,
  };
};
