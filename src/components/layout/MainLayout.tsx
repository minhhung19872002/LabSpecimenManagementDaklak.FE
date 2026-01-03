import React, { useState, useMemo, useEffect } from "react";
import {
  Menu,
  MenuProps,
  Dropdown,
  Avatar,
  Space,
  Modal,
  Form,
  Input,
  message,
  Button,
  Drawer,
} from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  SettingOutlined,
  TeamOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  AuditOutlined,
  SolutionOutlined,
  ToolOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  DownOutlined,
  MenuOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  PieChartOutlined,
  HistoryOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { authService, UserInfo } from "../../services/authService";
import { signalRService } from "../../services/signalRService";
import { NotificationBell } from "../Notification";
import WorkReminderModal, {
  LabTechManagerReminderModal,
  LabTechnicianReminderModal,
  QualityManagerReminderModal,
} from "../WorkReminderModal";
import { useWorkReminderPopup } from "../../hooks/useWorkReminderPopup";
import { useLabTechManagerReminderPopup } from "../../hooks/useLabTechManagerReminderPopup";
import { useLabTechnicianReminderPopup } from "../../hooks/useLabTechnicianReminderPopup";
import { useQualityManagerReminderPopup } from "../../hooks/useQualityManagerReminderPopup";
import "./MainLayout.css";
import {
  PATH_ROUTES,
  ROLES,
  getRoleDisplayName,
  STORAGE_KEYS,
} from "../../constants";

// Flask Icon SVG Component
const FlaskIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 3V8.5L3.5 17.5C2.5 19 3.5 21 5.5 21H18.5C20.5 21 21.5 19 20.5 17.5L15 8.5V3M9 3H15M9 3H8M15 3H16M7 15H17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type MenuItem = Required<MenuProps>["items"][number];

// Extended menu item type with roles
interface MenuItemWithRoles {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
  roles: string[];
  children?: MenuItemWithRoles[];
}

// Map routes to menu keys
const routeToKeyMap: Record<string, string> = {
  "/dashboard": "dashboard",
  "/test-requests": "requests",
  "/tasks": "taskManagement",
  "/testing": "testManagement",
  "/quality-management": "qualityManagement",
  "/specimens": "specimens",
  "/tests": "tests",
  "/specimen-histories": "specimenHistories",
  "/test-results": "results",
  "/reports": "reports",
  "/ncr": "ncr",
  "/statistics": "statistics",
  "/subcontractors": "subcontractors",
  "/master-data": "masterData",
  "/organizations": "organizations",
  "/audit-log": "auditLog",
  "/settings": "settings",
  "/employees": "employees",
};

const MOBILE_BREAKPOINT = 768;

const MainLayout: React.FC = () => {
  const [collapsed, _setCollapsed] = useState(false);
  void _setCollapsed; // Suppress unused warning
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < MOBILE_BREAKPOINT
  );
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Work reminder popup for SampleReceiver
  const {
    open: workReminderOpen,
    tasks: workReminderTasks,
    closePopup: closeWorkReminder,
  } = useWorkReminderPopup();

  // Work reminder popup for Lab Technical Manager
  const {
    open: labTechReminderOpen,
    tasks: labTechReminderTasks,
    closePopup: closeLabTechReminder,
  } = useLabTechManagerReminderPopup();

  // Work reminder popup for Lab Technician (KTV)
  const {
    open: labTechnicianReminderOpen,
    tasks: labTechnicianReminderTasks,
    closePopup: closeLabTechnicianReminder,
  } = useLabTechnicianReminderPopup();

  // Work reminder popup for Quality Manager (QLCL)
  const {
    open: qualityManagerReminderOpen,
    tasks: qualityManagerReminderTasks,
    closePopup: closeQualityManagerReminder,
  } = useQualityManagerReminderPopup();

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Load user info from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Connect to SignalR when user is authenticated
  useEffect(() => {
    if (userInfo) {
      signalRService.connect();
    }

    return () => {
      signalRService.disconnect();
    };
  }, [userInfo]);

  // Handle logout
  const handleLogout = () => {
    Modal.confirm({
      title: "Xác nhận đăng xuất",
      content: "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
      okText: "Đăng xuất",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        await authService.logout();
      },
    });
  };

  // Handle change password
  const handleChangePassword = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setChangePasswordLoading(true);
    try {
      await authService.changePassword(values);
      message.success("Đổi mật khẩu thành công!");
      setChangePasswordVisible(false);
      changePasswordForm.resetFields();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Đổi mật khẩu thất bại. Vui lòng thử lại.";
      message.error(errorMessage);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (userInfo?.fullName) return userInfo.fullName;
    if (userInfo?.name || userInfo?.surname)
      return `${userInfo.surname || ""} ${userInfo.name || ""}`.trim();
    return userInfo?.userName || "User";
  };

  // Get user role display
  const getUserRole = () => {
    if (userInfo?.roles && userInfo.roles.length > 0) {
      return getRoleDisplayName(userInfo.roles[0]);
    }
    return "";
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
    const sortedRoutes = Object.keys(routeToKeyMap).sort(
      (a, b) => b.length - a.length
    );
    for (const route of sortedRoutes) {
      if (pathname.startsWith(route + "/") || pathname === route) {
        return routeToKeyMap[route];
      }
    }

    // Default to dashboard
    return "dashboard";
  }, [location.pathname]);

  // Default open all groups
  const defaultOpenKeys = ["overview", "lab", "quality", "management", "admin"];

  // Helper to create label with tooltip
  const menuLabel = (text: string) => <span title={text}>{text}</span>;

  // All roles shorthand
  const ALL_ROLES = [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.SAMPLE_RECEIVER,
    ROLES.LAB_TECHNICIAN,
  ];

  // Menu items configuration with roles
  const allMenuItems: MenuItemWithRoles[] = [
    {
      key: "overview",
      icon: <PieChartOutlined />,
      label: menuLabel(t("menu.overview")),
      roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER, ROLES.LAB_TECHNICAL_MANAGER],
      children: [
        {
          key: "dashboard",
          icon: <DashboardOutlined />,
          label: menuLabel(t("menu.dashboard")),
          onClick: () => navigate(PATH_ROUTES.dashboard),
          roles: [
            ROLES.ADMIN,
            ROLES.QUALITY_MANAGER,
            ROLES.LAB_TECHNICAL_MANAGER,
          ],
        },
        {
          key: "reports",
          icon: <BarChartOutlined />,
          label: menuLabel(t("menu.reports")),
          onClick: () => navigate(PATH_ROUTES.reports),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "statistics",
          icon: <BarChartOutlined />,
          label: menuLabel(t("menu.statistics")),
          onClick: () => navigate(PATH_ROUTES.statistics),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
      ],
    },
    {
      key: "lab",
      icon: <ExperimentOutlined />,
      label: menuLabel(t("menu.labOperations")),
      roles: ALL_ROLES,
      children: [
        {
          key: "requests",
          icon: <FileTextOutlined />,
          label: menuLabel(t("menu.requests")),
          onClick: () => navigate(PATH_ROUTES.testRequests.index),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER, ROLES.SAMPLE_RECEIVER],
        },
        {
          key: "taskManagement",
          icon: <ScheduleOutlined />,
          label: menuLabel("Quản lý công việc"),
          onClick: () => navigate(PATH_ROUTES.tasks.index),
          roles: [
            ROLES.ADMIN,
            ROLES.QUALITY_MANAGER,
            ROLES.LAB_TECHNICAL_MANAGER,
            ROLES.LAB_TECHNICIAN,
            ROLES.SAMPLE_RECEIVER,
          ],
        },
        {
          key: "testManagement",
          icon: <ExperimentOutlined />,
          label: menuLabel("Quản lý xét nghiệm"),
          onClick: () => navigate(PATH_ROUTES.testing.index),
          roles: [
            ROLES.ADMIN,
            ROLES.QUALITY_MANAGER,
            ROLES.LAB_TECHNICAL_MANAGER,
            ROLES.LAB_TECHNICIAN,
          ],
        },
        {
          key: "qualityManagement",
          icon: <SafetyCertificateOutlined />,
          label: menuLabel("Quản lý chất lượng"),
          onClick: () => navigate(PATH_ROUTES.qualityManagement),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "specimens",
          icon: <ExperimentOutlined />,
          label: menuLabel(t("menu.specimens")),
          onClick: () => navigate(PATH_ROUTES.specimens.index),
          roles: [
            ROLES.ADMIN,
            ROLES.QUALITY_MANAGER,
            ROLES.LAB_TECHNICAL_MANAGER,
            ROLES.LAB_TECHNICIAN,
          ],
        },
        {
          key: "specimenHistories",
          icon: <HistoryOutlined />,
          label: menuLabel("Lịch sử lưu mẫu"),
          onClick: () => navigate(PATH_ROUTES.specimenHistories.index),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "ncr",
          icon: <WarningOutlined />,
          label: menuLabel("Báo cáo NCR"),
          onClick: () => navigate(PATH_ROUTES.ncr),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "reports",
          icon: <FileTextOutlined />,
          label: menuLabel(t("menu.reports")),
          onClick: () => navigate(PATH_ROUTES.reports),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
      ],
    },
    {
      key: "management",
      icon: <ToolOutlined />,
      label: menuLabel(t("menu.management")),
      roles: [ROLES.ADMIN],
      children: [
        {
          key: "subcontractors",
          icon: <TeamOutlined />,
          label: menuLabel(t("menu.subcontractors")),
          onClick: () => navigate(PATH_ROUTES.subcontractors),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "masterData",
          icon: <DatabaseOutlined />,
          label: menuLabel(t("menu.masterData")),
          onClick: () => navigate(PATH_ROUTES.masterData),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "organizations",
          icon: <TeamOutlined />,
          label: menuLabel("Cơ sở/Doanh nghiệp"),
          onClick: () => navigate(PATH_ROUTES.organizations),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "auditLog",
          icon: <AuditOutlined />,
          label: menuLabel(t("menu.auditLog")),
          onClick: () => navigate(PATH_ROUTES.auditLog),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
      ],
    },
    {
      key: "admin",
      icon: <SolutionOutlined />,
      label: menuLabel(t("menu.administration")),
      roles: ALL_ROLES,
      children: [
        {
          key: "employees",
          icon: <TeamOutlined />,
          label: menuLabel(t("menu.employees")),
          onClick: () => navigate(PATH_ROUTES.employees),
          roles: [ROLES.ADMIN],
        },
        {
          key: "settings",
          icon: <SettingOutlined />,
          label: menuLabel(t("menu.settings")),
          onClick: () => navigate(PATH_ROUTES.settings),
          roles: ALL_ROLES,
        },
      ],
    },
  ];

  // Filter menu items based on user roles
  const filterMenuByRoles = (items: MenuItemWithRoles[]): MenuItem[] => {
    const userRoles = userInfo?.roles || [];
    const result: MenuItem[] = [];

    for (const item of items) {
      // Check if user has any of the required roles
      if (!item.roles.some((role) => userRoles.includes(role))) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { roles, children, ...rest } = item;

      if (children && children.length > 0) {
        const filteredChildren = filterMenuByRoles(children);
        if (filteredChildren.length > 0) {
          result.push({ ...rest, children: filteredChildren });
        }
      } else {
        result.push(rest);
      }
    }

    return result;
  };

  // Build menu items based on user roles
  const menuItems: MenuItem[] = useMemo(() => {
    return filterMenuByRoles(allMenuItems);
  }, [userInfo, t, navigate]);

  // Toggle sidebar collapse (commented out for now)
  // const toggleCollapsed = () => {
  //   setCollapsed(!collapsed);
  // };

  // Sidebar content component
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <FlaskIcon />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">LSMS</span>
            <span className="sidebar-logo-subtitle">{t("common.subName")}</span>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="sidebar-menu-wrapper">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={collapsed ? [] : defaultOpenKeys}
          items={menuItems}
          inlineCollapsed={collapsed}
        />
      </div>
    </>
  );

  return (
    <div className="main-layout">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={`main-sidebar ${collapsed ? "collapsed" : ""}`}>
          {sidebarContent}
          {/* Collapse Toggle Button */}
          {/* <button
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? "»" : "«"}
          </button> */}
        </aside>
      )}

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width={260}
        className="mobile-menu-drawer"
        styles={{
          body: { padding: 0, background: "#FFFFFF" },
          header: { display: "none" },
        }}
        closeIcon={<CloseOutlined style={{ color: "#096DD9" }} />}
      >
        <div className="mobile-sidebar">{sidebarContent}</div>
      </Drawer>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            {/* Mobile menu button */}
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 20 }} />}
                onClick={() => setMobileMenuOpen(true)}
                className="mobile-menu-btn"
              />
            )}
            <div className="header-title-wrapper">
              <h1 className="header-title">{t("common.appName")}</h1>
              <span className="header-subtitle">
                Tổng hợp số liệu hoạt động của phòng Lab
              </span>
            </div>
          </div>

          <div className="header-right">
            <NotificationBell />
            <Dropdown
              menu={{
                items: [
                  {
                    key: "user-info",
                    label: (
                      <div className="user-dropdown-header">
                        <div className="user-dropdown-name">
                          {getUserDisplayName()}
                        </div>
                        <div className="user-dropdown-email">
                          {userInfo?.email}
                        </div>
                        {getUserRole() && (
                          <div className="user-dropdown-role">
                            {getUserRole()}
                          </div>
                        )}
                      </div>
                    ),
                    disabled: true,
                  },
                  { type: "divider" },
                  {
                    key: "change-password",
                    icon: <KeyOutlined />,
                    label: "Đổi mật khẩu",
                    onClick: () => setChangePasswordVisible(true),
                  },
                  {
                    key: "settings",
                    icon: <SettingOutlined />,
                    label: "Cài đặt",
                    onClick: () => navigate(PATH_ROUTES.settings),
                  },
                  { type: "divider" },
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: "Đăng xuất",
                    danger: true,
                    onClick: handleLogout,
                  },
                ],
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="user-dropdown-trigger">
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  className="user-avatar"
                >
                  {getAvatarLetter()}
                </Avatar>
                <div className="user-info-text">
                  <span className="user-name">{getUserDisplayName()}</span>
                  {getUserRole() && (
                    <span className="user-role">{getUserRole()}</span>
                  )}
                </div>
                <DownOutlined className="dropdown-arrow" />
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>

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
          centered
          className="change-password-modal"
        >
          <Form
            form={changePasswordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
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
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
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
            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
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

        {/* Work Reminder Modal for SampleReceiver */}
        <WorkReminderModal
          open={workReminderOpen}
          tasks={workReminderTasks}
          onClose={closeWorkReminder}
        />

        {/* Work Reminder Modal for Lab Technical Manager */}
        <LabTechManagerReminderModal
          open={labTechReminderOpen}
          tasks={labTechReminderTasks}
          onClose={closeLabTechReminder}
        />

        {/* Work Reminder Modal for Lab Technician (KTV) */}
        <LabTechnicianReminderModal
          open={labTechnicianReminderOpen}
          tasks={labTechnicianReminderTasks}
          onClose={closeLabTechnicianReminder}
        />

        {/* Work Reminder Modal for Quality Manager (QLCL) */}
        <QualityManagerReminderModal
          open={qualityManagerReminderOpen}
          tasks={qualityManagerReminderTasks}
          onClose={closeQualityManagerReminder}
        />
      </div>
    </div>
  );
};

export default MainLayout;
