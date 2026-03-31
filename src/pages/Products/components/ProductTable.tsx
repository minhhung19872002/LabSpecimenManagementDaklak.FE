import React from "react";
import { Row, Col, Input, Select, Spin, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ProductDto, ProductType } from "../../../services/productService";
import { PRODUCT_TYPE_OPTIONS } from "../constants";

interface ProductTableProps {
  loading: boolean;
  data: ProductDto[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  columns: ColumnsType<ProductDto>;
  searchText: string;
  productTypeFilter?: ProductType;
  onSearchChange: (value: string) => void;
  onProductTypeChange: (value: ProductType | undefined) => void;
  onPaginationChange: (page: number, pageSize: number) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  loading,
  data,
  totalCount,
  currentPage,
  pageSize,
  columns,
  searchText,
  productTypeFilter,
  onSearchChange,
  onProductTypeChange,
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
            placeholder="Tìm kiếm theo ID hoặc tên vật phẩm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Select
            placeholder="Loại sản phẩm"
            value={productTypeFilter}
            onChange={onProductTypeChange}
            allowClear
            style={{ width: "100%" }}
            options={PRODUCT_TYPE_OPTIONS}
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

export default ProductTable;
