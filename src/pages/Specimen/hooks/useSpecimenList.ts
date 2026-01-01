import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { sampleStorageService } from "../../../services/sampleStorageService";
import type { SampleStorageDto } from "../../../types/sampleStorage";
import { SampleStorageStatus } from "../../../types/sampleStorage";
import { getSpecimenColumns } from "../components/columns";

export const useSpecimenList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleStorageDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<SampleStorageStatus | "all">(
    "all"
  );

  // Modal state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await sampleStorageService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setData(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (error: unknown) {
      console.error("Error loading sample storage:", error);
      message.error("Không thể tải danh sách quản lý mẫu.");
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter]);

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

  const handleStatusChange = useCallback((value: SampleStorageStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleRowDoubleClick = useCallback((record: SampleStorageDto) => {
    setSelectedId(record.id);
    setModalOpen(true);
  }, []);

  const handleViewClick = useCallback((record: SampleStorageDto) => {
    setSelectedId(record.id);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedId(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const getRowClassName = useCallback((record: SampleStorageDto) => {
    return record.status === SampleStorageStatus.PendingDisposal
      ? "row-pending-disposal"
      : "";
  }, []);

  const columns = useMemo(
    () => getSpecimenColumns({ onView: handleViewClick }),
    [handleViewClick]
  );

  return {
    // State
    loading,
    data,
    totalCount,
    currentPage,
    pageSize,
    searchInput,
    statusFilter,
    selectedId,
    modalOpen,
    columns,

    // Handlers
    loadData,
    handleSearch,
    handleSearchInputChange,
    handleClearSearch,
    handleStatusChange,
    handleRowDoubleClick,
    handleViewClick,
    handleModalClose,
    handleModalSuccess,
    handlePageChange,
    getRowClassName,
  };
};
