import { Button, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { RoleDto } from '../../../services/roleManagementService';
import { authService } from '../../../services/authService';
import { PERMISSIONS } from '../../../constants/permissionMapping';

interface GetColumnsParams {
  onDelete: (id: string) => void;
}

export const getColumns = ({ onDelete }: GetColumnsParams): ColumnsType<RoleDto> => [
  {
    title: 'Tên nhóm',
    dataIndex: 'name',
    key: 'name',
    sorter: true,
    width: 250,
  },
  {
    title: 'Tổng số người dùng',
    dataIndex: 'userCount',
    key: 'userCount',
    width: 150,
    align: 'center',
    render: (count: number) => (
      <Tag style={{ backgroundColor: count > 0 ? "#1890FF" : "#8C8C8C", color: "#FFFFFF", border: "none", borderRadius: 18, padding: "2px 8px" }}>{count}</Tag>
    ),
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: 150,
    align: 'center',
    render: (_, record) => (
      <Space>
        {record.isStatic && <Tag style={{ backgroundColor: "#FA8C16", color: "#FFFFFF", border: "none", borderRadius: 18, padding: "2px 8px" }}>Hệ thống</Tag>}
        {record.isDefault && <Tag style={{ backgroundColor: "#52C41A", color: "#FFFFFF", border: "none", borderRadius: 18, padding: "2px 8px" }}>Mặc định</Tag>}
        {record.isPublic && <Tag style={{ backgroundColor: "#1890FF", color: "#FFFFFF", border: "none", borderRadius: 18, padding: "2px 8px" }}>Công khai</Tag>}
        {!record.isStatic && !record.isDefault && !record.isPublic && (
          <Tag style={{ backgroundColor: "#8C8C8C", color: "#FFFFFF", border: "none", borderRadius: 18, padding: "2px 8px" }}>Tùy chỉnh</Tag>
        )}
      </Space>
    ),
  },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 100,
    align: 'center',
    render: (_, record) => {
      const canDelete = authService.hasPermission(PERMISSIONS.RoleManagement.Delete);

      if (!canDelete) {
        return null;
      }

      return (
        <Space>
          {record.isStatic ? (
            <Tooltip title="Không thể xóa nhóm quyền hệ thống">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled
              />
            </Tooltip>
          ) : (
            <Popconfirm
              title="Xóa nhóm quyền"
              description="Bạn có chắc chắn muốn xóa nhóm quyền này?"
              onConfirm={() => onDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      );
    },
  },
];
