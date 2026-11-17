import { useState, useEffect, useMemo, useCallback } from "react";
import { message } from "antd";
import {
  standardService,
  testMethodService,
  indicatorGroupService,
  indicatorService,
  specimenTypeService,
} from "../../../../services/masterDataService";
import {
  StandardWithIndicatorsDto,
  GroupedStandardData,
} from "../types";
import {
  IndicatorDto,
  IndicatorGroupDto,
  TestMethodWithIndicatorsDto,
  SpecimenTypeDto,
  SpecimenTypeWithIndicatorsDto,
} from "../../../../services/masterDataService";

export const useStandardsData = () => {
  const [standards, setStandards] = useState<StandardWithIndicatorsDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [testMethods, setTestMethods] = useState<TestMethodWithIndicatorsDto[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [specimenTypesWithIndicators, setSpecimenTypesWithIndicators] = useState<SpecimenTypeWithIndicatorsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Batch selection for indicators (keyed by standardId)
  const [selectedIndicatorKeys, setSelectedIndicatorKeys] = useState<Record<string, string[]>>({});
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [standardsData, groupsData, indicatorsData, methodsData, specimenTypesActiveData, specimenTypesWithIndsData] = await Promise.all([
        standardService.getWithIndicators(true),
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
        testMethodService.getWithIndicators(),
        specimenTypeService.getActive(),
        specimenTypeService.getWithIndicators(),
      ]);

      setStandards(standardsData || []);
      setIndicatorGroups(groupsData || []);
      setIndicators(indicatorsData || []);
      setTestMethods(methodsData || []);
      setSpecimenTypes(specimenTypesActiveData?.items || []);
      setSpecimenTypesWithIndicators(specimenTypesWithIndsData || []);

      // Only collapse all on initial load
      if (isInitialLoad) {
        setExpandedRowKeys([]);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Không thể tải dữ liệu tiêu chuẩn");
      setStandards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter by search text
  const filteredData = useMemo(() => {
    if (!searchText) return standards;

    const lowerSearch = searchText.toLowerCase();
    return standards.filter(
      (item) =>
        item.code?.toLowerCase().includes(lowerSearch) ||
        item.name?.toLowerCase().includes(lowerSearch) ||
        item.limitDescription?.toLowerCase().includes(lowerSearch) ||
        item.indicators?.some(
          (ind) =>
            ind.indicatorName?.toLowerCase().includes(lowerSearch) ||
            ind.testMethodName?.toLowerCase().includes(lowerSearch) ||
            ind.unit?.toLowerCase().includes(lowerSearch)
        )
    );
  }, [standards, searchText]);

  // Convert to grouped data for table
  const groupedData: GroupedStandardData[] = useMemo(() => {
    return filteredData.map((standard) => ({
      ...standard,
      key: standard.id,
    }));
  }, [filteredData]);

  // Group indicators by group for selection
  const indicatorsByGroup = useMemo(() => {
    const grouped: Record<string, IndicatorDto[]> = {};
    indicators.forEach((indicator) => {
      if (indicator.isActive) {
        const groupId = indicator.indicatorGroupId;
        if (!grouped[groupId]) {
          grouped[groupId] = [];
        }
        grouped[groupId].push(indicator);
      }
    });
    return grouped;
  }, [indicators]);

  // Get test methods that contain a specific indicator
  const getMethodsForIndicator = (indicatorId: string) => {
    return testMethods.filter(
      (method) =>
        method.isActive &&
        method.indicators?.some((ind) => ind.indicatorId === indicatorId)
    );
  };

  // Get indicators belonging to a specific specimen type (nền mẫu)
  // Returns only active parent indicators that are linked to this specimen type
  const getIndicatorsBySpecimenType = useCallback((specimenTypeId: string): IndicatorDto[] => {
    const specimenType = specimenTypesWithIndicators.find(st => st.id === specimenTypeId);
    if (!specimenType) return [];

    // Get indicator IDs that are linked to this specimen type and active
    const linkedIndicatorIds = new Set(
      specimenType.indicators
        ?.filter(sti => sti.isActive)
        ?.map(sti => sti.indicatorId) || []
    );

    // Return active parent indicators that are in the linked set
    return indicators.filter(
      ind => ind.isActive && !ind.parentIndicatorId && linkedIndicatorIds.has(ind.id)
    );
  }, [specimenTypesWithIndicators, indicators]);

  return {
    standards,
    loading,
    searchText,
    groupedData,
    expandedRowKeys,
    indicatorGroups,
    indicators,
    testMethods,
    specimenTypes,
    specimenTypesWithIndicators,
    indicatorsByGroup,
    getMethodsForIndicator,
    getIndicatorsBySpecimenType,
    setSearchText,
    setExpandedRowKeys,
    fetchData,
    // Batch selection for indicators
    selectedIndicatorKeys,
    setSelectedIndicatorKeys,
    batchLoading,
    setBatchLoading,
  };
};
