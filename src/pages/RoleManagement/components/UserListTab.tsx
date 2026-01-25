import React, { useState } from "react";
import { Table, Button, Input, Popconfirm, Tag, Card } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { RoleUserDto } from "../../../services/roleManagementService";
import AddUserModal from "./AddUserModal";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

interface UserListTabProps {
  roleId: string;
  users: RoleUserDto[];
  totalCount: number;
  loading: boolean;
  onSearch: (value: string) => void;
  onRemoveUser: (userId: string) => Promise<boolean>;
  onAddUser: (userId: string) => Promise<boolean>;
  availableUsers: RoleUserDto[];
  availableUsersLoading: boolean;
  onSearchAvailableUsers: (filter: string) => Promise<void>;
}

const UserListTab: React.FC<UserListTabProps> = ({
  roleId: _roleId,
  users,
  totalCount: _totalCount,
  loading,
  onSearch,
  onRemoveUser,
  onAddUser,
  availableUsers,
  availableUsersLoading,
  onSearchAvailableUsers,
}) => {
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const canEdit = authService.hasPermission(PERMISSIONS.RoleManagement.Edit);

  const columns: ColumnsType<RoleUserDto> = [
    {
      title: "Tên đăng nhập",
      dataIndex: "userName",
      key: "userName",
      width: 150,
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
      width: 200,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Phòng ban",
      dataIndex: "departmentName",
      key: "departmentName",
      width: 150,
    },
    {
      title: "Chức vụ",
      dataIndex: "position",
      key: "position",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      align: "center",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Vô hiệu"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      fixed: "right",
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
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
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
    <Card style={{ borderTopLeftRadius: 0 }} styles={{ body: { padding: 0 } }}>
      <div className="role-user-toolbar">
        <Input.Search
          placeholder="Tìm kiếm người dùng..."
          allowClear
          enterButton
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 250 }}
        />
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
        pagination={false}
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
    </Card>
  );
};

export default UserListTab;
