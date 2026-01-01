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
  { value: NCRType.Equipment, label: "Thiết bị", color: "orange" },
  { value: NCRType.Process, label: "Quy trình", color: "magenta" },
  { value: NCRType.Personnel, label: "Nhân sự", color: "purple" },
  { value: NCRType.Environment, label: "Môi trường", color: "cyan" },
  { value: NCRType.Material, label: "Vật liệu", color: "blue" },
  { value: NCRType.Other, label: "Khác", color: "default" },
];

export const SEVERITY_CONFIG: Record<number, { color: string; text: string }> = {
  [NCRSeverity.Minor]: { color: "green", text: "Nhẹ" },
  [NCRSeverity.Major]: { color: "orange", text: "Nghiêm trọng" },
  [NCRSeverity.Critical]: { color: "red", text: "Rất nghiêm trọng" },
};

export const STATUS_CONFIG: Record<number, { color: string; text: string }> = {
  [NCRStatus.Open]: { color: "red", text: "Mở" },
  [NCRStatus.InProgress]: { color: "blue", text: "Đang xử lý" },
  [NCRStatus.Resolved]: { color: "orange", text: "Đã giải quyết" },
  [NCRStatus.Closed]: { color: "green", text: "Đã đóng" },
  [NCRStatus.Cancelled]: { color: "default", text: "Đã hủy" },
};

export const useNCRList = () => {
  // List state
  const [data, setData] = useState<NCRDisplay[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & filter
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

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

  // Stats
  const openCount = useMemo(
    () => data.filter((n) => n.status === NCRStatus.Open).length,
    [data]
  );
  const inProgressCount = useMemo(
    () => data.filter((n) => n.status === NCRStatus.InProgress).length,
    [data]
  );
  const closedCount = useMemo(
    () => data.filter((n) => n.status === NCRStatus.Closed).length,
    [data]
  );

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ncrService.getList({ maxResultCount: 1000 });
      setData(response.items);
    } catch (error) {
      console.error("Failed to load NCRs:", error);
      message.error("Không thể tải danh sách NCR. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getActive();
      setDepartments(response.items);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadDepartments();
  }, [loadData, loadDepartments]);

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((n) => {
      const matchSearch =
        n.ncrNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        n.title.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = statusFilter === null || n.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, searchText, statusFilter]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleStatusFilterChange = useCallback((value: number | null) => {
    setStatusFilter(value);
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
      } catch (error) {
        console.error("Failed to delete NCR:", error);
        message.error("Không thể xóa NCR. Vui lòng thử lại.");
      }
    },
    [loadData]
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
      } catch (error) {
        console.error("Failed to save NCR:", error);
        message.error("Không thể lưu NCR. Vui lòng thử lại.");
      }
    },
    [editingItem, form, loadData]
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
    data: filteredData,
    departments,
    loading,

    // Stats
    openCount,
    inProgressCount,
    closedCount,

    // Search & filter
    searchText,
    statusFilter,
    handleSearchChange,
    handleStatusFilterChange,

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
