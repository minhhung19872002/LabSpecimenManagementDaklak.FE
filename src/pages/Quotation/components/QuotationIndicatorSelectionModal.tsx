import React, { useEffect, useState, useMemo } from "react";
import { Modal, Checkbox, Typography, Input, Empty, Spin } from "antd";
import { SearchOutlined } from "../../../components/common/Icon";
import { Icon } from "@iconify/react";
import {
  testMethodService,
  indicatorGroupService,
  indicatorService,
  TestMethodWithIndicatorsDto,
  TestMethodIndicatorDto,
  IndicatorGroupDto,
  IndicatorDto,
} from "../../../services/masterDataService";
import { formatCurrency } from "../../../utils/formatters";
import { IndicatorName } from "../../../components/common";

const { Text } = Typography;

// Selected method info for quotation
export interface SelectedMethodInfo {
  indicatorId: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  testMethodId: string;
  testMethodName: string;
  testMethodFormattedName?: string;
  unitPrice: number;
}

interface QuotationIndicatorSelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (selectedMethods: SelectedMethodInfo[]) => void;
  excludedMethods?: string[]; // indicatorId_testMethodId keys to exclude
}

// Method info
interface MethodInfo {
  testMethodId: string;
  testMethodName: string;
  testMethodFormattedName?: string;
  unitPrice: number;
}

// Indicator methods map
type IndicatorMethodsMap = Record<string, MethodInfo[]>;

const QuotationIndicatorSelectionModal: React.FC<
  QuotationIndicatorSelectionModalProps
> = ({ visible, onCancel, onOk, excludedMethods = [] }) => {
  const [loading, setLoading] = useState(false);
  const [indicatorGroups, setIndicatorGroups] = useState<IndicatorGroupDto[]>([]);
  const [indicators, setIndicators] = useState<IndicatorDto[]>([]);
  const [indicatorMethodsMap, setIndicatorMethodsMap] = useState<IndicatorMethodsMap>({});
  const [searchText, setSearchText] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedIndicators, setExpandedIndicators] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      loadData();
    } else {
      // Reset on close
      setSelectedKeys([]);
      setSearchText("");
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groups, allIndicators, testMethodsWithIndicators] = await Promise.all([
        indicatorGroupService.getActive(),
        indicatorService.getActive(),
        testMethodService.getWithIndicators(),
      ]);

      setIndicatorGroups(groups);
      setIndicators(allIndicators);

      // Build indicator methods map
      const methodsMap: IndicatorMethodsMap = {};

      testMethodsWithIndicators.forEach((method: TestMethodWithIndicatorsDto) => {
        if (!method.isActive) return;

        method.indicators?.forEach((ind: TestMethodIndicatorDto) => {
          if (!ind.isActive) return;

          if (!methodsMap[ind.indicatorId]) {
            methodsMap[ind.indicatorId] = [];
          }

          // Avoid duplicate methods
          if (!methodsMap[ind.indicatorId].find((m) => m.testMethodId === method.id)) {
            methodsMap[ind.indicatorId].push({
              testMethodId: method.id,
              testMethodName: method.name,
              testMethodFormattedName: method.formattedName || undefined,
              unitPrice: ind.unitPrice,
            });
          }
        });
      });

      setIndicatorMethodsMap(methodsMap);

      // Auto-expand all groups
      setExpandedGroups(groups.map((g) => g.id));
      // Auto-expand all indicators that have methods
      const indicatorsWithMethods = allIndicators.filter(
        (ind) => ind.isActive && methodsMap[ind.id]?.length > 0
      );
      setExpandedIndicators(indicatorsWithMethods.map((i) => i.id));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get indicators with methods for display
  const indicatorsWithMethods = useMemo(() => {
    return indicators.filter(
      (ind) => ind.isActive && indicatorMethodsMap[ind.id]?.length > 0
    );
  }, [indicators, indicatorMethodsMap]);

  // Filter indicators by search text
  const getFilteredIndicatorsForGroup = (groupId: string) => {
    const groupIndicators = indicatorsWithMethods.filter(
      (ind) => ind.indicatorGroupId === groupId
    );

    if (!searchText.trim()) return groupIndicators;

    const search = searchText.toLowerCase();
    return groupIndicators.filter(
      (ind) =>
        ind.name.toLowerCase().includes(search) ||
        ind.code?.toLowerCase().includes(search)
    );
  };

  // Toggle method selection
  const toggleMethod = (indicatorId: string, testMethodId: string) => {
    const key = `${indicatorId}_${testMethodId}`;
    if (excludedMethods.includes(key)) return;

    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Check if method is selected
  const isMethodSelected = (indicatorId: string, testMethodId: string) => {
    return selectedKeys.includes(`${indicatorId}_${testMethodId}`);
  };

  // Check if method is excluded
  const isMethodExcluded = (indicatorId: string, testMethodId: string) => {
    return excludedMethods.includes(`${indicatorId}_${testMethodId}`);
  };

  // Handle OK
  const handleOk = () => {
    const selectedMethods: SelectedMethodInfo[] = selectedKeys.map((key) => {
      const [indicatorId, testMethodId] = key.split("_");
      const indicator = indicators.find((i) => i.id === indicatorId);
      const methods = indicatorMethodsMap[indicatorId] || [];
      const method = methods.find((m) => m.testMethodId === testMethodId);
      return {
        indicatorId,
        indicatorName: indicator?.name || "",
        indicatorFormattedName: indicator?.formattedName || undefined,
        testMethodId,
        testMethodName: method?.testMethodName || "",
        testMethodFormattedName: method?.testMethodFormattedName || undefined,
        unitPrice: method?.unitPrice || 0,
      };
    });
    onOk(selectedMethods);
  };

  // Calculate total
  const totalCost = selectedKeys.reduce((sum, key) => {
    const [indicatorId, testMethodId] = key.split("_");
    const methods = indicatorMethodsMap[indicatorId] || [];
    const method = methods.find((m) => m.testMethodId === testMethodId);
    return sum + (method?.unitPrice || 0);
  }, 0);

  // Get selected count for an indicator
  const getSelectedCountForIndicator = (indicatorId: string) => {
    return selectedKeys.filter((k) => k.startsWith(`${indicatorId}_`)).length;
  };

  // Get selected count for a group
  const getSelectedCountForGroup = (groupId: string) => {
    const groupIndicators = indicatorsWithMethods.filter(
      (ind) => ind.indicatorGroupId === groupId
    );
    return selectedKeys.filter((key) => {
      const [indicatorId] = key.split("_");
      return groupIndicators.some((ind) => ind.id === indicatorId);
    }).length;
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon icon="mdi:clipboard-check-outline" width={24} height={24} />
          <span>Chọn chỉ tiêu / Phương pháp</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText={`Thêm ${selectedKeys.length} chỉ tiêu`}
      cancelText="Hủy"
      width={700}
      centered
      okButtonProps={{ disabled: selectedKeys.length === 0 }}
      styles={{ body: { padding: 0 } }}
    >
      <Spin spinning={loading}>
        {/* Search */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #f0f0f0",
            background: "#fafafa",
          }}
        >
          <Input
            placeholder="Tìm kiếm chỉ tiêu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        {/* Selected summary */}
        {selectedKeys.length > 0 && (
          <div
            style={{
              padding: "8px 16px",
              background: "#e6f7ff",
              borderBottom: "1px solid #91d5ff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text>
              Đã chọn: <strong>{selectedKeys.length}</strong> chỉ tiêu
            </Text>
            <Text>
              Tổng:{" "}
              <strong style={{ color: "#1890ff" }}>
                {formatCurrency(totalCost)}
              </strong>
            </Text>
          </div>
        )}

        {/* 3-level tree: Group > Indicator > Methods */}
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {indicatorGroups.length === 0 ? (
            <Empty description="Không có dữ liệu" style={{ padding: 40 }} />
          ) : (
            indicatorGroups.map((group) => {
              const groupIndicators = getFilteredIndicatorsForGroup(group.id);
              if (groupIndicators.length === 0) return null;

              const isGroupExpanded = expandedGroups.includes(group.id);
              const groupSelectedCount = getSelectedCountForGroup(group.id);

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
                      icon={
                        isGroupExpanded
                          ? "mdi:chevron-down"
                          : "mdi:chevron-right"
                      }
                      width={18}
                      style={{ color: "#595959", flexShrink: 0 }}
                    />
                    <span style={{ flex: 1 }}>{group.name}</span>
                    {groupSelectedCount > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#1890ff",
                          background: "#bae7ff",
                          padding: "1px 6px",
                          borderRadius: 10,
                        }}
                      >
                        {groupSelectedCount}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        color: "#888",
                        fontWeight: 400,
                      }}
                    >
                      ({groupIndicators.length})
                    </span>
                  </div>

                  {/* Indicators under group */}
                  {isGroupExpanded &&
                    groupIndicators.map((indicator) => {
                      const methods = indicatorMethodsMap[indicator.id] || [];
                      const isIndicatorExpanded = expandedIndicators.includes(
                        indicator.id
                      );
                      const selectedCount = getSelectedCountForIndicator(
                        indicator.id
                      );

                      return (
                        <div key={indicator.id}>
                          {/* Indicator header */}
                          <div
                            onClick={() => {
                              setExpandedIndicators((prev) =>
                                prev.includes(indicator.id)
                                  ? prev.filter((id) => id !== indicator.id)
                                  : [...prev, indicator.id]
                              );
                            }}
                            style={{
                              padding: "6px 12px 6px 28px",
                              borderBottom: "1px solid #f5f5f5",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              cursor: "pointer",
                              background:
                                selectedCount > 0 ? "#e6f7ff" : "#fff",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedCount === 0) {
                                e.currentTarget.style.background = "#f5f5f5";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                selectedCount > 0 ? "#e6f7ff" : "#fff";
                            }}
                          >
                            <Icon
                              icon={
                                isIndicatorExpanded
                                  ? "mdi:chevron-down"
                                  : "mdi:chevron-right"
                              }
                              width={16}
                              style={{ color: "#595959", flexShrink: 0 }}
                            />
                            <IndicatorName
                              name={indicator.name}
                              formattedName={indicator.formattedName}
                              style={{
                                flex: 1,
                                fontSize: 13,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            />
                            {selectedCount > 0 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#1890ff",
                                  background: "#e6f7ff",
                                  padding: "1px 6px",
                                  borderRadius: 10,
                                }}
                              >
                                {selectedCount}
                              </span>
                            )}
                            <span style={{ fontSize: 12, color: "#888" }}>
                              ({methods.length})
                            </span>
                          </div>

                          {/* Methods under indicator */}
                          {isIndicatorExpanded &&
                            methods.map((method) => {
                              const isSelected = isMethodSelected(
                                indicator.id,
                                method.testMethodId
                              );
                              const isExcluded = isMethodExcluded(
                                indicator.id,
                                method.testMethodId
                              );

                              return (
                                <div
                                  key={method.testMethodId}
                                  onClick={() =>
                                    !isExcluded &&
                                    toggleMethod(
                                      indicator.id,
                                      method.testMethodId
                                    )
                                  }
                                  style={{
                                    padding: "5px 12px 5px 48px",
                                    borderBottom: "1px solid #f8f8f8",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: isExcluded
                                      ? "not-allowed"
                                      : "pointer",
                                    background: isSelected
                                      ? "#bae7ff"
                                      : isExcluded
                                      ? "#f5f5f5"
                                      : "#fff",
                                    opacity: isExcluded ? 0.5 : 1,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected && !isExcluded) {
                                      e.currentTarget.style.background =
                                        "#f0f0f0";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      isSelected
                                        ? "#bae7ff"
                                        : isExcluded
                                        ? "#f5f5f5"
                                        : "#fff";
                                  }}
                                >
                                  <Checkbox
                                    checked={isSelected || isExcluded}
                                    disabled={isExcluded}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() =>
                                      toggleMethod(
                                        indicator.id,
                                        method.testMethodId
                                      )
                                    }
                                  />
                                  <IndicatorName
                                    name={method.testMethodName}
                                    formattedName={method.testMethodFormattedName}
                                    style={{
                                      flex: 1,
                                      fontSize: 12,
                                      color: "#595959",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  />
                                  {isExcluded && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "#fa8c16",
                                        background: "#fff7e6",
                                        padding: "1px 6px",
                                        borderRadius: 4,
                                      }}
                                    >
                                      Đã chọn
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: "#52c41a",
                                      fontWeight: 500,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {formatCurrency(method.unitPrice)}
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
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default QuotationIndicatorSelectionModal;
