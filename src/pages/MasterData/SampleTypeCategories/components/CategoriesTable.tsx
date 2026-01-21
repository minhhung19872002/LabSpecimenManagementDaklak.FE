import React from "react";
import { Table, Input, Row, Col, Spin, Empty } from "antd";
import { SearchOutlined } from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedCategoryData, SpecimenTypeWithKey } from "../types";

interface CategoriesTableProps {
  loading: boolean;
  groupedData: GroupedCategoryData[];
  categoryColumns: ColumnsType<GroupedCategoryData>;
  specimenTypeColumns: ColumnsType<SpecimenTypeWithKey>;
  expandedRowKeys: string[];
  searchText: string;
  onSearchChange: (value: string) => void;
  onExpandedRowsChange: (keys: string[]) => void;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({
  loading,
  groupedData,
  categoryColumns,
  specimenTypeColumns,
  expandedRowKeys,
  searchText,
  onSearchChange,
  onExpandedRowsChange,
}) => {
  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo tên danh mục, loại mẫu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <Table
          columns={categoryColumns}
          dataSource={groupedData}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => {
              const hasSpecimenTypes = record.specimenTypes && record.specimenTypes.length > 0;

              return (
                <div style={{ padding: "8px 0", marginLeft: 16 }}>
                  {hasSpecimenTypes ? (
                    <Table
                      columns={specimenTypeColumns}
                      dataSource={record.specimenTypes}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có loại mẫu nào trong danh mục này"
                    />
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
            showTotal: (total) => `Tổng ${total} danh mục`,
          }}
        />
      </Spin>
    </>
  );
};

export default CategoriesTable;
