import { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import {
  testMethodService,
  indicatorGroupService,
  indicatorService,
  specimenTypeService,
} from "../../../../services/masterDataService";
import {
  TestMethodWithIndicatorsDto,
  GroupedTestMethodData,
} from "../types";
import { IndicatorDto, IndicatorGroupDto, SpecimenTypeDto } from "../../../../services/masterDataService";

export const useTestMethodsData = () => {
  const [testMethods, setTestMethods] = useState<TestMethodWithIndicatorsDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Batch selection for indicators (keyed by testMethodId)
  const [selectedIndicatorKeys, setSelectedIndicatorKeys] = useState<Record<string, string[]>>({});
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [methodsData, groupsData, indicatorsData, specimenTypesData] = await Promise.all([
        testMethodService.getWithIndicators(),
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
        specimenTypeService.getActive(),
      ]);

      setTestMethods(methodsData || []);
      setIndicatorGroups(groupsData || []);
      setIndicators(indicatorsData || []);
      setSpecimenTypes(specimenTypesData?.items || []);

      // Only collapse all on initial load
      if (isInitialLoad) {
        setExpandedRowKeys([]);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Không thể tải dữ liệu phương pháp thử");
      setTestMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter by search text
  const filteredData = useMemo(() => {
    if (!searchText) return testMethods;

    const lowerSearch = searchText.toLowerCase();
    return testMethods.filter(
      (item) =>
        item.code?.toLowerCase().includes(lowerSearch) ||
        item.name?.toLowerCase().includes(lowerSearch) ||
        item.unit?.toLowerCase().includes(lowerSearch) ||
        item.indicators?.some(
          (ind) =>
            ind.indicatorCode?.toLowerCase().includes(lowerSearch) ||
            ind.indicatorName?.toLowerCase().includes(lowerSearch)
        )
    );
  }, [testMethods, searchText]);

  // Helper function to sort indicators in tree order (parent followed by its children)
  // Children must match parent's indicatorId AND specimenTypeId
  const sortIndicatorsInTreeOrder = (indicators: any[]) => {
    if (!indicators || indicators.length === 0) return indicators;

    const result: any[] = [];
    const parentIndicators = indicators.filter(ind => !ind.parentIndicatorId);
    const childIndicators = indicators.filter(ind => ind.parentIndicatorId);

    // For each parent, add it first, then add its children
    // Children should match both parentIndicatorId and specimenTypeId
    parentIndicators.forEach(parent => {
      result.push(parent);
      const children = childIndicators.filter(child =>
        child.parentIndicatorId === parent.indicatorId &&
        (child.specimenTypeId || null) === (parent.specimenTypeId || null)
      );
      result.push(...children);
    });

    // Add any orphan children (children whose parent is not in the list)
    const addedChildKeys = new Set(
      result
        .filter(ind => ind.parentIndicatorId)
        .map(ind => `${ind.indicatorId}|${ind.specimenTypeId || ''}`)
    );
    const orphanChildren = childIndicators.filter(
      child => !addedChildKeys.has(`${child.indicatorId}|${child.specimenTypeId || ''}`)
    );
    result.push(...orphanChildren);

    return result;
  };

  // Convert to grouped data for table
  const groupedData: GroupedTestMethodData[] = useMemo(() => {
    return filteredData.map((method) => ({
      ...method,
      key: method.id,
      // Sort indicators so sub-indicators appear right after their parent
      indicators: sortIndicatorsInTreeOrder(method.indicators || []),
    }));
  }, [filteredData]);

  // Options for indicator group select (for AddIndicatorsModal)
  const groupOptions = useMemo(() => {
    return indicatorGroups.map((group) => ({
      value: group.id,
      label: group.name,
      isActive: group.isActive,
    }));
  }, [indicatorGroups]);

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

  return {
    testMethods,
    loading,
    searchText,
    groupedData,
    expandedRowKeys,
    indicatorGroups,
    indicators,
    specimenTypes,
    groupOptions,
    indicatorsByGroup,
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
