import React, { useState } from 'react';
import { Table, Button, Space, Input, Popconfirm, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { RoleUserDto, GetRoleUsersParams } from '../../../services/roleManagementService';
import AddUserModal from './AddUserModal';
import { authService } from '../../../services/authService';
import { PERMISSIONS } from '../../../constants/permissionMapping';

interface UserListTabProps {
  roleId: string;
  users: RoleUserDto[];
  totalCount: number;
  loading: boolean;
  params: GetRoleUsersParams;
  onPageChange: (page: number, pageSize: number) => void;
  onSearch: (value: string) => void;
  onRemoveUser: (userId: string) => Promise<boolean>;
  onAddUser: (userId: string) => Promise<boolean>;
  availableUsers: RoleUserDto[];
  availableUsersLoading: boolean;
  onSearchAvailableUsers: (filter: string) => Promise<void>;
}

const UserListTab: React.FC<UserListTabProps> = ({
  roleId,
  users,
  totalCount,
  loading,
  params,
  onPageChange,
  onSearch,
  onRemoveUser,
  onAddUser,
  availableUsers,
  availableUsersLoading,
  onSearchAvailableUsers,
}) => {
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const canEdit = authService.hasPermission(PERMISSIONS.RoleManagement.Edit);

  const columns: ColumnsType<RoleUserDto> = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Phòng ban',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 150,
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Vô hiệu'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (!canEdit) {
          return null;
        }

        return (
          <Popconfirm
            title="Xóa người dùng khỏi nhóm"
            description="Bạn có chắc chắn muốn xóa người dùng này khỏi nhóm quyền?"
            onConfirm={() => onRemoveUser(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        );
      },
    },
  ];

  const handleSearch = () => {
    onSearch(searchValue);
  };

  const handleAddUserSuccess = async (userId: string) => {
    const success = await onAddUser(userId);
    if (success) {
      setAddUserModalOpen(false);
    }
    return success;
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            suffix={
              <SearchOutlined
                style={{ cursor: 'pointer', color: '#1890ff' }}
                onClick={handleSearch}
              />
            }
          />
        </Space>
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddUserModalOpen(true)}
          >
            Thêm người dùng
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: Math.floor((params.skipCount || 0) / (params.maxResultCount || 10)) + 1,
          pageSize: params.maxResultCount || 10,
          total: totalCount,
          onChange: onPageChange,
          showSizeChanger: true,
          showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
          pageSizeOptions: ['10', '20', '50'],
        }}
        scroll={{ x: 1050 }}
        size="middle"
      />

      <AddUserModal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onAdd={handleAddUserSuccess}
        availableUsers={availableUsers}
        loading={availableUsersLoading}
        onSearch={onSearchAvailableUsers}
      />
    </div>
  );
};

export default UserListTab;
