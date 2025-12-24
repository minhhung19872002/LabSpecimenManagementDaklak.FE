import { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import {
  indicatorGroupService,
  indicatorService,
} from "../../../../services/masterDataService";
import { IndicatorGroupDto, IndicatorDto, GroupedIndicatorData } from "../types";

export const useIndicatorsData = () => {
  const [groups, setGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
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

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsData, indicatorsData] = await Promise.all([
        indicatorGroupService.getWithCount(),
        indicatorService.getList({ maxResultCount: 1000 }),
      ]);
      console.log("groupsData: ", groupsData);
      setGroups(groupsData || []);
      setIndicators(indicatorsData?.items || []);
      // Expand all groups by default
      setExpandedRowKeys((groupsData || []).map((g) => g.id));
    } catch (error) {
      console.error("Failed to fetch indicators data:", error);
      message.error("Không thể tải dữ liệu chỉ tiêu");
      setGroups([]);
      setIndicators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter indicators by search
  const filteredIndicators = searchText
    ? (indicators || []).filter(
        (item) =>
          item.code?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.indicatorGroupName
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
      )
    : indicators || [];

  // Group indicators by group for expandable table
  const groupedData: GroupedIndicatorData[] = (groups || []).map((group) => ({
    ...group,
    key: group.id,
    indicators: filteredIndicators.filter(
      (ind) => ind.indicatorGroupId === group.id
    ),
  }));

  return {
    // State
    groups,
    indicators,
    loading,
    searchText,
    expandedRowKeys,
    selectedRowKeys,
    batchLoading,
    groupOptions,
    filteredIndicators,
    groupedData,
    // Setters
    setGroups,
    setIndicators,
    setLoading,
    setSearchText,
    setExpandedRowKeys,
    setSelectedRowKeys,
    setBatchLoading,
    // Actions
    fetchData,
  };
};
