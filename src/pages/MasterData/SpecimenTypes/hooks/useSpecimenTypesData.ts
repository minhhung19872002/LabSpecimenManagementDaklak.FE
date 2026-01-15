import { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import {
  specimenTypeService,
  sampleTypeCategoryService,
  indicatorGroupService,
  indicatorService,
} from "../../../../services/masterDataService";
import {
  SpecimenTypeWithIndicatorsDto,
  GroupedSpecimenTypeData,
  SampleTypeCategoryDto,
} from "../types";
import { IndicatorDto, IndicatorGroupDto } from "../../../../services/masterDataService";

export const useSpecimenTypesData = () => {
  const [specimenTypes, setSpecimenTypes] = useState<SpecimenTypeWithIndicatorsDto[]>([]);
  const [categories, setCategories] = useState<SampleTypeCategoryDto[]>([]);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedSpecimenTypeKeys, setExpandedSpecimenTypeKeys] = useState<string[]>([]);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesData, categoriesData, groupsData, indicatorsData] = await Promise.all([
        specimenTypeService.getWithIndicators(),
        sampleTypeCategoryService.getWithCount(),
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
      ]);

      setSpecimenTypes(typesData || []);
      setCategories(categoriesData || []);
      setIndicatorGroups(groupsData || []);
      setIndicators(indicatorsData || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Không thể tải dữ liệu loại mẫu");
      setSpecimenTypes([]);
      setCategories([]);
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
        item.sampleTypeCategoryName?.toLowerCase().includes(lowerSearch) ||
        item.indicators?.some(
          (ind) =>
            ind.indicatorCode?.toLowerCase().includes(lowerSearch) ||
            ind.indicatorName?.toLowerCase().includes(lowerSearch)
        )
    );
  }, [specimenTypes, searchText]);

  // Flat list of specimen types with key
  const groupedData: GroupedSpecimenTypeData[] = useMemo(() => {
    return filteredData.map((type) => ({
      ...type,
      key: type.id,
    }));
  }, [filteredData]);

  // Options for category select (for SpecimenTypeModal)
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.name + (!category.isActive ? " (Ngừng)" : ""),
      isActive: category.isActive,
    }));
  }, [categories]);

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
    categories,
    loading,
    searchText,
    groupedData,
    expandedSpecimenTypeKeys,
    indicatorGroups,
    indicators,
    categoryOptions,
    indicatorsByGroup,
    setSearchText,
    setExpandedSpecimenTypeKeys,
    fetchData,
  };
};
