import React from "react";
import { Row, Col, Input, Spin, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SupplierDto } from "../../../services/supplierService";

interface SupplierTableProps {
  loading: boolean;
  data: SupplierDto[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  columns: ColumnsType<SupplierDto>;
  searchText: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, pageSize: number) => void;
}

const SupplierTable: React.FC<SupplierTableProps> = ({
  loading,
  data,
  totalCount,
  currentPage,
  pageSize,
  columns,
  searchText,
  onSearchChange,
  onPaginationChange,
}) => {
  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
        align="middle"
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo ID hoặc tên nhà cung cấp..."
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
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
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
            onChange: onPaginationChange,
          }}
        />
      </Spin>
    </>
  );
};

export default SupplierTable;
