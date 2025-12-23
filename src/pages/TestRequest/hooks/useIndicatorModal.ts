import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { SampleFormData, IndicatorDates, LaboratoryAssignment } from "../types";
import { FORM_MESSAGES } from "../constants";

interface UseIndicatorModalOptions {
  samples: SampleFormData[];
  updateSample: (key: string, field: keyof SampleFormData, value: any) => void;
  isSamplesLocked: () => boolean;
  indicators: any[];
  indicatorGroups: any[];
}

export const useIndicatorModal = ({
  samples,
  updateSample,
  isSamplesLocked,
  indicators,
  indicatorGroups,
}: UseIndicatorModalOptions) => {
  // Modal state
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false);
  const [currentSampleKey, setCurrentSampleKey] = useState<string | null>(null);
  const [tempSelectedIndicators, setTempSelectedIndicators] = useState<string[]>([]);

  // Filter state
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [indicatorSearchText, setIndicatorSearchText] = useState<string>("");

  // Group selector
  const [groupSelectorVisible, setGroupSelectorVisible] = useState(false);
  const [groupSearchText, setGroupSearchText] = useState<string>("");

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedGroupsInSelector, setExpandedGroupsInSelector] = useState<string[]>([]);

  // Indicator dates and states
  const [selectedIndicatorDates, setSelectedIndicatorDates] = useState<Record<string, IndicatorDates>>({});
  const [checkedIndicators, setCheckedIndicators] = useState<string[]>([]);

  // Laboratory assignment map
  const [indicatorLaboratoryMap, setIndicatorLaboratoryMap] = useState<Record<string, LaboratoryAssignment>>({});
  const [expandedLabGroups, setExpandedLabGroups] = useState<string[]>([]);

  // Initialize expanded groups
  useEffect(() => {
    if (indicatorGroups.length > 0 && expandedGroups.length === 0) {
      setExpandedGroups(indicatorGroups.map((g) => g.id));
      setExpandedGroupsInSelector(indicatorGroups.map((g) => g.id));
    }
  }, [indicatorGroups]);

  // Initialize dates when modal opens
  useEffect(() => {
    if (indicatorModalVisible && tempSelectedIndicators.length > 0) {
      const today = dayjs();
      const newDates: Record<string, IndicatorDates> = {};
      tempSelectedIndicators.forEach((id) => {
        if (!selectedIndicatorDates[id]) {
          newDates[id] = { transferDate: today, requestDate: today };
        }
      });
      if (Object.keys(newDates).length > 0) {
        setSelectedIndicatorDates((prev) => ({ ...prev, ...newDates }));
      }
    }
  }, [indicatorModalVisible, tempSelectedIndicators]);

  const openIndicatorModal = useCallback(
    (sampleKey: string) => {
      if (isSamplesLocked()) {
        message.warning(FORM_MESSAGES.cannotChangeIndicator);
        return;
      }
      const sample = samples.find((s) => s.key === sampleKey);
      if (sample) {
        setCurrentSampleKey(sampleKey);
        setTempSelectedIndicators([...sample.indicatorIds]);
        setSelectedGroupFilter("all");
        setIndicatorModalVisible(true);
      }
    },
    [samples, isSamplesLocked]
  );

  const handleIndicatorModalOk = useCallback(() => {
    const unsentIndicators = tempSelectedIndicators.filter(
      (id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]
    );
    if (unsentIndicators.length > 0) {
      message.warning(FORM_MESSAGES.indicatorsNotSent(unsentIndicators.length));
      return;
    }

    if (currentSampleKey) {
      updateSample(currentSampleKey, "indicatorIds", tempSelectedIndicators);
    }
    setIndicatorModalVisible(false);
    setCurrentSampleKey(null);
  }, [currentSampleKey, tempSelectedIndicators, indicatorLaboratoryMap, updateSample]);

  const handleIndicatorModalCancel = useCallback(() => {
    setIndicatorModalVisible(false);
    setCurrentSampleKey(null);
    setTempSelectedIndicators([]);
  }, []);

  const toggleIndicator = useCallback((indicatorId: string) => {
    setTempSelectedIndicators((prev) =>
      prev.includes(indicatorId)
        ? prev.filter((id) => id !== indicatorId)
        : [...prev, indicatorId]
    );
  }, []);

  const handleIndicatorDateChange = useCallback(
    (indicatorId: string, field: "transferDate" | "requestDate", value: dayjs.Dayjs | null) => {
      const currentDates = selectedIndicatorDates[indicatorId] || {};

      if (field === "transferDate" && value && currentDates.requestDate) {
        if (value.isAfter(currentDates.requestDate)) {
          message.warning(FORM_MESSAGES.transferDateInvalid);
          return;
        }
      }
      if (field === "requestDate" && value && currentDates.transferDate) {
        if (value.isBefore(currentDates.transferDate)) {
          message.warning(FORM_MESSAGES.requestDateInvalid);
          return;
        }
      }

      setSelectedIndicatorDates((prev) => ({
        ...prev,
        [indicatorId]: {
          ...prev[indicatorId],
          [field]: value || undefined,
        },
      }));
    },
    [selectedIndicatorDates]
  );

  const toggleCheckedIndicator = useCallback((indicatorId: string) => {
    setCheckedIndicators((prev) =>
      prev.includes(indicatorId)
        ? prev.filter((id) => id !== indicatorId)
        : [...prev, indicatorId]
    );
  }, []);

  const handleSelectAllIndicators = useCallback(
    (checked: boolean) => {
      if (checked) {
        setCheckedIndicators([...tempSelectedIndicators]);
      } else {
        setCheckedIndicators([]);
      }
    },
    [tempSelectedIndicators]
  );

  const getFilteredIndicators = useCallback(() => {
    let filtered = indicators.filter((ind) => ind.isActive);

    if (selectedGroupFilter !== "all") {
      filtered = filtered.filter((ind) => ind.indicatorGroupId === selectedGroupFilter);
    }

    if (indicatorSearchText.trim()) {
      const searchLower = indicatorSearchText.toLowerCase().trim();
      filtered = filtered.filter(
        (ind) =>
          ind.name.toLowerCase().includes(searchLower) ||
          ind.code?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [indicators, selectedGroupFilter, indicatorSearchText]);

  const getFilteredGroupsWithIndicators = useCallback(() => {
    const searchLower = groupSearchText.toLowerCase().trim();

    return indicatorGroups
      .map((group) => {
        const groupIndicators = indicators.filter(
          (ind) =>
            ind.indicatorGroupId === group.id &&
            ind.isActive &&
            (!searchLower ||
              ind.name.toLowerCase().includes(searchLower) ||
              group.name.toLowerCase().includes(searchLower))
        );

        return {
          ...group,
          indicators: groupIndicators,
          matchesSearch:
            !searchLower ||
            group.name.toLowerCase().includes(searchLower) ||
            groupIndicators.length > 0,
        };
      })
      .filter((g) => g.matchesSearch);
  }, [indicatorGroups, indicators, groupSearchText]);

  const handleGroupSelect = useCallback((groupId: string) => {
    setSelectedGroupFilter(groupId);
    setGroupSelectorVisible(false);
    setGroupSearchText("");
  }, []);

  return {
    // Modal state
    indicatorModalVisible,
    currentSampleKey,
    tempSelectedIndicators,
    setTempSelectedIndicators,

    // Filter state
    selectedGroupFilter,
    setSelectedGroupFilter,
    indicatorSearchText,
    setIndicatorSearchText,

    // Group selector
    groupSelectorVisible,
    setGroupSelectorVisible,
    groupSearchText,
    setGroupSearchText,

    // Expanded groups
    expandedGroups,
    setExpandedGroups,
    expandedGroupsInSelector,
    setExpandedGroupsInSelector,

    // Indicator dates
    selectedIndicatorDates,
    setSelectedIndicatorDates,
    checkedIndicators,
    setCheckedIndicators,

    // Laboratory map
    indicatorLaboratoryMap,
    setIndicatorLaboratoryMap,
    expandedLabGroups,
    setExpandedLabGroups,

    // Actions
    openIndicatorModal,
    handleIndicatorModalOk,
    handleIndicatorModalCancel,
    toggleIndicator,
    handleIndicatorDateChange,
    toggleCheckedIndicator,
    handleSelectAllIndicators,
    getFilteredIndicators,
    getFilteredGroupsWithIndicators,
    handleGroupSelect,
  };
};
