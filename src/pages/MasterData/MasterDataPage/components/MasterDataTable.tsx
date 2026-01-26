import React from "react";
import { Table, Input, Row, Col, Spin } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { MasterDataItem } from "../types";
import { NO_PAGINATION_CATEGORIES, DEFAULT_PAGE_SIZE } from "../constants";

interface MasterDataTableProps {
  activeCategory: string;
  loading: boolean;
  filteredData: MasterDataItem[];
  columns: ColumnsType<MasterDataItem>;
  pagination: Record<string, { current: number; pageSize: number }>;
  totalCount: Record<string, number>;
  searchText: string;
  onSearchChange: (value: string) => void;
  onTableChange: (page: number, pageSize: number) => void;
}

const MasterDataTable: React.FC<MasterDataTableProps> = ({
  activeCategory,
  loading,
  filteredData,
  columns,
  pagination,
  totalCount,
  searchText,
  onSearchChange,
  onTableChange,
}) => {
  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading} tip="Loading data...">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={
            NO_PAGINATION_CATEGORIES.includes(activeCategory)
              ? false
              : {
                  current: pagination[activeCategory]?.current || 1,
                  pageSize:
                    pagination[activeCategory]?.pageSize || DEFAULT_PAGE_SIZE,
                  total: totalCount[activeCategory] || 0,
                  pageSizeOptions: [50, 100, 150],
                  showSizeChanger: true,
                  showTotal: (total, range) => (
                    <>
                      Hiển thị{" "}
                      <b>
                        {range[0]}-{range[1]}/{total}
                      </b>
                    </>
                  ),
                  onChange: onTableChange,
                  onShowSizeChange: onTableChange,
                }
          }
          scroll={{
            x: activeCategory === "customers" ? 900 : 700,
          }}
        />
      </Spin>
    </>
  );
};

export default MasterDataTable;
