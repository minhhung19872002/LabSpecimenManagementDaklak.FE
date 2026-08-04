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
import { useEmployeeDetail } from "./hooks";
import UserInfoTab from "./components/UserInfoTab";
import UserPermissionsTab from "./components/UserPermissionsTab";
import UserRolesTab from "./components/UserRolesTab";
import WarehouseSelectionModal from "../../components/common/WarehouseSelectionModal";
import { PATH_ROUTES } from "../../constants/routes";
import "./EmployeeDetail.css";

const { Title } = Typography;

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    employee,
    loading,
    saving,
    permissionsLoading,
    rolesLoading,
    permissionGroups,
    userRoles,
    userWarehouses,
    totalWarehouseCount,
    handleUpdateEmployee,
    handleSavePermissions,
    handleAddRole,
    handleRemoveRole: _handleRemoveRole,
    handleSaveWarehouses,
  } = useEmployeeDetail(id || "");

  const [activeTab, setActiveTab] = useState<string>("info");
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);

  if (loading && !employee) {
    return (
      <div className="page-wrapper" style={{ textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="page-wrapper">
        <Card>
          <div style={{ textAlign: "center", padding: 48 }}>
            <Title level={4}>Không tìm thấy nhân viên</Title>
            <Button
              type="primary"
              onClick={() => navigate(PATH_ROUTES.employees.index)}
            >
              Quay lại danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-wrapper employee-detail">
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Tooltip title="Quay lại">
            <Button
              shape="circle"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(PATH_ROUTES.employees.index)}
            />
          </Tooltip>
          <Title level={4} style={{ margin: 0 }}>
            {employee.fullName}
          </Title>
          <Tag color={employee.isActive ? "green" : "default"}>
            {employee.isActive ? "Hoạt động" : "Ngừng hoạt động"}
          </Tag>
          {employee.roles.length > 0 && (
            <Space size={4}>
              {employee.roles.map((role) => (
                <Tag key={role} color="blue">
                  {role}
                </Tag>
              ))}
            </Space>
          )}
        </Space>
      </div>

      <div className="statistics-detail-tabs">
        <Radio.Group
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          optionType="button"
        >
          <Radio.Button value="info">Thông tin người dùng</Radio.Button>
          <Radio.Button value="permissions">Quyền truy cập</Radio.Button>
          <Radio.Button value="roles">Danh sách nhóm quyền</Radio.Button>
        </Radio.Group>
      </div>
      <div style={{ borderBottom: "1px solid #f0f0f0" }} />

      {activeTab === "info" && (
        <UserInfoTab
          employee={employee}
          loading={loading}
          saving={saving}
          onSave={handleUpdateEmployee}
        />
      )}

      {activeTab === "permissions" && (
        <>
          <UserPermissionsTab
            permissionGroups={permissionGroups}
            loading={permissionsLoading}
            saving={saving}
            onSave={handleSavePermissions}
            warehouseCount={{
              assigned: userWarehouses.length,
              total: totalWarehouseCount,
            }}
            onOpenWarehouseModal={() => setWarehouseModalOpen(true)}
          />
          <WarehouseSelectionModal
            open={warehouseModalOpen}
            onClose={() => setWarehouseModalOpen(false)}
            ownerName={employee?.fullName || ""}
            assignedWarehouseIds={userWarehouses.map((w) => w.warehouseId)}
            onSave={handleSaveWarehouses}
            saving={saving}
          />
        </>
      )}

      {activeTab === "roles" && (
        <UserRolesTab
          userRoles={userRoles}
          loading={rolesLoading}
          saving={saving}
          onAddRole={handleAddRole}
        />
      )}

    </div>
  );
};

export default EmployeeDetail;
