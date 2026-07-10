import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import Icon, {
  SettingOutlined,
  TeamOutlined,
  DatabaseOutlined,
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  MenuOutlined,
  CloseOutlined,
} from "../common/Icon";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { authService, UserInfo } from "../../services/authService";
import { signalRService } from "../../services/signalRService";
import { NotificationBell } from "../Notification";
import { OfflineIndicator } from "../common";
import WorkReminderModal, {
  LabTechManagerReminderModal,
  LabTechnicianReminderModal,
  QualityManagerReminderModal,
} from "../WorkReminderModal";
import { useWorkReminderPopup } from "../../hooks/useWorkReminderPopup";
import { useLabTechManagerReminderPopup } from "../../hooks/useLabTechManagerReminderPopup";
import { useLabTechnicianReminderPopup } from "../../hooks/useLabTechnicianReminderPopup";
import { useQualityManagerReminderPopup } from "../../hooks/useQualityManagerReminderPopup";
import {
  useSupporterStatus,
  clearSupporterCache,
} from "../../hooks/useSupporterStatus";
import "./MainLayout.css";
import {
  PATH_ROUTES,
  ROLES,
  getRoleDisplayName,
  STORAGE_KEYS,
} from "../../constants";
import { MENU_PERMISSION_MAP } from "../../constants/permissionMapping";
import { Helmet } from "react-helmet-async";
import { usePageTitle } from "../../hooks/usePageTitle";
import { HeaderHeightContext } from "../../hooks/useHeaderHeight";

type MenuItem = Required<MenuProps>["items"][number];

// Extended menu item type with roles and permissions
interface MenuItemWithRoles {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
  roles: string[];
  permissions?: string[]; // NEW: Optional permission-based access
  children?: MenuItemWithRoles[];
  supporterAllowed?: boolean; // If true, supporters can also access this menu item
}

// Map routes to menu keys
const routeToKeyMap: Record<string, string> = {
  "/dashboard": "dashboard",
  "/quotations": "quotations",
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
  "/receipts": "receipts",
  "/statistics": "statistics",
  "/lab-report": "lab-report",
  "/subcontractors": "subcontractors",
  "/goods-receipts": "goodsReceipts",
  "/stock-adjustments": "stockAdjustments",
  "/warehouse-imports": "warehouseImports",
  "/equipments": "equipments",
  "/products": "products",
  "/suppliers-management": "suppliersManagement",
  "/master-data": "masterData",
  "/organizations": "organizations",
  "/audit-log": "auditLog",
  "/settings": "settings",
  "/employees": "employees",
  "/role-management": "roleManagement",
  "/approval-process": "approvalProcess",
};

const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic page title
  const pageTitle = usePageTitle();

  // Nav horizontal scroll
  const navRef = useRef<HTMLDivElement>(null);
  const [navCanScrollLeft, setNavCanScrollLeft] = useState(false);
  const [navCanScrollRight, setNavCanScrollRight] = useState(false);
  const [navOverflows, setNavOverflows] = useState(false);

  const updateNavScrollState = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setNavCanScrollLeft(el.scrollLeft > 0);
    setNavCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    setNavOverflows(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    updateNavScrollState();
    const observer = new ResizeObserver(updateNavScrollState);
    observer.observe(nav);
    nav.addEventListener("scroll", updateNavScrollState);
    return () => {
      observer.disconnect();
      nav.removeEventListener("scroll", updateNavScrollState);
    };
  }, [updateNavScrollState]);

  const scrollNav = useCallback((direction: "left" | "right") => {
    const el = navRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
  }, []);

  // Header height measurement for scroll background
  const headerRef = useRef<HTMLElement>(null);
  const [headerBgHeight, setHeaderBgHeight] = useState(88);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      const top = parseFloat(getComputedStyle(el).top) || 0;
      setHeaderBgHeight(Math.ceil(top + el.offsetHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  // Check if current user is a supporter for any incomplete task
  const { isSupporter } = useSupporterStatus();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Detect scroll to add shadow to header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        clearSupporterCache(); // Clear supporter cache on logout
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
      (a, b) => b.length - a.length,
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
  const defaultOpenKeys = ["overview", "lab", "stock", "quality", "management", "admin"];

  // Helper to create label with tooltip
  const menuLabel = (text: string) => <span title={text}>{text}</span>;

  // All roles shorthand
  const ALL_ROLES = [
    ROLES.ADMIN,
    ROLES.QUALITY_MANAGER,
    ROLES.LAB_TECHNICAL_MANAGER,
    ROLES.SAMPLE_RECEIVER,
    ROLES.LAB_TECHNICIAN,
    ROLES.ACCOUNTANT,
  ];

  // Menu items configuration with roles
  const allMenuItems: MenuItemWithRoles[] = [
    {
      key: "overview",
      icon: <Icon name="layout-wtf" />,
      label: menuLabel(t("menu.overview")),
      roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER, ROLES.LAB_TECHNICAL_MANAGER],
      children: [
        {
          key: "dashboard",
          icon: <Icon name="layout-wtf" />,
          label: menuLabel(t("menu.dashboard")),
          onClick: () => navigate(PATH_ROUTES.dashboard),
          roles: [
            ROLES.ADMIN,
            ROLES.QUALITY_MANAGER,
            ROLES.LAB_TECHNICAL_MANAGER,
          ],
        },
        {
          key: "statistics",
          icon: <Icon name="bar-chart-line" />,
          label: menuLabel(t("menu.statistics")),
          onClick: () => navigate(PATH_ROUTES.statistics),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "lab-report",
          icon: <Icon name="clipboard-data" />,
          label: menuLabel("Báo cáo phòng Lab"),
          onClick: () => navigate(PATH_ROUTES.labReport),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER, ROLES.LAB_TECHNICAL_MANAGER],
        },
      ],
    },
    {
      key: "lab",
      icon: <Icon name="flask-florence" />,
      label: menuLabel(t("menu.labOperations")),
      roles: [...ALL_ROLES, ROLES.ACCOUNTANT],
      children: [
        {
          key: "quotations",
          icon: <Icon name="currency-dollar" />,
          label: menuLabel("Báo giá"),
          onClick: () => navigate(PATH_ROUTES.quotations.index),
          roles: [...ALL_ROLES, ROLES.ACCOUNTANT],
        },
        {
          key: "receipts",
          icon: <Icon name="journal-text" />,
          label: menuLabel("Quản lý phiếu thu"),
          onClick: () => navigate(PATH_ROUTES.receipts.index),
          roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
        },
        {
          key: "requests",
          icon: <Icon name="file-earmark-text" />,
          label: menuLabel(t("menu.requests")),
          onClick: () => navigate(PATH_ROUTES.testRequests.index),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER, ROLES.SAMPLE_RECEIVER],
        },
        {
          key: "taskManagement",
          icon: <Icon name="check2-square" />,
          label: menuLabel("Quản lý công việc"),
          onClick: () => navigate(PATH_ROUTES.tasks.index),
          roles: [ROLES.ADMIN, ROLES.LAB_TECHNICAL_MANAGER],
          supporterAllowed: true, // Người hỗ trợ có quyền truy cập
        },
        {
          key: "testManagement",
          icon: <Icon name="flask-florence" />,
          label: menuLabel("Quản lý thử nghiệm"),
          onClick: () => navigate(PATH_ROUTES.testing.index),
          roles: [
            ROLES.ADMIN,
            ROLES.LAB_TECHNICAL_MANAGER,
            ROLES.LAB_TECHNICIAN,
          ],
          supporterAllowed: true, // Người hỗ trợ có quyền truy cập
        },
        {
          key: "qualityManagement",
          icon: <Icon name="shield-check" />,
          label: menuLabel("Quản lý chất lượng"),
          onClick: () => navigate(PATH_ROUTES.qualityManagement.index),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "specimens",
          icon: <Icon name="droplet-half" />,
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
          icon: <Icon name="clock" />,
          label: menuLabel("Lịch sử lưu mẫu"),
          onClick: () => navigate(PATH_ROUTES.specimenHistories.index),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "ncr",
          icon: <Icon name="exclamation-diamond" />,
          label: menuLabel("Báo cáo NCR"),
          onClick: () => navigate(PATH_ROUTES.ncr),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
      ],
    },
    {
      key: "stock",
      icon: <Icon name="box-seam" />,
      label: menuLabel("Quản lý kho"),
      roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
      children: [
        {
          key: "products",
          icon: <Icon name="box-seam" />,
          label: menuLabel("Quản lý vật tư"),
          onClick: () => navigate(PATH_ROUTES.products),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "equipments",
          icon: <Icon name="tools" />,
          label: menuLabel("Quản lý thiết bị"),
          onClick: () => navigate(PATH_ROUTES.equipments),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "suppliersManagement",
          icon: <Icon name="shop" />,
          label: menuLabel("Quản lý nhà cung cấp"),
          onClick: () => navigate(PATH_ROUTES.suppliersManagement),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "goodsReceipts",
          icon: <Icon name="clipboard-check" />,
          label: menuLabel("Dự trù và đặt hàng"),
          onClick: () => navigate(PATH_ROUTES.goodsReceipts.index),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "stockAdjustments",
          icon: <Icon name="sliders" />,
          label: menuLabel("Điều chỉnh tồn kho"),
          onClick: () => navigate(PATH_ROUTES.stockAdjustments),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "materialReceipts",
          icon: <Icon name="receipt" />,
          label: menuLabel("Phiếu nhận vật tư"),
          onClick: () => navigate(PATH_ROUTES.goodsReceipts.index),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
        {
          key: "warehouseImports",
          icon: <Icon name="box-arrow-in-down" />,
          label: menuLabel("Quản lý nhập kho"),
          onClick: () => navigate(PATH_ROUTES.warehouseImports.index),
          roles: [ROLES.ADMIN, ROLES.QUALITY_MANAGER],
        },
      ],
    },
    {
      key: "management",
      icon: <Icon name="ui-checks-grid" />,
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
          icon: <Icon name="building" />,
          label: menuLabel("Cơ sở/Doanh nghiệp"),
          onClick: () => navigate(PATH_ROUTES.organizations.index),
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
      icon: <Icon name="database" />,
      label: menuLabel(t("menu.administration")),
      roles: ALL_ROLES,
      children: [
        {
          key: "employees",
          icon: <TeamOutlined />,
          label: menuLabel(t("menu.employees")),
          onClick: () => navigate(PATH_ROUTES.employees.index),
          roles: [ROLES.ADMIN],
        },
        {
          key: "roleManagement",
          icon: <Icon name="shield-check" />,
          label: menuLabel("Quản lý phân quyền"),
          onClick: () => navigate(PATH_ROUTES.roleManagement.index),
          roles: [ROLES.ADMIN],
        },
        {
          key: "approvalProcess",
          icon: <AuditOutlined />,
          label: menuLabel("Quy trình phê duyệt"),
          onClick: () => navigate(PATH_ROUTES.approvalProcess),
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

  // Filter menu items based on user roles, permissions and supporter status
  const filterMenuByRoles = (items: MenuItemWithRoles[]): MenuItem[] => {
    const userRoles = userInfo?.roles || [];
    const result: MenuItem[] = [];

    for (const item of items) {
      // Check role-based access (legacy)
      const hasRoleAccess = item.roles.some((role) => userRoles.includes(role));

      // Check permission-based access (new)
      // Get permissions from item or from MENU_PERMISSION_MAP
      const menuPermissions =
        MENU_PERMISSION_MAP[item.key as keyof typeof MENU_PERMISSION_MAP];
      const itemPermissions =
        item.permissions ||
        (menuPermissions ? [...menuPermissions] : undefined);
      const hasPermissionAccess = itemPermissions
        ? authService.hasAnyPermission(itemPermissions)
        : false;

      // Check supporter access
      const hasSupporterAccess = item.supporterAllowed && isSupporter;

      // User needs either role access, permission access, or supporter access
      if (!hasRoleAccess && !hasPermissionAccess && !hasSupporterAccess) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { roles, children, supporterAllowed, permissions, ...rest } = item;

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

  // Build menu items based on user roles and supporter status
  const menuItems: MenuItem[] = useMemo(() => {
    return filterMenuByRoles(allMenuItems);
  }, [userInfo, t, navigate, isSupporter]);

  // Build header menu groups with filtered children
  const headerMenuGroups = useMemo(() => {
    const userRoles = userInfo?.roles || [];

    return allMenuItems
      .map((group) => {
        // Filter children based on user roles and permissions
        const filteredChildren = (group.children || []).filter((child) => {
          // Check role-based access
          const hasRoleAccess = child.roles.some((role) =>
            userRoles.includes(role),
          );
          // Check supporter access
          const hasSupporterAccess = child.supporterAllowed && isSupporter;
          // Check permission-based access
          const childPermissions =
            MENU_PERMISSION_MAP[child.key as keyof typeof MENU_PERMISSION_MAP];
          const hasPermissionAccess = childPermissions
            ? authService.hasAnyPermission([...childPermissions])
            : false;

          return hasRoleAccess || hasSupporterAccess || hasPermissionAccess;
        });

        // Group is accessible if it has at least one accessible child
        if (filteredChildren.length === 0) return null;

        return {
          ...group,
          children: filteredChildren,
        };
      })
      .filter(Boolean) as MenuItemWithRoles[];
  }, [userInfo, isSupporter]);

  // Check if a group has selected child
  const isGroupActive = (group: MenuItemWithRoles) => {
    return group.children?.some((child) => child.key === selectedKey) || false;
  };

  // Mobile sidebar content component
  const mobileSidebarContent = (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Icon name="flask-florence" />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">StarLab</span>
          <span className="sidebar-logo-subtitle">{t("common.subName")}</span>
        </div>
      </div>

      {/* Menu */}
      <div className="sidebar-menu-wrapper">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={defaultOpenKeys}
          items={menuItems}
        />
      </div>
    </>
  );

  return (
    <div className="main-layout">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
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
        <div className="mobile-sidebar">{mobileSidebarContent}</div>
      </Drawer>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Header background strip - full width white when scrolled */}
        {isScrolled && <div className="header-scroll-bg" style={{ height: headerBgHeight }} />}

        {/* Header */}
        <header ref={headerRef} className={`main-header ${isScrolled ? "scrolled" : ""}`}>
          <div className="header-left">
            {/* Mobile menu button - visible only on mobile via CSS */}
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20 }} />}
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-menu-btn"
            />
            {/* Logo */}
            <div className="header-logo">
              <div className="header-logo-icon">
                <Icon name="flask-florence" />
              </div>
              <div className="header-logo-text">
                <span className="header-logo-title">StarLab</span>
                <span className="header-logo-subtitle">
                  {t("common.subName")}
                </span>
              </div>
            </div>
          </div>

          {/* Header Navigation Menu - Desktop only */}
          <div className="header-nav-wrapper">
            {navCanScrollLeft && (
              <button
                className="header-nav-scroll-btn"
                onClick={() => scrollNav("left")}
              >
                <LeftOutlined />
              </button>
            )}
            <nav className={`header-nav ${navOverflows ? "nav-overflows" : ""}`} ref={navRef}>
              {headerMenuGroups.map((group) => (
                <Dropdown
                  key={group.key}
                  open={openMenuKey === group.key}
                  onOpenChange={(open) => {
                    if (!open) setOpenMenuKey(null);
                  }}
                  dropdownRender={() => (
                    <div
                      className="header-menu-dropdown"
                      onMouseLeave={() => setOpenMenuKey(null)}
                    >
                      {group.children?.map((item) => (
                        <div
                          key={item.key}
                          className={`menu-dropdown-item ${
                            selectedKey === item.key ? "selected" : ""
                          }`}
                          onClick={() => {
                            item.onClick?.();
                            setOpenMenuKey(null);
                          }}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                >
                  <div
                    className={`header-nav-item ${
                      isGroupActive(group) ? "active" : ""
                    }`}
                    onMouseEnter={() => setOpenMenuKey(group.key)}
                  >
                    {group.icon}
                    <span>{group.label}</span>
                    <DownOutlined className="nav-arrow" />
                  </div>
                </Dropdown>
              ))}
            </nav>
            {navCanScrollRight && (
              <button
                className="header-nav-scroll-btn"
                onClick={() => scrollNav("right")}
              >
                <RightOutlined />
              </button>
            )}
          </div>

          <div className="header-right">
            <OfflineIndicator />
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
          <HeaderHeightContext.Provider value={headerBgHeight}>
            <Outlet />
          </HeaderHeightContext.Provider>
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
                      new Error("Mật khẩu xác nhận không khớp"),
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
