import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { specimenHistoryService } from "../../../services/specimenHistoryService";
import { specimenService } from "../../../services/specimenService";
import { storageLocationService } from "../../../services/masterDataService";
import { userService, UserLookupDto } from "../../../services/userService";
import {
  SpecimenHistoryDto,
  SpecimenStatus,
} from "../../../types/specimenHistory";
import {
  specimenHistorySchema,
  SpecimenHistoryFormData,
} from "../schemas";
import { getSpecimenHistoryColumns } from "../components/columns";

export const ACTION_OPTIONS = [
  "Tiếp nhận mẫu",
  "Chuyển vào kho lạnh",
  "Lấy mẫu thử nghiệm",
  "Hoàn tất thử nghiệm",
  "Chuyển lưu kho",
  "Chuẩn bị hủy mẫu",
  "Đã hủy mẫu",
  "Trả mẫu cho khách hàng",
];

export const useSpecimenHistoryList = () => {
  const navigate = useNavigate();

  // List state
  const [data, setData] = useState<SpecimenHistoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<SpecimenStatus | "all">("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecimenHistoryDto | null>(null);

  // Master data
  const [specimens, setSpecimens] = useState<{ id: string; code: string; name: string }[]>([]);
  const [storageLocations, setStorageLocations] = useState<{ id: string; code: string; name: string }[]>([]);
  const [users, setUsers] = useState<UserLookupDto[]>([]);

  // React Hook Form
  const form = useForm<SpecimenHistoryFormData>({
    resolver: yupResolver(specimenHistorySchema),
    defaultValues: {
      status: SpecimenStatus.Received,
      timestamp: new Date(),
    },
  });

  const loadMasterData = useCallback(async () => {
    try {
      const [specimensResult, locationsResult] = await Promise.all([
        specimenService.getList({ maxResultCount: 1000 }),
        storageLocationService.getActive(),
      ]);
      setSpecimens(specimensResult.items || []);
      setStorageLocations(locationsResult.items || []);
    } catch (error) {
      console.error("Error loading specimens/locations:", error);
    }

    try {
      const usersResult = await userService.getLookup();
      setUsers(usersResult || []);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await specimenHistoryService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "creationTime desc",
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (error) {
      console.error("Error loading specimen histories:", error);
      message.error("Không thể tải lịch sử mẫu. Vui lòng kiểm tra kết nối server.");
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleStatusChange = useCallback((value: SpecimenStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await specimenHistoryService.delete(id);
        message.success("Xóa lịch sử thành công!");
        loadData();
      } catch (error) {
        console.error("Error deleting specimen history:", error);
        message.error("Không thể xóa lịch sử. Vui lòng thử lại.");
      }
    },
    [loadData]
  );

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.reset({
      status: SpecimenStatus.Received,
      timestamp: new Date(),
      specimenId: "",
      action: "",
      location: "",
      performedById: null,
      temperature: null,
      humidity: null,
      notes: null,
    });
    setIsModalOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    (record: SpecimenHistoryDto) => {
      setEditingItem(record);
      form.reset({
        specimenId: record.specimenId,
        action: record.action,
        location: record.location,
        status: record.status,
        performedById: record.performedById || null,
        temperature: record.temperature || null,
        humidity: record.humidity || null,
        timestamp: record.timestamp ? new Date(record.timestamp) : null,
        notes: record.notes || null,
      });
      setIsModalOpen(true);
    },
    [form]
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/specimen-histories/${id}`);
    },
    [navigate]
  );

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.reset();
  }, [form]);

  const handleModalSubmit = useCallback(
    async (formData: SpecimenHistoryFormData) => {
      try {
        const payload = {
          specimenId: formData.specimenId,
          action: formData.action,
          location: formData.location,
          status: formData.status,
          notes: formData.notes || "",
          performedById: formData.performedById || undefined,
          temperature: formData.temperature || undefined,
          humidity: formData.humidity || undefined,
          timestamp: formData.timestamp
            ? dayjs(formData.timestamp).toISOString()
            : undefined,
        };

        if (editingItem) {
          await specimenHistoryService.update(editingItem.id, payload);
          message.success("Cập nhật lịch sử thành công!");
        } else {
          await specimenHistoryService.create(payload);
          message.success("Thêm lịch sử mới thành công!");
        }
        setIsModalOpen(false);
        setEditingItem(null);
        form.reset();
        loadData();
      } catch (error) {
        console.error("Error saving specimen history:", error);
        message.error("Không thể lưu lịch sử. Vui lòng thử lại.");
      }
    },
    [editingItem, form, loadData]
  );

  const columns = useMemo(
    () =>
      getSpecimenHistoryColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete]
  );

  return {
    // List state
    data,
    loading,
    totalCount,
    currentPage,
    pageSize,
    searchInput,
    statusFilter,
    columns,

    // Modal state
    isModalOpen,
    editingItem,
    form,

    // Master data
    specimens,
    storageLocations,
    users,

    // Handlers
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusChange,
    handlePageChange,
    handleDelete,
    handleCreate,
    handleEdit,
    handleView,
    handleModalCancel,
    handleModalSubmit,
  };
};
