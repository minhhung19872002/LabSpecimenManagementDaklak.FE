import React from 'react';
import { Card, Tabs, Spin, Button, Space, Breadcrumb, Typography, Tag } from 'antd';
import { ArrowLeftOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRoleManagementDetail } from './hooks';
import { UserListTab, PermissionsTab } from './components';
import { PATH_ROUTES } from '../../constants/routes';

const { Title } = Typography;

const RoleManagementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    roleDetail,
    loading,
    usersLoading,
    permissionsLoading,
    saving,
    users,
    usersTotalCount,
    usersParams,
    permissionGroups,
    availableUsers,
    availableUsersLoading,
    handleUsersPageChange,
    handleUsersSearch,
    handleAddUser,
    handleRemoveUser,
    handleSearchAvailableUsers,
    handleSavePermissions,
  } = useRoleManagementDetail(id || '');

  if (loading && !roleDetail) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!roleDetail) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Title level={4}>Không tìm thấy nhóm quyền</Title>
            <Button type="primary" onClick={() => navigate(PATH_ROUTES.roleManagement.index)}>
              Quay lại danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'users',
      label: (
        <Space>
          <UserOutlined />
          Danh sách người dùng
          <Tag color="blue">{roleDetail.userCount}</Tag>
        </Space>
      ),
      children: (
        <UserListTab
          roleId={id || ''}
          users={users}
          totalCount={usersTotalCount}
          loading={usersLoading}
          params={usersParams}
          onPageChange={handleUsersPageChange}
          onSearch={handleUsersSearch}
          onRemoveUser={handleRemoveUser}
          onAddUser={handleAddUser}
          availableUsers={availableUsers}
          availableUsersLoading={availableUsersLoading}
          onSearchAvailableUsers={handleSearchAvailableUsers}
        />
      ),
    },
    {
      key: 'permissions',
      label: (
        <Space>
          <LockOutlined />
          Quyền truy cập
        </Space>
      ),
      children: (
        <PermissionsTab
          permissionGroups={permissionGroups}
          loading={permissionsLoading}
          saving={saving}
          onSave={handleSavePermissions}
          isStatic={roleDetail.isStatic}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: <Link to={PATH_ROUTES.roleManagement.index}>Quản lý truy cập</Link>,
          },
          {
            title: roleDetail.name,
          },
        ]}
      />

      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(PATH_ROUTES.roleManagement.index)}
            />
            <Title level={4} style={{ margin: 0 }}>
              {roleDetail.name}
            </Title>
            {roleDetail.isStatic && <Tag color="orange">Hệ thống</Tag>}
            {roleDetail.isDefault && <Tag color="green">Mặc định</Tag>}
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="users"
          items={tabItems}
          destroyInactiveTabPane={false}
        />
      </Card>
    </div>
  );
};

export default RoleManagementDetail;
