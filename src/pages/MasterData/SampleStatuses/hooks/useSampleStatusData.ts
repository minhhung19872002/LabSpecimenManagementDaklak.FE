import { useState, useEffect, useMemo } from "react";
import { message } from "antd";
import { sampleConditionService, SampleConditionDto } from "../../../../services/masterDataService";

export const useSampleConditionData = () => {
  const [conditions, setConditions] = useState<SampleConditionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await sampleConditionService.getList({ skipCount: 0, maxResultCount: 1000 });
      setConditions(result?.items || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Không thể tải dữ liệu tình trạng mẫu");
      setConditions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter conditions by search text
  const filteredConditions = useMemo(() => {
    if (!searchText) return conditions;

    const lowerSearch = searchText.toLowerCase();
    return conditions.filter(
      (condition) =>
        condition.name?.toLowerCase().includes(lowerSearch) ||
        condition.description?.toLowerCase().includes(lowerSearch)
    );
  }, [conditions, searchText]);

  return {
    conditions,
    loading,
    searchText,
    filteredConditions,
    setSearchText,
    fetchData,
  };
};
