import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { supplierService, SupplierDto } from "../../../services/supplierService";

const DEFAULT_PAGE_SIZE = 50;

export const useSupplierList = () => {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supplierService.getList({
        page: currentPage,
        limit: pageSize,
        search: searchText || undefined,
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
  }, [currentPage, pageSize, searchText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  return {
    suppliers,
    totalCount,
    loading,
    searchText,
    currentPage,
    pageSize,
    setSearchText: handleSearch,
    fetchData,
    handlePageChange,
  };
};
