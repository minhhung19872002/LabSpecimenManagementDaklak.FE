// @ts-nocheck
import React, { useState, useEffect } from 'react';
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
} from 'antd';
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
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockUsers, mockDepartments } from '../../mocks/mockData';

const { Text } = Typography;

interface Employee {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  departmentId: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const roles = [
  { value: 'Admin', label: 'Quản trị viên', color: 'red' },
  { value: 'LabManager', label: 'Trưởng phòng TN', color: 'purple' },
  { value: 'Technician', label: 'Kỹ thuật viên', color: 'blue' },
  { value: 'Reviewer', label: 'Người duyệt B1', color: 'orange' },
  { value: 'Approver', label: 'Người duyệt B2', color: 'green' },
  { value: 'Viewer', label: 'Xem báo cáo', color: 'default' },
];

const positions = [
  'Giám đốc',
  'Phó Giám đốc',
  'Trưởng phòng',
  'Phó trưởng phòng',
  'Kỹ thuật viên chính',
  'Kỹ thuật viên',
  'Nhân viên',
];

// Generate initial mock employees from centralized data
const generateInitialEmployees = (): Employee[] => {
  return mockUsers.map((user, index) => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    departmentId: mockDepartments.find(d => d.name === user.department)?.id || 'dept-001',
    position: index === 0 ? 'Giám đốc' : index === 1 ? 'Trưởng phòng' : 'Kỹ thuật viên',
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  }));
};

// Generate random password (simulating backend behavior)
const generateRandomPassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredData, setFilteredData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Employee | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [newEmployeeInfo, setNewEmployeeInfo] = useState<{ username: string; email: string } | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...employees];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.fullName.toLowerCase().includes(search) ||
        item.username.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search) ||
        item.phone.includes(search)
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(item => item.department === departmentFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(item => item.role === roleFilter);
    }

    setFilteredData(filtered);
  }, [searchText, departmentFilter, roleFilter, employees]);

  const loadData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = generateInitialEmployees();
      setEmployees(data);
      setFilteredData(data);
      setLoading(false);
    }, 300);
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: Employee) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setEmployees(prev => prev.filter(item => item.id !== id));
    message.success('Đã xóa nhân viên');
  };

  const handleToggleActive = (id: string, checked: boolean) => {
    setEmployees(prev =>
      prev.map(item => (item.id === id ? { ...item, isActive: checked } : item))
    );
    message.success(checked ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
  };

  const handleResetPassword = (record: Employee) => {
    // Simulate backend generating a new password
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    setNewEmployeeInfo({ username: record.username, email: record.email });
    setIsPasswordModalOpen(true);
    message.success(`Đã đặt lại mật khẩu cho ${record.fullName}`);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    message.success('Đã sao chép mật khẩu');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const selectedDept = mockDepartments.find(d => d.id === values.departmentId);

      if (editingItem) {
        // Update existing employee
        const updatedEmployee: Employee = {
          ...editingItem,
          ...values,
          department: selectedDept?.name || editingItem.department,
        };
        setEmployees(prev =>
          prev.map(item => (item.id === editingItem.id ? updatedEmployee : item))
        );
        message.success('Đã cập nhật thông tin nhân viên');
        setIsModalOpen(false);
      } else {
        // Create new employee
        // Simulate backend generating password
        const newPassword = generateRandomPassword();
        const newEmployee: Employee = {
          id: `user-${Date.now()}`,
          username: values.username,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone || '',
          role: values.role,
          department: selectedDept?.name || '',
          departmentId: values.departmentId,
          position: values.position || '',
          isActive: values.isActive ?? true,
          createdAt: new Date().toISOString(),
          lastLogin: null,
        };

        setEmployees(prev => [newEmployee, ...prev]);
        setIsModalOpen(false);

        // Show password modal
        setGeneratedPassword(newPassword);
        setNewEmployeeInfo({ username: newEmployee.username, email: newEmployee.email });
        setIsPasswordModalOpen(true);
        message.success('Đã tạo nhân viên mới');
      }

      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getRoleTag = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return <Tag color={roleConfig?.color || 'default'}>{roleConfig?.label || role}</Tag>;
  };

  // Statistics
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.isActive).length,
    inactive: employees.filter(e => !e.isActive).length,
    byDepartment: mockDepartments.map(d => ({
      name: d.name,
      count: employees.filter(e => e.department === d.name).length,
    })),
  };

  const columns: ColumnsType<Employee> = [
    {
      title: 'Nhân viên',
      key: 'employee',
      width: 250,
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: record.isActive ? '#1890ff' : '#d9d9d9' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.fullName}</div>
            <div style={{ fontSize: 12, color: '#666' }}>@{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (email: string) => (
        <Space>
          <MailOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontSize: 13 }}>{email}</span>
        </Space>
      ),
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string) => (
        <Space>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          {phone || '-'}
        </Space>
      ),
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      width: 150,
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      width: 140,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={checked => handleToggleActive(record.id, checked)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Vô hiệu"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
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
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
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
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card>
            <Statistic
              title="Vô hiệu hóa"
              value={stats.inactive}
              valueStyle={{ color: '#ff4d4f' }}
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
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
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
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Phòng ban"
              value={departmentFilter}
              onChange={setDepartmentFilter}
            >
              <Select.Option value="all">Tất cả phòng ban</Select.Option>
              {mockDepartments.map(d => (
                <Select.Option key={d.id} value={d.name}>
                  {d.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Vai trò"
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Select.Option value="all">Tất cả vai trò</Select.Option>
              {roles.map(r => (
                <Select.Option key={r.value} value={r.value}>
                  {r.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: total => `Tổng ${total} nhân viên`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText={editingItem ? 'Cập nhật' : 'Tạo nhân viên'}
        cancelText="Hủy"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                  { pattern: /^[a-z0-9._]+$/, message: 'Chỉ cho phép chữ thường, số, dấu chấm và gạch dưới' },
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
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
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
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="email@labdaklak.vn" />
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
                rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}
              >
                <Select placeholder="Chọn phòng ban">
                  {mockDepartments.map(d => (
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
                  {positions.map(p => (
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
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select placeholder="Chọn vai trò">
                  {roles.map(r => (
                    <Select.Option key={r.value} value={r.value}>
                      {r.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
              </Form.Item>
            </Col>
          </Row>

          {!editingItem && (
            <div
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 6,
                marginTop: 8,
              }}
            >
              <Text type="secondary">
                <KeyOutlined style={{ marginRight: 8 }} />
                Mật khẩu sẽ được tạo tự động và gửi đến email nhân viên đã cung cấp.
              </Text>
            </div>
          )}
        </Form>
      </Modal>

      {/* Password Display Modal */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: '#52c41a' }} />
            Thông tin đăng nhập
          </Space>
        }
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyPassword}>
            Sao chép mật khẩu
          </Button>,
          <Button key="close" type="primary" onClick={() => setIsPasswordModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Username:</Text>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{newEmployeeInfo?.username}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Email:</Text>
            <div style={{ fontSize: 16 }}>{newEmployeeInfo?.email}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Mật khẩu được tạo tự động:</Text>
            <div
              style={{
                background: '#f5f5f5',
                padding: '12px 16px',
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 1,
                marginTop: 8,
              }}
            >
              {generatedPassword}
            </div>
          </div>
          <div
            style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              padding: 12,
              borderRadius: 6,
              marginTop: 16,
            }}
          >
            <Text type="warning">
              ⚠️ Vui lòng gửi thông tin đăng nhập này cho nhân viên và yêu cầu họ đổi mật khẩu
              ngay sau khi đăng nhập lần đầu.
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeList;
