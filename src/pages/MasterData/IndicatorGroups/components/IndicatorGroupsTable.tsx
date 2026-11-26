import { Table, Button, Space, Tag, Tooltip, Popconfirm, Input, Row, Col, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, SearchOutlined } from "../../../../components/common/Icon";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";
import MasterDataHistoryButton from "../../../../components/common/MasterDataHistory/MasterDataHistoryButton";
import type { IndicatorGroupDto } from "../../../../services/masterDataService";

export interface IndicatorGroupsTableProps {
  loading: boolean;
  dataSource: IndicatorGroupDto[];
  searchText: string;
  currentPage: number;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (group: IndicatorGroupDto) => void;
  onDelete: (id: string) => void;
}

const getColumns = (
  onEdit: (group: IndicatorGroupDto) => void,
  onDelete: (id: string) => void,
): ColumnsType<IndicatorGroupDto> => {
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  return [
    {
      title: "Tên nhóm",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số chỉ tiêu",
      dataIndex: "indicatorCount",
      key: "indicatorCount",
      width: 120,
      align: "center",
      render: (count: number) => count ?? 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Ngừng"}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <MasterDataHistoryButton entityType="indicatorGroups" entityId={record.id} title={record.name} />
          {canEdit && (
            <Tooltip title="Sửa nhóm">
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
          )}
          {canDelete &&
            ((record.indicatorCount ?? 0) === 0 ? (
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa nhóm này?"
                onConfirm={() => onDelete(record.id)}
                okText="Có"
                cancelText="Không"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ) : (
              <Tooltip title="Không thể xóa nhóm đang có chỉ tiêu">
                <Button type="link" size="small" disabled icon={<DeleteOutlined />} />
              </Tooltip>
            ))}
        </Space>
      ),
    },
  ];
};

const IndicatorGroupsTable = ({
  loading,
  dataSource,
  searchText,
  currentPage,
  pageSize,
  onSearchChange,
  onPageChange,
  onEdit,
  onDelete,
}: IndicatorGroupsTableProps) => (
  <>
    <Row gutter={[16, 16]} style={{ marginBottom: 16, padding: "16px 16px 0" }}>
      <Col xs={24} sm={12} md={8}>
        <Input
          placeholder="Tìm kiếm theo tên nhóm..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
        />
      </Col>
    </Row>
    <Spin spinning={loading}>
      <Table
        columns={getColumns(onEdit, onDelete)}
        dataSource={dataSource}
        rowKey="id"
        size="small"
        pagination={{
          current: currentPage,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100],
          showTotal: (total: number) => (
            <>
              Tổng <b>{total}</b> nhóm
            </>
          ),
          onChange: onPageChange,
        }}
      />
    </Spin>
  </>
);

export default IndicatorGroupsTable;
