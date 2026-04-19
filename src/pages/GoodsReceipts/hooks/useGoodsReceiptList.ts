import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import {
  goodsReceiptService,
  GoodsReceiptListDto,
  GoodsReceiptWarehouseStatus,
  GoodsReceiptOrderStatus,
  GoodsReceiptPaymentStatus,
} from "../../../services/goodsReceiptService";

const DEFAULT_PAGE_SIZE = 50;
const DEBOUNCE_MS = 400;

export const useGoodsReceiptList = () => {
  const [data, setData] = useState<GoodsReceiptListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState<GoodsReceiptWarehouseStatus | undefined>();
  const [orderStatusFilter, setOrderStatusFilter] = useState<GoodsReceiptOrderStatus | undefined>();
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<GoodsReceiptPaymentStatus | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [sorting, setSorting] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await goodsReceiptService.getList({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sorting: sorting || undefined,
        warehouseStatus: warehouseStatusFilter,
        orderStatus: orderStatusFilter,
        paymentStatus: paymentStatusFilter,
        fromDate: dateRange?.[0],
        toDate: dateRange?.[1],
      });
      setData(result?.items || []);
      setTotalCount(result?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch goods receipts:", error);
      message.error("Không thể tải danh sách phiếu nhập hàng");
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, sorting, warehouseStatusFilter, orderStatusFilter, paymentStatusFilter, dateRange]);

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

  const handleWarehouseStatusChange = (value: GoodsReceiptWarehouseStatus | undefined) => {
    setWarehouseStatusFilter(value);
    setCurrentPage(1);
  };

  const handleOrderStatusChange = (value: GoodsReceiptOrderStatus | undefined) => {
    setOrderStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePaymentStatusChange = (value: GoodsReceiptPaymentStatus | undefined) => {
    setPaymentStatusFilter(value);
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
    warehouseStatusFilter,
    orderStatusFilter,
    paymentStatusFilter,
    dateRange,
    currentPage,
    pageSize,
    setSearchText: handleSearch,
    handleWarehouseStatusChange,
    handleOrderStatusChange,
    handlePaymentStatusChange,
    handleDateRangeChange,
    handleSortChange,
    fetchData,
    handlePageChange,
  };
};
