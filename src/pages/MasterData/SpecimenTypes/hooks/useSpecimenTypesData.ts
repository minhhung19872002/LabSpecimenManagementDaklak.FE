import { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import {
  specimenTypeService,
  indicatorGroupService,
  indicatorService,
} from "../../../../services/masterDataService";
import {
  SpecimenTypeWithIndicatorsDto,
  GroupedSpecimenTypeData,
} from "../types";
import { IndicatorDto, IndicatorGroupDto } from "../../../../services/masterDataService";

export const useSpecimenTypesData = () => {
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeWithIndicatorsDto[]>([]);
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
      const [typesData, groupsData, indicatorsData] = await Promise.all([
        specimenTypeService.getWithIndicators(),
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
      ]);

      setSpecimenTypes(typesData || []);
      setIndicatorGroups(groupsData || []);
      setIndicators(indicatorsData || []);

      // Only collapse all on initial load
      if (isInitialLoad) {
        setExpandedRowKeys([]);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Không thể tải dữ liệu loại mẫu");
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
    if (!searchText) return specimenTypes;

    const lowerSearch = searchText.toLowerCase();
    return specimenTypes.filter(
      (item) =>
        item.name?.toLowerCase().includes(lowerSearch) ||
        item.description?.toLowerCase().includes(lowerSearch) ||
        item.indicators?.some(
          (ind) =>
            ind.indicatorCode?.toLowerCase().includes(lowerSearch) ||
            ind.indicatorName?.toLowerCase().includes(lowerSearch)
        )
    );
  }, [specimenTypes, searchText]);

  // Convert to grouped data for table
  const groupedData: GroupedSpecimenTypeData[] = useMemo(() => {
    return filteredData.map((type) => ({
      ...type,
      key: type.id,
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
    specimenTypes,
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
