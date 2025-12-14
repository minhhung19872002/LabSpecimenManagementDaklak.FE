import React, { useState, useEffect } from 'react';
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
  Avatar,
  Descriptions,
  Spin,
  Modal
} from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SafetyOutlined,
  MailOutlined,
  SaveOutlined
} from '@ant-design/icons';
import settingsService, {
  UserProfileDto,
  SystemSettingsDto,
  NotificationSettingsDto,
  SecuritySettingsDto
} from '../../services/settingsService';

const SettingsPage: React.FC = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [securityForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [systemLoading, setSystemLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Load data when tab changes
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'profile':
          await loadProfile();
          break;
        case 'system':
          await loadSystemSettings();
          break;
        case 'notifications':
          await loadNotificationSettings();
          break;
        case 'email':
          await loadEmailSettings();
          break;
        case 'security':
          await loadSecuritySettings();
          break;
      }
    } catch (error: any) {
      message.error('Không thể tải dữ liệu: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    const profile = await settingsService.getUserProfile();
    setUserProfile(profile);
    profileForm.setFieldsValue({
      fullName: profile.fullName,
      email: profile.email,
      phoneNumber: profile.phoneNumber || '',
      department: profile.department || '',
      position: profile.position || ''
    });
  };

  const loadSystemSettings = async () => {
    const settings = await settingsService.getSystemSettings();
    systemForm.setFieldsValue({
      labName: settings.labName,
      labCode: settings.labCode,
      address: settings.address,
      defaultTAT: settings.defaultTAT,
      workingDays: settings.workingDays,
      language: settings.language,
      timezone: settings.timezone
    });
  };

  const loadEmailSettings = async () => {
    const settings = await settingsService.getEmailSettings();
    emailForm.setFieldsValue({
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUsername: settings.smtpUsername,
      smtpPassword: '', // Don't show password
      enableSsl: settings.enableSsl,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName
    });
  };

  const loadNotificationSettings = async () => {
    const settings = await settingsService.getNotificationSettings();
    notificationForm.setFieldsValue({
      emailEnabled: settings.emailEnabled,
      newRequestAlert: settings.newRequestAlert,
      resultApprovalAlert: settings.resultApprovalAlert,
      tatWarningAlert: settings.tatWarningAlert,
      ncrAlert: settings.ncrAlert,
      weeklyReport: settings.weeklyReport,
      monthlyReport: settings.monthlyReport
    });
  };

  const loadSecuritySettings = async () => {
    const settings = await settingsService.getSecuritySettings();
    securityForm.setFieldsValue({
      requireStrongPassword: settings.requireStrongPassword,
      sessionTimeout: settings.sessionTimeout,
      maxLoginAttempts: settings.maxLoginAttempts,
      lockoutDuration: settings.lockoutDuration,
      passwordExpiryDays: settings.passwordExpiryDays,
      twoFactorEnabled: settings.twoFactorEnabled
    });
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setProfileLoading(true);
      await settingsService.updateUserProfile({
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber
      });
      message.success('Đã cập nhật thông tin cá nhân');
      await loadProfile();
    } catch (error: any) {
      if (error.errorFields) return; // Validation error
      message.error('Lỗi: ' + (error.message || 'Không thể cập nhật thông tin'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setPasswordLoading(true);
      await settingsService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('Đổi mật khẩu thành công!');
      passwordForm.resetFields();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('Lỗi: ' + (error.message || 'Không thể đổi mật khẩu'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveSystem = async () => {
    try {
      const values = await systemForm.validateFields();
      setSystemLoading(true);
      await settingsService.updateSystemSettings(values as SystemSettingsDto);
      message.success('Đã cập nhật cài đặt hệ thống');
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('Lỗi: ' + (error.message || 'Không thể cập nhật cài đặt'));
    } finally {
      setSystemLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    try {
      const values = await emailForm.validateFields();
      setEmailLoading(true);
      await settingsService.updateEmailSettings({
        smtpHost: values.smtpHost,
        smtpPort: values.smtpPort,
        smtpUsername: values.smtpUsername,
        smtpPassword: values.smtpPassword || undefined,
        enableSsl: values.enableSsl,
        fromEmail: values.fromEmail,
        fromName: values.fromName
      });
      message.success('Đã cập nhật cài đặt email');
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('Lỗi: ' + (error.message || 'Không thể cập nhật cài đặt'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleTestEmail = async () => {
    Modal.confirm({
      title: 'Gửi email test',
      content: (
        <div>
          <p>Nhập địa chỉ email để nhận test:</p>
          <Input
            id="test-email-input"
            placeholder="email@example.com"
            defaultValue={userProfile?.email || ''}
          />
        </div>
      ),
      okText: 'Gửi',
      cancelText: 'Hủy',
      onOk: async () => {
        const emailInput = document.getElementById('test-email-input') as HTMLInputElement;
        const toEmail = emailInput?.value;
        if (!toEmail) {
          message.error('Vui lòng nhập địa chỉ email');
          return Promise.reject();
        }

        setTestEmailLoading(true);
        try {
          await settingsService.testEmail({ toEmail });
          message.success('Đã gửi email test thành công!');
        } catch (error: any) {
          message.error('Gửi email thất bại: ' + (error.message || 'Lỗi không xác định'));
        } finally {
          setTestEmailLoading(false);
        }
      }
    });
  };

  const handleSaveNotification = async () => {
    try {
      const values = await notificationForm.validateFields();
      setNotificationLoading(true);
      await settingsService.updateNotificationSettings(values as NotificationSettingsDto);
      message.success('Đã cập nhật cài đặt thông báo');
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('Lỗi: ' + (error.message || 'Không thể cập nhật cài đặt'));
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      const values = await securityForm.validateFields();
      setSecurityLoading(true);
      await settingsService.updateSecuritySettings(values as SecuritySettingsDto);
      message.success('Đã cập nhật cài đặt bảo mật');
    } catch (error: any) {
      if (error.errorFields) return;
      message.error('Lỗi: ' + (error.message || 'Không thể cập nhật cài đặt'));
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <SettingOutlined /> Cài đặt hệ thống
      </h2>

      <Tabs
        tabPosition="left"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'profile',
            label: (
              <span>
                <UserOutlined /> Thông tin cá nhân
              </span>
            ),
            children: (
              <Spin spinning={loading}>
                <Card title="Thông tin tài khoản">
                  <Row gutter={24}>
                    <Col xs={24} md={8} style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Avatar size={120} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                        {userProfile?.fullName?.charAt(0).toUpperCase()}
                      </Avatar>
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{userProfile?.fullName}</div>
                        <div style={{ color: '#666' }}>{userProfile?.userName}</div>
                      </div>
                    </Col>
                    <Col xs={24} md={16}>
                      <Form form={profileForm} layout="vertical">
                        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                          <Input />
                        </Form.Item>
                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                          <Input prefix={<MailOutlined />} />
                        </Form.Item>
                        <Form.Item name="phoneNumber" label="Số điện thoại">
                          <Input />
                        </Form.Item>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item name="department" label="Phòng ban">
                              <Input disabled />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="position" label="Chức vụ">
                              <Input disabled />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveProfile} loading={profileLoading}>
                          Lưu thay đổi
                        </Button>
                      </Form>

                      <Divider>Đổi mật khẩu</Divider>

                      <Form form={passwordForm} layout="vertical">
                        <Form.Item
                          name="currentPassword"
                          label="Mật khẩu hiện tại"
                          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                        >
                          <Input.Password placeholder="Mật khẩu hiện tại" />
                        </Form.Item>
                        <Form.Item
                          name="newPassword"
                          label="Mật khẩu mới"
                          rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                          ]}
                        >
                          <Input.Password placeholder="Mật khẩu mới" />
                        </Form.Item>
                        <Form.Item
                          name="confirmPassword"
                          label="Xác nhận mật khẩu mới"
                          dependencies={['newPassword']}
                          rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                              }
                            })
                          ]}
                        >
                          <Input.Password placeholder="Xác nhận mật khẩu mới" />
                        </Form.Item>
                        <Button type="primary" onClick={handleChangePassword} loading={passwordLoading}>
                          Đổi mật khẩu
                        </Button>
                      </Form>
                    </Col>
                  </Row>
                </Card>
              </Spin>
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
              <Spin spinning={loading}>
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
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveSystem} loading={systemLoading}>
                      Lưu cài đặt
                    </Button>
                  </Form>
                </Card>
              </Spin>
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
              <Spin spinning={loading}>
                <Card title="Cài đặt thông báo">
                  <Form form={notificationForm} layout="vertical">
                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="Thông báo qua email">
                        <Form.Item name="emailEnabled" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Thông báo khi có yêu cầu mới">
                        <Form.Item name="newRequestAlert" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Thông báo khi có kết quả cần duyệt">
                        <Form.Item name="resultApprovalAlert" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Thông báo khi sắp hết hạn TAT">
                        <Form.Item name="tatWarningAlert" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Thông báo NCR mới">
                        <Form.Item name="ncrAlert" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Báo cáo hàng tuần">
                        <Form.Item name="weeklyReport" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Báo cáo hàng tháng">
                        <Form.Item name="monthlyReport" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                      </Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 16 }}>
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveNotification} loading={notificationLoading}>
                        Lưu cài đặt
                      </Button>
                    </div>
                  </Form>
                </Card>
              </Spin>
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
              <Spin spinning={loading}>
                <Card title="Cài đặt SMTP">
                  <Form form={emailForm} layout="vertical">
                    <Row gutter={16}>
                      <Col xs={24} md={16}>
                        <Form.Item name="smtpHost" label="SMTP Server" rules={[{ required: true }]}>
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
                        <Form.Item name="smtpUsername" label="Username">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="smtpPassword" label="Password">
                          <Input.Password placeholder="Để trống nếu không muốn thay đổi" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="enableSsl" label="SSL/TLS" valuePropName="checked">
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
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveEmail} loading={emailLoading}>
                        Lưu cài đặt
                      </Button>
                      <Button icon={<MailOutlined />} onClick={handleTestEmail} loading={testEmailLoading}>
                        Gửi email test
                      </Button>
                    </Space>
                  </Form>
                </Card>
              </Spin>
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
              <Spin spinning={loading}>
                <Card title="Cài đặt bảo mật">
                  <Form form={securityForm} layout="vertical">
                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="Yêu cầu mật khẩu mạnh">
                        <Form.Item name="requireStrongPassword" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                        <span style={{ marginLeft: 8, color: '#666' }}>Tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Thời gian hết hạn session (phút)">
                        <Form.Item name="sessionTimeout" noStyle>
                          <InputNumber min={5} max={120} />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Số lần đăng nhập sai tối đa">
                        <Form.Item name="maxLoginAttempts" noStyle>
                          <InputNumber min={3} max={10} />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Khóa tài khoản khi đăng nhập sai (phút)">
                        <Form.Item name="lockoutDuration" noStyle>
                          <InputNumber min={5} max={60} />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Bắt buộc đổi mật khẩu định kỳ (ngày)">
                        <Form.Item name="passwordExpiryDays" noStyle>
                          <InputNumber min={30} max={365} />
                        </Form.Item>
                      </Descriptions.Item>
                      <Descriptions.Item label="Xác thực 2 bước (2FA)">
                        <Form.Item name="twoFactorEnabled" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                        <Tag color="blue" style={{ marginLeft: 8 }}>Coming soon</Tag>
                      </Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 16 }}>
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveSecurity} loading={securityLoading}>
                        Lưu cài đặt
                      </Button>
                    </div>
                  </Form>
                </Card>
              </Spin>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SettingsPage;
