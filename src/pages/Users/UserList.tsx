import React, { useState } from 'react';
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
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';

// Mock data for users
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    fullName: 'Quản trị viên',
    email: 'admin@labdaklak.vn',
    phone: '0905123456',
    role: 'Admin',
    department: 'Quản lý',
    isActive: true,
    createdAt: '2025-01-01',
    lastLogin: '2025-12-12 10:30',
  },
  {
    id: '2',
    username: 'nguyen.van.a',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@labdaklak.vn',
    phone: '0905234567',
    role: 'LabManager',
    department: 'Phòng Hóa học',
    isActive: true,
    createdAt: '2025-02-15',
    lastLogin: '2025-12-12 09:15',
  },
  {
    id: '3',
    username: 'tran.thi.b',
    fullName: 'Trần Thị B',
    email: 'tranthib@labdaklak.vn',
    phone: '0905345678',
    role: 'Technician',
    department: 'Phòng Vi sinh',
    isActive: true,
    createdAt: '2025-03-20',
    lastLogin: '2025-12-12 08:45',
  },
  {
    id: '4',
    username: 'le.van.c',
    fullName: 'Lê Văn C',
    email: 'levanc@labdaklak.vn',
    phone: '0905456789',
    role: 'Reviewer',
    department: 'Phòng Hóa học',
    isActive: true,
    createdAt: '2025-04-10',
    lastLogin: '2025-12-11 16:30',
  },
  {
    id: '5',
    username: 'pham.thi.d',
    fullName: 'Phạm Thị D',
    email: 'phamthid@labdaklak.vn',
    phone: '0905567890',
    role: 'Approver',
    department: 'Ban Giám đốc',
    isActive: true,
    createdAt: '2025-05-05',
    lastLogin: '2025-12-12 07:00',
  },
  {
    id: '6',
    username: 'hoang.van.e',
    fullName: 'Hoàng Văn E',
    email: 'hoangvane@labdaklak.vn',
    phone: '0905678901',
    role: 'Technician',
    department: 'Phòng Vật lý',
    isActive: false,
    createdAt: '2025-06-15',
    lastLogin: '2025-11-20 10:00',
  },
];

const roles = [
  { value: 'Admin', label: 'Quản trị viên', color: 'red' },
  { value: 'LabManager', label: 'Trưởng phòng TN', color: 'purple' },
  { value: 'Technician', label: 'Kỹ thuật viên', color: 'blue' },
  { value: 'Reviewer', label: 'Người duyệt B1', color: 'orange' },
  { value: 'Approver', label: 'Người duyệt B2', color: 'green' },
  { value: 'Viewer', label: 'Xem báo cáo', color: 'default' },
];

const departments = [
  'Quản lý',
  'Ban Giám đốc',
  'Phòng Hóa học',
  'Phòng Vi sinh',
  'Phòng Vật lý',
  'Phòng Môi trường',
  'Tiếp nhận mẫu',
];

const UserList: React.FC = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const getRoleTag = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return <Tag color={roleConfig?.color || 'default'}>{roleConfig?.label || role}</Tag>;
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
    message.success('Đã xóa người dùng');
  };

  const handleToggleActive = (id: string, checked: boolean) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, isActive: checked } : u)));
    message.success(checked ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingUser) {
        setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u)));
        message.success('Đã cập nhật thông tin người dùng');
      } else {
        const newUser = {
          id: Date.now().toString(),
          ...values,
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
          lastLogin: '-',
        };
        setUsers([...users, newUser]);
        message.success('Đã thêm người dùng mới');
      }
      setIsModalOpen(false);
    });
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
      render: (_: any, record: any) => (
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
          {phone}
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
      render: (isActive: boolean, record: any) => (
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
      render: (text: string) => <span style={{ color: '#666', fontSize: 12 }}>{text}</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Đặt lại mật khẩu">
            <Button
              type="text"
              icon={<LockOutlined />}
              onClick={() => message.info('Chức năng đặt lại mật khẩu (mockup)')}
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
              <Button type="text" danger icon={<DeleteOutlined />} />
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
            />
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
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} người dùng` }}
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
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}>
            <Input prefix={<UserOutlined />} placeholder="username" disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input prefix={<PhoneOutlined />} placeholder="0905123456" />
          </Form.Item>
          <Form.Item name="department" label="Phòng ban" rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}>
            <Select placeholder="Chọn phòng ban">
              {departments.map((d) => (
                <Select.Option key={d} value={d}>{d}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}>
            <Select placeholder="Chọn vai trò">
              {roles.map((r) => (
                <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
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
