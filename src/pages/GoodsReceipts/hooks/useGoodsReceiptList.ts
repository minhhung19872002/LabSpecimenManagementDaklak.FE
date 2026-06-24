import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import { getApiErrorMessage } from "../../../utils/errorHandler";
import {
  goodsReceiptService,
  GoodsReceiptListDto,
  GoodsReceiptOrderStatus,
  GoodsReceiptStatisticsDto,
  GoodsReceiptType,
} from "../../../services/goodsReceiptService";

const DEFAULT_PAGE_SIZE = 50;
const DEBOUNCE_MS = 400;

export const useGoodsReceiptList = () => {
  const [data, setData] = useState<GoodsReceiptListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<GoodsReceiptOrderStatus | undefined>();
  const [receiptTypeFilter, setReceiptTypeFilter] = useState<GoodsReceiptType | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [sorting, setSorting] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [stats, setStats] = useState<GoodsReceiptStatisticsDto>({ pendingApproval: 0, ordering: 0, waitingReceipt: 0, rejected: 0 });
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadStats = useCallback(async () => {
    try {
      const result = await goodsReceiptService.getStatistics();
      setStats(result);
    } catch {
      console.error("Failed to load statistics");
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await goodsReceiptService.getList({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sorting: sorting || undefined,
        orderStatus: orderStatusFilter,
        receiptType: receiptTypeFilter,
        fromDate: dateRange?.[0],
        toDate: dateRange?.[1],
      });
      setData(result?.items || []);
      setTotalCount(result?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch goods receipts:", error);
      message.error(getApiErrorMessage(error, "Không thể tải danh sách phiếu nhập hàng"));
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, sorting, orderStatusFilter, receiptTypeFilter, dateRange]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleSortChange = (field: string, order: "ascend" | "descend" | null) => {
    if (!field || !order) {
      setSorting("");
    } else {
      setSorting(`${field} ${order === "ascend" ? "asc" : "desc"}`);
    }
    setCurrentPage(1);
  };

  const handleOrderStatusChange = (value: GoodsReceiptOrderStatus | undefined) => {
    setOrderStatusFilter(value);
    setCurrentPage(1);
  };

  const handleReceiptTypeChange = (value: GoodsReceiptType | undefined) => {
    setReceiptTypeFilter(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: [string, string] | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  return {
    data,
    totalCount,
    loading,
    searchText,
    orderStatusFilter,
    receiptTypeFilter,
    dateRange,
    currentPage,
    pageSize,
    stats,
    setSearchText: handleSearch,
    handleOrderStatusChange,
    handleReceiptTypeChange,
    handleDateRangeChange,
    handleSortChange,
    fetchData,
    loadStats,
    handlePageChange,
  };
};
