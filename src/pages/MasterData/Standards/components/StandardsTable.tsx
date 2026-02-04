import React, { useState } from "react";
import {
  Table,
  Input,
  Row,
  Col,
  Spin,
  Button,
  Empty,
  Space,
  Checkbox,
} from "antd";
import type { SorterResult } from "antd/es/table/interface";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedStandardData, StandardIndicatorDto } from "../types";
import { StandardIndicatorWithPosition } from "../constants";
import "./StandardsTable.css";

// Sort config type for indicator tables
interface IndicatorSortConfig {
  field: string | null;
  order: "ascend" | "descend" | null;
}

// Utility function to sort indicators by parent-child relationship
// Parents first, then their sub-indicators grouped together
// Also adds _isFirstSub and _isLastSub flags for tree line rendering
// IMPORTANT: Group by both parentIndicatorId AND specimenTypeId
const sortIndicatorsByHierarchy = (
  indicators: StandardIndicatorDto[],
  sortConfig?: IndicatorSortConfig
): StandardIndicatorWithPosition[] => {
  if (!indicators || indicators.length === 0) return [];

  // Separate parent indicators and sub-indicators
  const parents = indicators.filter(ind => !ind.parentIndicatorId);
  const subs = indicators.filter(ind => ind.parentIndicatorId);

  // Group sub-indicators by parentIndicatorId + specimenTypeId
  // Key format: "parentIndicatorId|specimenTypeId"
  const subsByParentAndSpecimen = new Map<string, StandardIndicatorDto[]>();
  subs.forEach(sub => {
    const key = `${sub.parentIndicatorId}|${sub.specimenTypeId || ""}`;
    if (!subsByParentAndSpecimen.has(key)) {
      subsByParentAndSpecimen.set(key, []);
    }
    subsByParentAndSpecimen.get(key)!.push(sub);
  });

  // Sort subs within each group by sortOrder
  subsByParentAndSpecimen.forEach((subList) => {
    subList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  });

  // Build sorted result with position flags
  const result: StandardIndicatorWithPosition[] = [];

  // Sort parents based on sortConfig or default to sortOrder
  let sortedParents = [...parents];
  if (sortConfig?.field === "specimenTypeName" && sortConfig.order) {
    const multiplier = sortConfig.order === "ascend" ? 1 : -1;
    sortedParents.sort((a, b) => {
      const codeA = a.specimenTypeCode || "";
      const codeB = b.specimenTypeCode || "";
      return multiplier * codeA.localeCompare(codeB, "vi");
    });
  } else {
    // Default sort by sortOrder
    sortedParents.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  sortedParents.forEach(parent => {
    // Match by both indicatorId AND specimenTypeId
    const key = `${parent.indicatorId}|${parent.specimenTypeId || ""}`;
    const childSubs = subsByParentAndSpecimen.get(key);
    const hasSubIndicators = !!childSubs && childSubs.length > 0;

    // Add parent with _hasSubIndicators flag
    result.push({
      ...parent,
      _hasSubIndicators: hasSubIndicators,
    });

    if (childSubs) {
      childSubs.forEach((sub, index) => {
        result.push({
          ...sub,
          _isFirstSub: index === 0,
          _isLastSub: index === childSubs.length - 1,
        });
      });
      subsByParentAndSpecimen.delete(key);
    }
  });

  // Then add orphaned sub-indicators (whose parent is not in the list)
  // Group them together by parentIndicatorId + specimenTypeId
  const orphanedKeys = Array.from(subsByParentAndSpecimen.keys());
  orphanedKeys.forEach(key => {
    const orphanedSubs = subsByParentAndSpecimen.get(key)!;
    orphanedSubs.forEach((sub, index) => {
      result.push({
        ...sub,
        _isFirstSub: index === 0,
        _isLastSub: index === orphanedSubs.length - 1,
      });
    });
  });

  return result;
};

interface StandardsTableProps {
  loading: boolean;
  batchLoading: boolean;
  groupedData: GroupedStandardData[];
  standardColumns: ColumnsType<GroupedStandardData>;
  indicatorColumns: ColumnsType<StandardIndicatorWithPosition>;
  expandedRowKeys: string[];
  searchText: string;
  // Batch selection for indicators
  selectedIndicatorKeys: Record<string, string[]>;
  onSelectedIndicatorKeysChange: (keys: Record<string, string[]>) => void;
  onBatchRemoveIndicators: (standardId: string) => void;
  onBatchActivateIndicators: (standardId: string) => void;
  onBatchDeactivateIndicators: (standardId: string) => void;
  // Handlers
  onSearchChange: (value: string) => void;
  onExpandedRowsChange: (keys: string[]) => void;
  onAddIndicators: (standardId: string, standardName: string) => void;
}

const StandardsTable: React.FC<StandardsTableProps> = ({
  loading,
  batchLoading,
  groupedData,
  standardColumns,
  indicatorColumns,
  expandedRowKeys,
  searchText,
  selectedIndicatorKeys,
  onSelectedIndicatorKeysChange,
  onBatchRemoveIndicators,
  onBatchActivateIndicators,
  onBatchDeactivateIndicators,
  onSearchChange,
  onExpandedRowsChange,
  onAddIndicators,
}) => {
  // Sort config for each standard's indicator table
  const [indicatorSortConfigs, setIndicatorSortConfigs] = useState<
    Record<string, IndicatorSortConfig>
  >({});

  // Handle sort change for indicator table
  const handleIndicatorSortChange = (
    standardId: string,
    sorter: SorterResult<StandardIndicatorWithPosition> | SorterResult<StandardIndicatorWithPosition>[]
  ) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setIndicatorSortConfigs(prev => ({
      ...prev,
      [standardId]: {
        field: singleSorter.field as string || null,
        order: singleSorter.order || null,
      },
    }));
  };

  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên, giới hạn, chỉ tiêu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={standardColumns}
          dataSource={groupedData}
          rowKey="id"
          expandable={{
            expandedRowRender: (standardRecord) => {
              const hasIndicators =
                standardRecord.indicators &&
                standardRecord.indicators.length > 0;
              const selectedKeys =
                selectedIndicatorKeys[standardRecord.id] || [];

              return (
                <div style={{ padding: "8px 0", marginLeft: 16 }}>
                  {hasIndicators ? (
                    <>
                      {/* Indicator table with overlay header when selected */}
                      {(() => {
                        // Get sort config for this standard
                        const sortConfig = indicatorSortConfigs[standardRecord.id];
                        // Sort indicators by hierarchy (parent-child relationship)
                        const sortedIndicators = sortIndicatorsByHierarchy(standardRecord.indicators, sortConfig);

                        // Only parent indicators can be selected (not sub-indicators)
                        const selectableIndicatorIds = sortedIndicators
                          .filter((ind) => !ind.parentIndicatorId)
                          .map((ind) => ind.id);
                        const allSelected =
                          selectableIndicatorIds.length > 0 &&
                          selectableIndicatorIds.every((id) => selectedKeys.includes(id));
                        const someSelected = selectableIndicatorIds.some((id) =>
                          selectedKeys.includes(id),
                        );

                        // Lấy danh sách các chỉ tiêu đã được chọn trong standard này
                        const selectedIndicators =
                          standardRecord.indicators.filter((ind) =>
                            selectedKeys.includes(ind.id),
                          );
                        // Kiểm tra có chỉ tiêu nào đang ngừng hoạt động không (để hiện nút Kích hoạt)
                        const hasInactiveSelected = selectedIndicators.some(
                          (ind) => !ind.isActive,
                        );
                        // Kiểm tra có chỉ tiêu nào đang hoạt động không (để hiện nút Ngưng)
                        const hasActiveSelected = selectedIndicators.some(
                          (ind) => ind.isActive,
                        );

                        return (
                          <div style={{ position: "relative" }}>
                            {/* Overlay header when indicators are selected */}
                            {someSelected && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  right: 0,
                                  height: 39,
                                  background: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  paddingLeft: 8,
                                  paddingRight: 12,
                                  zIndex: 100,
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Checkbox
                                    checked={allSelected}
                                    indeterminate={someSelected && !allSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [standardRecord.id]: selectableIndicatorIds,
                                        });
                                      } else {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [standardRecord.id]: [],
                                        });
                                      }
                                    }}
                                  />
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      color: "#1890ff",
                                      fontWeight: 500,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Đã chọn {selectedKeys.length}
                                  </span>
                                </div>
                                <Space size="small">
                                  {hasInactiveSelected && (
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={<CheckCircleOutlined />}
                                      onClick={() =>
                                        onBatchActivateIndicators(
                                          standardRecord.id,
                                        )
                                      }
                                      loading={batchLoading}
                                    >
                                      Kích hoạt
                                    </Button>
                                  )}
                                  {hasActiveSelected && (
                                    <Button
                                      size="small"
                                      icon={<StopOutlined />}
                                      onClick={() =>
                                        onBatchDeactivateIndicators(
                                          standardRecord.id,
                                        )
                                      }
                                      loading={batchLoading}
                                    >
                                      Ngưng
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      onBatchRemoveIndicators(standardRecord.id)
                                    }
                                    loading={batchLoading}
                                  >
                                    Xóa
                                  </Button>
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<CloseOutlined />}
                                    onClick={() =>
                                      onSelectedIndicatorKeysChange({
                                        ...selectedIndicatorKeys,
                                        [standardRecord.id]: [],
                                      })
                                    }
                                  />
                                </Space>
                              </div>
                            )}
                            <Table
                              columns={indicatorColumns.map(col => {
                                // Add sortOrder to specimenTypeName column
                                if (col.key === "specimenTypeName") {
                                  return {
                                    ...col,
                                    sortOrder: sortConfig?.field === "specimenTypeName" ? sortConfig.order : null,
                                  };
                                }
                                return col;
                              })}
                              dataSource={sortedIndicators}
                              rowKey="id"
                              pagination={false}
                              size="small"
                              onChange={(_pagination, _filters, sorter) => {
                                handleIndicatorSortChange(standardRecord.id, sorter);
                              }}
                              rowClassName={(record) =>
                                record.parentIndicatorId ? "sub-indicator-row" : ""
                              }
                              rowSelection={{
                                selectedRowKeys: selectedKeys,
                                onChange: (keys) => {
                                  onSelectedIndicatorKeysChange({
                                    ...selectedIndicatorKeys,
                                    [standardRecord.id]: keys as string[],
                                  });
                                },
                                // Hide checkbox for sub-indicators
                                getCheckboxProps: (record) => ({
                                  style: record.parentIndicatorId ? { display: 'none' } : undefined,
                                  disabled: !!record.parentIndicatorId,
                                }),
                                columnTitle: (
                                  <Checkbox
                                    checked={allSelected}
                                    indeterminate={someSelected && !allSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [standardRecord.id]: selectableIndicatorIds,
                                        });
                                      } else {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [standardRecord.id]: [],
                                        });
                                      }
                                    }}
                                  />
                                ),
                              }}
                            />
                          </div>
                        );
                      })()}
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() =>
                            onAddIndicators(
                              standardRecord.id,
                              standardRecord.name,
                            )
                          }
                        >
                          Thêm chỉ tiêu
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có chỉ tiêu nào"
                    >
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          onAddIndicators(
                            standardRecord.id,
                            standardRecord.name,
                          )
                        }
                      >
                        Thêm chỉ tiêu
                      </Button>
                    </Empty>
                  )}
                </div>
              );
            },
            rowExpandable: () => true,
            expandedRowKeys,
            onExpandedRowsChange: (keys) =>
              onExpandedRowsChange(keys as string[]),
          }}
          pagination={{
            pageSize: 50,
            showTotal: (total, range) => (
              <>
                Hiển thị{" "}
                <b>
                  {range[0]}-{range[1]}/{total}
                </b>
              </>
            ),
          }}
        />
      </Spin>
    </>
  );
};

export default StandardsTable;
