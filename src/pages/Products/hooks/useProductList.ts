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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await productService.getList({
        page: currentPage,
        limit: pageSize,
        search: searchText || undefined,
        productType: productTypeFilter,
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
  }, [currentPage, pageSize, searchText, productTypeFilter]);

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

  const handleProductTypeChange = (value: ProductType | undefined) => {
    setProductTypeFilter(value);
    setCurrentPage(1);
  };

  return {
    products,
    totalCount,
    loading,
    searchText,
    productTypeFilter,
    currentPage,
    pageSize,
    setSearchText: handleSearch,
    setProductTypeFilter: handleProductTypeChange,
    fetchData,
    handlePageChange,
  };
};
