import { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import {
  indicatorGroupService,
  indicatorService,
  laboratoryService,
  LaboratoryDto,
} from "../../../../services/masterDataService";
import { IndicatorGroupDto, IndicatorDto, GroupedIndicatorData } from "../types";

export const useIndicatorsData = () => {
  const [groups, setGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [laboratories, setLaboratories] = useState<LaboratoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Computed options for Select
  const groupOptions = useMemo(() => {
    console.log("Computing groupOptions, groups:", groups);
    return (groups || []).map((group) => ({
      value: group.id,
      label: group.name + (!group.isActive ? " (Ngừng)" : ""),
    }));
  }, [groups]);

  // Computed options for Laboratory Select (Khoa phòng thực hiện)
  const laboratoryOptions = useMemo(() => {
    return (laboratories || []).map((lab) => ({
      value: lab.id,
      label: lab.name + (!lab.isActive ? " (Ngừng)" : ""),
    }));
  }, [laboratories]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsData, indicatorsData, laboratoriesData] = await Promise.all([
        indicatorGroupService.getWithCount(),
        indicatorService.getList({ maxResultCount: 1000 }),
        laboratoryService.getActive(),
      ]);
      console.log("groupsData: ", groupsData);
      setGroups(groupsData || []);
      setIndicators(indicatorsData?.items || []);
      setLaboratories(laboratoriesData || []);
      // Expand all groups by default
      setExpandedRowKeys((groupsData || []).map((g) => g.id));
    } catch (error) {
      console.error("Failed to fetch indicators data:", error);
      message.error("Không thể tải dữ liệu chỉ tiêu");
      setGroups([]);
      setIndicators([]);
      setLaboratories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter indicators by search (including sub-indicators)
  const filteredIndicators = searchText
    ? (indicators || []).filter((item) => {
        const searchLower = searchText.toLowerCase();

        // Check parent indicator
        const parentMatch =
          item.code?.toLowerCase().includes(searchLower) ||
          item.name?.toLowerCase().includes(searchLower) ||
          item.indicatorGroupName?.toLowerCase().includes(searchLower);

        // Check sub-indicators
        const subMatch = item.subIndicators?.some(
          (sub) =>
            sub.code?.toLowerCase().includes(searchLower) ||
            sub.name?.toLowerCase().includes(searchLower)
        );

        return parentMatch || subMatch;
      })
    : indicators || [];

  // Group indicators by group for expandable table
  // Only show parent indicators (sub-indicators shown in edit modal)
  const groupedData: GroupedIndicatorData[] = (groups || []).map((group) => {
    const parentIndicators = filteredIndicators.filter(
      (ind) => ind.indicatorGroupId === group.id && !ind.parentIndicatorId
    );

    return {
      ...group,
      key: group.id,
      indicators: parentIndicators,
    };
  });

  return {
    // State
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
    filteredIndicators,
    groupedData,
    // Setters
    setGroups,
    setIndicators,
    setLaboratories,
    setLoading,
    setSearchText,
    setExpandedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    // Actions
    fetchData,
  };
};
