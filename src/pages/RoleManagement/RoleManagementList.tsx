import React, { useState } from 'react';
import { Card, Table, Input, Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useRoleManagementList } from './hooks';
import { getColumns, CreateRoleModal } from './components';
import { PATH_ROUTES } from '../../constants/routes';
import { authService } from '../../services/authService';
import { PERMISSIONS } from '../../constants/permissionMapping';
import '../../styles/ListCard.css';

const RoleManagementList: React.FC = () => {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const {
    roles,
    loading,
    totalCount,
    params,
    refresh,
    handleSearch,
    handlePageChange,
    handleCreate,
    handleDelete,
  } = useRoleManagementList();

  const columns = getColumns({
    onDelete: handleDelete,
  });

  const handleSearchSubmit = () => {
    handleSearch(searchValue);
  };

  const handleRowDoubleClick = (record: { id: string }) => {
    navigate(PATH_ROUTES.roleManagement.detail(record.id));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        className="list-card"
        title={
          <Space>
            <SafetyOutlined style={{ fontSize: 20 }} />
            <span>Quản lý truy cập</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
            >
              Làm mới
            </Button>
{authService.hasPermission(PERMISSIONS.RoleManagement.Create) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
              >
                Thêm nhóm mới
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm kiếm theo tên nhóm..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearchSubmit}
            style={{ width: 300 }}
            allowClear
            enterButton
          />
        </div>

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            current: Math.floor((params.skipCount || 0) / (params.maxResultCount || 10)) + 1,
            pageSize: params.maxResultCount || 10,
            total: totalCount,
            onChange: handlePageChange,
            showSizeChanger: true,
            showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
            pageSizeOptions: [50, 100, 150],
          }}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 650 }}
          size="middle"
        />
      </Card>

      <CreateRoleModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default RoleManagementList;
