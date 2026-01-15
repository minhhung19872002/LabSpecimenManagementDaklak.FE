import React from "react";
import { Table, Input, Row, Col, Spin, Button, Empty } from "antd";
import { SearchOutlined, PlusOutlined } from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedTestMethodData, TestMethodIndicatorDto } from "../types";

interface TestMethodsTableProps {
  loading: boolean;
  groupedData: GroupedTestMethodData[];
  methodColumns: ColumnsType<GroupedTestMethodData>;
  indicatorColumns: ColumnsType<TestMethodIndicatorDto>;
  expandedRowKeys: string[];
  searchText: string;
  onSearchChange: (value: string) => void;
  onExpandedRowsChange: (keys: string[]) => void;
  onAddIndicators: (testMethodId: string) => void;
}

const TestMethodsTable: React.FC<TestMethodsTableProps> = ({
  loading,
  groupedData,
  methodColumns,
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
                          onClick={() => onAddIndicators(record.id)}
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
                        onClick={() => onAddIndicators(record.id)}
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
            showTotal: (total) => `Tổng ${total} phương pháp`,
          }}
        />
      </Spin>
    </>
  );
};

export default TestMethodsTable;
