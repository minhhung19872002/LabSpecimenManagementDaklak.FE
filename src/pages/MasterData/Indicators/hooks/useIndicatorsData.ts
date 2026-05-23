import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { message } from "antd";
import {
  indicatorGroupService,
  indicatorService,
  specimenTypeService,
  testMethodService,
  laboratoryService,
  LaboratoryDto,
  SpecimenTypeDto,
  TestMethodDto,
  IndicatorWithMethodsDto,
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

  // Filter state (multi-select)
  const [filterSpecimenTypeIds, setFilterSpecimenTypeIds] = useState<string[]>([]);
  const [filterTestMethodIds, setFilterTestMethodIds] = useState<string[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [allTestMethods, setAllTestMethods] = useState<TestMethodDto[]>([]);

  // Linked IDs (only specimenTypes/testMethods that are linked to indicators)
  const [linkedSpecimenTypeIds, setLinkedSpecimenTypeIds] = useState<Set<string>>(new Set());
  const [linkedTestMethodIds, setLinkedTestMethodIds] = useState<Set<string>>(new Set());

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
    return (laboratories || []).map((lab) => ({
      value: lab.id,
      label: lab.name + (!lab.isActive ? " (Ngừng)" : ""),
    }));
  }, [laboratories]);

  // Filter options: only show specimenTypes/testMethods linked to indicators
  const specimenTypeFilterOptions = useMemo(() => {
    return specimenTypes
      .filter((st) => linkedSpecimenTypeIds.has(st.id))
      .map((st) => ({
        value: st.id,
        label: `${st.code} - ${st.name}`,
      }));
  }, [specimenTypes, linkedSpecimenTypeIds]);

  const testMethodFilterOptions = useMemo(() => {
    return allTestMethods
      .filter((tm) => linkedTestMethodIds.has(tm.id))
      .map((tm) => ({
        value: tm.id,
        label: `${tm.code} - ${tm.name}`,
      }));
  }, [allTestMethods, linkedTestMethodIds]);

  // Fetch reference data (groups, labs, specimenTypes, testMethods, linked IDs) - once
  const fetchRefData = useCallback(async () => {
    if (refDataLoaded.current) return;
    try {
      const [groupsData, laboratoriesData, stResult, tmResult, methodsData] = await Promise.all([
        indicatorGroupService.getWithCount(),
        laboratoryService.getActive(),
        specimenTypeService.getActive(),
        testMethodService.getActive(),
        indicatorService.getWithMethods(),
      ]);
      setGroups(groupsData || []);
      setLaboratories(laboratoriesData || []);
      setSpecimenTypes(stResult.items || []);
      setAllTestMethods(tmResult.items || []);

      // Build linked sets for filter options
      const stIds = new Set<string>();
      const tmIds = new Set<string>();
      (methodsData || []).forEach((ind: IndicatorWithMethodsDto) => {
        ind.methods.forEach((m) => {
          if (m.specimenTypeId) stIds.add(m.specimenTypeId);
          tmIds.add(m.testMethodId);
        });
      });
      setLinkedSpecimenTypeIds(stIds);
      setLinkedTestMethodIds(tmIds);

      refDataLoaded.current = true;
      setExpandedRowKeys((groupsData || []).map((g: IndicatorGroupDto) => g.id));
    } catch (error) {
      console.error("Failed to fetch ref data:", error);
    }
  }, []);

  // Fetch all matching indicators in batches (pagination is at group level)
  const fetchIndicators = useCallback(async (
    search: string,
    specimenTypeIds: string[],
    testMethodIds: string[],
  ) => {
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
          specimenTypeIds: specimenTypeIds.length ? specimenTypeIds : undefined,
          testMethodIds: testMethodIds.length ? testMethodIds : undefined,
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
    await fetchIndicators(debouncedSearch, filterSpecimenTypeIds, filterTestMethodIds);
  }, [fetchRefData, fetchIndicators, debouncedSearch, filterSpecimenTypeIds, filterTestMethodIds]);

  // Initial load
  useEffect(() => {
    fetchRefData();
  }, [fetchRefData]);

  // Fetch indicators when filters change (uses debounced search)
  useEffect(() => {
    fetchIndicators(debouncedSearch, filterSpecimenTypeIds, filterTestMethodIds);
  }, [fetchIndicators, debouncedSearch, filterSpecimenTypeIds, filterTestMethodIds]);

  // Filter change handlers (reset to page 1)
  const handleFilterSpecimenTypeChange = useCallback((values: string[]) => {
    setFilterSpecimenTypeIds(values);
    setCurrentPage(1);
  }, []);

  const handleFilterTestMethodChange = useCallback((values: string[]) => {
    setFilterTestMethodIds(values);
    setCurrentPage(1);
  }, []);

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
    filterSpecimenTypeIds,
    filterTestMethodIds,
    specimenTypeFilterOptions,
    testMethodFilterOptions,
    setGroups,
    setIndicators,
    setLaboratories,
    setLoading,
    setSearchText,
    setExpandedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    setFilterSpecimenTypeIds: handleFilterSpecimenTypeChange,
    setFilterTestMethodIds: handleFilterTestMethodChange,
    handlePageChange,
    fetchData,
  };
};
