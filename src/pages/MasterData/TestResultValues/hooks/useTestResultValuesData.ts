import { useState, useEffect, useMemo, useCallback } from "react";
import { message } from "antd";
import testResultValueService, {
  TestResultValueDto,
} from "../../../../services/testResultValueService";
import {
  specimenTypeService,
  indicatorGroupService,
  indicatorService,
  SpecimenTypeDto,
  IndicatorDto,
  IndicatorGroupDto,
  SpecimenTypeWithIndicatorsDto,
} from "../../../../services/masterDataService";

export interface GroupedTestResultValueData extends TestResultValueDto {
  key: string;
}

export const useTestResultValuesData = () => {
  const [testResultValues, setTestResultValues] = useState<TestResultValueDto[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [specimenTypesWithIndicators, setSpecimenTypesWithIndicators] = useState<SpecimenTypeWithIndicatorsDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  // Batch selection for indicators (keyed by testResultValueId, value is composite key: `${indicatorId}_${specimenTypeId}`)
  const [selectedIndicatorKeys, setSelectedIndicatorKeys] = useState<Record<string, string[]>>({});
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [valuesData, specimenTypesData, specimenTypesWithIndData, groupsData, indicatorsData] = await Promise.all([
        testResultValueService.getWithIndicators(),
        specimenTypeService.getActive(),
        specimenTypeService.getWithIndicators(),
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
      ]);

      setTestResultValues(valuesData || []);
      setSpecimenTypes(specimenTypesData?.items || []);
      setSpecimenTypesWithIndicators(specimenTypesWithIndData || []);
      setIndicatorGroups(groupsData || []);
      setIndicators(indicatorsData || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Không thể tải dữ liệu kết quả thử nghiệm");
      setTestResultValues([]);
      setSpecimenTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter by search text
  const filteredData = useMemo(() => {
    if (!searchText) return testResultValues;

    const lowerSearch = searchText.toLowerCase();
    return testResultValues.filter(
      (item) =>
        item.name?.toLowerCase().includes(lowerSearch) ||
        item.code?.toLowerCase().includes(lowerSearch) ||
        item.description?.toLowerCase().includes(lowerSearch) ||
        item.indicators?.some(
          (ind) =>
            ind.indicatorCode?.toLowerCase().includes(lowerSearch) ||
            ind.indicatorName?.toLowerCase().includes(lowerSearch) ||
            ind.specimenTypeName?.toLowerCase().includes(lowerSearch)
        )
    );
  }, [testResultValues, searchText]);

  // Flat list with key
  const groupedData: GroupedTestResultValueData[] = useMemo(() => {
    return filteredData.map((item) => ({
      ...item,
      key: item.id,
    }));
  }, [filteredData]);

  // Options for specimen type select
  const specimenTypeOptions = useMemo(() => {
    return specimenTypes.map((st) => ({
      value: st.id,
      label: st.name + (!st.isActive ? " (Ngừng)" : ""),
      isActive: st.isActive,
    }));
  }, [specimenTypes]);

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

  // Helper to generate composite key for indicator selection
  const getIndicatorCompositeKey = (indicatorId: string, specimenTypeId: string) => {
    return `${indicatorId}_${specimenTypeId}`;
  };

  // Helper to parse composite key
  const parseIndicatorCompositeKey = (compositeKey: string) => {
    const [indicatorId, specimenTypeId] = compositeKey.split("_");
    return { indicatorId, specimenTypeId };
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
    testResultValues,
    specimenTypes,
    loading,
    searchText,
    groupedData,
    expandedKeys,
    indicatorGroups,
    indicators,
    specimenTypeOptions,
    indicatorsByGroup,
    setSearchText,
    setExpandedKeys,
    fetchData,
    // Batch selection for indicators
    selectedIndicatorKeys,
    setSelectedIndicatorKeys,
    batchLoading,
    setBatchLoading,
    // Helper functions
    getIndicatorCompositeKey,
    parseIndicatorCompositeKey,
    getIndicatorsBySpecimenType,
  };
};
