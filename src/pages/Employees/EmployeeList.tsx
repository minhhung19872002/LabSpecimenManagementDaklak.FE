import React from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Row,
  Col,
  Statistic,
  Select,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "../../components/common/Icon";
import { useEmployeeList, ROLE_OPTIONS } from "./hooks";
import { EmployeeFormModal, PasswordSentModal } from "./components";
import ResetPasswordModal from "./components/ResetPasswordModal";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "../../styles/ListCard.css";

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
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="Tổng nhân viên"
              value={stats.total}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.active}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="Vô hiệu hóa"
              value={stats.inactive}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

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
            <Input
              placeholder="Tìm kiếm theo tên, username, email, SĐT..."
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              onClear={handleClearSearch}
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
            pageSizeOptions: [20, 50, 100],
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
