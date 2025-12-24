import { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import {
  testMethodService,
  indicatorGroupService,
  indicatorService,
} from "../../../../services/masterDataService";
import {
  TestMethodWithIndicatorsDto,
  GroupedTestMethodData,
} from "../types";
import { IndicatorDto, IndicatorGroupDto } from "../../../../services/masterDataService";

export const useTestMethodsData = () => {
  const [testMethods, setTestMethods] = useState<TestMethodWithIndicatorsDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [methodsData, groupsData, indicatorsData] = await Promise.all([
        testMethodService.getWithIndicators(),
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
      ]);

      setTestMethods(methodsData || []);
      setIndicatorGroups(groupsData || []);
      setIndicators(indicatorsData || []);

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

  // Convert to grouped data for table
  const groupedData: GroupedTestMethodData[] = useMemo(() => {
    return filteredData.map((method) => ({
      ...method,
      key: method.id,
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
    groupOptions,
    indicatorsByGroup,
    setSearchText,
    setExpandedRowKeys,
    fetchData,
  };
};
