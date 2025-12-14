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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { userService, UserDto } from '../../services/userService';
import { departmentService } from '../../services/masterDataService';

interface Department {
  id: string;
  name: string;
  code: string;
}

const roles = [
  { value: 'Admin', label: 'Quản trị viên', color: 'red' },
  { value: 'LabManager', label: 'Trưởng phòng TN', color: 'purple' },
  { value: 'Technician', label: 'Kỹ thuật viên', color: 'blue' },
  { value: 'Reviewer', label: 'Người duyệt B1', color: 'orange' },
  { value: 'Approver', label: 'Người duyệt B2', color: 'green' },
  { value: 'Viewer', label: 'Xem báo cáo', color: 'default' },
];

const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const result = await departmentService.getList({ maxResultCount: 100 });
      setDepartments(result.items || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await userService.getList({ maxResultCount: 100 });
      setUsers(result.items || []);
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối server.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleTag = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return <Tag color={roleConfig?.color || 'default'}>{roleConfig?.label || role}</Tag>;
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: UserDto) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await userService.delete(id);
      setUsers(users.filter((u) => u.id !== id));
      message.success('Đã xóa người dùng');
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Không thể xóa người dùng. Vui lòng thử lại.');
    }
  };

  const handleToggleActive = async (id: string, checked: boolean) => {
    try {
      await userService.toggleActive(id, checked);
      setUsers(users.map((u) => (u.id === id ? { ...u, isActive: checked } : u)));
      message.success(checked ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
    } catch (error) {
      console.error('Error toggling user status:', error);
      message.error('Không thể thay đổi trạng thái. Vui lòng thử lại.');
    }
  };

  const handleResetPassword = async (record: UserDto) => {
    try {
      const result = await userService.resetPassword(record.id);
      message.success(`Đã đặt lại mật khẩu cho ${record.fullName}. Mật khẩu mới: ${result.password}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      message.error('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        await userService.update(editingUser.id, values);
        message.success('Đã cập nhật thông tin người dùng');
      } else {
        await userService.create(values);
        message.success('Đã thêm người dùng mới');
      }
      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      message.error('Không thể lưu thông tin người dùng. Vui lòng thử lại.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      u.username.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_: any, record: UserDto) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: record.isActive ? '#1890ff' : '#d9d9d9' }} />
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
      render: (email: string) => (
        <Space>
          <MailOutlined style={{ color: '#1890ff' }} />
          {email}
        </Space>
      ),
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
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
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => getRoleTag(role),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: UserDto) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record.id, checked)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Vô hiệu"
        />
      ),
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (text: string) => <span style={{ color: '#666', fontSize: 12 }}>{text || '-'}</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: UserDto) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Đặt lại mật khẩu">
            <Button
              type="text"
              size="small"
              icon={<LockOutlined />}
              onClick={() => handleResetPassword(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý người dùng"
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm người dùng
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 50,
            pageSizeOptions: [50, 100, 150],
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} người dùng`,
          }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
        centered
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}>
                <Input prefix={<UserOutlined />} placeholder="username" disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
                <Input prefix={<MailOutlined />} placeholder="email@example.com" />
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
              <Form.Item name="department" label="Phòng ban" rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}>
                <Select placeholder="Chọn phòng ban">
                  {departments.map((d) => (
                    <Select.Option key={d.id} value={d.name}>{d.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}>
                <Select placeholder="Chọn vai trò">
                  {roles.map((r) => (
                    <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {!editingUser && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
