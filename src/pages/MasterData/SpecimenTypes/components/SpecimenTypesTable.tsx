import React from "react";
import { Table, Input, Row, Col, Spin, Button, Empty, Space, Checkbox } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedSpecimenTypeData, SpecimenTypeIndicatorDto } from "../types";

interface SpecimenTypesTableProps {
  loading: boolean;
  batchLoading: boolean;
  groupedData: GroupedSpecimenTypeData[];
  specimenTypeColumns: ColumnsType<GroupedSpecimenTypeData>;
  indicatorColumns: ColumnsType<SpecimenTypeIndicatorDto>;
  expandedSpecimenTypeKeys: string[];
  searchText: string;
  // Batch selection for indicators
  selectedIndicatorKeys: Record<string, string[]>;
  onSelectedIndicatorKeysChange: (keys: Record<string, string[]>) => void;
  onBatchRemoveIndicators: (specimenTypeId: string) => void;
  // Handlers
  onSearchChange: (value: string) => void;
  onExpandedSpecimenTypeKeysChange: (keys: string[]) => void;
  onAddIndicators: (specimenTypeId: string) => void;
}

const SpecimenTypesTable: React.FC<SpecimenTypesTableProps> = ({
  loading,
  batchLoading,
  groupedData,
  specimenTypeColumns,
  indicatorColumns,
  expandedSpecimenTypeKeys,
  searchText,
  selectedIndicatorKeys,
  onSelectedIndicatorKeysChange,
  onBatchRemoveIndicators,
  onSearchChange,
  onExpandedSpecimenTypeKeysChange,
  onAddIndicators,
}) => {
  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo tên, mô tả, danh mục, chỉ tiêu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={specimenTypeColumns}
          dataSource={groupedData}
          rowKey="id"
          expandable={{
            expandedRowRender: (specimenTypeRecord) => {
              const hasIndicators = specimenTypeRecord.indicators && specimenTypeRecord.indicators.length > 0;
              const selectedKeys = selectedIndicatorKeys[specimenTypeRecord.id] || [];

              return (
                <div style={{ padding: "8px 0", marginLeft: 16 }}>
                  {hasIndicators ? (
                    <>
                      {/* Indicator table with overlay header when selected */}
                      {(() => {
                        const indicatorIds = specimenTypeRecord.indicators.map(
                          (ind) => ind.indicatorId
                        );
                        const allSelected =
                          indicatorIds.length > 0 &&
                          indicatorIds.every((id) => selectedKeys.includes(id));
                        const someSelected = indicatorIds.some((id) =>
                          selectedKeys.includes(id)
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
                                          [specimenTypeRecord.id]: indicatorIds,
                                        });
                                      } else {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [specimenTypeRecord.id]: [],
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
                                    onClick={() => onBatchRemoveIndicators(specimenTypeRecord.id)}
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
                                        [specimenTypeRecord.id]: [],
                                      })
                                    }
                                  />
                                </Space>
                              </div>
                            )}
                            <Table
                              columns={indicatorColumns}
                              dataSource={specimenTypeRecord.indicators}
                              rowKey="indicatorId"
                              pagination={false}
                              size="small"
                              rowSelection={{
                                selectedRowKeys: selectedKeys,
                                onChange: (keys) => {
                                  onSelectedIndicatorKeysChange({
                                    ...selectedIndicatorKeys,
                                    [specimenTypeRecord.id]: keys as string[],
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
                                          [specimenTypeRecord.id]: indicatorIds,
                                        });
                                      } else {
                                        onSelectedIndicatorKeysChange({
                                          ...selectedIndicatorKeys,
                                          [specimenTypeRecord.id]: [],
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
                          onClick={() => onAddIndicators(specimenTypeRecord.id)}
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
                        onClick={() => onAddIndicators(specimenTypeRecord.id)}
                      >
                        Thêm chỉ tiêu
                      </Button>
                    </Empty>
                  )}
                </div>
              );
            },
            rowExpandable: () => true,
            expandedRowKeys: expandedSpecimenTypeKeys,
            onExpandedRowsChange: (keys) => onExpandedSpecimenTypeKeysChange(keys as string[]),
          }}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            pageSizeOptions: [50, 100, 150],
            showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
          }}
        />
      </Spin>
    </>
  );
};

export default SpecimenTypesTable;
