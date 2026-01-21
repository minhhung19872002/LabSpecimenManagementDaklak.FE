import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Avatar, Typography, Spin, Empty } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { RoleUserDto } from '../../../services/roleManagementService';

const { Text } = Typography;

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (userId: string) => Promise<boolean>;
  availableUsers: RoleUserDto[];
  loading: boolean;
  onSearch: (filter: string) => Promise<void>;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  open,
  onClose,
  onAdd,
  availableUsers,
  loading,
  onSearch,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSearchValue('');
      onSearch('');
    }
  }, [open, onSearch]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleAddUser = async (userId: string) => {
    setAdding(userId);
    try {
      await onAdd(userId);
    } finally {
      setAdding(null);
    }
  };

  return (
    <Modal
      title="Thêm người dùng vào nhóm"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
      centered
    >
      <Input
        placeholder="Tìm kiếm người dùng..."
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        prefix={<SearchOutlined />}
        style={{ marginBottom: 16 }}
        allowClear
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : availableUsers.length === 0 ? (
        <Empty description="Không tìm thấy người dùng" />
      ) : (
        <List
          dataSource={availableUsers}
          style={{ maxHeight: 400, overflow: 'auto' }}
          renderItem={(user) => (
            <List.Item
              key={user.id}
              style={{ cursor: 'pointer' }}
              onClick={() => !adding && handleAddUser(user.id)}
              className={adding === user.id ? 'list-item-loading' : ''}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Text strong>
                    {user.fullName || user.userName}
                    {adding === user.id && <Spin size="small" style={{ marginLeft: 8 }} />}
                  </Text>
                }
                description={
                  <div>
                    <Text type="secondary">{user.email}</Text>
                    {user.departmentName && (
                      <Text type="secondary"> - {user.departmentName}</Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      <style>{`
        .list-item-loading {
          opacity: 0.5;
          pointer-events: none;
        }
        .ant-list-item:hover {
          background-color: #f5f5f5;
        }
      `}</style>
    </Modal>
  );
};

export default AddUserModal;
