import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import {
  subcontractorService,
  GetSubcontractorListInput,
} from "../../../services/subcontractorService";
import { isQueuedOffline, type OfflineSyncInfo } from "../../../services/offline/createOfflineService";
import { useReloadOnSync } from "../../../hooks/useReloadOnSync";
import { subcontractorSchema, SubcontractorFormData } from "../schemas";
import { getSubcontractorColumns } from "../components/columns";

export interface Subcontractor extends OfflineSyncInfo {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  taxCode: string;
  status: "active" | "inactive";
  capabilities: string[];
  certifications: Certification[];
  evaluationScore: number;
  contractStartDate: string;
  contractEndDate: string;
  notes?: string;
  createdAt: string;
}

export interface Certification {
  id: string;
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  status: "valid" | "expired" | "expiring";
}

export const ALL_CAPABILITIES = [
  "Xét nghiệm COVID-19 khẳng định",
  "Giải trình tự gen virus",
  "Xét nghiệm bệnh nhiệt đới",
  "Xét nghiệm HIV khẳng định",
  "Xét nghiệm Viêm gan B/C",
  "Nuôi cấy vi khuẩn đặc biệt",
  "Kiểm nghiệm vắc xin",
  "Kiểm nghiệm sinh phẩm",
  "Thử nghiệm sinh học",
  "Đánh giá an toàn sinh phẩm",
  "Xét nghiệm kháng thuốc",
  "PCR định lượng virus",
  "Western Blot",
  "ELISA chuyên sâu",
];

const parseCapabilities = (
  capabilities: string | string[] | null | undefined
): string[] => {
  if (!capabilities) return [];
  if (Array.isArray(capabilities)) return capabilities;
  try {
    const parsed = JSON.parse(capabilities);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const useSubcontractorList = () => {
  // List state
  const [data, setData] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Search & filter state
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subcontractor | null>(null);
  const [selectedItem, setSelectedItem] = useState<Subcontractor | null>(null);

  // React Hook Form
  const form = useForm<SubcontractorFormData>({
    resolver: yupResolver(subcontractorSchema),
    defaultValues: {
      status: "active",
      capabilities: [],
    },
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetSubcontractorListInput = {
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        filter: searchText || undefined,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      };

      const result = await subcontractorService.getListWithPending(params);
      const items = result.items.map((sub: any) => ({
        id: sub.id,
        code: sub.code,
        name: sub.name,
        address: sub.address,
        phone: sub.phone,
        email: sub.email,
        contactPerson: sub.contactPerson,
        taxCode: sub.taxCode,
        status: (sub.isActive === false ? "inactive" : "active") as "active" | "inactive",
        capabilities: parseCapabilities(sub.capabilities),
        certifications: sub.certifications || [],
        evaluationScore: sub.evaluationScore || 0,
        contractStartDate: sub.contractStartDate,
        contractEndDate: sub.contractEndDate,
        notes: sub.notes,
        createdAt: sub.creationTime,
        _isUnsyncedCreate: sub._isUnsyncedCreate,
        syncStatus: sub.syncStatus,
        syncError: sub.syncError,
      }));
      setData(items);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Error loading subcontractors:", error);
      message.error("Không thể tải danh sách nhà thầu phụ.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useReloadOnSync(loadData);

  // Search handlers
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleSearch = useCallback(() => {
    setSearchText(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setCurrentPage(1);
  }, []);

  // Filter handlers
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  // Pagination
  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  // Refresh
  const handleRefresh = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setStatusFilter("all");
    setCurrentPage(1);
  }, []);

  // CRUD handlers
  const handleCreate = useCallback(() => {
    setEditingItem(null);
    form.reset({
      code: `NTP-${dayjs().format("YYYYMMDD")}-${String(data.length + 1).padStart(3, "0")}`,
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      taxCode: "",
      address: "",
      capabilities: [],
      status: "active",
      contractStartDate: new Date(),
      contractEndDate: dayjs().add(1, "year").toDate(),
      notes: "",
    });
    setIsModalOpen(true);
  }, [form, data.length]);

  const handleEdit = useCallback(
    (record: Subcontractor) => {
      setEditingItem(record);
      form.reset({
        code: record.code,
        name: record.name,
        contactPerson: record.contactPerson,
        phone: record.phone,
        email: record.email || "",
        taxCode: record.taxCode || "",
        address: record.address || "",
        capabilities: record.capabilities || [],
        status: record.status,
        contractStartDate: record.contractStartDate
          ? new Date(record.contractStartDate)
          : null,
        contractEndDate: record.contractEndDate
          ? new Date(record.contractEndDate)
          : null,
        notes: record.notes || "",
      });
      setIsModalOpen(true);
    },
    [form]
  );

  const handleView = useCallback((record: Subcontractor) => {
    setSelectedItem(record);
    setIsDetailModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const { queued } = await subcontractorService.delete(id);
        message.success(
          queued
            ? "Đã xóa nhà thầu phụ trên máy, sẽ đồng bộ lên máy chủ khi có mạng"
            : "Xóa nhà thầu phụ thành công!"
        );
        loadData();
      } catch (error) {
        console.error("Error deleting subcontractor:", error);
        message.error("Không thể xóa nhà thầu phụ.");
      }
    },
    [loadData]
  );

  // Modal handlers
  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.reset();
  }, [form]);

  const handleModalSubmit = useCallback(
    async (formData: SubcontractorFormData) => {
      try {
        const capabilitiesJson =
          formData.capabilities && formData.capabilities.length > 0
            ? JSON.stringify(formData.capabilities)
            : null;

        const payload = {
          name: formData.name,
          address: formData.address || "",
          phone: formData.phone,
          // BE [EmailAddress] chỉ cho null, chuỗi rỗng bị 400 → trống thì không gửi
          email: formData.email || undefined,
          contactPerson: formData.contactPerson,
          taxCode: formData.taxCode || "",
          isActive: formData.status === "active",
          capabilities: capabilitiesJson,
          contractStartDate: formData.contractStartDate
            ? dayjs(formData.contractStartDate).toISOString()
            : undefined,
          contractEndDate: formData.contractEndDate
            ? dayjs(formData.contractEndDate).toISOString()
            : undefined,
          notes: formData.notes || "",
        };

        if (editingItem) {
          const updated = await subcontractorService.update(editingItem.id, payload);
          message.success(
            isQueuedOffline(updated)
              ? "Đã lưu thay đổi nhà thầu phụ trên máy, sẽ đồng bộ lên máy chủ khi có mạng"
              : "Cập nhật nhà thầu phụ thành công!"
          );
        } else {
          const created = await subcontractorService.create(payload);
          message.success(
            isQueuedOffline(created)
              ? "Đã lưu nhà thầu phụ trên máy, sẽ đồng bộ lên máy chủ khi có mạng"
              : "Thêm nhà thầu phụ thành công!"
          );
        }

        setIsModalOpen(false);
        form.reset();
        loadData();
      } catch (error) {
        console.error("Error saving subcontractor:", error);
        message.error("Không thể lưu nhà thầu phụ.");
      }
    },
    [editingItem, form, loadData]
  );

  const handleDetailModalClose = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  }, []);

  // Columns
  const columns = useMemo(
    () =>
      getSubcontractorColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete]
  );

  return {
    // Data
    data,
    loading,
    totalCount,

    // Search & filter
    searchInput,
    statusFilter,
    handleSearchInputChange,
    handleSearch,
    handleClearSearch,
    handleStatusFilterChange,

    // Pagination
    currentPage,
    pageSize,
    handlePageChange,

    // Modal
    isModalOpen,
    isDetailModalOpen,
    editingItem,
    selectedItem,
    form,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
    handleDetailModalClose,

    // Table
    columns,
    handleRefresh,
  };
};
