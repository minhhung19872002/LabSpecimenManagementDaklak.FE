import React from "react";
import { Table, Input, Row, Col, Spin, Button, Empty, Space, Checkbox } from "antd";
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

interface StandardsTableProps {
  loading: boolean;
  batchLoading: boolean;
  groupedData: GroupedStandardData[];
  standardColumns: ColumnsType<GroupedStandardData>;
  indicatorColumns: ColumnsType<StandardIndicatorDto>;
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
  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
              const hasIndicators = standardRecord.indicators && standardRecord.indicators.length > 0;
              const selectedKeys = selectedIndicatorKeys[standardRecord.id] || [];

              return (
                <div style={{ padding: "8px 0", marginLeft: 16 }}>
                  {hasIndicators ? (
                    <>
                      {/* Indicator table with overlay header when selected */}
                      {(() => {
                        const indicatorIds = standardRecord.indicators.map(
                          (ind) => ind.id
                        );
                        const allSelected =
                          indicatorIds.length > 0 &&
                          indicatorIds.every((id) => selectedKeys.includes(id));
                        const someSelected = indicatorIds.some((id) =>
                          selectedKeys.includes(id)
                        );

                        // Lấy danh sách các chỉ tiêu đã được chọn trong standard này
                        const selectedIndicators = standardRecord.indicators.filter(
                          (ind) => selectedKeys.includes(ind.id)
                        );
                        // Kiểm tra có chỉ tiêu nào đang ngừng hoạt động không (để hiện nút Kích hoạt)
                        const hasInactiveSelected = selectedIndicators.some(
                          (ind) => !ind.isActive
                        );
                        // Kiểm tra có chỉ tiêu nào đang hoạt động không (để hiện nút Ngưng)
                        const hasActiveSelected = selectedIndicators.some(
                          (ind) => ind.isActive
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
                                <div style={{ display: "flex", alignItems: "center" }}>
                                  <Checkbox
                                    checked={allSelected}
                                    indeterminate={someSelected && !allSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [standardRecord.id]: indicatorIds,
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
                                      onClick={() => onBatchActivateIndicators(standardRecord.id)}
                                      loading={batchLoading}
                                    >
                                      Kích hoạt
                                    </Button>
                                  )}
                                  {hasActiveSelected && (
                                    <Button
                                      size="small"
                                      icon={<StopOutlined />}
                                      onClick={() => onBatchDeactivateIndicators(standardRecord.id)}
                                      loading={batchLoading}
                                    >
                                      Ngưng
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => onBatchRemoveIndicators(standardRecord.id)}
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
                              columns={indicatorColumns}
                              dataSource={standardRecord.indicators}
                              rowKey="id"
                              pagination={false}
                              size="small"
                              rowSelection={{
                                selectedRowKeys: selectedKeys,
                                onChange: (keys) => {
                                  onSelectedIndicatorKeysChange({
                                    ...selectedIndicatorKeys,
                                    [standardRecord.id]: keys as string[],
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
                                          [standardRecord.id]: indicatorIds,
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
                          onClick={() => onAddIndicators(standardRecord.id, standardRecord.name)}
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
                        onClick={() => onAddIndicators(standardRecord.id, standardRecord.name)}
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
            onExpandedRowsChange: (keys) => onExpandedRowsChange(keys as string[]),
          }}
          pagination={{
            pageSize: 50,
            showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
          }}
        />
      </Spin>
    </>
  );
};

export default StandardsTable;
