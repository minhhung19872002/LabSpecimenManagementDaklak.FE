import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { productService, ProductDto, ProductType } from "../../../services/productService";

const DEFAULT_PAGE_SIZE = 50;

export const useProductList = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | undefined>(undefined);
  const [isDraftFilter, setIsDraftFilter] = useState<boolean | undefined>(undefined);
  const [sorting, setSorting] = useState<string | undefined>(undefined);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchData = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const result = await productService.getList({
        page: currentPage,
        limit: pageSize,
        search: searchText || undefined,
        productType: productTypeFilter,
        isDraft: isDraftFilter,
        sorting: sorting,
        warehouseId: warehouseId,
      });
      setProducts(result?.items || []);
      setTotalCount(result?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      message.error("Không thể tải danh sách sản phẩm");
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, productTypeFilter, isDraftFilter, sorting, warehouseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleProductTypeChange = (value: ProductType | undefined) => {
    setProductTypeFilter(value);
    setCurrentPage(1);
  };

  const handleIsDraftChange = (value: boolean | undefined) => {
    setIsDraftFilter(value);
    setCurrentPage(1);
  };

  const handleWarehouseChange = (value: string | undefined) => {
    setWarehouseId(value);
    setCurrentPage(1);
  };

  const handleSortChange = (field: string, order: "ascend" | "descend" | null) => {
    if (!order) {
      setSorting(undefined);
    } else {
      const dir = order === "ascend" ? "asc" : "desc";
      setSorting(`${field} ${dir}`);
    }
    setCurrentPage(1);
  };

  return {
    products,
    totalCount,
    loading,
    searchText,
    productTypeFilter,
    isDraftFilter,
    sorting,
    warehouseId,
    currentPage,
    pageSize,
    setSearchText: handleSearch,
    setProductTypeFilter: handleProductTypeChange,
    setIsDraftFilter: handleIsDraftChange,
    setWarehouseId: handleWarehouseChange,
    handleSortChange,
    fetchData,
    handlePageChange,
  };
};
