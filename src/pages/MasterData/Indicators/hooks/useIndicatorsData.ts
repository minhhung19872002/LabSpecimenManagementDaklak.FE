import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { message } from "antd";
import {
  indicatorGroupService,
  indicatorService,
  laboratoryService,
  LaboratoryDto,
} from "../../../../services/masterDataService";
import { IndicatorGroupDto, IndicatorDto, GroupedIndicatorData } from "../types";

const DEBOUNCE_MS = 400;

export const useIndicatorsData = () => {
  const [groups, setGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [laboratories, setLaboratories] = useState<LaboratoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Computed options for Select
  const groupOptions = useMemo(() => {
    return (groups || []).map((group) => ({
      value: group.id,
      label: group.name + (!group.isActive ? " (Ngừng)" : ""),
    }));
  }, [groups]);

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
      setExpandedRowKeys((groupsData || []).map((g: IndicatorGroupDto) => g.id));
    } catch (error) {
      console.error("Failed to fetch ref data:", error);
    }
  }, []);

  // Fetch all matching indicators in batches (pagination is at group level)
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

  // Group indicators by group, then paginate at group level
  const allGroupedData: GroupedIndicatorData[] = useMemo(() => {
    return (groups || [])
      .map((group) => {
        const parentIndicators = (indicators || []).filter(
          (ind) => ind.indicatorGroupId === group.id && !ind.parentIndicatorId
        );
        return {
          ...group,
          key: group.id,
          indicators: parentIndicators,
        };
      })
      .filter((group) => group.indicators.length > 0);
  }, [groups, indicators]);

  const groupTotalCount = allGroupedData.length;

  const groupedData: GroupedIndicatorData[] = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allGroupedData.slice(start, start + pageSize);
  }, [allGroupedData, currentPage, pageSize]);

  return {
    groups,
    indicators,
    laboratories,
    loading,
    searchText,
    expandedRowKeys,
    selectedRowKeys,
    batchLoading,
    groupOptions,
    laboratoryOptions,
    groupedData,
    totalCount: groupTotalCount,
    currentPage,
    pageSize,
    setGroups,
    setIndicators,
    setLaboratories,
    setLoading,
    setSearchText,
    setExpandedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    handlePageChange,
    fetchData,
  };
};
