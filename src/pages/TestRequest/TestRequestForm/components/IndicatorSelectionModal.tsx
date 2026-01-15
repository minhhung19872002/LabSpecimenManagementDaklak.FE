// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Checkbox, Typography, Drawer } from "antd";
import { PlusOutlined } from "../../../../components/common/Icon";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import {
  IndicatorGroupDto,
  IndicatorDto,
  SpecimenTypeWithIndicatorsDto,
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
  indicatorSearchText: string;
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
  indicatorSearchText,
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

  // State for group mode: "indicatorGroup" | "specimenType"
  const [groupMode, setGroupMode] = useState<"indicatorGroup" | "specimenType">("specimenType");
  // State for expanded specimen types (when groupMode = "specimenType")
  const [expandedSpecimenTypes, setExpandedSpecimenTypes] = useState<string[]>([]);

  // Auto-expand all specimen types when modal opens and groupMode is specimenType
  useEffect(() => {
    if (visible && groupMode === "specimenType" && expandedSpecimenTypes.length === 0) {
      const activeSpecimenTypes = specimenTypesWithIndicators.filter(st => st.isActive).map(st => st.id);
      setExpandedSpecimenTypes([...activeSpecimenTypes, "others"]); // Include "others" for indicators without specimen type
    }
  }, [visible, groupMode, specimenTypesWithIndicators]);

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

  // Render content grouped by Specimen Type (2 levels: SpecimenType > IndicatorGroup > Indicator > Method)
  const renderBySpecimenType = () => {
    // Get all indicators with active methods
    let activeIndicators = indicators.filter(
      (ind) => ind.isActive && indicatorMethodsMap[ind.id]?.some((m) => m.isActive)
    );

    // Apply specimen type filter if active
    if (specimenTypeFilterActive) {
      activeIndicators = activeIndicators.filter((ind) =>
        specimenTypeIndicatorIds.includes(ind.id)
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

    const activeIndicatorIds = new Set(activeIndicators.map((i) => i.id));

    // Group by specimen type
    const specimenTypeGroups: {
      id: string;
      name: string;
      indicatorsByGroup: Map<string, IndicatorDto[]>;
    }[] = [];

    // Process each active specimen type
    specimenTypesWithIndicators
      .filter((st) => st.isActive)
      .forEach((st) => {
        const stIndicatorIds = st.indicators
          ?.filter((sti) => sti.isActive)
          .map((sti) => sti.indicatorId) || [];

        // Get indicators that belong to this specimen type AND are active
        const stIndicators = activeIndicators.filter((ind) =>
          stIndicatorIds.includes(ind.id)
        );

        if (stIndicators.length === 0) return;

        // Group by indicator group within this specimen type
        const indicatorsByGroup = new Map<string, IndicatorDto[]>();
        stIndicators.forEach((ind) => {
          const groupId = ind.indicatorGroupId;
          if (!indicatorsByGroup.has(groupId)) {
            indicatorsByGroup.set(groupId, []);
          }
          indicatorsByGroup.get(groupId)!.push(ind);
        });

        specimenTypeGroups.push({
          id: st.id,
          name: st.name,
          indicatorsByGroup,
        });
      });

    // Find indicators without specimen type (or not in any active specimen type)
    const indicatorsWithSpecimenType = new Set<string>();
    specimenTypesWithIndicators.forEach((st) => {
      st.indicators?.forEach((sti) => {
        if (sti.isActive) {
          indicatorsWithSpecimenType.add(sti.indicatorId);
        }
      });
    });

    const othersIndicators = activeIndicators.filter(
      (ind) => !indicatorsWithSpecimenType.has(ind.id)
    );

    if (othersIndicators.length > 0) {
      const indicatorsByGroup = new Map<string, IndicatorDto[]>();
      othersIndicators.forEach((ind) => {
        const groupId = ind.indicatorGroupId;
        if (!indicatorsByGroup.has(groupId)) {
          indicatorsByGroup.set(groupId, []);
        }
        indicatorsByGroup.get(groupId)!.push(ind);
      });

      specimenTypeGroups.push({
        id: "others",
        name: "Khác",
        indicatorsByGroup,
      });
    }

    return (
      <>
        {specimenTypeGroups.map((stGroup) => {
          const isSpecimenTypeExpanded = expandedSpecimenTypes.includes(stGroup.id);
          // Get all indicator IDs in this specimen type group
          const allIndicatorIdsInGroup: string[] = [];
          stGroup.indicatorsByGroup.forEach((inds) => {
            inds.forEach((ind) => allIndicatorIdsInGroup.push(ind.id));
          });
          const isAllSpecimenTypeSelected = areAllIndicatorsSelected(allIndicatorIdsInGroup);
          const isSomeSpecimenTypeSelected = areSomeIndicatorsSelected(allIndicatorIdsInGroup);

          return (
            <div key={stGroup.id}>
              {/* Specimen Type header */}
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
                  checked={isAllSpecimenTypeSelected}
                  indeterminate={isSomeSpecimenTypeSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleAllIndicatorsInGroup(allIndicatorIdsInGroup, !isAllSpecimenTypeSelected)}
                />
                <span style={{ flex: 1 }}>{stGroup.name}</span>
                <Icon
                  icon={isSpecimenTypeExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                  width={18}
                  style={{ color: "#595959", flexShrink: 0, cursor: "pointer" }}
                  onClick={() => {
                    setExpandedSpecimenTypes((prev) =>
                      prev.includes(stGroup.id)
                        ? prev.filter((id) => id !== stGroup.id)
                        : [...prev, stGroup.id]
                    );
                  }}
                />
              </div>

              {/* Indicator Groups within Specimen Type */}
              {isSpecimenTypeExpanded &&
                Array.from(stGroup.indicatorsByGroup.entries()).map(([groupId, groupInds]) => {
                  const group = indicatorGroups.find((g) => g.id === groupId);
                  if (!group) return null;

                  const isGroupExpanded = expandedGroups.includes(`${stGroup.id}_${groupId}`);
                  const groupIndicatorIds = groupInds.map((ind) => ind.id);
                  const isAllGroupSelected = areAllIndicatorsSelected(groupIndicatorIds);
                  const isSomeGroupSelected = areSomeIndicatorsSelected(groupIndicatorIds);

                  return (
                    <div key={`${stGroup.id}_${groupId}`}>
                      {/* Indicator Group header */}
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
                          checked={isAllGroupSelected}
                          indeterminate={isSomeGroupSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleAllIndicatorsInGroup(groupIndicatorIds, !isAllGroupSelected)}
                        />
                        <span style={{ flex: 1 }}>{group.name}</span>
                        <Icon
                          icon={isGroupExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                          width={16}
                          style={{ color: "#595959", flexShrink: 0, cursor: "pointer" }}
                          onClick={() => {
                            const key = `${stGroup.id}_${groupId}`;
                            setExpandedGroups((prev) =>
                              prev.includes(key)
                                ? prev.filter((id) => id !== key)
                                : [...prev, key]
                            );
                          }}
                        />
                      </div>

                      {/* Indicators within Group */}
                      {isGroupExpanded &&
                        groupInds.map((ind) => renderIndicatorWithMethods(ind, 2))}
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
        {/* Toggle group mode */}
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <Button
            type={groupMode === "specimenType" ? "primary" : "default"}
            size="small"
            onClick={() => setGroupMode("specimenType")}
            icon={<Icon icon="mdi:flask-outline" width={14} />}
          >
            Loại mẫu
          </Button>
          <Button
            type={groupMode === "indicatorGroup" ? "primary" : "default"}
            size="small"
            onClick={() => setGroupMode("indicatorGroup")}
            icon={<Icon icon="mdi:folder-outline" width={14} />}
          >
            Nhóm CT
          </Button>
        </div>
        {/* Filter theo nhóm chỉ tiêu - chỉ hiện khi groupMode = indicatorGroup */}
        {groupMode === "indicatorGroup" && (
          <div
            onClick={() => setGroupSelectorVisible(true)}
            style={{
              padding: "6px 12px",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              cursor: "pointer",
              background: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: selectedGroupFilter === "all" ? "#999" : "#000",
              }}
            >
              {selectedGroupFilter === "all"
                ? "--- Tất cả nhóm chỉ tiêu ---"
                : indicatorGroups.find((g) => g.id === selectedGroupFilter)
                    ?.name || "Chọn nhóm..."}
            </span>
            <Icon icon="mdi:chevron-down" width={16} />
          </div>
        )}
        {/* Filter theo loại mẫu */}
        {currentSampleSpecimenTypeName && (
          <Checkbox
            checked={specimenTypeFilterActive}
            onChange={(e) => setSpecimenTypeFilterActive(e.target.checked)}
            style={{ fontSize: 13 }}
          >
            {currentSampleSpecimenTypeName}
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
        ) : groupMode === "specimenType" ? (
          // Render grouped by Specimen Type
          renderBySpecimenType()
        ) : selectedGroupFilter === "all"
          ? indicatorGroups.map((group) => {
              // Get indicators in this group that have active methods
              let groupIndicators = indicators.filter(
                (ind) =>
                  ind.indicatorGroupId === group.id &&
                  ind.isActive &&
                  indicatorMethodsMap[ind.id]?.some((m) => m.isActive)
              );

              // Apply specimen type filter if active
              if (specimenTypeFilterActive) {
                groupIndicators = groupIndicators.filter((ind) =>
                  specimenTypeIndicatorIds.includes(ind.id)
                );
              }

              if (groupIndicators.length === 0) return null;

              // Apply search filter
              const filteredIndicators = indicatorSearchText.trim()
                ? groupIndicators.filter(
                    (ind) =>
                      ind.name
                        .toLowerCase()
                        .includes(indicatorSearchText.toLowerCase().trim()) ||
                      ind.code
                        ?.toLowerCase()
                        .includes(indicatorSearchText.toLowerCase().trim())
                  )
                : groupIndicators;

              if (filteredIndicators.length === 0) return null;

              const isGroupExpanded = expandedGroups.includes(group.id);
              const groupIndicatorIds = filteredIndicators.map((ind) => ind.id);
              const isAllGroupSelected = areAllIndicatorsSelected(groupIndicatorIds);
              const isSomeGroupSelected = areSomeIndicatorsSelected(groupIndicatorIds);

              return (
                <div key={group.id}>
                  {/* Group header */}
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
                      onChange={() => toggleAllIndicatorsInGroup(groupIndicatorIds, !isAllGroupSelected)}
                    />
                    <span style={{ flex: 1 }}>{group.name}</span>
                    <Icon
                      icon={isGroupExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                      width={18}
                      style={{ color: "#595959", flexShrink: 0, cursor: "pointer" }}
                      onClick={() => {
                        setExpandedGroups((prev) =>
                          prev.includes(group.id)
                            ? prev.filter((id) => id !== group.id)
                            : [...prev, group.id]
                        );
                      }}
                    />
                  </div>

                  {/* Indicators under group - reuse helper */}
                  {isGroupExpanded &&
                    filteredIndicators.map((ind) => renderIndicatorWithMethods(ind, 1))}
                </div>
              );
            })
          : // When a specific group is selected - reuse helper
            getFilteredIndicators()
              .filter((ind) =>
                indicatorMethodsMap[ind.id]?.some((m) => m.isActive)
              )
              .filter((ind) =>
                // Apply specimen type filter if active
                // Nếu filter active mà specimenTypeIndicatorIds rỗng -> hiện danh sách rỗng
                !specimenTypeFilterActive ||
                specimenTypeIndicatorIds.includes(ind.id)
              )
              .map((ind) => renderIndicatorWithMethods(ind, 1))}
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
