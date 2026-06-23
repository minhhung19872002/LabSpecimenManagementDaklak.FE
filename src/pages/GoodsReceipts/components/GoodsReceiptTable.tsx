import React from "react";
import { Row, Col, Input, Select, Spin, Table, DatePicker } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { useNavigate } from "react-router-dom";

import {
  GoodsReceiptListDto,
  RECEIPT_TYPE_OPTIONS,
  GoodsReceiptType,
} from "../../../services/goodsReceiptService";

const { RangePicker } = DatePicker;

interface GoodsReceiptTableProps {
  loading: boolean;
  data: GoodsReceiptListDto[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  columns: ColumnsType<GoodsReceiptListDto>;
  searchText: string;
  receiptTypeFilter?: GoodsReceiptType;
  canDelete?: boolean;
  selectedRowKeys: React.Key[];
  onSearchChange: (value: string) => void;
  onReceiptTypeChange: (value: GoodsReceiptType | undefined) => void;
  onDateRangeChange: (range: [string, string] | undefined) => void;
  onSortChange: (field: string, order: "ascend" | "descend" | null) => void;
  onPaginationChange: (page: number, pageSize: number) => void;
  onSelectionChange: (keys: React.Key[]) => void;
}

const GoodsReceiptTable: React.FC<GoodsReceiptTableProps> = ({
  loading,
  data,
  totalCount,
  currentPage,
  pageSize,
  columns,
  searchText,
  receiptTypeFilter,
  canDelete,
  selectedRowKeys,
  onSearchChange,
  onReceiptTypeChange,
  onDateRangeChange,
  onSortChange,
  onPaginationChange,
  onSelectionChange,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <Row
        gutter={[12, 12]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
        align="middle"
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo ID..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Select
            placeholder="Loại phiếu"
            value={receiptTypeFilter}
            onChange={onReceiptTypeChange}
            allowClear
            style={{ width: "100%" }}
            options={RECEIPT_TYPE_OPTIONS}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                onDateRangeChange([
                  dates[0].format("YYYY-MM-DD"),
                  dates[1].format("YYYY-MM-DD"),
                ]);
              } else {
                onDateRangeChange(undefined);
              }
            }}
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          scroll={{ x: 1400 }}
          onRow={(record) => ({
            onDoubleClick: () => navigate(`/goods-receipts/${record.id}`),
            style: { cursor: "pointer" },
          })}
          rowSelection={canDelete ? {
            selectedRowKeys,
            onChange: onSelectionChange,
          } : undefined}
          onChange={(_pagination, _filters, sorter) => {
            const s = sorter as SorterResult<GoodsReceiptListDto>;
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

export default GoodsReceiptTable;
