import React from "react";
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
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedTestResultValueData, TestResultValueIndicatorDto } from "../types";

interface TestResultValuesTableProps {
  loading: boolean;
  batchLoading: boolean;
  groupedData: GroupedTestResultValueData[];
  testResultValueColumns: ColumnsType<GroupedTestResultValueData>;
  indicatorColumns: ColumnsType<TestResultValueIndicatorDto>;
  expandedKeys: string[];
  searchText: string;
  // Batch selection for indicators (keyed by testResultValueId, value is composite key: `${indicatorId}_${specimenTypeId}`)
  selectedIndicatorKeys: Record<string, string[]>;
  onSelectedIndicatorKeysChange: (keys: Record<string, string[]>) => void;
  onBatchRemoveIndicators: (testResultValueId: string) => void;
  // Handlers
  onSearchChange: (value: string) => void;
  onExpandedKeysChange: (keys: string[]) => void;
  onAddIndicators: (testResultValueId: string) => void;
  // Helper to generate composite key
  getIndicatorCompositeKey: (indicatorId: string, specimenTypeId: string) => string;
}

const TestResultValuesTable: React.FC<TestResultValuesTableProps> = ({
  loading,
  batchLoading,
  groupedData,
  testResultValueColumns,
  indicatorColumns,
  expandedKeys,
  searchText,
  selectedIndicatorKeys,
  onSelectedIndicatorKeysChange,
  onBatchRemoveIndicators,
  onSearchChange,
  onExpandedKeysChange,
  onAddIndicators,
  getIndicatorCompositeKey,
}) => {
  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên, mô tả, chỉ tiêu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={testResultValueColumns}
          dataSource={groupedData}
          rowKey="id"
          expandable={{
            expandedRowRender: (testResultValueRecord) => {
              const hasIndicators =
                testResultValueRecord.indicators &&
                testResultValueRecord.indicators.length > 0;
              const selectedKeys =
                selectedIndicatorKeys[testResultValueRecord.id] || [];

              return (
                <div style={{ padding: "8px 0", marginLeft: 16 }}>
                  {hasIndicators ? (
                    <>
                      {/* Indicator table with overlay header when selected */}
                      {(() => {
                        const compositeKeys = testResultValueRecord.indicators!.map(
                          (ind) => getIndicatorCompositeKey(ind.indicatorId, ind.specimenTypeId)
                        );
                        const allSelected =
                          compositeKeys.length > 0 &&
                          compositeKeys.every((key) => selectedKeys.includes(key));
                        const someSelected = compositeKeys.some((key) =>
                          selectedKeys.includes(key)
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
                                          [testResultValueRecord.id]: compositeKeys,
                                        });
                                      } else {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [testResultValueRecord.id]: [],
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
                                        testResultValueRecord.id
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
                                        [testResultValueRecord.id]: [],
                                      })
                                    }
                                  />
                                </Space>
                              </div>
                            )}
                            <Table
                              columns={indicatorColumns}
                              dataSource={testResultValueRecord.indicators}
                              rowKey={(record) => getIndicatorCompositeKey(record.indicatorId, record.specimenTypeId)}
                              pagination={false}
                              size="small"
                              rowSelection={{
                                selectedRowKeys: selectedKeys,
                                onChange: (keys) => {
                                  onSelectedIndicatorKeysChange({
                                    ...selectedIndicatorKeys,
                                    [testResultValueRecord.id]: keys as string[],
                                  });
                                },
                                columnTitle: (
                                  <Checkbox
                                    checked={allSelected}
                                    indeterminate={someSelected && !allSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [testResultValueRecord.id]: compositeKeys,
                                        });
                                      } else {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [testResultValueRecord.id]: [],
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
                          onClick={() => onAddIndicators(testResultValueRecord.id)}
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
                        onClick={() => onAddIndicators(testResultValueRecord.id)}
                      >
                        Thêm chỉ tiêu
                      </Button>
                    </Empty>
                  )}
                </div>
              );
            },
            rowExpandable: () => true,
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) =>
              onExpandedKeysChange(keys as string[]),
          }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            pageSizeOptions: [50, 100, 150],
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

export default TestResultValuesTable;
