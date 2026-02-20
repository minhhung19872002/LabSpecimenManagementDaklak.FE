import React, { useState, useMemo } from "react";
import { Card, Table, Button, Space, Spin, Tag, Badge, Input, Tooltip } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { UserRoleDto } from "../../../services/employeeService";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";
import { PATH_ROUTES } from "../../../constants/routes";

interface UserRolesTabProps {
  userRoles: UserRoleDto[];
  loading: boolean;
  saving: boolean;
  onAddRole: (roleName: string) => Promise<boolean>;
}

const UserRolesTab: React.FC<UserRolesTabProps> = ({ userRoles, loading }) => {
  const [searchText, setSearchText] = useState("");

  const canViewRoleDetail = authService.hasPermission(
    PERMISSIONS.RoleManagement.Default
  );

  // Filter assigned roles based on search text
  const filteredRoles = useMemo(() => {
    const assignedRoles = userRoles.filter((r) => r.isAssigned);
    if (!searchText.trim()) {
      return assignedRoles;
    }
    const lowerSearch = searchText.toLowerCase();
    return assignedRoles.filter((role) =>
      role.name.toLowerCase().includes(lowerSearch)
    );
  }, [userRoles, searchText]);

  const handleViewDetail = (roleId: string) => {
    // Open role detail in new tab
    const url = PATH_ROUTES.roleManagement.detail(roleId);
    window.open(url, "_blank");
  };

  const columns: ColumnsType<UserRoleDto> = [
    {
      title: "Tên nhóm",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: UserRoleDto) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {record.isStatic && <Tag color="orange">Hệ thống</Tag>}
        </Space>
      ),
    },
    {
      title: "Số quyền được cấp",
      dataIndex: "permissionCount",
      key: "permissionCount",
      width: 150,
      align: "center",
      render: (count: number) => (
        <Badge
          count={count}
          style={{
            backgroundColor: count > 0 ? "#1890ff" : "#d9d9d9",
          }}
          showZero
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      align: "center",
      render: (_: unknown, record: UserRoleDto) => {
        if (!canViewRoleDetail) return null;

        return (
          <Tooltip title="Xem chi tiết nhóm quyền">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            >
              Xem chi tiết
            </Button>
          </Tooltip>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card style={{ borderTopLeftRadius: 0 }} styles={{ body: { padding: 0 } }}>
      <div className="role-user-toolbar">
        <Input.Search
          placeholder="Tìm kiếm nhóm quyền..."
          allowClear
          enterButton
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredRoles}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />
    </Card>
  );
};

export default UserRolesTab;
