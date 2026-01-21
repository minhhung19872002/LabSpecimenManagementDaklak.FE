import React from "react";
import { Table, Input, Row, Col, Spin } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { SampleConditionDto } from "../types";

interface StatusTableProps {
  loading: boolean;
  data: SampleConditionDto[];
  columns: ColumnsType<SampleConditionDto>;
  searchText: string;
  onSearchChange: (value: string) => void;
}

const StatusTable: React.FC<StatusTableProps> = ({
  loading,
  data,
  columns,
  searchText,
  onSearchChange,
}) => {
  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo tên, mô tả..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            pageSize: 50,
            showTotal: (total) => `Tổng ${total} tình trạng mẫu`,
          }}
        />
      </Spin>
    </>
  );
};

export default StatusTable;
