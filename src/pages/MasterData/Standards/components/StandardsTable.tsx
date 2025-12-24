import React from "react";
import { Table, Input, Row, Col, Spin, Button, Empty } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { GroupedStandardData, StandardIndicatorDto } from "../types";

interface StandardsTableProps {
  loading: boolean;
  groupedData: GroupedStandardData[];
  standardColumns: ColumnsType<GroupedStandardData>;
  indicatorColumns: ColumnsType<StandardIndicatorDto>;
  expandedRowKeys: string[];
  searchText: string;
  onSearchChange: (value: string) => void;
  onExpandedRowsChange: (keys: string[]) => void;
  onAddIndicators: (standardId: string, standardName: string) => void;
}

const StandardsTable: React.FC<StandardsTableProps> = ({
  loading,
  groupedData,
  standardColumns,
  indicatorColumns,
  expandedRowKeys,
  searchText,
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
            expandedRowRender: (record) => {
              const hasIndicators = record.indicators && record.indicators.length > 0;

              return (
                <div style={{ padding: "8px 0" }}>
                  {hasIndicators ? (
                    <>
                      <Table
                        columns={indicatorColumns}
                        dataSource={record.indicators}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => onAddIndicators(record.id, record.name)}
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
                        onClick={() => onAddIndicators(record.id, record.name)}
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
            showTotal: (total) => `Tổng ${total} tiêu chuẩn`,
          }}
        />
      </Spin>
    </>
  );
};

export default StandardsTable;
