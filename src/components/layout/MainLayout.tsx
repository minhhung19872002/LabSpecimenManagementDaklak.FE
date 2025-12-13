import React, { useState, useMemo } from 'react';
import { Layout, Menu, MenuProps } from 'antd';
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
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine selected key based on current path
  const selectedKey = useMemo(() => {
    const pathname = location.pathname;

    // Check exact match first
    if (routeToKeyMap[pathname]) {
      return routeToKeyMap[pathname];
    }

    // Check prefix match for nested routes (e.g., /test-request/123)
    for (const route of Object.keys(routeToKeyMap)) {
      if (pathname.startsWith(route)) {
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
              <span>{t('common.welcome')}, Admin</span>
            </div>
          </div>
        </Header>
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
