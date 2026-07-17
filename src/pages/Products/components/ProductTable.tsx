import React from "react";
import { Row, Col, Input, Select, Spin, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { ProductDto, ProductType } from "../../../services/productService";
import { PRODUCT_TYPE_OPTIONS } from "../constants";

const DRAFT_FILTER_OPTIONS = [
  { value: "true", label: "Nháp" },
  { value: "false", label: "Đã phát hành" },
];

interface ProductTableProps {
  loading: boolean;
  data: ProductDto[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  columns: ColumnsType<ProductDto>;
  searchText: string;
  productTypeFilter?: ProductType;
  isDraftFilter?: boolean;
  selectedRowKeys: React.Key[];
  onSearchChange: (value: string) => void;
  onProductTypeChange: (value: ProductType | undefined) => void;
  onIsDraftChange: (value: boolean | undefined) => void;
  onSortChange: (field: string, order: "ascend" | "descend" | null) => void;
  onPaginationChange: (page: number, pageSize: number) => void;
  onSelectionChange: (keys: React.Key[]) => void;
  onRowDoubleClick?: (record: ProductDto) => void;
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
  isDraftFilter,
  selectedRowKeys,
  onSearchChange,
  onProductTypeChange,
  onIsDraftChange,
  onSortChange,
  onPaginationChange,
  onSelectionChange,
  onRowDoubleClick,
}) => {
  const handleDraftFilterChange = (value: string | undefined) => {
    if (value === undefined) {
      onIsDraftChange(undefined);
    } else {
      onIsDraftChange(value === "true");
    }
  };

  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
        align="middle"
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên vật tư..."
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
        <Col xs={24} sm={8} md={4}>
          <Select
            placeholder="Trạng thái"
            value={isDraftFilter === undefined ? undefined : String(isDraftFilter)}
            onChange={handleDraftFilterChange}
            allowClear
            style={{ width: "100%" }}
            options={DRAFT_FILTER_OPTIONS}
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: onSelectionChange,
          }}
          scroll={{ x: 1200 }}
          onRow={onRowDoubleClick ? (record) => ({
            onDoubleClick: () => onRowDoubleClick(record),
            style: { cursor: "pointer" },
          }) : undefined}
          onChange={(_pagination, _filters, sorter) => {
            const s = sorter as SorterResult<ProductDto>;
            onSortChange(
              s.field ? String(s.field) : "",
              s.order || null
            );
          }}
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
