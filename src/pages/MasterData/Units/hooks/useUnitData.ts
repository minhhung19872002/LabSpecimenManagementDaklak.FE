import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { UnitDto } from "../../../../services/masterDataService";
import { unitService } from "../../../../services/masterDataService";

const DEFAULT_PAGE_SIZE = 50;

export const useUnitData = () => {
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchData = useCallback(
    async (page?: number, size?: number) => {
      const p = page ?? currentPage;
      const s = size ?? pageSize;
      setLoading(true);
      try {
        const result = await unitService.getList({
          skipCount: (p - 1) * s,
          maxResultCount: s,
        });
        setUnits(result?.items || []);
        setTotalCount(result?.totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        message.error("Không thể tải dữ liệu đơn vị hàng hóa");
        setUnits([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Search vẫn filter local trên page hiện tại
  const filteredUnits = searchText
    ? units.filter((unit) => {
        const lowerSearch = searchText.toLowerCase();
        return (
          unit.code?.toLowerCase().includes(lowerSearch) ||
          unit.name?.toLowerCase().includes(lowerSearch)
        );
      })
    : units;

  return {
    units,
    totalCount,
    loading,
    searchText,
    currentPage,
    pageSize,
    filteredUnits,
    setSearchText,
    fetchData,
    handlePageChange,
  };
};
