import { useState, useEffect, useMemo, useCallback } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { offlineTestRequestService } from "../../../services/testRequestService";
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
import { useNetworkStatus } from "../../../hooks/useNetworkStatus";
import { isServerReachable } from "../../../services/offline/connectivity";
import { cacheApprovedIndicators } from "../../../services/offline/offlineResultService";
import { cacheTestRequest } from "../../../services/offline/db";

// Statuses that have no results yet -> skip caching approved indicators.
const NO_RESULT_STATUSES = new Set<TestRequestStatus>([
  TestRequestStatus.New,
  TestRequestStatus.PendingPayment,
  TestRequestStatus.Paid,
  TestRequestStatus.SampleSent,
  TestRequestStatus.Cancelled,
]);

/**
 * Background, best-effort: while online, cache approved indicators for the
 * printable test requests currently listed, so result/request forms can be
 * generated OFFLINE later without opening each phiếu first. Throttled (3
 * concurrent); all failures ignored.
 */
async function prefetchApprovedForOffline(items: TestRequestDto[]): Promise<void> {
  if (!(await isServerReachable())) return;
  const queue = items.filter((r) => r?.id && !NO_RESULT_STATUSES.has(r.status));
  const worker = async () => {
    for (;;) {
      const it = queue.shift();
      if (!it) break;
      try {
        const inds = await testRequestService.getApprovedIndicators(it.id);
        if (inds && inds.length) await cacheApprovedIndicators(it.id, inds);
      } catch {
        /* best-effort */
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}

/**
 * Background, best-effort: while online, cache the FULL detail (with
 * Samples + indicators) for the test requests currently listed. The list
 * endpoint only returns a summary DTO (no Samples — see
 * GetFilteredListAsync), so caching list items alone overwrites any richer
 * detail previously cached and leaves "In phiếu TN" with an empty sample
 * table offline. Throttled (3 concurrent); all failures ignored.
 */
async function prefetchFullDetailForOffline(items: TestRequestDto[]): Promise<void> {
  if (!(await isServerReachable())) return;
  const queue = items.filter((r) => r?.id);
  const worker = async () => {
    for (;;) {
      const it = queue.shift();
      if (!it) break;
      try {
        const full = await testRequestService.get(it.id);
        await cacheTestRequest(full.id, full, false);
      } catch {
        /* best-effort */
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}

export const useTestRequestList = () => {
  const navigate = useNavigate();

  // Network status for offline support
  const { isOnline } = useNetworkStatus();

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
  const [sorting, setSorting] = useState("contractDate desc");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  // Track if data is from offline cache
  const [isOfflineData, setIsOfflineData] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await offlineTestRequestService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        sorting,
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        expectedCompletionDateFrom:
          dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
        expectedCompletionDateTo:
          dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      });
      const items = response.data.items || [];
      setData(items);
      setTotalCount(response.data.totalCount || 0);
      setIsOfflineData(response.isOfflineData);
      // While online, pre-cache approved indicators for offline printing so the
      // user doesn't have to open each phiếu first (background, best-effort).
      if (!response.isOfflineData) {
        void prefetchApprovedForOffline(items);
        void prefetchFullDetailForOffline(items);
      }
    } catch (error: unknown) {
      console.error("Error loading test requests:", error);
      message.error(
        "Không thể tải danh sách yêu cầu thử nghiệm. Vui lòng kiểm tra kết nối server."
      );
      setData([]);
      setTotalCount(0);
      setIsOfflineData(false);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter, dateRange, sorting]);

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

  const handleSortChange = useCallback((value: string) => {
    setSorting(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      setDateRange(dates);
      setCurrentPage(1);
    },
    []
  );

  const handleCreate = useCallback(() => {
    window.open(PATH_ROUTES.testRequests.create, "_blank");
  }, []);

  const handleEdit = useCallback(
    (record: TestRequestDto) => {
      navigate(PATH_ROUTES.testRequests.edit(record.id));
    },
    [navigate]
  );

  const handleRowDoubleClick = useCallback(
    (record: TestRequestDto) => {
      window.open(PATH_ROUTES.testRequests.detail(record.id), "_blank");
    },
    []
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
      canEditPermission,
    }),
    [handleEdit, canEditPermission]
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
    sorting,
    dateRange,
    importModalOpen,
    downloadingTemplate,
    columns,
    // Offline support
    isOnline,
    isOfflineData,

    // Handlers
    loadData,
    handleDownloadTemplate,
    handleSearch,
    handleStatusChange,
    handleSortChange,
    handleDateRangeChange,
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
