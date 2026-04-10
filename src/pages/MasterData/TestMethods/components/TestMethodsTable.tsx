import React from "react";
import {
  Table,
  Input,
  Row,
  Col,
  Spin,
} from "antd";
import {
  SearchOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { TestMethodDto } from "../../../../services/masterDataService";
import "./TestMethodsTable.css";

interface TestMethodsTableProps {
  loading: boolean;
  data: TestMethodDto[];
  columns: ColumnsType<TestMethodDto>;
  searchText: string;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
}

const TestMethodsTable: React.FC<TestMethodsTableProps> = ({
  loading,
  data,
  columns,
  searchText,
  totalCount,
  currentPage,
  pageSize,
  onSearchChange,
  onPageChange,
}) => {
  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên, đơn vị..."
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
            current: currentPage,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => (
              <>
                Hiển thị{" "}
                <b>
                  {range[0]}-{range[1]}/{total}
                </b>
              </>
            ),
            onChange: onPageChange,
          }}
        />
      </Spin>
    </>
  );
};

export default TestMethodsTable;