import React, { useState } from "react";
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
  Modal,
  Tag,
  Radio,
} from "antd";
import Icon, {
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "../../components/common/Icon";
import { useNavigate } from "react-router-dom";
import { useEmployeeList, useDutyScheduleList, ROLE_OPTIONS } from "./hooks";
import { EmployeeFormModal, PasswordSentModal, DutyScheduleView, TemporaryPermissionModal } from "./components";
import ResetPasswordModal from "./components/ResetPasswordModal";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { PATH_ROUTES } from "../../constants/routes";
import "../../styles/ListCard.css";
import "../Dashboard/Dashboard.css";

const { Text } = Typography;

type EmployeePageTab = "employees" | "schedules";

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EmployeePageTab>("employees");
  const isSchedulesTab = activeTab === "schedules";

  const dutySchedule = useDutyScheduleList();

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
    isRolesModalOpen,
    rolesModalEmployee,
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
    handleRolesModalClose,
    getRoleId,
  } = useEmployeeList({ onAddSchedule: dutySchedule.handleOpenCreateFromEmployee });

  // Stats section — changes based on active tab
  const statsSection = isSchedulesTab ? (
    <div className="dashboard-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
      <Card className="dashboard-stat-card" bordered={false}>
        <div className="dashboard-stat-content">
          <div className="dashboard-stat-info">
            <Text className="dashboard-stat-title">Tổng lịch trực</Text>
            <div className="dashboard-stat-value">{dutySchedule.stats.total}</div>
          </div>
          <div className="dashboard-stat-icon contract">
            <Icon name="calendar-check" />
          </div>
        </div>
      </Card>
      <Card className="dashboard-stat-card" bordered={false}>
        <div className="dashboard-stat-content">
          <div className="dashboard-stat-info">
            <Text className="dashboard-stat-title">Còn sử dụng</Text>
            <div
              className="dashboard-stat-value"
              style={{ background: "#52C41A", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              {dutySchedule.stats.active}
            </div>
          </div>
          <div className="dashboard-stat-icon green">
            <Icon name="check-circle" />
          </div>
        </div>
      </Card>
      <Card className="dashboard-stat-card" bordered={false}>
        <div className="dashboard-stat-content">
          <div className="dashboard-stat-info">
            <Text className="dashboard-stat-title">Hết hạn</Text>
            <div
              className="dashboard-stat-value"
              style={{ background: "#F5222D", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              {dutySchedule.stats.expired}
            </div>
          </div>
          <div className="dashboard-stat-icon red">
            <Icon name="x-circle" />
          </div>
        </div>
      </Card>
    </div>
  ) : (
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
            <div
              className="dashboard-stat-value"
              style={{ background: "#52C41A", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              {stats.active}
            </div>
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
            <div
              className="dashboard-stat-value"
              style={{ background: "#F5222D", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              {stats.inactive}
            </div>
          </div>
          <div className="dashboard-stat-icon red">
            <Icon name="x-circle" />
          </div>
        </div>
      </Card>
    </div>
  );

  const cardTitle = (
    <Space>
      {isSchedulesTab ? <CalendarOutlined /> : <TeamOutlined />}
      {isSchedulesTab ? "Quản lý lịch trực" : "Quản lý nhân viên"}
    </Space>
  );

  const cardExtra = (
    <Space>
      <Button
        icon={<ReloadOutlined />}
        onClick={isSchedulesTab ? dutySchedule.handleRefresh : handleRefresh}
      />
      {!isSchedulesTab && authService.hasPermission(PERMISSIONS.Users.Create) && (
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Thêm nhân viên
        </Button>
      )}
      {isSchedulesTab && authService.hasPermission(PERMISSIONS.TemporaryAccess.Create) && (
        <Button type="primary" icon={<PlusOutlined />} onClick={dutySchedule.handleOpenCreate}>
          Thêm lịch trực
        </Button>
      )}
    </Space>
  );

  return (
    <div>
      {/* Stats — switches based on active tab */}
      {statsSection}

      <Card
        className="list-card"
        title={cardTitle}
        extra={cardExtra}
        styles={{ body: { padding: 0 } }}
      >
        {/* Tab switcher */}
        <div className="statistics-detail-tabs" style={{ padding: "16px 16px 0" }}>
          <Radio.Group
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as EmployeePageTab)}
            optionType="button"
          >
            <Radio.Button value="employees">Quản lý nhân viên</Radio.Button>
            <Radio.Button value="schedules">Quản lý lịch trực</Radio.Button>
          </Radio.Group>
        </div>
        <div style={{ borderBottom: "1px solid #f0f0f0", marginTop: 16 }} />

        {/* Employee tab content */}
        {!isSchedulesTab && (
          <div style={{ padding: 16 }}>
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
                showTotal: (total, range) => (
                  <>Hiển thị <b>{range[0]}-{range[1]}/{total}</b></>
                ),
                onChange: handlePageChange,
              }}
              scroll={{ x: 1400 }}
              onRow={(record) => ({
                onDoubleClick: () => {
                  if (!record._isUnsyncedCreate) navigate(PATH_ROUTES.employees.detail(record.id));
                },
                style: { cursor: record._isUnsyncedCreate ? "default" : "pointer" },
              })}
            />
          </div>
        )}

        {/* Duty schedule tab content */}
        {isSchedulesTab && (
          <DutyScheduleView
            grants={dutySchedule.grants}
            loading={dutySchedule.loading}
            totalCount={dutySchedule.totalCount}
            currentPage={dutySchedule.currentPage}
            pageSize={dutySchedule.pageSize}
            statusFilter={dutySchedule.statusFilter}
            searchInput={dutySchedule.searchInput}
            onSearchInputChange={dutySchedule.handleSearchInputChange}
            onSearch={dutySchedule.handleSearch}
            onClearSearch={dutySchedule.handleClearSearch}
            onStatusFilterChange={dutySchedule.handleStatusFilterChange}
            onPageChange={dutySchedule.handlePageChange}
            onEdit={dutySchedule.handleEdit}
            onExpire={dutySchedule.handleExpire}
          />
        )}
      </Card>

      {/* Employee modals */}
      <EmployeeFormModal
        open={isModalOpen}
        isEditing={!!editingItem}
        form={form}
        departments={departments}
        modalLoading={modalLoading}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
      />

      <PasswordSentModal
        open={isPasswordModalOpen}
        email={newEmployeeInfo?.email || null}
        onClose={handlePasswordModalClose}
      />

      <ResetPasswordModal
        open={isResetPasswordModalOpen}
        employee={resetPasswordEmployee}
        onCancel={handleResetPasswordModalCancel}
        onSuccess={handleResetPasswordSuccess}
      />

      <Modal
        title={`Nhóm quyền - ${rolesModalEmployee?.fullName || ""}`}
        open={isRolesModalOpen}
        onCancel={handleRolesModalClose}
        footer={null}
        centered
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {(rolesModalEmployee?.roles || []).map((roleName) => {
            const roleConfig = ROLE_OPTIONS.find((r) => r.value === roleName);
            const roleId = getRoleId(roleName);
            return (
              <div
                key={roleName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                }}
              >
                <Tag
                  style={{
                    backgroundColor: roleConfig?.color || "#8C8C8C",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 18,
                    padding: "2px 12px",
                    margin: 0,
                  }}
                >
                  {roleConfig?.label || roleName}
                </Tag>
                {roleId && authService.hasPermission(PERMISSIONS.RoleManagement.Default) && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      handleRolesModalClose();
                      navigate(PATH_ROUTES.roleManagement.detail(roleId));
                    }}
                  >
                    Chi tiết
                  </Button>
                )}
              </div>
            );
          })}
        </Space>
      </Modal>

      {/* Temporary Permission Modal — shared between both tabs */}
      <TemporaryPermissionModal
        open={dutySchedule.isModalOpen}
        editingGrant={dutySchedule.editingGrant}
        preselectedEmployee={dutySchedule.preselectedEmployee}
        onCancel={dutySchedule.handleModalCancel}
        onSuccess={dutySchedule.handleModalSuccess}
      />
    </div>
  );
};

export default EmployeeList;
