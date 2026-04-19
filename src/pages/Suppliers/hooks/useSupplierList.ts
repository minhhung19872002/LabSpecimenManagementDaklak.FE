import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { message } from "antd";
import { supplierService, SupplierDto } from "../../../services/supplierService";

const DEFAULT_PAGE_SIZE = 50;
const DEBOUNCE_MS = 400;

export const useSupplierList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [supplierGroupFilter, setSupplierGroupFilter] = useState<string | undefined>(undefined);
  const [sorting, setSorting] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supplierService.getList({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        supplierGroup: supplierGroupFilter,
        sorting: sorting || undefined,
      });
      setSuppliers(result?.items || []);
      setTotalCount(result?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      message.error("Không thể tải danh sách nhà cung cấp");
      setSuppliers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, supplierGroupFilter, sorting]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.has("search")) {
      searchParams.delete("search");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, DEBOUNCE_MS);
  };

  const handleSupplierGroupChange = (value: string | undefined) => {
    setSupplierGroupFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (field: string, order: "ascend" | "descend" | null) => {
    if (!field || !order) {
      setSorting("");
    } else {
      setSorting(`${field} ${order === "ascend" ? "asc" : "desc"}`);
    }
  };

  return {
    suppliers,
    totalCount,
    loading,
    searchText,
    supplierGroupFilter,
    currentPage,
    pageSize,
    setSearchText: handleSearch,
    handleSupplierGroupChange,
    handleSortChange,
    fetchData,
    handlePageChange,
  };
};
