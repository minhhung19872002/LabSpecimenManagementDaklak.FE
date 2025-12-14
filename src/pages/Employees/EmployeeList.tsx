// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Modal,
  Form,
  Select,
  message,
  Popconfirm,
  Avatar,
  Switch,
  Tooltip,
  Row,
  Col,
  Statistic,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  TeamOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { employeeService, EmployeeDto } from "../../services/employeeService";
import { departmentService } from "../../services/masterDataService";

const { Text } = Typography;

interface Department {
  id: string;
  name: string;
  code: string;
}

const roles = [
  { value: "Admin", label: "Quản trị viên", color: "red" },
  { value: "LabManager", label: "Trưởng phòng TN", color: "purple" },
  { value: "Technician", label: "Kỹ thuật viên", color: "blue" },
  { value: "Reviewer", label: "Người duyệt B1", color: "orange" },
  { value: "Approver", label: "Người duyệt B2", color: "green" },
  { value: "Viewer", label: "Xem báo cáo", color: "default" },
];

const positions = [
  "Giám đốc",
  "Phó Giám đốc",
  "Trưởng phòng",
  "Phó trưởng phòng",
  "Kỹ thuật viên chính",
  "Kỹ thuật viên",
  "Nhân viên",
];

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EmployeeDto | null>(null);
  const [newEmployeeInfo, setNewEmployeeInfo] = useState<{
    email: string;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [resetPasswordLoadingId, setResetPasswordLoadingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Statistics state (load once without filters)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    loadDepartments();
    loadStatistics();
  }, []);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Load data when filters or pagination changes
  useEffect(() => {
    loadData();
  }, [debouncedSearchText, departmentFilter, roleFilter, pagination.current, pagination.pageSize]);

  const loadDepartments = async () => {
    try {
      const result = await departmentService.getList({ maxResultCount: 100 });
      setDepartments(result.items || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      // Load all employees once for statistics
      const result = await employeeService.getList({ maxResultCount: 1000 });
      const items = result.items || [];
      setStats({
        total: items.length,
        active: items.filter((e) => e.isActive).length,
        inactive: items.filter((e) => !e.isActive).length,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        skipCount: (pagination.current - 1) * pagination.pageSize,
        maxResultCount: pagination.pageSize,
        sorting: 'CreationTime DESC',
      };

      // Apply filters
      if (debouncedSearchText) {
        params.filter = debouncedSearchText;
      }
      if (departmentFilter !== 'all') {
        const dept = departments.find(d => d.name === departmentFilter);
        if (dept) {
          params.departmentId = dept.id;
        }
      }
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      const result = await employeeService.getList(params);
      setEmployees(result.items || []);
      setPagination(prev => ({ ...prev, total: result.totalCount }));
    } catch (error) {
      console.error('Error loading employees:', error);
      message.error('Không thể tải danh sách nhân viên. Vui lòng kiểm tra kết nối server.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: EmployeeDto) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await employeeService.delete(id);
      message.success("Đã xóa nhân viên");
      loadData();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error('Không thể xóa nhân viên. Vui lòng thử lại.');
    }
  };

  const handleToggleActive = async (id: string, checked: boolean) => {
    try {
      await employeeService.toggleActive(id, checked);
      setEmployees((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isActive: checked } : item
        )
      );
      // Update statistics
      setStats((prev) => ({
        ...prev,
        active: prev.active + (checked ? 1 : -1),
        inactive: prev.inactive + (checked ? -1 : 1),
      }));
      message.success(
        checked ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản"
      );
    } catch (error) {
      console.error('Error toggling employee status:', error);
      message.error('Không thể thay đổi trạng thái. Vui lòng thử lại.');
    }
  };

  const handleResetPassword = async (record: EmployeeDto) => {
    setResetPasswordLoadingId(record.id);
    try {
      await employeeService.resetPassword(record.id);
      setNewEmployeeInfo({ email: record.email });
      setIsPasswordModalOpen(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      message.error('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setResetPasswordLoadingId(null);
    }
  };

  const handleModalOk = async () => {
    setModalLoading(true);
    try {
      const values = await form.validateFields();
      const selectedDept = departments.find(
        (d) => d.id === values.departmentId
      );

      const payload = {
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || "",
        role: values.role,
        departmentId: values.departmentId,
        position: values.position || "",
        isActive: values.isActive ?? true,
      };

      if (editingItem) {
        await employeeService.update(editingItem.id, payload);
        message.success("Đã cập nhật thông tin nhân viên");
        setIsModalOpen(false);
        loadData();
      } else {
        await employeeService.create(payload);
        setIsModalOpen(false);
        loadData();
        loadStatistics();

        // Show notification that password was sent via email
        setNewEmployeeInfo({ email: values.email });
        setIsPasswordModalOpen(true);
      }

      form.resetFields();
    } catch (error: any) {
      console.error("Error saving employee:", error);
      message.error('Không thể lưu thông tin nhân viên. Vui lòng thử lại.');
    } finally {
      setModalLoading(false);
    }
  };

  const getRoleTag = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return (
      <Tag color={roleConfig?.color || "default"}>
        {roleConfig?.label || role}
      </Tag>
    );
  };

  // Handle table pagination change
  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  // Handle filter changes - reset to page 1
  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchText('');
    setDebouncedSearchText('');
    setDepartmentFilter('all');
    setRoleFilter('all');
    setPagination(prev => ({ ...prev, current: 1 }));
    loadStatistics();
  };

  const columns: ColumnsType<EmployeeDto> = [
    {
      title: "Nhân viên",
      key: "employee",
      width: 250,
      fixed: "left",
      render: (_, record) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: record.isActive ? "#1890ff" : "#d9d9d9" }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.fullName}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              @{record.username}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      render: (email: string) => (
        <Space>
          <MailOutlined style={{ color: "#1890ff" }} />
          <span style={{ fontSize: 13 }}>{email}</span>
        </Space>
      ),
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 130,
      render: (phone: string) => (
        <Space>
          <PhoneOutlined style={{ color: "#52c41a" }} />
          {phone || "-"}
        </Space>
      ),
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
      width: 150,
    },
    {
      title: "Chức vụ",
      dataIndex: "position",
      key: "position",
      width: 140,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record.id, checked)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Vô hiệu"
        />
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Đặt lại mật khẩu">
            <Button
              type="link"
              size="small"
              icon={<KeyOutlined />}
              loading={resetPasswordLoadingId === record.id}
              onClick={() => handleResetPassword(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa nhân viên"
            description="Bạn có chắc muốn xóa nhân viên này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
        title={
          <Space>
            <TeamOutlined />
            Quản lý nhân viên
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm nhân viên
            </Button>
          </Space>
        }
      >
        {/* Search & Filter */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm theo tên, username, email, SĐT..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
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
              {roles.map((r) => (
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
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            pageSizeOptions: [20, 50, 100],
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nhân viên`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={
          editingItem ? "Chỉnh sửa thông tin nhân viên" : "Thêm nhân viên mới"
        }
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText={editingItem ? "Cập nhật" : "Tạo nhân viên"}
        cancelText="Hủy"
        confirmLoading={modalLoading}
        centered
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[
                  { required: true, message: "Vui lòng nhập tên đăng nhập" },
                  {
                    pattern: /^[a-z0-9._]+$/,
                    message:
                      "Chỉ cho phép chữ thường, số, dấu chấm và gạch dưới",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="nguyen.van.a"
                  disabled={!!editingItem}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="email@labdaklak.vn"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input prefix={<PhoneOutlined />} placeholder="0905123456" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="departmentId"
                label="Phòng ban"
                rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
              >
                <Select placeholder="Chọn phòng ban">
                  {departments.map((d) => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label="Chức vụ">
                <Select placeholder="Chọn chức vụ" allowClear>
                  {positions.map((p) => (
                    <Select.Option key={p} value={p}>
                      {p}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò hệ thống"
                rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
              >
                <Select placeholder="Chọn vai trò">
                  {roles.map((r) => (
                    <Select.Option key={r.value} value={r.value}>
                      {r.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Hoạt động"
                  unCheckedChildren="Vô hiệu"
                />
              </Form.Item>
            </Col>
          </Row>

          {!editingItem && (
            <div
              style={{
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 6,
                marginTop: 8,
              }}
            >
              <Text type="secondary">
                <KeyOutlined style={{ marginRight: 8 }} />
                Mật khẩu sẽ được tạo tự động và gửi đến email nhân viên đã cung
                cấp.
              </Text>
            </div>
          )}
        </Form>
      </Modal>

      {/* Password Sent Notification Modal */}
      <Modal
        title={
          <Space>
            <MailOutlined style={{ color: "#52c41a" }} />
            Thông báo
          </Space>
        }
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        centered
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsPasswordModalOpen(false)}
          >
            Đóng
          </Button>,
        ]}
        width={450}
      >
        <div style={{ padding: "16px 0", textAlign: "center" }}>
          <div
            style={{
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              padding: 24,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <MailOutlined style={{ fontSize: 48, color: "#52c41a", marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              Mật khẩu đã được gửi qua email
            </div>
            <div style={{ color: "#666" }}>
              {newEmployeeInfo?.email}
            </div>
          </div>
          <Text type="secondary">
            Nhân viên sẽ nhận được email chứa thông tin đăng nhập và được yêu cầu đổi mật khẩu sau khi đăng nhập lần đầu.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeList;
