import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { message } from "antd";
import {
  indicatorGroupService,
  indicatorService,
  laboratoryService,
  LaboratoryDto,
} from "../../../../services/masterDataService";
import { IndicatorGroupDto, IndicatorDto } from "../types";
import { UNGROUPED_ID, UNGROUPED_NAME } from "../../../../utils/indicatorGroups";

const DEBOUNCE_MS = 400;

/** Giá trị lọc nhóm: "all" = tất cả, UNGROUPED_ID = chỉ tiêu chưa phân nhóm, còn lại = id nhóm */
export const ALL_GROUPS = "all";

export const useIndicatorsData = () => {
  const [groups, setGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [laboratories, setLaboratories] = useState<LaboratoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [groupFilter, setGroupFilterState] = useState<string>(ALL_GROUPS);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Ref data (loaded once)
  const refDataLoaded = useRef(false);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const setGroupFilter = useCallback((value: string) => {
    setGroupFilterState(value);
    setCurrentPage(1);
  }, []);

  // Options cho Select nhóm trong modal thêm/sửa chỉ tiêu (không có nhánh ảo)
  const groupOptions = useMemo(() => {
    return (groups || []).map((group) => ({
      value: group.id,
      label: group.name + (!group.isActive ? " (Ngừng)" : ""),
    }));
  }, [groups]);

  // Options cho bộ lọc nhóm trên bảng
  const groupFilterOptions = useMemo(
    () => [
      { value: ALL_GROUPS, label: "Tất cả nhóm" },
      { value: UNGROUPED_ID, label: UNGROUPED_NAME },
      ...groupOptions,
    ],
    [groupOptions],
  );

  const laboratoryOptions = useMemo(() => {
    const VISIBLE_LABS = ["lab vi sinh", "lab hóa"];
    return (laboratories || [])
      .filter((lab) => lab.isActive && VISIBLE_LABS.includes(lab.name.toLowerCase()))
      .map((lab) => ({
        value: lab.id,
        label: lab.name,
      }));
  }, [laboratories]);

  // Fetch reference data (groups, labs) - once
  const fetchRefData = useCallback(async () => {
    if (refDataLoaded.current) return;
    try {
      const [groupsData, laboratoriesData] = await Promise.all([
        indicatorGroupService.getWithCount(),
        laboratoryService.getActive(),
      ]);
      setGroups(groupsData || []);
      setLaboratories(laboratoriesData || []);
      refDataLoaded.current = true;
    } catch (error) {
      console.error("Failed to fetch ref data:", error);
    }
  }, []);

  // Fetch all matching indicators in batches (lọc nhóm + phân trang ở client)
  const fetchIndicators = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const batchSize = 1000;
      const allItems: IndicatorDto[] = [];
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await indicatorService.getList({
          skipCount: skip,
          maxResultCount: batchSize,
          search: search || undefined,
        });
        allItems.push(...(result.items || []));
        skip += batchSize;
        hasMore = allItems.length < result.totalCount;
      }

      setIndicators(allItems);
    } catch (error) {
      console.error("Failed to fetch indicators:", error);
      message.error("Không thể tải dữ liệu chỉ tiêu");
      setIndicators([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Combined fetch (for initial load and after mutations)
  const fetchData = useCallback(async () => {
    refDataLoaded.current = false;
    await fetchRefData();
    await fetchIndicators(debouncedSearch);
  }, [fetchRefData, fetchIndicators, debouncedSearch]);

  // Initial load
  useEffect(() => {
    fetchRefData();
  }, [fetchRefData]);

  // Fetch indicators when search changes (debounced)
  useEffect(() => {
    fetchIndicators(debouncedSearch);
  }, [fetchIndicators, debouncedSearch]);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  // Danh sách phẳng chỉ tiêu cha (chỉ tiêu phụ hiển thị qua số đếm / modal sửa)
  const filteredIndicators: IndicatorDto[] = useMemo(() => {
    return (indicators || []).filter((ind) => {
      if (ind.parentIndicatorId) return false;
      if (groupFilter === ALL_GROUPS) return true;
      if (groupFilter === UNGROUPED_ID) return !ind.indicatorGroupId;
      return ind.indicatorGroupId === groupFilter;
    });
  }, [indicators, groupFilter]);

  const pagedIndicators: IndicatorDto[] = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIndicators.slice(start, start + pageSize);
  }, [filteredIndicators, currentPage, pageSize]);

  return {
    groups,
    indicators,
    laboratories,
    loading,
    searchText,
    groupFilter,
    selectedRowKeys,
    batchLoading,
    groupOptions,
    groupFilterOptions,
    laboratoryOptions,
    pagedIndicators,
    totalCount: filteredIndicators.length,
    currentPage,
    pageSize,
    setGroups,
    setIndicators,
    setLaboratories,
    setLoading,
    setSearchText,
    setGroupFilter,
    setSelectedRowKeys,
    setBatchLoading,
    handlePageChange,
    fetchData,
  };
};
