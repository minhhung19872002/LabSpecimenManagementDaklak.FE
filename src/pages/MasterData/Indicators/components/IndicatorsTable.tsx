import { Table, Button, Space, Checkbox, Spin, Input, Row, Col } from "antd";
import {
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  SearchOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { IndicatorDto, GroupedIndicatorData } from "../types";
import "./IndicatorsTable.css";

/**
 * Bảng nhóm chỉ tiêu → chỉ tiêu.
 * Phương pháp / giá / tiêu hao đã chuyển sang tab "Dịch vụ & Bảng giá" và "Định mức theo mẻ".
 */
interface IndicatorsTableProps {
  loading: boolean;
  batchLoading: boolean;
  groupedData: GroupedIndicatorData[];
  expandedRowKeys: string[];
  selectedRowKeys: string[];
  indicators: IndicatorDto[];
  groupColumns: ColumnsType<GroupedIndicatorData>;
  indicatorColumns: ColumnsType<IndicatorDto>;
  onExpandedRowsChange: (keys: string[]) => void;
  onSelectedRowsChange: (keys: string[]) => void;
  onBatchDelete: () => void;
  onBatchDeactivate: () => void;
  onBatchActivate: () => void;
  searchText?: string;
  onSearchChange?: (value: string) => void;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

const IndicatorsTable = ({
  loading,
  batchLoading,
  groupedData,
  expandedRowKeys,
  selectedRowKeys,
  indicators,
  groupColumns,
  indicatorColumns,
  onExpandedRowsChange,
  onSelectedRowsChange,
  onBatchDelete,
  onBatchDeactivate,
  onBatchActivate,
  searchText,
  onSearchChange,
  totalCount,
  currentPage,
  pageSize: pageSizeProp,
  onPageChange,
}: IndicatorsTableProps) => {
  const renderGroupIndicators = (record: GroupedIndicatorData) => {
    const groupIndicatorIds = record.indicators.map((ind: IndicatorDto) => ind.id);
    const allSelected =
      groupIndicatorIds.length > 0 && groupIndicatorIds.every((id: string) => selectedRowKeys.includes(id));
    const someSelected = groupIndicatorIds.some((id: string) => selectedRowKeys.includes(id));

    const selectedIndicators = indicators.filter((ind) => selectedRowKeys.includes(ind.id));
    const hasInactiveSelected = selectedIndicators.some((ind) => !ind.isActive);
    const hasActiveSelected = selectedIndicators.some((ind) => ind.isActive);

    return (
      <div style={{ position: "relative" }}>
        {someSelected && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              height: 39,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingLeft: 8,
              paddingRight: 12,
              zIndex: 100,
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectedRowsChange([...new Set([...selectedRowKeys, ...groupIndicatorIds])]);
                  } else {
                    onSelectedRowsChange(selectedRowKeys.filter((key) => !groupIndicatorIds.includes(key)));
                  }
                }}
              />
              <span style={{ marginLeft: 8, color: "#1890ff", fontWeight: 500, whiteSpace: "nowrap" }}>
                Đã chọn {selectedRowKeys.length}
              </span>
            </div>
            <Space size="small">
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
          </div>
        )}
        <Table
          columns={indicatorColumns}
          dataSource={record.indicators}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    );
  };

  const showTotal = (total: number) => (
    <>
      Tổng <b>{total}</b> nhóm
    </>
  );

  return (
    <>
      {onSearchChange && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "16px 16px 0" }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo tên chỉ tiêu..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      )}
      <Spin spinning={loading}>
        <Table
          columns={groupColumns}
          dataSource={groupedData}
          rowKey="id"
          expandable={{
            expandedRowRender: renderGroupIndicators,
            rowExpandable: () => true,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => onExpandedRowsChange(keys as string[]),
          }}
          pagination={
            onPageChange
              ? {
                  current: currentPage,
                  pageSize: pageSizeProp,
                  total: totalCount,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 20, 50],
                  showTotal,
                  onChange: onPageChange,
                  onShowSizeChange: onPageChange,
                }
              : { pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal }
          }
        />
      </Spin>
    </>
  );
};

export default IndicatorsTable;
