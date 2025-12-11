import React, { useState } from 'react';
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
  UserOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate } from 'react-router-dom';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('menu.dashboard'),
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'requests',
      icon: <FileTextOutlined />,
      label: t('menu.requests'),
      onClick: () => navigate('/requests'),
    },
    {
      key: 'specimens',
      icon: <ExperimentOutlined />,
      label: t('menu.specimens'),
      onClick: () => navigate('/specimens'),
    },
    {
      key: 'tests',
      icon: <CheckCircleOutlined />,
      label: t('menu.tests'),
      onClick: () => navigate('/tests'),
    },
    {
      key: 'specimenHistories',
      icon: <HistoryOutlined />,
      label: t('menu.specimenHistories'),
      onClick: () => navigate('/specimen-histories'),
    },
    {
      key: 'results',
      icon: <FileSearchOutlined />,
      label: t('menu.results'),
      onClick: () => navigate('/test-results'),
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: t('menu.reports'),
      onClick: () => navigate('/reports'),
    },
    {
      key: 'ncr',
      icon: <WarningOutlined />,
      label: t('menu.ncr'),
      onClick: () => navigate('/ncr'),
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: t('menu.statistics'),
      onClick: () => navigate('/statistics'),
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('menu.settings'),
      onClick: () => navigate('/settings'),
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: t('menu.users'),
      onClick: () => navigate('/users'),
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
          defaultSelectedKeys={['dashboard']}
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
