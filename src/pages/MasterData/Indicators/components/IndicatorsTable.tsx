import { Table, Button, Space, Spin, Input, Row, Col, Select } from "antd";
import {
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  SearchOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { IndicatorDto } from "../types";
import "./IndicatorsTable.css";

/**
 * Bảng phẳng danh sách chỉ tiêu (nhóm KHÔNG bắt buộc, lọc theo nhóm qua Select).
 * Quản lý nhóm chỉ tiêu ở danh mục riêng "Nhóm chỉ tiêu".
 * Phương pháp / giá / tiêu hao đã chuyển sang tab "Dịch vụ & Bảng giá" và "Định mức theo mẻ".
 */
export interface IndicatorsTableProps {
  loading: boolean;
  batchLoading: boolean;
  dataSource: IndicatorDto[];
  selectedRowKeys: string[];
  indicators: IndicatorDto[];
  columns: ColumnsType<IndicatorDto>;
  onSelectedRowsChange: (keys: string[]) => void;
  onBatchDelete: () => void;
  onBatchDeactivate: () => void;
  onBatchActivate: () => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  groupFilter: string;
  groupFilterOptions: { value: string; label: string }[];
  onGroupFilterChange: (value: string) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

const IndicatorsTable = ({
  loading,
  batchLoading,
  dataSource,
  selectedRowKeys,
  indicators,
  columns,
  onSelectedRowsChange,
  onBatchDelete,
  onBatchDeactivate,
  onBatchActivate,
  searchText,
  onSearchChange,
  groupFilter,
  groupFilterOptions,
  onGroupFilterChange,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
}: IndicatorsTableProps) => {
  const selectedIndicators = indicators.filter((ind) => selectedRowKeys.includes(ind.id));
  const hasInactiveSelected = selectedIndicators.some((ind) => !ind.isActive);
  const hasActiveSelected = selectedIndicators.some((ind) => ind.isActive);

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "16px 16px 0" }} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo tên chỉ tiêu..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            style={{ width: "100%" }}
            value={groupFilter}
            onChange={onGroupFilterChange}
            options={groupFilterOptions}
            showSearch
            optionFilterProp="label"
          />
        </Col>
        {selectedRowKeys.length > 0 && (
          <Col flex="auto">
            <Space size="small" wrap>
              <span style={{ color: "#1890ff", fontWeight: 500, whiteSpace: "nowrap" }}>
                Đã chọn {selectedRowKeys.length}
              </span>
              {hasInactiveSelected && (
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={onBatchActivate}
                  loading={batchLoading}
                >
                  Kích hoạt
                </Button>
              )}
              {hasActiveSelected && (
                <Button size="small" icon={<StopOutlined />} onClick={onBatchDeactivate} loading={batchLoading}>
                  Ngưng
                </Button>
              )}
              <Button size="small" danger icon={<DeleteOutlined />} onClick={onBatchDelete} loading={batchLoading}>
                Xóa
              </Button>
              <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => onSelectedRowsChange([])} />
            </Space>
          </Col>
        )}
      </Row>
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          size="small"
          rowSelection={{
            selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: (keys) => onSelectedRowsChange(keys as string[]),
          }}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            showTotal: (total: number) => (
              <>
                Tổng <b>{total}</b> chỉ tiêu
              </>
            ),
            onChange: onPageChange,
          }}
        />
      </Spin>
    </>
  );
};

export default IndicatorsTable;
