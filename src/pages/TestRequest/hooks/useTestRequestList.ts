import { useState, useEffect, useMemo, useCallback } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { testRequestService } from "../../../services/testRequestService";
import {
  importService,
  downloadBlobAsFile,
} from "../../../services/importService";
import { PATH_ROUTES } from "../../../constants";
import {
  TestRequestDto,
  TestRequestStatus,
} from "../../../types/testRequest";
import { getTestRequestColumns } from "../components/columns";
import { useActionPermission } from "../../../hooks/useActionPermission";

export const useTestRequestList = () => {
  const navigate = useNavigate();

  // Check quyền edit theo Permission Matrix (bao gồm cả quyền xóa)
  const { canAll: canEditPermission } = useActionPermission('testRequests', 'edit');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestRequestStatus | "all">(
    "all"
  );
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await testRequestService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting: "creationTime desc",
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        expectedCompletionDateFrom:
          dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
        expectedCompletionDateTo:
          dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      });
      const items = result.items || [];
      setData(items);
      setTotalCount(result.totalCount || 0);
    } catch (error: unknown) {
      console.error("Error loading test requests:", error);
      message.error(
        "Không thể tải danh sách yêu cầu thử nghiệm. Vui lòng kiểm tra kết nối server."
      );
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await importService.downloadTestRequestsTemplate();
      downloadBlobAsFile(blob, "requests-template.xlsx");
      message.success("Tải template thành công!");
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error("Không thể tải template. Vui lòng thử lại.");
    } finally {
      setDownloadingTemplate(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    setSearchText(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleStatusChange = useCallback((value: TestRequestStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      setDateRange(dates);
      setCurrentPage(1);
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await testRequestService.delete(id);
        message.success("Xóa yêu cầu thành công!");
        loadData();
      } catch (error: unknown) {
        console.error("Error deleting test request:", error);
        message.error("Không thể xóa yêu cầu. Vui lòng thử lại.");
      }
    },
    [loadData]
  );

  const handleCreate = useCallback(() => {
    navigate(PATH_ROUTES.testRequests.create);
  }, [navigate]);

  const handleEdit = useCallback(
    (record: TestRequestDto) => {
      navigate(PATH_ROUTES.testRequests.edit(record.id));
    },
    [navigate]
  );

  const handleRowDoubleClick = useCallback(
    (record: TestRequestDto) => {
      navigate(PATH_ROUTES.testRequests.detail(record.id));
    },
    [navigate]
  );

  const isUrgentRow = useCallback((record: TestRequestDto): boolean => {
    if (!record.expectedCompletionDate) return false;
    if (record.status >= TestRequestStatus.Completed) return false;
    const daysRemaining = dayjs(record.expectedCompletionDate).diff(
      dayjs(),
      "day"
    );
    return daysRemaining <= 5;
  }, []);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchText("");
    setCurrentPage(1);
  }, []);

  const openImportModal = useCallback(() => {
    setImportModalOpen(true);
  }, []);

  const closeImportModal = useCallback(() => {
    setImportModalOpen(false);
  }, []);

  const handleImportSuccess = useCallback(() => {
    setImportModalOpen(false);
    loadData();
  }, [loadData]);

  const columns = useMemo(
    () => getTestRequestColumns({
      onEdit: handleEdit,
      onDelete: handleDelete,
      canEditPermission,
    }),
    [handleEdit, handleDelete, canEditPermission]
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
    dateRange,
    importModalOpen,
    downloadingTemplate,
    columns,

    // Handlers
    loadData,
    handleDownloadTemplate,
    handleSearch,
    handleStatusChange,
    handleDateRangeChange,
    handleDelete,
    handleCreate,
    handleEdit,
    handleRowDoubleClick,
    isUrgentRow,
    handlePageChange,
    handleSearchInputChange,
    handleClearSearch,
    openImportModal,
    closeImportModal,
    handleImportSuccess,
  };
};
