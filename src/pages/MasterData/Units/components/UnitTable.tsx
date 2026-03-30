import React from "react";
import { Row, Col, Input, Spin, Table, Space, Button, Checkbox } from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { UnitDto } from "../../../../services/masterDataService";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";

interface UnitTableProps {
  loading: boolean;
  data: UnitDto[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  columns: ColumnsType<UnitDto>;
  searchText: string;
  onSearchChange: (value: string) => void;
  selectedRowKeys: React.Key[];
  onSelectionChange: (keys: React.Key[]) => void;
  onBatchDelete: () => void;
  onBatchToggleActive: (isActive: boolean) => void;
  onPaginationChange: (page: number, pageSize: number) => void;
}

const UnitTable: React.FC<UnitTableProps> = ({
  loading,
  data,
  totalCount,
  currentPage,
  pageSize,
  columns,
  searchText,
  onSearchChange,
  selectedRowKeys,
  onSelectionChange,
  onBatchDelete,
  onBatchToggleActive,
  onPaginationChange,
}) => {
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  const allIds = data.map((d) => d.id);
  const someSelected = selectedRowKeys.length > 0;
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedRowKeys.includes(id));

  // Check trạng thái của các item đã chọn để hiển thị button phù hợp
  const selectedItems = data.filter((d) => selectedRowKeys.includes(d.id));
  const hasActiveSelected = selectedItems.some((d) => d.isActive);
  const hasInactiveSelected = selectedItems.some((d) => !d.isActive);

  return (
    <>
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16, padding: "16px 16px 0" }}
      >
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm kiếm theo mã, tên đơn vị..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        <div style={{ position: "relative" }}>
          {/* Overlay header khi có row được chọn */}
          {someSelected && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
                height: 55,
                background: "#E6F7FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingLeft: 16,
                paddingRight: 16,
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
                      onSelectionChange(allIds);
                    } else {
                      onSelectionChange([]);
                    }
                  }}
                />
                <span
                  style={{
                    marginLeft: 8,
                    color: "#1890ff",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  Đã chọn {selectedRowKeys.length}
                </span>
              </div>
              <Space size="small">
                {canEdit && hasInactiveSelected && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onBatchToggleActive(true)}
                  >
                    Kích hoạt
                  </Button>
                )}
                {canEdit && hasActiveSelected && (
                  <Button
                    size="small"
                    icon={<StopOutlined />}
                    onClick={() => onBatchToggleActive(false)}
                  >
                    Ngừng
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={onBatchDelete}
                  >
                    Xóa
                  </Button>
                )}
                <Button
                  size="small"
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => onSelectionChange([])}
                />
              </Space>
            </div>
          )}

          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: onSelectionChange,
              columnTitle: (
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectionChange(allIds);
                    } else {
                      onSelectionChange([]);
                    }
                  }}
                />
              ),
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
              onChange: (page, size) => {
                onPaginationChange(page, size);
              },
            }}
          />
        </div>
      </Spin>
    </>
  );
};

export default UnitTable;
