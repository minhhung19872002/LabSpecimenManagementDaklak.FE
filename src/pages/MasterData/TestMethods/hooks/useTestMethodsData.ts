import { useState, useEffect, useMemo, useCallback } from "react";
import { message } from "antd";
import {
  testMethodService,
  indicatorGroupService,
  indicatorService,
  specimenTypeService,
} from "../../../../services/masterDataService";
import { TestMethodDto } from "../../../../services/masterDataService";
import { IndicatorDto, IndicatorGroupDto, SpecimenTypeDto, SpecimenTypeWithIndicatorsDto } from "../../../../services/masterDataService";
import { groupIndicatorsByGroup } from "../../../../utils/indicatorGroups";

export const useTestMethodsData = () => {
  const [allTestMethods, setAllTestMethods] = useState<TestMethodDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [specimenTypesWithIndicators, setSpecimenTypesWithIndicators] = useState<SpecimenTypeWithIndicatorsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [methodsData, groupsData, indicatorsData, specimenTypesData, specimenTypesWithIndsData] = await Promise.all([
        testMethodService.getAll(),
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
        specimenTypeService.getActive(),
        specimenTypeService.getWithIndicators(),
      ]);

      setAllTestMethods(methodsData || []);
      setIndicatorGroups(groupsData || []);
      setIndicators(indicatorsData || []);
      setSpecimenTypes(specimenTypesData?.items || []);
      setSpecimenTypesWithIndicators(specimenTypesWithIndsData || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Không thể tải dữ liệu phương pháp thử");
      setAllTestMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sort by creation time descending (newest first), then filter by search text
  const filteredData = useMemo(() => {
    const sorted = [...allTestMethods].sort((a, b) => {
      const timeA = a.creationTime ? new Date(a.creationTime).getTime() : 0;
      const timeB = b.creationTime ? new Date(b.creationTime).getTime() : 0;
      return timeB - timeA;
    });

    if (!searchText) return sorted;

    const lowerSearch = searchText.toLowerCase();
    return allTestMethods.filter(
      (item) =>
        item.code?.toLowerCase().includes(lowerSearch) ||
        item.name?.toLowerCase().includes(lowerSearch) ||
        item.unit?.toLowerCase().includes(lowerSearch)
    );
  }, [allTestMethods, searchText]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Options for indicator group select (for AddIndicatorsModal)
  const groupOptions = useMemo(() => {
    return indicatorGroups.map((group) => ({
      value: group.id,
      label: group.name,
      isActive: group.isActive,
    }));
  }, [indicatorGroups]);

  // Group indicators by group for selection
  // Chỉ tiêu không nhóm → khóa UNGROUPED_ID (nhánh "Chưa phân nhóm")
  const indicatorsByGroup = useMemo(
    () => groupIndicatorsByGroup(indicators.filter((indicator) => indicator.isActive)),
    [indicators],
  );

  // Get specimen types that have a specific indicator linked
  const getSpecimenTypesByIndicator = useCallback((indicatorId: string): SpecimenTypeDto[] => {
    const specimenTypeIds = new Set<string>();

    specimenTypesWithIndicators.forEach(st => {
      const hasIndicator = st.indicators?.some(
        sti => sti.indicatorId === indicatorId && sti.isActive
      );
      if (hasIndicator && st.isActive) {
        specimenTypeIds.add(st.id);
      }
    });

    return specimenTypes.filter(st => st.isActive && specimenTypeIds.has(st.id));
  }, [specimenTypesWithIndicators, specimenTypes]);

  // Get indicators that are linked to a specific specimen type
  const getIndicatorsBySpecimenType = useCallback((specimenTypeId: string): IndicatorDto[] => {
    const specimenTypeWithIndicators = specimenTypesWithIndicators.find(
      st => st.id === specimenTypeId && st.isActive
    );

    if (!specimenTypeWithIndicators?.indicators) {
      return [];
    }

    const indicatorIds = new Set(
      specimenTypeWithIndicators.indicators
        .filter(sti => sti.isActive)
        .map(sti => sti.indicatorId)
    );

    return indicators.filter(ind => ind.isActive && indicatorIds.has(ind.id));
  }, [specimenTypesWithIndicators, indicators]);

  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  }, []);

  return {
    testMethods: paginatedData,
    totalCount: filteredData.length,
    loading,
    searchText,
    currentPage,
    pageSize,
    indicatorGroups,
    indicators,
    specimenTypes,
    specimenTypesWithIndicators,
    groupOptions,
    indicatorsByGroup,
    getSpecimenTypesByIndicator,
    getIndicatorsBySpecimenType,
    setSearchText,
    handlePageChange,
    fetchData,
    batchLoading,
    setBatchLoading,
  };
};
