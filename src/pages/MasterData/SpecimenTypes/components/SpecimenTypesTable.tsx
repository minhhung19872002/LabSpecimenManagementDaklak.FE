import React from "react";
import { Table, Input, Row, Col, Spin, Button, Empty } from "antd";
import { SearchOutlined, PlusOutlined } from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedSpecimenTypeData, SpecimenTypeIndicatorDto } from "../types";

interface SpecimenTypesTableProps {
  loading: boolean;
  groupedData: GroupedSpecimenTypeData[];
  specimenTypeColumns: ColumnsType<GroupedSpecimenTypeData>;
  indicatorColumns: ColumnsType<SpecimenTypeIndicatorDto>;
  expandedSpecimenTypeKeys: string[];
  searchText: string;
  onSearchChange: (value: string) => void;
  onExpandedSpecimenTypeKeysChange: (keys: string[]) => void;
  onAddIndicators: (specimenTypeId: string) => void;
}

const SpecimenTypesTable: React.FC<SpecimenTypesTableProps> = ({
  loading,
  groupedData,
  specimenTypeColumns,
  indicatorColumns,
  expandedSpecimenTypeKeys,
  searchText,
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

              return (
                <div style={{ padding: "8px 0", marginLeft: 16 }}>
                  {hasIndicators ? (
                    <>
                      <Table
                        columns={indicatorColumns}
                        dataSource={specimenTypeRecord.indicators}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
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
            showTotal: (total) => `Tổng ${total} loại mẫu`,
          }}
        />
      </Spin>
    </>
  );
};

export default SpecimenTypesTable;
