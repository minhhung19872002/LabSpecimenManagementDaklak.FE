// @ts-nocheck
import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Switch,
  Button,
  message,
  Divider,
  Row,
  Col,
  InputNumber,
  Space,
  Tag,
  Table,
  Modal,
  Upload,
  Avatar,
  Descriptions
} from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  MailOutlined,
  GlobalOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SaveOutlined
} from '@ant-design/icons';

// Mock master data
const mockTestMethods = [
  { id: 1, code: 'TM-001', name: 'Phương pháp chuẩn độ', standard: 'TCVN 6492:2011' },
  { id: 2, code: 'TM-002', name: 'Phương pháp quang phổ UV-Vis', standard: 'TCVN 6178:1996' },
  { id: 3, code: 'TM-003', name: 'Phương pháp vi sinh đếm đĩa', standard: 'TCVN 6187-1:2019' },
  { id: 4, code: 'TM-004', name: 'Phương pháp khối lượng', standard: 'TCVN 6663-3:2016' },
];

const mockSpecimenTypes = [
  { id: 1, code: 'ST-001', name: 'Nước ngầm', description: 'Nước từ giếng khoan, giếng đào' },
  { id: 2, code: 'ST-002', name: 'Nước mặt', description: 'Nước sông, hồ, suối' },
  { id: 3, code: 'ST-003', name: 'Nước thải', description: 'Nước thải công nghiệp, sinh hoạt' },
  { id: 4, code: 'ST-004', name: 'Đất', description: 'Đất nông nghiệp, đất xây dựng' },
  { id: 5, code: 'ST-005', name: 'Thực phẩm', description: 'Thực phẩm các loại' },
];

const SettingsPage: React.FC = () => {
  const [profileForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // Initialize forms with mock data
  React.useEffect(() => {
    profileForm.setFieldsValue({
      fullName: 'Quản trị viên',
      email: 'admin@labdaklak.vn',
      phone: '0905123456',
      department: 'Quản lý',
    });
    systemForm.setFieldsValue({
      labName: 'Phòng Thí nghiệm Đắk Lắk',
      labCode: 'VILAS-001',
      address: '123 Nguyễn Tất Thành, TP. Buôn Ma Thuột',
      defaultTAT: 5,
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
    });
    emailForm.setFieldsValue({
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@labdaklak.vn',
      enableSSL: true,
      fromName: 'Lab Đắk Lắk',
      fromEmail: 'noreply@labdaklak.vn',
    });
  }, []);

  const handleSaveProfile = () => {
    profileForm.validateFields().then(() => {
      message.success('Đã cập nhật thông tin cá nhân');
    });
  };

  const handleSaveSystem = () => {
    systemForm.validateFields().then(() => {
      message.success('Đã cập nhật cài đặt hệ thống');
    });
  };

  const handleSaveEmail = () => {
    emailForm.validateFields().then(() => {
      message.success('Đã cập nhật cài đặt email');
    });
  };

  const handleTestEmail = () => {
    message.loading('Đang gửi email test...', 2).then(() => {
      message.success('Đã gửi email test thành công!');
    });
  };

  const methodColumns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Tên phương pháp', dataIndex: 'name', key: 'name', width: 250 },
    { title: 'Tiêu chuẩn', dataIndex: 'standard', key: 'standard', width: 150 },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: () => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  const typeColumns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Tên loại mẫu', dataIndex: 'name', key: 'name', width: 150 },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', width: 250 },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: () => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <SettingOutlined /> Cài đặt hệ thống
      </h2>

      <Tabs
        tabPosition="left"
        items={[
          {
            key: 'profile',
            label: (
              <span>
                <UserOutlined /> Thông tin cá nhân
              </span>
            ),
            children: (
              <Card title="Thông tin tài khoản">
                <Row gutter={24}>
                  <Col xs={24} md={8} style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Avatar size={120} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    <div style={{ marginTop: 16 }}>
                      <Upload showUploadList={false}>
                        <Button icon={<UploadOutlined />}>Đổi ảnh đại diện</Button>
                      </Upload>
                    </div>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form form={profileForm} layout="vertical">
                      <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                      <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>
                      <Form.Item name="phone" label="Số điện thoại">
                        <Input />
                      </Form.Item>
                      <Form.Item name="department" label="Phòng ban">
                        <Input disabled />
                      </Form.Item>
                      <Divider />
                      <Form.Item label="Đổi mật khẩu">
                        <Input.Password placeholder="Mật khẩu hiện tại" style={{ marginBottom: 8 }} />
                        <Input.Password placeholder="Mật khẩu mới" style={{ marginBottom: 8 }} />
                        <Input.Password placeholder="Xác nhận mật khẩu mới" />
                      </Form.Item>
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveProfile}>
                        Lưu thay đổi
                      </Button>
                    </Form>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: 'system',
            label: (
              <span>
                <SettingOutlined /> Cài đặt chung
              </span>
            ),
            children: (
              <Card title="Cài đặt hệ thống">
                <Form form={systemForm} layout="vertical">
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="labName" label="Tên phòng thí nghiệm" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="labCode" label="Mã VILAS" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="address" label="Địa chỉ">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item name="defaultTAT" label="TAT mặc định (ngày)">
                        <InputNumber min={1} max={30} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="language" label="Ngôn ngữ">
                        <Select>
                          <Select.Option value="vi">Tiếng Việt</Select.Option>
                          <Select.Option value="en">English</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="timezone" label="Múi giờ">
                        <Select>
                          <Select.Option value="Asia/Ho_Chi_Minh">UTC+7 (Việt Nam)</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="workingDays" label="Ngày làm việc">
                    <Select mode="multiple">
                      <Select.Option value="monday">Thứ 2</Select.Option>
                      <Select.Option value="tuesday">Thứ 3</Select.Option>
                      <Select.Option value="wednesday">Thứ 4</Select.Option>
                      <Select.Option value="thursday">Thứ 5</Select.Option>
                      <Select.Option value="friday">Thứ 6</Select.Option>
                      <Select.Option value="saturday">Thứ 7</Select.Option>
                      <Select.Option value="sunday">Chủ nhật</Select.Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveSystem}>
                    Lưu cài đặt
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'notifications',
            label: (
              <span>
                <BellOutlined /> Thông báo
              </span>
            ),
            children: (
              <Card title="Cài đặt thông báo">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Thông báo qua email">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="Thông báo khi có yêu cầu mới">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="Thông báo khi có kết quả cần duyệt">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="Thông báo khi sắp hết hạn TAT">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="Thông báo NCR mới">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                  <Descriptions.Item label="Báo cáo hàng tuần">
                    <Switch />
                  </Descriptions.Item>
                  <Descriptions.Item label="Báo cáo hàng tháng">
                    <Switch defaultChecked />
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" icon={<SaveOutlined />}>
                    Lưu cài đặt
                  </Button>
                </div>
              </Card>
            ),
          },
          {
            key: 'email',
            label: (
              <span>
                <MailOutlined /> Email SMTP
              </span>
            ),
            children: (
              <Card title="Cài đặt SMTP">
                <Form form={emailForm} layout="vertical">
                  <Row gutter={16}>
                    <Col xs={24} md={16}>
                      <Form.Item name="smtpServer" label="SMTP Server" rules={[{ required: true }]}>
                        <Input placeholder="smtp.gmail.com" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="smtpPort" label="Port" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="smtpUser" label="Username">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="smtpPassword" label="Password">
                        <Input.Password placeholder="••••••••" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="enableSSL" label="SSL/TLS" valuePropName="checked">
                    <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                  </Form.Item>
                  <Divider>Thông tin người gửi</Divider>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="fromName" label="Tên hiển thị">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="fromEmail" label="Email gửi">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveEmail}>
                      Lưu cài đặt
                    </Button>
                    <Button icon={<MailOutlined />} onClick={handleTestEmail}>
                      Gửi email test
                    </Button>
                  </Space>
                </Form>
              </Card>
            ),
          },
          {
            key: 'masterdata',
            label: (
              <span>
                <DatabaseOutlined /> Dữ liệu danh mục
              </span>
            ),
            children: (
              <div>
                <Card
                  title="Phương pháp thử nghiệm"
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsMethodModalOpen(true)}>
                      Thêm mới
                    </Button>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Table dataSource={mockTestMethods} columns={methodColumns} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }} />
                </Card>

                <Card
                  title="Loại mẫu thử"
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsTypeModalOpen(true)}>
                      Thêm mới
                    </Button>
                  }
                >
                  <Table dataSource={mockSpecimenTypes} columns={typeColumns} rowKey="id" pagination={false} size="small" scroll={{ x: 600 }} />
                </Card>
              </div>
            ),
          },
          {
            key: 'security',
            label: (
              <span>
                <SafetyOutlined /> Bảo mật
              </span>
            ),
            children: (
              <Card title="Cài đặt bảo mật">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Yêu cầu mật khẩu mạnh">
                    <Switch defaultChecked />
                    <span style={{ marginLeft: 8, color: '#666' }}>Tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian hết hạn session (phút)">
                    <InputNumber defaultValue={30} min={5} max={120} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Số lần đăng nhập sai tối đa">
                    <InputNumber defaultValue={5} min={3} max={10} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Khóa tài khoản khi đăng nhập sai (phút)">
                    <InputNumber defaultValue={15} min={5} max={60} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Bắt buộc đổi mật khẩu định kỳ (ngày)">
                    <InputNumber defaultValue={90} min={30} max={365} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Xác thực 2 bước (2FA)">
                    <Switch />
                    <Tag color="blue" style={{ marginLeft: 8 }}>Coming soon</Tag>
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" icon={<SaveOutlined />}>
                    Lưu cài đặt
                  </Button>
                </div>
              </Card>
            ),
          },
        ]}
      />

      {/* Add Method Modal */}
      <Modal
        title="Thêm phương pháp thử nghiệm"
        open={isMethodModalOpen}
        onCancel={() => setIsMethodModalOpen(false)}
        onOk={() => {
          message.success('Đã thêm phương pháp mới');
          setIsMethodModalOpen(false);
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Mã phương pháp" rules={[{ required: true }]}>
            <Input placeholder="TM-xxx" />
          </Form.Item>
          <Form.Item label="Tên phương pháp" rules={[{ required: true }]}>
            <Input placeholder="Tên phương pháp thử nghiệm" />
          </Form.Item>
          <Form.Item label="Tiêu chuẩn áp dụng">
            <Input placeholder="TCVN xxxx:yyyy" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Type Modal */}
      <Modal
        title="Thêm loại mẫu thử"
        open={isTypeModalOpen}
        onCancel={() => setIsTypeModalOpen(false)}
        onOk={() => {
          message.success('Đã thêm loại mẫu mới');
          setIsTypeModalOpen(false);
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Mã loại mẫu" rules={[{ required: true }]}>
            <Input placeholder="ST-xxx" />
          </Form.Item>
          <Form.Item label="Tên loại mẫu" rules={[{ required: true }]}>
            <Input placeholder="Tên loại mẫu thử" />
          </Form.Item>
          <Form.Item label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả chi tiết" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
