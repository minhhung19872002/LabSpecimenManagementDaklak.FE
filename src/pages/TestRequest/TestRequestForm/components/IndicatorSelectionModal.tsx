// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Checkbox, Typography, Drawer, Input, Select, Tag } from "antd";
import { PlusOutlined, SearchOutlined } from "../../../../components/common/Icon";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import {
  IndicatorGroupDto,
  IndicatorDto,
  SpecimenTypeWithIndicatorsDto,
  SpecimenTypeDto,
  SampleTypeCategoryDto,
} from "../../../../services/masterDataService";
import IndicatorName from "../../../../components/common/IndicatorName";
import {
  IndicatorDateInfo,
  LaboratoryAssignment,
  IndicatorMethodKey,
  IndicatorMethodInfo,
  parseIndicatorMethodKey,
  createIndicatorMethodKey,
} from "../types";
import IndicatorRow from "./IndicatorRow";

const { Text } = Typography;

interface IndicatorSelectionModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  currentSampleKey: string | null;
  // Old props (deprecated)
  tempSelectedIndicators: string[];
  setTempSelectedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  // New props
  tempSelectedIndicatorMethods: IndicatorMethodKey[];
  setTempSelectedIndicatorMethods: React.Dispatch<
    React.SetStateAction<IndicatorMethodKey[]>
  >;
  indicatorMethodsMap: Record<string, IndicatorMethodInfo[]>;
  expandedIndicators: string[];
  setExpandedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  toggleIndicatorMethod: (indicatorId: string, testMethodId: string) => void;
  // Existing props
  indicatorGroups: IndicatorGroupDto[];
  indicators: IndicatorDto[];
  expandedGroups: string[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGroupFilter: string;
  setGroupSelectorVisible: (visible: boolean) => void;
  getFilteredIndicators: () => IndicatorDto[];
  getIndicatorInfo: (indicatorId: string) => IndicatorDto | undefined;
  getIndicatorMethodInfo: (key: IndicatorMethodKey) => {
    indicator: IndicatorDto | undefined;
    method: IndicatorMethodInfo | undefined;
    indicatorId: string;
    testMethodId: string;
  };
  toggleIndicator: (indicatorId: string) => void;
  selectedIndicatorDates: Record<string, IndicatorDateInfo>;
  setSelectedIndicatorDates: React.Dispatch<
    React.SetStateAction<Record<string, IndicatorDateInfo>>
  >;
  checkedIndicators: string[];
  setCheckedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  handleIndicatorDateChange: (
    id: string,
    field: "transferDate" | "requestDate",
    value: dayjs.Dayjs | null
  ) => void;
  toggleCheckedIndicator: (id: string) => void;
  handleSendToLaboratory: () => void;
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  setIndicatorLaboratoryMap: React.Dispatch<
    React.SetStateAction<Record<string, LaboratoryAssignment>>
  >;
  expandedLabGroups: string[];
  setExpandedLabGroups: React.Dispatch<React.SetStateAction<string[]>>;
  // Filter theo loại mẫu
  currentSampleSpecimenTypeName?: string;
  specimenTypeIndicatorIds: string[];
  specimenTypeFilterActive: boolean;
  setSpecimenTypeFilterActive: React.Dispatch<React.SetStateAction<boolean>>;
  // Group theo loại mẫu (2 cấp)
  specimenTypesWithIndicators: SpecimenTypeWithIndicatorsDto[];
  indicatorToSpecimenTypesMap: Record<string, { id: string; name: string }[]>;
  // Filter mới
  specimenTypes: SpecimenTypeDto[];
  sampleTypeCategories: SampleTypeCategoryDto[];
  indicatorSearchText: string;
  setIndicatorSearchText: React.Dispatch<React.SetStateAction<string>>;
}

const IndicatorSelectionModal: React.FC<IndicatorSelectionModalProps> = ({
  visible,
  onOk,
  onCancel,
  currentSampleKey,
  tempSelectedIndicatorMethods,
  setTempSelectedIndicatorMethods,
  indicatorMethodsMap,
  expandedIndicators,
  setExpandedIndicators,
  toggleIndicatorMethod,
  indicatorGroups,
  indicators,
  expandedGroups,
  setExpandedGroups,
  selectedGroupFilter,
  setGroupSelectorVisible,
  getFilteredIndicators,
  getIndicatorInfo,
  getIndicatorMethodInfo,
  selectedIndicatorDates,
  setSelectedIndicatorDates,
  checkedIndicators,
  setCheckedIndicators,
  handleIndicatorDateChange,
  toggleCheckedIndicator,
  handleSendToLaboratory,
  indicatorLaboratoryMap,
  setIndicatorLaboratoryMap,
  expandedLabGroups,
  setExpandedLabGroups,
  currentSampleSpecimenTypeName,
  specimenTypeIndicatorIds,
  specimenTypeFilterActive,
  setSpecimenTypeFilterActive,
  specimenTypesWithIndicators,
  indicatorToSpecimenTypesMap,
  specimenTypes,
  sampleTypeCategories,
  indicatorSearchText,
  setIndicatorSearchText,
}) => {
  // Handle remove indicator method
  const handleRemoveIndicatorMethod = (key: IndicatorMethodKey) => {
    const { indicatorId, testMethodId } = parseIndicatorMethodKey(key);
    toggleIndicatorMethod(indicatorId, testMethodId);
    const labMapKey = `${currentSampleKey}_${key}`;
    if (indicatorLaboratoryMap[labMapKey]) {
      setIndicatorLaboratoryMap((prev) => {
        const updated = { ...prev };
        delete updated[labMapKey];
        return updated;
      });
    }
  };

  // Check if a method is selected
  const isMethodSelected = (
    indicatorId: string,
    testMethodId: string
  ): boolean => {
    const key = createIndicatorMethodKey(indicatorId, testMethodId);
    return tempSelectedIndicatorMethods.includes(key);
  };

  // Separate sent and unsent indicator methods
  const unsentMethods = tempSelectedIndicatorMethods.filter(
    (key) => !indicatorLaboratoryMap[`${currentSampleKey}_${key}`]
  );
  const sentMethods = tempSelectedIndicatorMethods.filter(
    (key) => indicatorLaboratoryMap[`${currentSampleKey}_${key}`]
  );

  // Group sent methods by laboratory
  const groupedByLab: Record<
    string,
    { labName: string; requestDate: dayjs.Dayjs; methods: IndicatorMethodKey[] }
  > = {};
  sentMethods.forEach((key) => {
    const labInfo = indicatorLaboratoryMap[`${currentSampleKey}_${key}`];
    if (!groupedByLab[labInfo.laboratoryId]) {
      groupedByLab[labInfo.laboratoryId] = {
        labName: labInfo.laboratoryName,
        requestDate: labInfo.requestDate,
        methods: [],
      };
    }
    groupedByLab[labInfo.laboratoryId].methods.push(key);
  });

  // Calculate total cost from selected methods
  const totalCost = tempSelectedIndicatorMethods.reduce((sum, key) => {
    const { method } = getIndicatorMethodInfo(key);
    return sum + (method?.unitPrice || 0);
  }, 0);

  // Get indicators that have active methods, filtered by specimen type if active
  const indicatorsWithMethods = useMemo(() => {
    let filtered = indicators.filter(
      (ind) =>
        ind.isActive && indicatorMethodsMap[ind.id]?.some((m) => m.isActive)
    );
    // Apply specimen type filter if active
    // Nếu filter active mà specimenTypeIndicatorIds rỗng -> hiện danh sách rỗng
    if (specimenTypeFilterActive) {
      filtered = filtered.filter((ind) => specimenTypeIndicatorIds.includes(ind.id));
    }
    return filtered;
  }, [indicators, indicatorMethodsMap, specimenTypeFilterActive, specimenTypeIndicatorIds]);

  // Auto-expand all indicators when modal opens
  useEffect(() => {
    if (
      visible &&
      indicatorsWithMethods.length > 0 &&
      expandedIndicators.length === 0
    ) {
      setExpandedIndicators(indicatorsWithMethods.map((ind) => ind.id));
    }
  }, [visible, indicatorsWithMethods]);

  // State for mobile indicator picker drawer
  const [indicatorPickerOpen, setIndicatorPickerOpen] = useState(false);

  // State for expanded specimen types (now used as level 2 within indicator groups)
  const [expandedSpecimenTypes, setExpandedSpecimenTypes] = useState<string[]>([]);

  // State for new filter fields
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSpecimenTypeIds, setSelectedSpecimenTypeIds] = useState<string[]>([]);

  // Filtered specimen types based on selected categories
  const filteredSpecimenTypeOptions = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return specimenTypes.filter((st) => st.isActive);
    }
    return specimenTypes.filter(
      (st) => st.isActive && st.sampleTypeCategoryId && selectedCategoryIds.includes(st.sampleTypeCategoryId)
    );
  }, [specimenTypes, selectedCategoryIds]);

  // Clear selected specimen types when categories change (if they're no longer valid)
  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      const validSpecimenTypeIds = filteredSpecimenTypeOptions.map((st) => st.id);
      setSelectedSpecimenTypeIds((prev) =>
        prev.filter((id) => validSpecimenTypeIds.includes(id))
      );
    }
  }, [selectedCategoryIds, filteredSpecimenTypeOptions]);

  // Auto-expand all indicator groups when modal opens
  useEffect(() => {
    if (visible && expandedGroups.length === 0) {
      const activeGroupIds = indicatorGroups.map(g => g.id);
      setExpandedGroups(activeGroupIds);
    }
  }, [visible, indicatorGroups]);

  // Helper: Toggle all methods of an indicator
  const toggleAllMethodsOfIndicator = (indicatorId: string, select: boolean) => {
    const methods = indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    methods.forEach((method) => {
      const isCurrentlySelected = isMethodSelected(indicatorId, method.testMethodId);
      if (select && !isCurrentlySelected) {
        toggleIndicatorMethod(indicatorId, method.testMethodId);
      } else if (!select && isCurrentlySelected) {
        toggleIndicatorMethod(indicatorId, method.testMethodId);
      }
    });
  };

  // Helper: Toggle all indicators in a group (within specimen type context)
  const toggleAllIndicatorsInGroup = (indicatorIds: string[], select: boolean) => {
    indicatorIds.forEach((indId) => {
      toggleAllMethodsOfIndicator(indId, select);
    });
  };

  // Helper: Check if all methods of an indicator are selected
  const areAllMethodsSelected = (indicatorId: string): boolean => {
    const methods = indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    if (methods.length === 0) return false;
    return methods.every((m) => isMethodSelected(indicatorId, m.testMethodId));
  };

  // Helper: Check if some (but not all) methods of an indicator are selected
  const areSomeMethodsSelected = (indicatorId: string): boolean => {
    const methods = indicatorMethodsMap[indicatorId]?.filter((m) => m.isActive) || [];
    if (methods.length === 0) return false;
    const selectedCount = methods.filter((m) => isMethodSelected(indicatorId, m.testMethodId)).length;
    return selectedCount > 0 && selectedCount < methods.length;
  };

  // Helper: Check if all indicators in a list are fully selected
  const areAllIndicatorsSelected = (indicatorIds: string[]): boolean => {
    if (indicatorIds.length === 0) return false;
    return indicatorIds.every((indId) => areAllMethodsSelected(indId));
  };

  // Helper: Check if some indicators in a list are selected (partial)
  const areSomeIndicatorsSelected = (indicatorIds: string[]): boolean => {
    if (indicatorIds.length === 0) return false;
    const hasAnySelected = indicatorIds.some((indId) => {
      const methods = indicatorMethodsMap[indId]?.filter((m) => m.isActive) || [];
      return methods.some((m) => isMethodSelected(indId, m.testMethodId));
    });
    return hasAnySelected && !areAllIndicatorsSelected(indicatorIds);
  };

  // Helper: Render indicator with methods (reusable)
  const renderIndicatorWithMethods = (ind: IndicatorDto, indentLevel: number = 1) => {
    const methods = indicatorMethodsMap[ind.id]?.filter((m) => m.isActive) || [];
    const isIndicatorExpanded = expandedIndicators.includes(ind.id);
    const selectedMethodsCount = methods.filter((m) =>
      isMethodSelected(ind.id, m.testMethodId)
    ).length;
    const paddingLeft = indentLevel === 1 ? 12 : indentLevel === 2 ? 28 : 12;
    const methodPaddingLeft = indentLevel === 1 ? 32 : indentLevel === 2 ? 48 : 32;
    const isAllSelected = areAllMethodsSelected(ind.id);
    const isSomeSelected = areSomeMethodsSelected(ind.id);

    return (
      <div key={ind.id}>
        {/* Indicator header */}
        <div
          style={{
            padding: `6px 12px 6px ${paddingLeft}px`,
            borderBottom: "1px solid #f5f5f5",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: selectedMethodsCount > 0 ? "#e6f7ff" : "#fff",
          }}
        >
          <Checkbox
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggleAllMethodsOfIndicator(ind.id, !isAllSelected)}
          />
          <IndicatorName
            name={ind.name}
            formattedName={ind.formattedName}
            style={{
              flex: 1,
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          />
          <Icon
            icon={isIndicatorExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
            width={18}
            style={{ color: "#595959", flexShrink: 0, cursor: "pointer" }}
            onClick={() => {
              setExpandedIndicators((prev) =>
                prev.includes(ind.id)
                  ? prev.filter((id) => id !== ind.id)
                  : [...prev, ind.id]
              );
            }}
          />
        </div>

        {/* Methods under indicator */}
        {isIndicatorExpanded &&
          methods.map((method) => {
            const isSelected = isMethodSelected(ind.id, method.testMethodId);
            return (
              <div
                key={method.testMethodId}
                onClick={() => toggleIndicatorMethod(ind.id, method.testMethodId)}
                style={{
                  padding: `5px 12px 5px ${methodPaddingLeft}px`,
                  borderBottom: "1px solid #f8f8f8",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  background: isSelected ? "#bae7ff" : "#fff",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#f0f0f0";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected ? "#bae7ff" : "#fff";
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleIndicatorMethod(ind.id, method.testMethodId)}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#595959",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <IndicatorName name={method.testMethodName} formattedName={method.testMethodFormattedName} />
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#888",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {method.unitPrice?.toLocaleString("vi-VN")}đ
                </span>
              </div>
            );
          })}
      </div>
    );
  };

  // Render content grouped by: Nhóm CT → Loại mẫu → Chỉ tiêu → Phương pháp
  const renderBySpecimenType = () => {
    // Get all indicators with active methods
    let activeIndicators = indicators.filter(
      (ind) => ind.isActive && indicatorMethodsMap[ind.id]?.some((m) => m.isActive)
    );

    // Apply specimen type filter if active (from current sample)
    if (specimenTypeFilterActive) {
      activeIndicators = activeIndicators.filter((ind) =>
        specimenTypeIndicatorIds.includes(ind.id)
      );
    }

    // Apply indicator group filter if selected
    if (selectedGroupFilter !== "all") {
      activeIndicators = activeIndicators.filter(
        (ind) => ind.indicatorGroupId === selectedGroupFilter
      );
    }

    // Apply search filter
    if (indicatorSearchText.trim()) {
      const searchLower = indicatorSearchText.toLowerCase().trim();
      activeIndicators = activeIndicators.filter(
        (ind) =>
          ind.name.toLowerCase().includes(searchLower) ||
          ind.code?.toLowerCase().includes(searchLower)
      );
    }

    // Build map: indicatorId -> specimenTypeIds
    const indicatorSpecimenTypesMap = new Map<string, string[]>();
    specimenTypesWithIndicators.forEach((st) => {
      if (st.isActive) {
        st.indicators?.forEach((sti) => {
          if (sti.isActive) {
            if (!indicatorSpecimenTypesMap.has(sti.indicatorId)) {
              indicatorSpecimenTypesMap.set(sti.indicatorId, []);
            }
            indicatorSpecimenTypesMap.get(sti.indicatorId)!.push(st.id);
          }
        });
      }
    });

    // Get specimen type IDs to filter by (from selected categories and/or specimen types)
    let specimenTypeIdsToFilter: string[] = [];
    if (selectedSpecimenTypeIds.length > 0) {
      // If specific specimen types selected, use them
      specimenTypeIdsToFilter = selectedSpecimenTypeIds;
    } else if (selectedCategoryIds.length > 0) {
      // If only categories selected, get all specimen types in those categories
      specimenTypeIdsToFilter = specimenTypes
        .filter((st) => st.isActive && st.sampleTypeCategoryId && selectedCategoryIds.includes(st.sampleTypeCategoryId))
        .map((st) => st.id);
    }

    // Apply specimen type filter from new filter fields
    if (specimenTypeIdsToFilter.length > 0) {
      activeIndicators = activeIndicators.filter((ind) => {
        const indStIds = indicatorSpecimenTypesMap.get(ind.id) || [];
        // Indicator must belong to at least one of the selected specimen types
        return indStIds.some((stId) => specimenTypeIdsToFilter.includes(stId));
      });
    }

    // Group structure: Nhóm CT → Loại mẫu → Chỉ tiêu[]
    type IndicatorGroupData = {
      id: string;
      name: string;
      specimenTypes: Map<string, { id: string; name: string; indicators: IndicatorDto[] }>;
    };

    const groupedData: IndicatorGroupData[] = [];

    // Process each indicator group
    indicatorGroups.forEach((group) => {
      const groupIndicators = activeIndicators.filter(
        (ind) => ind.indicatorGroupId === group.id
      );
      if (groupIndicators.length === 0) return;

      // Group indicators by specimen type within this indicator group
      const specimenTypesMap = new Map<string, { id: string; name: string; indicators: IndicatorDto[] }>();

      groupIndicators.forEach((ind) => {
        const stIds = indicatorSpecimenTypesMap.get(ind.id) || [];
        if (stIds.length === 0) {
          // Indicator không thuộc loại mẫu nào -> nhóm "Khác"
          if (!specimenTypesMap.has("others")) {
            specimenTypesMap.set("others", { id: "others", name: "Khác", indicators: [] });
          }
          specimenTypesMap.get("others")!.indicators.push(ind);
        } else {
          // Indicator thuộc một hoặc nhiều loại mẫu
          stIds.forEach((stId) => {
            const st = specimenTypesWithIndicators.find((s) => s.id === stId);
            if (st) {
              if (!specimenTypesMap.has(stId)) {
                specimenTypesMap.set(stId, { id: stId, name: st.name, indicators: [] });
              }
              specimenTypesMap.get(stId)!.indicators.push(ind);
            }
          });
        }
      });

      groupedData.push({
        id: group.id,
        name: group.name,
        specimenTypes: specimenTypesMap,
      });
    });

    // Debug: If no grouped data, show detailed message
    if (groupedData.length === 0) {
      const totalIndicators = indicators.length;
      const activeCount = indicators.filter((i) => i.isActive).length;
      const methodMapKeys = Object.keys(indicatorMethodsMap).length;
      const withMethods = indicators.filter(
        (i) => i.isActive && indicatorMethodsMap[i.id]?.some((m) => m.isActive)
      ).length;

      return (
        <div style={{ padding: 24, textAlign: "center", color: "#999" }}>
          <Text type="secondary">
            Không có chỉ tiêu nào phù hợp với bộ lọc
          </Text>
        </div>
      );
    }

    return (
      <>
        {groupedData.map((groupData) => {
          const isGroupExpanded = expandedGroups.includes(groupData.id);
          // Get all indicator IDs in this group
          const allIndicatorIdsInGroup: string[] = [];
          groupData.specimenTypes.forEach((stData) => {
            stData.indicators.forEach((ind) => {
              if (!allIndicatorIdsInGroup.includes(ind.id)) {
                allIndicatorIdsInGroup.push(ind.id);
              }
            });
          });
          const isAllGroupSelected = areAllIndicatorsSelected(allIndicatorIdsInGroup);
          const isSomeGroupSelected = areSomeIndicatorsSelected(allIndicatorIdsInGroup);

          return (
            <div key={groupData.id}>
              {/* Nhóm CT header (Level 1) */}
              <div
                style={{
                  padding: "8px 12px",
                  background: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  userSelect: "none",
                }}
              >
                <Checkbox
                  checked={isAllGroupSelected}
                  indeterminate={isSomeGroupSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleAllIndicatorsInGroup(allIndicatorIdsInGroup, !isAllGroupSelected)}
                />
                <span style={{ flex: 1 }}>{groupData.name}</span>
                <Icon
                  icon={isGroupExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                  width={18}
                  style={{ color: "#595959", flexShrink: 0, cursor: "pointer" }}
                  onClick={() => {
                    setExpandedGroups((prev) =>
                      prev.includes(groupData.id)
                        ? prev.filter((id) => id !== groupData.id)
                        : [...prev, groupData.id]
                    );
                  }}
                />
              </div>

              {/* Loại mẫu within Nhóm CT (Level 2) */}
              {isGroupExpanded &&
                Array.from(groupData.specimenTypes.values()).map((stData) => {
                  const isSpecimenTypeExpanded = expandedSpecimenTypes.includes(`${groupData.id}_${stData.id}`);
                  const stIndicatorIds = stData.indicators.map((ind) => ind.id);
                  const isAllStSelected = areAllIndicatorsSelected(stIndicatorIds);
                  const isSomeStSelected = areSomeIndicatorsSelected(stIndicatorIds);

                  return (
                    <div key={`${groupData.id}_${stData.id}`}>
                      {/* Loại mẫu header */}
                      <div
                        style={{
                          padding: "6px 12px 6px 24px",
                          background: "#fafafa",
                          borderBottom: "1px solid #f0f0f0",
                          fontWeight: 500,
                          fontSize: 13,
                          color: "#000",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          userSelect: "none",
                        }}
                      >
                        <Checkbox
                          checked={isAllStSelected}
                          indeterminate={isSomeStSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleAllIndicatorsInGroup(stIndicatorIds, !isAllStSelected)}
                        />
                        <span style={{ flex: 1 }}>{stData.name}</span>
                        <Icon
                          icon={isSpecimenTypeExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                          width={16}
                          style={{ color: "#595959", flexShrink: 0, cursor: "pointer" }}
                          onClick={() => {
                            const key = `${groupData.id}_${stData.id}`;
                            setExpandedSpecimenTypes((prev) =>
                              prev.includes(key)
                                ? prev.filter((id) => id !== key)
                                : [...prev, key]
                            );
                          }}
                        />
                      </div>

                      {/* Chỉ tiêu within Loại mẫu (Level 3) */}
                      {isSpecimenTypeExpanded &&
                        stData.indicators.map((ind) => renderIndicatorWithMethods(ind, 2))}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </>
    );
  };

  // Left panel content - extracted for reuse in drawer
  const leftPanelContent = (
    <>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Từ khóa search */}
        <Input
          placeholder="Từ khóa..."
          prefix={<SearchOutlined style={{ color: "#999" }} />}
          value={indicatorSearchText}
          onChange={(e) => setIndicatorSearchText(e.target.value)}
          allowClear
          size="small"
        />
        {/* Danh mục loại mẫu - Select multiple with tags */}
        <Select
          mode="multiple"
          placeholder="Danh mục loại mẫu"
          value={selectedCategoryIds}
          onChange={setSelectedCategoryIds}
          style={{ width: "100%" }}
          size="small"
          maxTagCount="responsive"
          allowClear
          options={sampleTypeCategories
            .filter((cat) => cat.isActive)
            .map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
          tagRender={(props) => {
            const { label, closable, onClose } = props;
            return (
              <Tag
                color="blue"
                closable={closable}
                onClose={onClose}
                style={{
                  marginRight: 3,
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={label as string}
              >
                {label}
              </Tag>
            );
          }}
        />
        {/* Loại mẫu - Select multiple with tags */}
        <Select
          mode="multiple"
          placeholder="Loại mẫu"
          value={selectedSpecimenTypeIds}
          onChange={setSelectedSpecimenTypeIds}
          style={{ width: "100%" }}
          size="small"
          maxTagCount="responsive"
          allowClear
          options={filteredSpecimenTypeOptions.map((st) => ({
            value: st.id,
            label: st.name,
          }))}
          tagRender={(props) => {
            const { label, closable, onClose } = props;
            return (
              <Tag
                color="green"
                closable={closable}
                onClose={onClose}
                style={{
                  marginRight: 3,
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={label as string}
              >
                {label}
              </Tag>
            );
          }}
        />
        {/* Filter theo loại mẫu của sample hiện tại */}
        {currentSampleSpecimenTypeName && (
          <Checkbox
            checked={specimenTypeFilterActive}
            onChange={(e) => setSpecimenTypeFilterActive(e.target.checked)}
            style={{ fontSize: 13 }}
          >
            Chỉ hiện chỉ tiêu của: {currentSampleSpecimenTypeName}
          </Checkbox>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Empty state khi filter theo loại mẫu nhưng không có chỉ tiêu */}
        {specimenTypeFilterActive && indicatorsWithMethods.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              color: "#999",
            }}
          >
            <Icon
              icon="mdi:flask-empty-outline"
              width={48}
              style={{ marginBottom: 12, color: "#d9d9d9" }}
            />
            <Text type="secondary" style={{ fontSize: 14, textAlign: "center" }}>
              Loại mẫu "{currentSampleSpecimenTypeName}" chưa được cấu hình chỉ tiêu
            </Text>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
              Bỏ chọn filter để xem tất cả chỉ tiêu
            </Text>
          </div>
        ) : (
          // Always render grouped by Specimen Type
          renderBySpecimenType()
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Drawer for mobile indicator picker */}
      <Drawer
        title="Chọn chỉ tiêu"
        placement="left"
        open={indicatorPickerOpen}
        onClose={() => setIndicatorPickerOpen(false)}
        width={320}
        styles={{
          body: { padding: 0, display: "flex", flexDirection: "column" },
        }}
        className="indicator-picker-drawer"
      >
        {leftPanelContent}
      </Drawer>

      <Modal
        title={
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
          >
            <Icon icon="mdi:clipboard-check-outline" width={24} height={24} />
            <span>Chọn chỉ tiêu</span>
            {/* Button to open indicator picker - shown only on mobile/tablet via CSS */}
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setIndicatorPickerOpen(true)}
              className="indicator-add-button-mobile"
              style={{ marginLeft: "auto" }}
            >
              Thêm
            </Button>
          </div>
        }
        open={visible}
        onOk={onOk}
        onCancel={onCancel}
        width={1200}
        centered
        okText="Chọn"
        cancelText="Thoát"
        styles={{ body: { padding: 0 } }}
        className="indicator-selection-modal"
      >
        <div className="indicator-modal-body">
          {/* Left panel - 3-level tree: Group > Indicator > Methods (desktop only) */}
          <div className="indicator-modal-left">{leftPanelContent}</div>

          {/* Right panel - Selected indicator methods */}
          <div className="indicator-modal-right">
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #f0f0f0",
                background: "#fafafa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Text strong>Danh sách đã chọn</Text>
                <Checkbox
                  checked={
                    checkedIndicators.length === unsentMethods.length &&
                    unsentMethods.length > 0
                  }
                  indeterminate={
                    checkedIndicators.length > 0 &&
                    checkedIndicators.length < unsentMethods.length
                  }
                  disabled={unsentMethods.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCheckedIndicators([...unsentMethods]);
                    } else {
                      setCheckedIndicators([]);
                    }
                  }}
                >
                  Chọn tất cả{" "}
                  {unsentMethods.length > 0
                    ? `(${unsentMethods.length})`
                    : "(Không có chỉ tiêu chưa gửi)"}
                </Checkbox>
              </div>
              <Button
                type="primary"
                size="small"
                icon={<Icon icon="mdi:send" width={14} />}
                onClick={handleSendToLaboratory}
              >
                Gửi khoa phòng
              </Button>
            </div>
            <div className="indicator-table-container">
              <div className="indicator-table-scroll">
                <div className="indicator-table-inner">
                  {/* Table header */}
                  <div
                    className="indicator-table-header"
                    style={{
                      background: "#fafafa",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ width: 24, flexShrink: 0 }}>[X]</span>
                    <span style={{ flex: 1, minWidth: 80 }}>Chỉ tiêu</span>
                    <span style={{ width: 120, flexShrink: 0 }}>
                      Phương pháp
                    </span>
                    <span
                      style={{ width: 70, flexShrink: 0, textAlign: "right" }}
                    >
                      Đơn giá
                    </span>
                    <span
                      style={{ width: 100, flexShrink: 0, textAlign: "center" }}
                    >
                      Ngày CG
                    </span>
                    <span
                      style={{ width: 100, flexShrink: 0, textAlign: "center" }}
                    >
                      Ngày YC
                    </span>
                    <span style={{ width: 32, flexShrink: 0 }}>Xóa</span>
                  </div>
                  {/* Table body */}
                  <div className="indicator-table-body">
                    {/* Unsent indicator methods */}
                    {unsentMethods.map((key) => {
                      const { indicator, method } = getIndicatorMethodInfo(key);
                      return (
                        <IndicatorRow
                          key={key}
                          id={key}
                          isInGroup={false}
                          indicator={indicator}
                          methodName={method?.testMethodName || ""}
                          methodFormattedName={method?.testMethodFormattedName}
                          unitPrice={method?.unitPrice || 0}
                          isChecked={checkedIndicators.includes(key)}
                          transferDate={
                            selectedIndicatorDates[key]?.transferDate
                          }
                          requestDate={selectedIndicatorDates[key]?.requestDate}
                          onCheckChange={toggleCheckedIndicator}
                          onDateChange={handleIndicatorDateChange}
                          onRemove={handleRemoveIndicatorMethod}
                        />
                      );
                    })}

                    {/* Sent indicator methods grouped by laboratory */}
                    {Object.entries(groupedByLab).map(
                      ([labId, { labName, methods: labMethods }]) => {
                        const isExpanded = expandedLabGroups.includes(labId);
                        return (
                          <div key={labId}>
                            <div
                              onClick={() => {
                                setExpandedLabGroups((prev) =>
                                  prev.includes(labId)
                                    ? prev.filter((id) => id !== labId)
                                    : [...prev, labId]
                                );
                              }}
                              style={{
                                padding: "8px 12px",
                                background: "#fafafa",
                                borderBottom: "1px solid #f0f0f0",
                                fontWeight: 600,
                                fontSize: 13,
                                color: "#000",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                cursor: "pointer",
                                userSelect: "none",
                              }}
                            >
                              <Icon
                                icon={
                                  isExpanded
                                    ? "mdi:chevron-down"
                                    : "mdi:chevron-right"
                                }
                                width={18}
                                style={{ color: "#595959", flexShrink: 0 }}
                              />
                              <span>
                                {labName} ({labMethods.length})
                              </span>
                            </div>
                            {isExpanded &&
                              labMethods.map((key) => {
                                const { indicator, method } =
                                  getIndicatorMethodInfo(key);
                                const labInfo =
                                  indicatorLaboratoryMap[
                                    `${currentSampleKey}_${key}`
                                  ];
                                return (
                                  <IndicatorRow
                                    key={key}
                                    id={key}
                                    isInGroup={true}
                                    indicator={indicator}
                                    methodName={method?.testMethodName || ""}
                                    methodFormattedName={method?.testMethodFormattedName}
                                    unitPrice={method?.unitPrice || 0}
                                    isChecked={checkedIndicators.includes(key)}
                                    transferDate={
                                      selectedIndicatorDates[key]?.transferDate
                                    }
                                    requestDate={
                                      selectedIndicatorDates[key]?.requestDate
                                    }
                                    approvalStatus={labInfo?.approvalStatus}
                                    onCheckChange={toggleCheckedIndicator}
                                    onDateChange={handleIndicatorDateChange}
                                    onRemove={handleRemoveIndicatorMethod}
                                  />
                                );
                              })}
                          </div>
                        );
                      }
                    )}

                    {/* Empty state */}
                    {tempSelectedIndicatorMethods.length === 0 && (
                      <div style={{ padding: 24, textAlign: "center" }}>
                        <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #d9d9d9",
                background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14 }}>
                Số chỉ tiêu:{" "}
                <Text strong>{tempSelectedIndicatorMethods.length}</Text>
                {sentMethods.length > 0 && (
                  <span style={{ color: "#52c41a", marginLeft: 8 }}>
                    (Đã gửi: {sentMethods.length})
                  </span>
                )}
              </Text>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 14 }}>Tổng tiền:</Text>
                <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                  {totalCost.toLocaleString("vi-VN")} đ
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default IndicatorSelectionModal;
