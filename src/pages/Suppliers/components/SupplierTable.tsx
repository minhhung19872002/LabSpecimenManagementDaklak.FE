import React from "react";
import { Row, Col, Input, Select, Spin, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { SupplierDto } from "../../../services/supplierService";

interface SupplierTableProps {
  loading: boolean;
  data: SupplierDto[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  columns: ColumnsType<SupplierDto>;
  searchText: string;
  supplierGroupFilter?: string;
  supplierGroups: string[];
  canDelete?: boolean;
  selectedRowKeys: React.Key[];
  onSearchChange: (value: string) => void;
  onSupplierGroupChange: (value: string | undefined) => void;
  onSortChange: (field: string, order: "ascend" | "descend" | null) => void;
  onPaginationChange: (page: number, pageSize: number) => void;
  onSelectionChange: (keys: React.Key[]) => void;
}

const SupplierTable: React.FC<SupplierTableProps> = ({
  loading,
  data,
  totalCount,
  currentPage,
  pageSize,
  columns,
  searchText,
  supplierGroupFilter,
  supplierGroups,
  canDelete,
  selectedRowKeys,
  onSearchChange,
  onSupplierGroupChange,
  onSortChange,
  onPaginationChange,
  onSelectionChange,
}) => {
  const groupOptions = supplierGroups.map((g) => ({ value: g, label: g }));

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
        <Col xs={24} sm={8} md={4}>
          <Select
            placeholder="Nhóm NCC"
            value={supplierGroupFilter}
            onChange={onSupplierGroupChange}
            allowClear
            style={{ width: "100%" }}
            options={groupOptions}
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          scroll={{ x: 1200 }}
          rowSelection={canDelete ? {
            selectedRowKeys,
            onChange: onSelectionChange,
          } : undefined}
          onChange={(_pagination, _filters, sorter) => {
            const s = sorter as SorterResult<SupplierDto>;
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

export default SupplierTable;
