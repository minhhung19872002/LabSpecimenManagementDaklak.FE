import React, { useState } from "react";
import {
  Card,
  Radio,
  Spin,
  Button,
  Space,
  Typography,
  Tag,
  Tooltip,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useRoleManagementDetail } from "./hooks";
import { UserListTab, PermissionsTab } from "./components";
import WarehouseSelectionModal from "../../components/common/WarehouseSelectionModal";
import { PATH_ROUTES } from "../../constants/routes";
import "./RoleManagementDetail.css";

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
    permissionGroups,
    availableUsers,
    availableUsersLoading,
    roleWarehouses,
    totalWarehouseCount,
    handleUsersSearch,
    handleAddUser,
    handleRemoveUser,
    handleSearchAvailableUsers,
    handleSavePermissions,
    handleSaveRoleWarehouses,
  } = useRoleManagementDetail(id || "");

  const [activeTab, setActiveTab] = useState<string>("users");
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);

  if (loading && !roleDetail) {
    return (
      <div className="page-wrapper" style={{ textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!roleDetail) {
    return (
      <div className="page-wrapper">
        <Card>
          <div style={{ textAlign: "center", padding: 48 }}>
            <Title level={4}>Không tìm thấy nhóm quyền</Title>
            <Button
              type="primary"
              onClick={() => navigate(PATH_ROUTES.roleManagement.index)}
            >
              Quay lại danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-wrapper role-management-detail">
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Tooltip title="Quay lại">
            <Button
              shape="circle"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(PATH_ROUTES.roleManagement.index)}
            />
          </Tooltip>
          <Title level={4} style={{ margin: 0 }}>
            {roleDetail.name}
          </Title>
          {roleDetail.isStatic && <Tag color="orange">Hệ thống</Tag>}
          {roleDetail.isDefault && <Tag color="green">Mặc định</Tag>}
        </Space>
      </div>

      <div className="statistics-detail-tabs">
        <Radio.Group
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          optionType="button"
        >
          <Radio.Button value="users">Danh sách người dùng</Radio.Button>
          <Radio.Button value="permissions">Quyền truy cập</Radio.Button>
        </Radio.Group>
      </div>
      <div style={{ borderBottom: "1px solid #f0f0f0" }} />

      {activeTab === "users" ? (
        <UserListTab
          roleId={id || ""}
          users={users}
          totalCount={usersTotalCount}
          loading={usersLoading}
          onSearch={handleUsersSearch}
          onRemoveUser={handleRemoveUser}
          onAddUser={handleAddUser}
          availableUsers={availableUsers}
          availableUsersLoading={availableUsersLoading}
          onSearchAvailableUsers={handleSearchAvailableUsers}
        />
      ) : (
        <>
          <PermissionsTab
            permissionGroups={permissionGroups}
            loading={permissionsLoading}
            saving={saving}
            onSave={handleSavePermissions}
            isStatic={roleDetail.isStatic}
            warehouseCount={{
              assigned: roleWarehouses.length,
              total: totalWarehouseCount,
            }}
            onOpenWarehouseModal={() => setWarehouseModalOpen(true)}
          />
          <WarehouseSelectionModal
            open={warehouseModalOpen}
            onClose={() => setWarehouseModalOpen(false)}
            ownerName={roleDetail.name}
            assignedWarehouseIds={roleWarehouses.map((w) => w.warehouseId)}
            onSave={handleSaveRoleWarehouses}
            saving={saving}
          />
        </>
      )}
    </div>
  );
};

export default RoleManagementDetail;
