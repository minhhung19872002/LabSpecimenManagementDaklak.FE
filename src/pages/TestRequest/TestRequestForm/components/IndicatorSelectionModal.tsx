// @ts-nocheck
import React, { useEffect, useMemo } from "react";
import { Modal, Button, Checkbox, Typography } from "antd";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import { IndicatorGroupDto, IndicatorDto } from "../../../../services/masterDataService";
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
  setTempSelectedIndicatorMethods: React.Dispatch<React.SetStateAction<IndicatorMethodKey[]>>;
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
  setSelectedIndicatorDates: React.Dispatch<React.SetStateAction<Record<string, IndicatorDateInfo>>>;
  checkedIndicators: string[];
  setCheckedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  handleIndicatorDateChange: (id: string, field: "transferDate" | "requestDate", value: dayjs.Dayjs | null) => void;
  toggleCheckedIndicator: (id: string) => void;
  handleSendToLaboratory: () => void;
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  setIndicatorLaboratoryMap: React.Dispatch<React.SetStateAction<Record<string, LaboratoryAssignment>>>;
  expandedLabGroups: string[];
  setExpandedLabGroups: React.Dispatch<React.SetStateAction<string[]>>;
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
  const isMethodSelected = (indicatorId: string, testMethodId: string): boolean => {
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

  // Get indicators that have active methods
  const indicatorsWithMethods = useMemo(() => {
    return indicators.filter(
      (ind) => ind.isActive && indicatorMethodsMap[ind.id]?.some((m) => m.isActive)
    );
  }, [indicators, indicatorMethodsMap]);

  // Auto-expand all indicators when modal opens
  useEffect(() => {
    if (visible && indicatorsWithMethods.length > 0 && expandedIndicators.length === 0) {
      setExpandedIndicators(indicatorsWithMethods.map((ind) => ind.id));
    }
  }, [visible, indicatorsWithMethods]);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon icon="mdi:clipboard-check-outline" width={24} height={24} />
          <span>Chọn chỉ tiêu</span>
        </div>
      }
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={1600}
      okText="Chọn"
      cancelText="Thoát"
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: "flex", height: 550 }}>
        {/* Left panel - 3-level tree: Group > Indicator > Methods */}
        <div
          style={{
            width: 400,
            borderRight: "1px solid #f0f0f0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
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
              <span style={{ color: selectedGroupFilter === "all" ? "#999" : "#000" }}>
                {selectedGroupFilter === "all"
                  ? "--- Tất cả nhóm chỉ tiêu ---"
                  : indicatorGroups.find((g) => g.id === selectedGroupFilter)?.name ||
                    "Chọn nhóm..."}
              </span>
              <Icon icon="mdi:chevron-down" width={16} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {selectedGroupFilter === "all"
              ? indicatorGroups.map((group) => {
                  // Get indicators in this group that have active methods
                  const groupIndicators = indicators.filter(
                    (ind) =>
                      ind.indicatorGroupId === group.id &&
                      ind.isActive &&
                      indicatorMethodsMap[ind.id]?.some((m) => m.isActive)
                  );
                  if (groupIndicators.length === 0) return null;

                  // Apply search filter
                  const filteredIndicators = indicatorSearchText.trim()
                    ? groupIndicators.filter(
                        (ind) =>
                          ind.name.toLowerCase().includes(indicatorSearchText.toLowerCase().trim()) ||
                          ind.code?.toLowerCase().includes(indicatorSearchText.toLowerCase().trim())
                      )
                    : groupIndicators;

                  if (filteredIndicators.length === 0) return null;

                  const isGroupExpanded = expandedGroups.includes(group.id);

                  return (
                    <div key={group.id}>
                      {/* Group header */}
                      <div
                        onClick={() => {
                          setExpandedGroups((prev) =>
                            prev.includes(group.id)
                              ? prev.filter((id) => id !== group.id)
                              : [...prev, group.id]
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e6f7ff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fafafa";
                        }}
                      >
                        <Icon
                          icon={isGroupExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                          width={18}
                          style={{ color: "#595959", flexShrink: 0 }}
                        />
                        <span style={{ flex: 1 }}>{group.name}</span>
                        <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>
                          ({filteredIndicators.length})
                        </span>
                      </div>

                      {/* Indicators under group */}
                      {isGroupExpanded &&
                        filteredIndicators.map((ind) => {
                          const methods = indicatorMethodsMap[ind.id]?.filter((m) => m.isActive) || [];
                          const isIndicatorExpanded = expandedIndicators.includes(ind.id);
                          const selectedMethodsCount = methods.filter((m) =>
                            isMethodSelected(ind.id, m.testMethodId)
                          ).length;

                          return (
                            <div key={ind.id}>
                              {/* Indicator header */}
                              <div
                                onClick={() => {
                                  setExpandedIndicators((prev) =>
                                    prev.includes(ind.id)
                                      ? prev.filter((id) => id !== ind.id)
                                      : [...prev, ind.id]
                                  );
                                }}
                                style={{
                                  padding: "6px 12px 6px 28px",
                                  borderBottom: "1px solid #f5f5f5",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  cursor: "pointer",
                                  background: selectedMethodsCount > 0 ? "#e6f7ff" : "#fff",
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedMethodsCount === 0) {
                                    e.currentTarget.style.background = "#f5f5f5";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    selectedMethodsCount > 0 ? "#e6f7ff" : "#fff";
                                }}
                              >
                                <Icon
                                  icon={isIndicatorExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                                  width={16}
                                  style={{ color: "#595959", flexShrink: 0 }}
                                />
                                <span
                                  style={{
                                    flex: 1,
                                    fontSize: 13,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {ind.name}
                                </span>
                                {selectedMethodsCount > 0 && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "#1890ff",
                                      background: "#e6f7ff",
                                      padding: "1px 6px",
                                      borderRadius: 10,
                                    }}
                                  >
                                    {selectedMethodsCount}
                                  </span>
                                )}
                                <span style={{ fontSize: 12, color: "#888" }}>
                                  ({methods.length})
                                </span>
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
                                        padding: "5px 12px 5px 48px",
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
                                        {method.testMethodName}
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
                        })}
                    </div>
                  );
                })
              : // When a specific group is selected
                getFilteredIndicators()
                  .filter((ind) => indicatorMethodsMap[ind.id]?.some((m) => m.isActive))
                  .map((ind) => {
                    const methods = indicatorMethodsMap[ind.id]?.filter((m) => m.isActive) || [];
                    const isIndicatorExpanded = expandedIndicators.includes(ind.id);
                    const selectedMethodsCount = methods.filter((m) =>
                      isMethodSelected(ind.id, m.testMethodId)
                    ).length;

                    return (
                      <div key={ind.id}>
                        {/* Indicator header */}
                        <div
                          onClick={() => {
                            setExpandedIndicators((prev) =>
                              prev.includes(ind.id)
                                ? prev.filter((id) => id !== ind.id)
                                : [...prev, ind.id]
                            );
                          }}
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #f5f5f5",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            background: selectedMethodsCount > 0 ? "#e6f7ff" : "#fff",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedMethodsCount === 0) {
                              e.currentTarget.style.background = "#f5f5f5";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedMethodsCount > 0 ? "#e6f7ff" : "#fff";
                          }}
                        >
                          <Icon
                            icon={isIndicatorExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                            width={16}
                            style={{ color: "#595959", flexShrink: 0 }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: 13,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ind.name}
                          </span>
                          {selectedMethodsCount > 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#1890ff",
                                background: "#e6f7ff",
                                padding: "1px 6px",
                                borderRadius: 10,
                              }}
                            >
                              {selectedMethodsCount}
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: "#888" }}>({methods.length})</span>
                        </div>

                        {/* Methods */}
                        {isIndicatorExpanded &&
                          methods.map((method) => {
                            const isSelected = isMethodSelected(ind.id, method.testMethodId);
                            return (
                              <div
                                key={method.testMethodId}
                                onClick={() => toggleIndicatorMethod(ind.id, method.testMethodId)}
                                style={{
                                  padding: "5px 12px 5px 32px",
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
                                  {method.testMethodName}
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
                  })}
          </div>
        </div>

        {/* Right panel - Selected indicator methods */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text strong>Danh sách đã chọn</Text>
              <Checkbox
                checked={
                  checkedIndicators.length === unsentMethods.length && unsentMethods.length > 0
                }
                indeterminate={
                  checkedIndicators.length > 0 && checkedIndicators.length < unsentMethods.length
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    setCheckedIndicators([...unsentMethods]);
                  } else {
                    setCheckedIndicators([]);
                  }
                }}
              >
                Chọn tất cả
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
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "#fafafa",
                borderBottom: "1px solid #f0f0f0",
                fontWeight: 600,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              <span style={{ width: 24 }}>[X]</span>
              <span style={{ flex: 1 }}>Chỉ tiêu</span>
              <span style={{ width: 150 }}>Phương pháp</span>
              <span style={{ width: 80, textAlign: "right" }}>Đơn giá</span>
              <span style={{ width: 110, textAlign: "center" }}>Ngày chuyển giao</span>
              <span style={{ width: 110, textAlign: "center" }}>Ngày yêu cầu</span>
              <span style={{ width: 32 }}>Xóa</span>
            </div>
            {/* Table body */}
            <div style={{ flex: 1, overflowY: "auto" }}>
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
                    unitPrice={method?.unitPrice || 0}
                    isChecked={checkedIndicators.includes(key)}
                    transferDate={selectedIndicatorDates[key]?.transferDate}
                    requestDate={selectedIndicatorDates[key]?.requestDate}
                    onCheckChange={toggleCheckedIndicator}
                    onDateChange={handleIndicatorDateChange}
                    onRemove={handleRemoveIndicatorMethod}
                  />
                );
              })}

              {/* Sent indicator methods grouped by laboratory */}
              {Object.entries(groupedByLab).map(([labId, { labName, methods: labMethods }]) => {
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
                        icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
                        width={18}
                        style={{ color: "#595959", flexShrink: 0 }}
                      />
                      <span>
                        {labName} ({labMethods.length})
                      </span>
                    </div>
                    {isExpanded &&
                      labMethods.map((key) => {
                        const { indicator, method } = getIndicatorMethodInfo(key);
                        return (
                          <IndicatorRow
                            key={key}
                            id={key}
                            isInGroup={true}
                            indicator={indicator}
                            methodName={method?.testMethodName || ""}
                            unitPrice={method?.unitPrice || 0}
                            isChecked={checkedIndicators.includes(key)}
                            transferDate={selectedIndicatorDates[key]?.transferDate}
                            requestDate={selectedIndicatorDates[key]?.requestDate}
                            onCheckChange={toggleCheckedIndicator}
                            onDateChange={handleIndicatorDateChange}
                            onRemove={handleRemoveIndicatorMethod}
                          />
                        );
                      })}
                  </div>
                );
              })}

              {/* Empty state */}
              {tempSelectedIndicatorMethods.length === 0 && (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <Text type="secondary">Chưa chọn chỉ tiêu nào</Text>
                </div>
              )}
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
              Số chỉ tiêu: <Text strong>{tempSelectedIndicatorMethods.length}</Text>
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
  );
};

export default IndicatorSelectionModal;
