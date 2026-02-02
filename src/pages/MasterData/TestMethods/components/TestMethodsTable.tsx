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
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedTestMethodData, TestMethodIndicatorDto } from "../types";
import "./TestMethodsTable.css";

// Sort config type for indicator tables
interface IndicatorSortConfig {
  field: string | null;
  order: "ascend" | "descend" | null;
}

// Extended type with position flags for tree line rendering
interface TestMethodIndicatorWithPosition extends TestMethodIndicatorDto {
  _isFirstSub?: boolean;
  _isLastSub?: boolean;
}

// Utility function to sort indicators by parent-child relationship
// Parents first, then their sub-indicators grouped together
// Also adds _isFirstSub and _isLastSub flags for tree line rendering
// Sub-indicators are matched by BOTH parentIndicatorId AND specimenTypeId
const sortIndicatorsByHierarchy = (
  indicators: TestMethodIndicatorDto[],
  sortConfig?: IndicatorSortConfig
): TestMethodIndicatorWithPosition[] => {
  if (!indicators || indicators.length === 0) return [];

  // Separate parent indicators and sub-indicators
  const parents = indicators.filter(ind => !ind.parentIndicatorId);
  const subs = indicators.filter(ind => ind.parentIndicatorId);

  // Group sub-indicators by parentIndicatorId + specimenTypeId (composite key)
  const subsByParentKey = new Map<string, TestMethodIndicatorDto[]>();
  subs.forEach(sub => {
    // Composite key: parentIndicatorId|specimenTypeId
    const key = `${sub.parentIndicatorId}|${sub.specimenTypeId || ''}`;
    if (!subsByParentKey.has(key)) {
      subsByParentKey.set(key, []);
    }
    subsByParentKey.get(key)!.push(sub);
  });

  // Sort subs within each group by sortOrder
  subsByParentKey.forEach((subList) => {
    subList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  });

  // Build sorted result with position flags
  const result: TestMethodIndicatorWithPosition[] = [];

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
    result.push(parent);
    // Match children by BOTH indicatorId AND specimenTypeId
    const parentKey = `${parent.indicatorId}|${parent.specimenTypeId || ''}`;
    const childSubs = subsByParentKey.get(parentKey);
    if (childSubs) {
      childSubs.forEach((sub, index) => {
        result.push({
          ...sub,
          _isFirstSub: index === 0,
          _isLastSub: index === childSubs.length - 1,
        });
      });
      subsByParentKey.delete(parentKey);
    }
  });

  // Then add orphaned sub-indicators (whose parent is not in the list)
  const orphanedKeys = Array.from(subsByParentKey.keys());
  orphanedKeys.forEach(key => {
    const orphanedSubs = subsByParentKey.get(key)!;
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

interface TestMethodsTableProps {
  loading: boolean;
  batchLoading: boolean;
  groupedData: GroupedTestMethodData[];
  methodColumns: ColumnsType<GroupedTestMethodData>;
  indicatorColumns: ColumnsType<TestMethodIndicatorDto>;
  expandedRowKeys: string[];
  searchText: string;
  // Batch selection for indicators
  selectedIndicatorKeys: Record<string, string[]>;
  onSelectedIndicatorKeysChange: (keys: Record<string, string[]>) => void;
  onBatchRemoveIndicators: (testMethodId: string) => void;
  // Handlers
  onSearchChange: (value: string) => void;
  onExpandedRowsChange: (keys: string[]) => void;
  onAddIndicators: (testMethodId: string) => void;
}

const TestMethodsTable: React.FC<TestMethodsTableProps> = ({
  loading,
  batchLoading,
  groupedData,
  methodColumns,
  indicatorColumns,
  expandedRowKeys,
  searchText,
  selectedIndicatorKeys,
  onSelectedIndicatorKeysChange,
  onBatchRemoveIndicators,
  onSearchChange,
  onExpandedRowsChange,
  onAddIndicators,
}) => {
  // Sort config for each test method's indicator table
  const [indicatorSortConfigs, setIndicatorSortConfigs] = useState<
    Record<string, IndicatorSortConfig>
  >({});

  // Handle sort change for indicator table
  const handleIndicatorSortChange = (
    testMethodId: string,
    sorter: SorterResult<TestMethodIndicatorWithPosition> | SorterResult<TestMethodIndicatorWithPosition>[]
  ) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setIndicatorSortConfigs(prev => ({
      ...prev,
      [testMethodId]: {
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
            placeholder="Tìm kiếm theo mã, tên, đơn vị, chỉ tiêu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={methodColumns}
          dataSource={groupedData}
          rowKey="id"
          expandable={{
            expandedRowRender: (testMethodRecord) => {
              // Get sort config for this test method
              const sortConfig = indicatorSortConfigs[testMethodRecord.id];
              // Sort indicators by hierarchy: parents first, then their sub-indicators
              const sortedIndicators = sortIndicatorsByHierarchy(testMethodRecord.indicators || [], sortConfig);
              const hasIndicators = sortedIndicators.length > 0;
              const selectedKeys =
                selectedIndicatorKeys[testMethodRecord.id] || [];

              return (
                <div style={{ padding: "8px 0", marginLeft: 16 }}>
                  {hasIndicators ? (
                    <>
                      {/* Indicator table with overlay header when selected */}
                      {(() => {
                        // Only parent indicators can be selected (not sub-indicators)
                        const selectableIndicators = sortedIndicators.filter(
                          (ind) => !ind.parentIndicatorId
                        );
                        // Use composite key: indicatorId|specimenTypeId
                        const selectableKeys = selectableIndicators.map(
                          (ind) => `${ind.indicatorId}|${ind.specimenTypeId || ''}`,
                        );
                        const allSelected =
                          selectableKeys.length > 0 &&
                          selectableKeys.every((key) => selectedKeys.includes(key));
                        const someSelected = selectableKeys.some((key) =>
                          selectedKeys.includes(key),
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
                                          [testMethodRecord.id]: selectableKeys,
                                        });
                                      } else {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [testMethodRecord.id]: [],
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
                                  <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      onBatchRemoveIndicators(
                                        testMethodRecord.id,
                                      )
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
                                        [testMethodRecord.id]: [],
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
                              rowKey={(record) => `${record.indicatorId}|${record.specimenTypeId || ''}`}
                              pagination={false}
                              size="small"
                              onChange={(_pagination, _filters, sorter) => {
                                handleIndicatorSortChange(testMethodRecord.id, sorter);
                              }}
                              rowClassName={(record) =>
                                record.parentIndicatorId ? "sub-indicator-row" : ""
                              }
                              rowSelection={{
                                selectedRowKeys: selectedKeys,
                                onChange: (keys) => {
                                  onSelectedIndicatorKeysChange({
                                    ...selectedIndicatorKeys,
                                    [testMethodRecord.id]: keys as string[],
                                  });
                                },
                                // Hide checkbox for sub-indicators
                                getCheckboxProps: (record: TestMethodIndicatorDto) => ({
                                  style: record.parentIndicatorId ? { display: 'none' } : {},
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
                                          [testMethodRecord.id]: selectableKeys,
                                        });
                                      } else {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [testMethodRecord.id]: [],
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
                          onClick={() => onAddIndicators(testMethodRecord.id)}
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
                        onClick={() => onAddIndicators(testMethodRecord.id)}
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

export default TestMethodsTable;
