import React, { useState, useMemo, useEffect } from 'react';
import { Layout, Menu, MenuProps, Dropdown, Avatar, Space, Modal, Form, Input, message, Button } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  WarningOutlined,
  SettingOutlined,
  HistoryOutlined,
  TeamOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  AuditOutlined,
  SolutionOutlined,
  ToolOutlined,
  PieChartOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService, UserInfo } from '../../services/authService';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

// Map routes to menu keys
const routeToKeyMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/requests': 'requests',
  '/test-request': 'requests',
  '/specimens': 'specimens',
  '/specimen': 'specimens',
  '/tests': 'tests',
  '/test': 'tests',
  '/specimen-histories': 'specimenHistories',
  '/test-results': 'results',
  '/test-result': 'results',
  '/reports': 'reports',
  '/ncr': 'ncr',
  '/statistics': 'statistics',
  '/tasks': 'tasks',
  '/subcontractors': 'subcontractors',
  '/master-data': 'masterData',
  '/audit-log': 'auditLog',
  '/settings': 'settings',
  '/employees': 'employees',
};

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Load user info from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        await authService.logout();
      },
    });
  };

  // Handle change password
  const handleChangePassword = async (values: { currentPassword: string; newPassword: string }) => {
    setChangePasswordLoading(true);
    try {
      await authService.changePassword(values);
      message.success('Đổi mật khẩu thành công!');
      setChangePasswordVisible(false);
      changePasswordForm.resetFields();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      message.error(errorMessage);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (userInfo?.fullName) return userInfo.fullName;
    if (userInfo?.name || userInfo?.surname) return `${userInfo.surname || ''} ${userInfo.name || ''}`.trim();
    return userInfo?.userName || 'User';
  };

  // Get user role display
  const getUserRole = () => {
    if (userInfo?.roles && userInfo.roles.length > 0) {
      return userInfo.roles[0];
    }
    return '';
  };

  // Get avatar letter
  const getAvatarLetter = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Determine selected key based on current path
  const selectedKey = useMemo(() => {
    const pathname = location.pathname;

    // Check exact match first
    if (routeToKeyMap[pathname]) {
      return routeToKeyMap[pathname];
    }

    // Check prefix match for nested routes (e.g., /test-request/123)
    // Sort routes by length (longest first) to avoid matching shorter prefixes
    const sortedRoutes = Object.keys(routeToKeyMap).sort((a, b) => b.length - a.length);
    for (const route of sortedRoutes) {
      if (pathname.startsWith(route + '/') || pathname === route) {
        return routeToKeyMap[route];
      }
    }

    // Default to dashboard
    return 'dashboard';
  }, [location.pathname]);

  // Default open all groups
  const defaultOpenKeys = ['lab', 'quality', 'management', 'admin'];

  // Helper to create label with tooltip
  const menuLabel = (text: string) => <span title={text}>{text}</span>;

  const menuItems: MenuItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: menuLabel(t('menu.dashboard')),
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'lab',
      icon: <ExperimentOutlined />,
      label: menuLabel(t('menu.labOperations')),
      children: [
        {
          key: 'requests',
          icon: <FileTextOutlined />,
          label: menuLabel(t('menu.requests')),
          onClick: () => navigate('/requests'),
        },
        {
          key: 'specimens',
          icon: <ExperimentOutlined />,
          label: menuLabel(t('menu.specimens')),
          onClick: () => navigate('/specimens'),
        },
        {
          key: 'tests',
          icon: <CheckCircleOutlined />,
          label: menuLabel(t('menu.tests')),
          onClick: () => navigate('/tests'),
        },
        {
          key: 'specimenHistories',
          icon: <HistoryOutlined />,
          label: menuLabel(t('menu.specimenHistories')),
          onClick: () => navigate('/specimen-histories'),
        },
        {
          key: 'results',
          icon: <FileSearchOutlined />,
          label: menuLabel(t('menu.results')),
          onClick: () => navigate('/test-results'),
        },
      ],
    },
    {
      key: 'quality',
      icon: <PieChartOutlined />,
      label: menuLabel(t('menu.qualityReports')),
      children: [
        {
          key: 'ncr',
          icon: <WarningOutlined />,
          label: menuLabel(t('menu.ncr')),
          onClick: () => navigate('/ncr'),
        },
        {
          key: 'reports',
          icon: <BarChartOutlined />,
          label: menuLabel(t('menu.reports')),
          onClick: () => navigate('/reports'),
        },
        {
          key: 'statistics',
          icon: <BarChartOutlined />,
          label: menuLabel(t('menu.statistics')),
          onClick: () => navigate('/statistics'),
        },
      ],
    },
    {
      key: 'management',
      icon: <ToolOutlined />,
      label: menuLabel(t('menu.management')),
      children: [
        {
          key: 'tasks',
          icon: <ScheduleOutlined />,
          label: menuLabel(t('menu.tasks')),
          onClick: () => navigate('/tasks'),
        },
        {
          key: 'subcontractors',
          icon: <TeamOutlined />,
          label: menuLabel(t('menu.subcontractors')),
          onClick: () => navigate('/subcontractors'),
        },
        {
          key: 'masterData',
          icon: <DatabaseOutlined />,
          label: menuLabel(t('menu.masterData')),
          onClick: () => navigate('/master-data'),
        },
        {
          key: 'auditLog',
          icon: <AuditOutlined />,
          label: menuLabel(t('menu.auditLog')),
          onClick: () => navigate('/audit-log'),
        },
      ],
    },
    {
      key: 'admin',
      icon: <SolutionOutlined />,
      label: menuLabel(t('menu.administration')),
      children: [
        {
          key: 'employees',
          icon: <TeamOutlined />,
          label: menuLabel(t('menu.employees')),
          onClick: () => navigate('/employees'),
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: menuLabel(t('menu.settings')),
          onClick: () => navigate('/settings'),
        },
      ],
    },
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo">
          <h2>{collapsed ? 'LSM' : t('common.appName')}</h2>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={defaultOpenKeys}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: '#fff' }}>
          <div className="header-content">
            <h1>{t('common.appName')}</h1>
            <div className="header-actions">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'user-info',
                      label: (
                        <div className="user-dropdown-header">
                          <div className="user-dropdown-name">{getUserDisplayName()}</div>
                          <div className="user-dropdown-email">{userInfo?.email}</div>
                          {getUserRole() && (
                            <div className="user-dropdown-role">{getUserRole()}</div>
                          )}
                        </div>
                      ),
                      disabled: true,
                    },
                    { type: 'divider' },
                    {
                      key: 'change-password',
                      icon: <KeyOutlined />,
                      label: 'Đổi mật khẩu',
                      onClick: () => setChangePasswordVisible(true),
                    },
                    {
                      key: 'settings',
                      icon: <SettingOutlined />,
                      label: 'Cài đặt',
                      onClick: () => navigate('/settings'),
                    },
                    { type: 'divider' },
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: 'Đăng xuất',
                      danger: true,
                      onClick: handleLogout,
                    },
                  ],
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Space className="user-dropdown-trigger">
                  <Avatar
                    size={36}
                    icon={<UserOutlined />}
                    className="user-avatar"
                  >
                    {getAvatarLetter()}
                  </Avatar>
                  <div className="user-info-text">
                    <span className="user-name">{getUserDisplayName()}</span>
                    {getUserRole() && <span className="user-role">{getUserRole()}</span>}
                  </div>
                  <DownOutlined className="dropdown-arrow" />
                </Space>
              </Dropdown>
            </div>
          </div>
        </Header>

        {/* Change Password Modal */}
        <Modal
          title="Đổi mật khẩu"
          open={changePasswordVisible}
          onCancel={() => {
            setChangePasswordVisible(false);
            changePasswordForm.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          <Form
            form={changePasswordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
            >
              <Input.Password placeholder="Nhập mật khẩu hiện tại" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
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
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button
                  onClick={() => {
                    setChangePasswordVisible(false);
                    changePasswordForm.resetFields();
                  }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={changePasswordLoading}
                >
                  Đổi mật khẩu
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
        <Content style={{ margin: '16px', overflow: 'auto' }}>
          <div className="site-layout-content">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
