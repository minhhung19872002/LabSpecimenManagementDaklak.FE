import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Divider,
  Form,
  Input,
  Select,
  Switch,
  Button,
  message,
  Row,
  Col,
  InputNumber,
  Space,
  Avatar,
  Spin,
  Modal,
} from "antd";
import Icon, {
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SafetyOutlined,
  MailOutlined,
  SaveOutlined,
  InboxOutlined,
  FileDoneOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  LockOutlined,
  KeyOutlined,
} from "../../components/common/Icon";
import settingsService, {
  UserProfileDto,
  SystemSettingsDto,
  NotificationSettingsDto,
  SecuritySettingsDto,
} from "../../services/settingsService";
import { ROLES, STORAGE_KEYS } from "../../constants";
import { UserInfo, authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import "./SettingsPage.css";

/**
 * Settings Tab Permission Matrix:
 * - profile: All roles (everyone can edit their own profile)
 * - notifications: All roles (everyone can manage their notifications)
 * - system: Admin only
 * - email: Admin only
 * - security: Admin only
 */
const SETTINGS_TAB_PERMISSIONS: Record<string, string[]> = {
  profile: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.SAMPLE_RECEIVER,
    ROLES.LAB_TECHNICIAN,
    ROLES.ACCOUNTANT,
  ],
  notifications: [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.SAMPLE_RECEIVER,
    ROLES.LAB_TECHNICIAN,
    ROLES.ACCOUNTANT,
  ],
  system: [ROLES.ADMIN],
  email: [ROLES.ADMIN],
  security: [ROLES.ADMIN],
};

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
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("profile");

  // Load user roles from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (storedUser) {
      try {
        const userInfo: UserInfo = JSON.parse(storedUser);
        setUserRoles(userInfo.roles || []);
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Check if user has permission to view a tab
  const hasTabPermission = (tabKey: string): boolean => {
    if (userRoles.includes(ROLES.ADMIN)) {
      return true; // Admin has access to all tabs
    }
    const allowedRoles = SETTINGS_TAB_PERMISSIONS[tabKey];
    if (!allowedRoles) return false;
    return userRoles.some((role) => allowedRoles.includes(role));
  };

  // Get allowed tabs for current user
  const allowedTabs = useMemo(() => {
    return Object.keys(SETTINGS_TAB_PERMISSIONS).filter((tabKey) =>
      hasTabPermission(tabKey)
    );
  }, [userRoles]);

  // Set initial active tab to first allowed tab
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [allowedTabs]);

  // Load data when tab changes
  useEffect(() => {
    if (allowedTabs.includes(activeTab)) {
      loadTabData(activeTab);
    }
  }, [activeTab, allowedTabs]);

  const loadTabData = async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case "profile":
          await loadProfile();
          break;
        case "system":
          await loadSystemSettings();
          break;
        case "notifications":
          await loadNotificationSettings();
          break;
        case "email":
          await loadEmailSettings();
          break;
        case "security":
          await loadSecuritySettings();
          break;
      }
    } catch (error: any) {
      message.error(
        "Không thể tải dữ liệu: " + (error.message || "Lỗi không xác định")
      );
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
      phoneNumber: profile.phoneNumber || "",
      department: profile.department || "",
      position: profile.position || "",
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
      timezone: settings.timezone,
    });
  };

  const loadEmailSettings = async () => {
    const settings = await settingsService.getEmailSettings();
    emailForm.setFieldsValue({
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUsername: settings.smtpUsername,
      smtpPassword: "", // Don't show password
      enableSsl: settings.enableSsl,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
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
      monthlyReport: settings.monthlyReport,
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
      twoFactorEnabled: settings.twoFactorEnabled,
    });
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setProfileLoading(true);
      await settingsService.updateUserProfile({
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
      });
      message.success("Đã cập nhật thông tin cá nhân");
      await loadProfile();
    } catch (error: any) {
      if (error.errorFields) return; // Validation error
      message.error(
        "Lỗi: " + (error.message || "Không thể cập nhật thông tin")
      );
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
        newPassword: values.newPassword,
      });
      message.success("Đổi mật khẩu thành công!");
      passwordForm.resetFields();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error("Lỗi: " + (error.message || "Không thể đổi mật khẩu"));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveSystem = async () => {
    try {
      const values = await systemForm.validateFields();
      setSystemLoading(true);
      await settingsService.updateSystemSettings(values as SystemSettingsDto);
      message.success("Đã cập nhật cài đặt hệ thống");
    } catch (error: any) {
      if (error.errorFields) return;
      message.error("Lỗi: " + (error.message || "Không thể cập nhật cài đặt"));
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
        fromName: values.fromName,
      });
      message.success("Đã cập nhật cài đặt email");
    } catch (error: any) {
      if (error.errorFields) return;
      message.error("Lỗi: " + (error.message || "Không thể cập nhật cài đặt"));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleTestEmail = async () => {
    Modal.confirm({
      title: "Gửi email test",
      content: (
        <div>
          <p>Nhập địa chỉ email để nhận test:</p>
          <Input
            id="test-email-input"
            placeholder="email@example.com"
            defaultValue={userProfile?.email || ""}
          />
        </div>
      ),
      okText: "Gửi",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        const emailInput = document.getElementById(
          "test-email-input"
        ) as HTMLInputElement;
        const toEmail = emailInput?.value;
        if (!toEmail) {
          message.error("Vui lòng nhập địa chỉ email");
          return Promise.reject();
        }

        setTestEmailLoading(true);
        try {
          await settingsService.testEmail({ toEmail });
          message.success("Đã gửi email test thành công!");
        } catch (error: any) {
          message.error(
            "Gửi email thất bại: " + (error.message || "Lỗi không xác định")
          );
        } finally {
          setTestEmailLoading(false);
        }
      },
    });
  };

  const handleSaveNotification = async () => {
    try {
      const values = await notificationForm.validateFields();
      setNotificationLoading(true);
      await settingsService.updateNotificationSettings(
        values as NotificationSettingsDto
      );
      message.success("Đã cập nhật cài đặt thông báo");
    } catch (error: any) {
      if (error.errorFields) return;
      message.error("Lỗi: " + (error.message || "Không thể cập nhật cài đặt"));
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      const values = await securityForm.validateFields();
      setSecurityLoading(true);
      await settingsService.updateSecuritySettings(
        values as SecuritySettingsDto
      );
      message.success("Đã cập nhật cài đặt bảo mật");
    } catch (error: any) {
      if (error.errorFields) return;
      message.error("Lỗi: " + (error.message || "Không thể cập nhật cài đặt"));
    } finally {
      setSecurityLoading(false);
    }
  };

  // Define all tabs
  const allTabs = [
    {
      key: "profile",
      label: (
        <span>
          <UserOutlined /> Thông tin cá nhân
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          {/* Card 1: Thông tin cá nhân */}
          <Card
            className="settings-form-card"
            title={
              <div>
                <div className="settings-form-card-title">Thông tin cá nhân</div>
                <div className="settings-form-card-subtitle">Cập nhật thông tin định danh của bạn trên hệ thống</div>
              </div>
            }
          >
            <Row gutter={24}>
              <Col
                xs={24}
                md={6}
                style={{ textAlign: "center", marginBottom: 24 }}
              >
                <Avatar
                  size={100}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#1890ff" }}
                >
                  {userProfile?.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {userProfile?.fullName}
                  </div>
                  <div style={{ color: "#8c8c8c", fontSize: 13 }}>{userProfile?.userName}</div>
                </div>
              </Col>
              <Col xs={24} md={18}>
                <Form form={profileForm} layout="vertical">
                  <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên" },
                    ]}
                  >
                    <Input placeholder="Nhập họ tên" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                          {
                            required: true,
                            type: "email",
                            message: "Email không hợp lệ",
                          },
                        ]}
                      >
                        <Input placeholder="Nhập email" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="phoneNumber" label="Số điện thoại">
                        <Input placeholder="Nhập số điện thoại" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="department" label="Phòng ban">
                        <Select disabled placeholder="Chọn" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="position" label="Chức vụ">
                        <Select disabled placeholder="Chọn" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveProfile}
                    loading={profileLoading}
                    className="settings-btn-gradient"
                  >
                    Lưu thay đổi
                  </Button>
                </Form>
              </Col>
            </Row>
          </Card>

          {/* Card 2: Đổi mật khẩu */}
          <Card
            className="settings-form-card"
            style={{ marginTop: 24 }}
            title={
              <div>
                <div className="settings-form-card-title">Đổi mật khẩu</div>
                <div className="settings-form-card-subtitle">Bảo vệ tài khoản bằng mật khẩu mạnh</div>
              </div>
            }
          >
            <Form form={passwordForm} layout="vertical">
              <Form.Item
                name="currentPassword"
                label="Mật khẩu hiện tại"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mật khẩu hiện tại",
                  },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu hiện tại" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                  {
                    pattern: /[A-Z]/,
                    message: "Mật khẩu phải có ít nhất 1 chữ hoa",
                  },
                  {
                    pattern: /[a-z]/,
                    message: "Mật khẩu phải có ít nhất 1 chữ thường",
                  },
                  {
                    pattern: /[0-9]/,
                    message: "Mật khẩu phải có ít nhất 1 chữ số",
                  },
                  {
                    pattern: /[!@#$%^&*(),.?":{}|<>]/,
                    message: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt",
                  },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu mới" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={["newPassword"]}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng xác nhận mật khẩu mới",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        getFieldValue("newPassword") === value
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Mật khẩu xác nhận không khớp")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Nhập lại mật khẩu mới" />
              </Form.Item>
              <Button
                type="primary"
                onClick={handleChangePassword}
                loading={passwordLoading}
                className="settings-btn-gradient"
              >
                Lưu thay đổi
              </Button>
            </Form>
          </Card>
        </Spin>
      ),
    },
    {
      key: "notifications",
      label: (
        <span>
          <BellOutlined /> Thông báo
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <Card
            className="settings-form-card settings-form-card--no-body-padding"
            title={
              <div>
                <div className="settings-form-card-title">Cài đặt thông báo</div>
                <div className="settings-form-card-subtitle">Tùy chỉnh cách bạn nhận cập nhật từ hệ thống</div>
              </div>
            }
          >
            <Form form={notificationForm}>
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><MailOutlined /></div>
                  <div>
                    <div className="settings-item-label">Thông báo qua email</div>
                    <div className="settings-item-subtitle">Gửi các cập nhật quan trọng trực tiếp đến hộp thư của bạn</div>
                  </div>
                </div>
                <Form.Item name="emailEnabled" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><InboxOutlined /></div>
                  <div>
                    <div className="settings-item-label">Thông báo khi có yêu cầu mới</div>
                    <div className="settings-item-subtitle">Gửi các cập nhật quan trọng trực tiếp đến hộp thư của bạn</div>
                  </div>
                </div>
                <Form.Item name="newRequestAlert" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><FileDoneOutlined /></div>
                  <div>
                    <div className="settings-item-label">Thông báo khi có kết quả cần duyệt</div>
                    <div className="settings-item-subtitle">Gửi các cập nhật quan trọng trực tiếp đến hộp thư của bạn</div>
                  </div>
                </div>
                <Form.Item name="resultApprovalAlert" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><BellOutlined /></div>
                  <div>
                    <div className="settings-item-label">Thông báo khi sắp hết hạn TAT</div>
                    <div className="settings-item-subtitle">Gửi các cập nhật quan trọng trực tiếp đến hộp thư của bạn</div>
                  </div>
                </div>
                <Form.Item name="tatWarningAlert" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><ExclamationCircleOutlined /></div>
                  <div>
                    <div className="settings-item-label">Thông báo NCR mới</div>
                    <div className="settings-item-subtitle">Gửi các cập nhật quan trọng trực tiếp đến hộp thư của bạn</div>
                  </div>
                </div>
                <Form.Item name="ncrAlert" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><ClockCircleOutlined /></div>
                  <div>
                    <div className="settings-item-label">Báo cáo hàng tuần</div>
                    <div className="settings-item-subtitle">Gửi các cập nhật quan trọng trực tiếp đến hộp thư của bạn</div>
                  </div>
                </div>
                <Form.Item name="weeklyReport" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><CalendarOutlined /></div>
                  <div>
                    <div className="settings-item-label">Báo cáo hàng tháng</div>
                    <div className="settings-item-subtitle">Gửi các cập nhật quan trọng trực tiếp đến hộp thư của bạn</div>
                  </div>
                </div>
                <Form.Item name="monthlyReport" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveNotification}
                  loading={notificationLoading}
                  className="settings-btn-gradient"
                >
                  Lưu cài đặt
                </Button>
              </div>
            </Form>
          </Card>
        </Spin>
      ),
    },
    {
      key: "system",
      label: (
        <span>
          <SettingOutlined /> Cài đặt chung
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <Card
            className="settings-form-card"
            title={
              <div>
                <div className="settings-form-card-title">Cài đặt hệ thống</div>
                <div className="settings-form-card-subtitle">Tùy chỉnh các thông số chung của hệ thống</div>
              </div>
            }
          >
            <Form form={systemForm} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="labName"
                    label="Tên phòng thí nghiệm"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="labCode"
                    label="Mã VILAS"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="address" label="Địa chỉ">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="defaultTAT" label="TAT mặc định (ngày)">
                    <InputNumber min={1} max={30} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="language" label="Ngôn ngữ">
                    <Select>
                      <Select.Option value="vi">Tiếng Việt</Select.Option>
                      <Select.Option value="en">English</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="timezone" label="Múi giờ">
                    <Select>
                      <Select.Option value="Asia/Ho_Chi_Minh">
                        UTC+7 (Việt Nam)
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
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
                </Col>
              </Row>
              {authService.hasPermission(PERMISSIONS.Settings.Edit) && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveSystem}
                  loading={systemLoading}
                  className="settings-btn-gradient"
                >
                  Lưu cài đặt
                </Button>
              )}
            </Form>
          </Card>
        </Spin>
      ),
    },
    {
      key: "email",
      label: (
        <span>
          <MailOutlined /> Email SMTP
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <Card
            className="settings-form-card"
            title={
              <div>
                <div className="settings-form-card-title">Cài đặt SMTP</div>
                <div className="settings-form-card-subtitle">Tùy chỉnh cách bạn nhận cập nhật từ hệ thống</div>
              </div>
            }
          >
            <Form form={emailForm} layout="vertical">
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="smtpHost"
                    label="SMTP Server"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="smtp.gmail.com" />
                  </Form.Item>
                  <Form.Item
                    name="smtpPort"
                    label="Port"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="smtpUsername" label="Username">
                    <Input />
                  </Form.Item>
                  <Form.Item name="smtpPassword" label="Password">
                    <Input.Password placeholder="Để trống nếu không muốn thay đổi" />
                  </Form.Item>
                  <Form.Item
                    name="enableSsl"
                    label="SSL/TLS"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ background: '#FAFAFA', borderRadius: 8, padding: '16px' }}>
                    <Form.Item name="fromName" label="Tên hiển thị">
                      <Input />
                    </Form.Item>
                    <Form.Item name="fromEmail" label="Email gửi">
                      <Input />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              {authService.hasPermission(PERMISSIONS.Settings.Edit) && (
                <Space>
                  <Button
                    type="primary"
                    className="settings-btn-gradient"
                    icon={<SaveOutlined />}
                    onClick={handleSaveEmail}
                    loading={emailLoading}
                  >
                    Lưu cài đặt
                  </Button>
                  <Button
                    icon={<MailOutlined />}
                    onClick={handleTestEmail}
                    loading={testEmailLoading}
                  >
                    Gửi email test
                  </Button>
                </Space>
              )}
            </Form>
          </Card>
        </Spin>
      ),
    },
    {
      key: "security",
      label: (
        <span>
          <SafetyOutlined /> Bảo mật
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <Card
            className="settings-form-card settings-form-card--no-body-padding"
            title={
              <div>
                <div className="settings-form-card-title">Cài đặt bảo mật</div>
                <div className="settings-form-card-subtitle">Tùy chỉnh các thiết lập bảo mật cho hệ thống</div>
              </div>
            }
          >
            <Form form={securityForm}>
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><SafetyOutlined /></div>
                  <div>
                    <div className="settings-item-label">Yêu cầu mật khẩu mạnh</div>
                    <div className="settings-item-subtitle">Tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt</div>
                  </div>
                </div>
                <Form.Item name="requireStrongPassword" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><ClockCircleOutlined /></div>
                  <div>
                    <div className="settings-item-label">Thời gian hết hạn session (phút)</div>
                  </div>
                </div>
                <Form.Item name="sessionTimeout" noStyle>
                  <InputNumber min={5} max={120} />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><Icon name="exclamation-diamond" /></div>
                  <div>
                    <div className="settings-item-label">Số lần đăng nhập sai tối đa</div>
                  </div>
                </div>
                <Form.Item name="maxLoginAttempts" noStyle>
                  <InputNumber min={3} max={10} />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><LockOutlined /></div>
                  <div>
                    <div className="settings-item-label">Khóa tài khoản khi đăng nhập sai (phút)</div>
                  </div>
                </div>
                <Form.Item name="lockoutDuration" noStyle>
                  <InputNumber min={5} max={60} />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><KeyOutlined /></div>
                  <div>
                    <div className="settings-item-label">Bắt buộc đổi mật khẩu định kỳ (ngày)</div>
                  </div>
                </div>
                <Form.Item name="passwordExpiryDays" noStyle>
                  <InputNumber min={30} max={365} />
                </Form.Item>
              </div>
              <Divider style={{ margin: 0 }} />
              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-icon"><Icon name="fingerprint" /></div>
                  <div>
                    <div className="settings-item-label">Xác thực 2 bước (2FA)</div>
                  </div>
                </div>
                <Space>
                  <span style={{ fontSize: 14, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Coming soon</span>
                  <Form.Item name="twoFactorEnabled" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </Space>
              </div>
              <Divider style={{ margin: 0 }} />
              {authService.hasPermission(PERMISSIONS.Settings.Edit) && (
                <div className="settings-item">
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveSecurity}
                    loading={securityLoading}
                    className="settings-btn-gradient"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              )}
            </Form>
          </Card>
        </Spin>
      ),
    },
  ];

  // Filter tabs based on user permissions
  const visibleTabs = allTabs.filter((tab) => hasTabPermission(tab.key));

  // Menu items config
  const menuItems = [
    { key: "profile", icon: <UserOutlined />, label: "Thông tin cá nhân" },
    { key: "notifications", icon: <BellOutlined />, label: "Thông báo" },
    { key: "system", icon: <SettingOutlined />, label: "Cài đặt chung" },
    { key: "email", icon: <MailOutlined />, label: "Email SMTP" },
    { key: "security", icon: <SafetyOutlined />, label: "Bảo mật" },
  ].filter((item) => hasTabPermission(item.key));

  // Get active tab content
  const activeTabContent = visibleTabs.find((tab) => tab.key === activeTab)?.children;

  return (
    <div className="page-wrapper">
      <Row gutter={24}>
        <Col xs={24} md={7} lg={6}>
          <Card className="settings-menu-card" title="Cài đặt hệ thống">
            {menuItems.map((item) => (
              <div
                key={item.key}
                className={`settings-menu-item${activeTab === item.key ? " active" : ""}`}
                onClick={() => setActiveTab(item.key)}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={17} lg={18}>
          <div className="settings-content">
            {activeTabContent}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SettingsPage;
