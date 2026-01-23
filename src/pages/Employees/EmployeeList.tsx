import React from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Row,
  Col,
  Typography,
  Select,
} from "antd";
import Icon, {
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "../../components/common/Icon";
import { useEmployeeList, ROLE_OPTIONS } from "./hooks";
import { EmployeeFormModal, PasswordSentModal } from "./components";
import ResetPasswordModal from "./components/ResetPasswordModal";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";

const { Text } = Typography;

const EmployeeList: React.FC = () => {
  const {
    employees,
    departments,
    loading,
    totalCount,
    stats,
    searchInput,
    departmentFilter,
    roleFilter,
    currentPage,
    pageSize,
    isModalOpen,
    isPasswordModalOpen,
    isResetPasswordModalOpen,
    editingItem,
    resetPasswordEmployee,
    newEmployeeInfo,
    modalLoading,
    form,
    columns,
    handleSearchInputChange,
    handleSearch,
    handleClearSearch,
    handleDepartmentFilterChange,
    handleRoleFilterChange,
    handlePageChange,
    handleRefresh,
    handleCreate,
    handleModalCancel,
    handleModalSubmit,
    handlePasswordModalClose,
    handleResetPasswordModalCancel,
    handleResetPasswordSuccess,
  } = useEmployeeList();

  return (
    <div>
      {/* Statistics */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Card className="dashboard-stat-card" bordered={false}>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-info">
              <Text className="dashboard-stat-title">Tổng nhân viên</Text>
              <div className="dashboard-stat-value">{stats.total}</div>
            </div>
            <div className="dashboard-stat-icon contract">
              <Icon name="people-fill" />
            </div>
          </div>
        </Card>
        <Card className="dashboard-stat-card" bordered={false}>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-info">
              <Text className="dashboard-stat-title">Đang hoạt động</Text>
              <div className="dashboard-stat-value" style={{ background: "#52C41A", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{stats.active}</div>
            </div>
            <div className="dashboard-stat-icon green">
              <Icon name="check-circle" />
            </div>
          </div>
        </Card>
        <Card className="dashboard-stat-card" bordered={false}>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-info">
              <Text className="dashboard-stat-title">Vô hiệu hóa</Text>
              <div className="dashboard-stat-value" style={{ background: "#F5222D", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{stats.inactive}</div>
            </div>
            <div className="dashboard-stat-icon red">
              <Icon name="x-circle" />
            </div>
          </div>
        </Card>
      </div>

      <Card
        className="list-card"
        title={
          <Space>
            <TeamOutlined />
            Quản lý nhân viên
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
            {authService.hasPermission(PERMISSIONS.Users.Create) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Thêm nhân viên
              </Button>
            )}
          </Space>
        }
      >
        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Tìm kiếm theo tên, username, email, SĐT..."
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              allowClear
              onClear={handleClearSearch}
              enterButton
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Phòng ban"
              value={departmentFilter}
              onChange={handleDepartmentFilterChange}
            >
              <Select.Option value="all">Tất cả phòng ban</Select.Option>
              {departments.map((d) => (
                <Select.Option key={d.id} value={d.name}>
                  {d.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Vai trò"
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <Select.Option value="all">Tất cả vai trò</Select.Option>
              {ROLE_OPTIONS.map((r) => (
                <Select.Option key={r.value} value={r.value}>
                  {r.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            pageSizeOptions: [50, 100, 150],
            showSizeChanger: true,
            showTotal: (total, range) => <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>,
            onChange: handlePageChange,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <EmployeeFormModal
        open={isModalOpen}
        isEditing={!!editingItem}
        form={form}
        departments={departments}
        modalLoading={modalLoading}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />

      {/* Password Sent Notification Modal */}
      <PasswordSentModal
        open={isPasswordModalOpen}
        email={newEmployeeInfo?.email || null}
        onClose={handlePasswordModalClose}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        open={isResetPasswordModalOpen}
        employee={resetPasswordEmployee}
        onCancel={handleResetPasswordModalCancel}
        onSuccess={handleResetPasswordSuccess}
      />
    </div>
  );
};

export default EmployeeList;
