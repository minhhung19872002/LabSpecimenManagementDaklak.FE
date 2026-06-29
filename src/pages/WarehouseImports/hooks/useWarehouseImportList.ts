import { useState, useEffect, useCallback, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import { message } from "antd";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import {
  warehouseImportReceiptService,
  WarehouseImportReceiptListDto,
  WarehouseImportReceiptDisplayStatusFilter,
  WarehouseImportReceiptStatisticsDto,
} from "../../../services/warehouseImportReceiptService";

const DEFAULT_PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

const STATS_FROM = dayjs().subtract(30, "day");
const STATS_TO = dayjs();

export const useWarehouseImportList = () => {
  const [data, setData] = useState<WarehouseImportReceiptListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [displayStatusFilter, setDisplayStatusFilter] = useState<WarehouseImportReceiptDisplayStatusFilter | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<[Dayjs, Dayjs] | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [stats, setStats] = useState<WarehouseImportReceiptStatisticsDto>({ totalReceipts: 0, defectiveLots: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statCardSelected, setStatCardSelected] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    warehouseImportReceiptService
      .getStatistics(STATS_FROM.format("YYYY-MM-DD"), STATS_TO.format("YYYY-MM-DD"))
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch(() => {
        console.error("Failed to load warehouse import statistics");
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await warehouseImportReceiptService.getList({
        skipCount: (currentPage - 1) * pageSize,
        maxResultCount: pageSize,
        search: debouncedSearch || undefined,
        displayStatus: displayStatusFilter,
        fromDate: filterDateRange?.[0]?.format("YYYY-MM-DD"),
        toDate: filterDateRange?.[1]?.format("YYYY-MM-DD"),
      });
      setData(result?.items || []);
      setTotalCount(result?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch warehouse import receipts:", error);
      message.error(getApiErrorMessage(error, "Không thể tải danh sách phiếu nhập kho"));
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, displayStatusFilter, filterDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, DEBOUNCE_MS);
  };

  const handleDisplayStatusChange = (value: WarehouseImportReceiptDisplayStatusFilter | undefined) => {
    setDisplayStatusFilter(value);
    setStatCardSelected(false);
    setCurrentPage(1);
  };

  const handleFilterDateRangeChange = (range: [Dayjs, Dayjs] | null) => {
    setFilterDateRange(range && range[0] && range[1] ? range : undefined);
    setStatCardSelected(false);
    setCurrentPage(1);
  };

  const handleStatCardClick = (value: WarehouseImportReceiptDisplayStatusFilter) => {
    if (statCardSelected && displayStatusFilter === value) {
      setStatCardSelected(false);
      setDisplayStatusFilter(undefined);
      setFilterDateRange(undefined);
    } else {
      setStatCardSelected(true);
      setDisplayStatusFilter(value);
      setFilterDateRange([STATS_FROM, STATS_TO]);
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  return {
    data,
    totalCount,
    loading,
    searchText,
    displayStatusFilter,
    statCardSelected,
    filterDateRange,
    currentPage,
    pageSize,
    stats,
    statsLoading,
    setSearchText: handleSearch,
    handleDisplayStatusChange,
    handleFilterDateRangeChange,
    handleStatCardClick,
    handlePageChange,
    fetchData,
  };
};
