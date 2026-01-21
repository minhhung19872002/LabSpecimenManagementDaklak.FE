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
      <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
    ),
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: 150,
    align: 'center',
    render: (_, record) => (
      <Space>
        {record.isStatic && <Tag color="orange">Hệ thống</Tag>}
        {record.isDefault && <Tag color="green">Mặc định</Tag>}
        {record.isPublic && <Tag color="blue">Công khai</Tag>}
        {!record.isStatic && !record.isDefault && !record.isPublic && (
          <Tag color="default">Tùy chỉnh</Tag>
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
