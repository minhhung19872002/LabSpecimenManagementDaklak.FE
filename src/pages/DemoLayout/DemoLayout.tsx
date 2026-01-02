import React from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Table,
  Typography,
} from "antd";
import {
  FileTextOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  PieChartOutlined,
  BarChartOutlined,
  BoxPlotOutlined,
  DownOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import "./DemoLayout.css";

const { Title, Text } = Typography;

// Flask icon SVG
const FlaskIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3V8.5L3.5 17.5C2.5 19 3.5 21 5.5 21H18.5C20.5 21 21.5 19 20.5 17.5L15 8.5V3M9 3H15M9 3H8M15 3H16M7 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Menu items data
const menuItems = [
  { key: "requests", icon: <FileTextOutlined />, label: "Phiếu yêu Cầu" },
  { key: "tasks", icon: <AppstoreOutlined />, label: "Quản lý công việc" },
  { key: "testing", icon: <ExperimentOutlined />, label: "Quản lý xét nghiệm", hasSubmenu: true },
  { key: "quality", icon: <SafetyCertificateOutlined />, label: "Quản lý chất lượng", hasSubmenu: true },
  { key: "dashboard", icon: <PieChartOutlined />, label: "Tổng quan", active: true },
  { key: "reports", icon: <BarChartOutlined />, label: "Báo cáo", hasSubmenu: true },
  { key: "statistics", icon: <BarChartOutlined />, label: "Thống kê", hasSubmenu: true },
  { key: "lab", icon: <BoxPlotOutlined />, label: "Hoạt động phòng lab", hasSubmenu: true },
];

// Stats data
const statsData = [
  {
    title: "Tổng số hợp đồng",
    value: 150,
    prefix: null,
    suffix: null,
    change: "12% so với tháng trước",
    changeType: "up",
    iconBg: "#E6F7FF",
    iconColor: "#096DD9",
    icon: <FileTextOutlined style={{ fontSize: 24 }} />,
  },
  {
    title: "Tổng số mẫu",
    value: "1,500",
    prefix: null,
    suffix: null,
    change: "Đạt 85% chỉ tiêu",
    changeType: "up",
    iconBg: "#F9F0FF",
    iconColor: "#531DAB",
    icon: <ExperimentOutlined style={{ fontSize: 24 }} />,
  },
  {
    title: "Tổng doanh thu",
    value: "4.5",
    prefix: null,
    suffix: " tỷ",
    change: "+8% so với cùng kỳ",
    changeType: "up",
    iconBg: "#FFFBE6",
    iconColor: "#D46B08",
    icon: <span style={{ fontSize: 24 }}>$</span>,
  },
  {
    title: "Báo cáo NCT",
    value: 3,
    prefix: null,
    suffix: null,
    change: "Cần xử lý gấp",
    changeType: "warning",
    iconBg: "#FFF1F0",
    iconColor: "#CF1322",
    icon: <ExclamationCircleOutlined style={{ fontSize: 24 }} />,
  },
];

// Secondary stats
const secondaryStats = [
  {
    title: "TN Đúng hạn",
    value: "98%",
    icon: <CheckCircleOutlined />,
    iconBg: "#F6FFED",
    iconColor: "#389E0D",
  },
  {
    title: "TN Trễ hạn",
    value: "2%",
    icon: <ClockCircleOutlined />,
    iconBg: "#FFF7E6",
    iconColor: "#D46B08",
  },
  {
    title: "Chờ phê duyệt",
    value: 12,
    icon: <EditOutlined />,
    iconBg: "#E6F7FF",
    iconColor: "#096DD9",
  },
  {
    title: "Đang thực hiện",
    value: 45,
    icon: <SyncOutlined />,
    iconBg: "#F9F0FF",
    iconColor: "#531DAB",
  },
];

// Pending items
const pendingItems = [
  { code: "HD3112001", org: "Sở Tài nguyên và Môi trường", action: "Kết quả" },
  { code: "HD3112001", org: "Sở Tài nguyên và Môi trường", action: "Chi tiết" },
  { code: "HD3112001", org: "Sở Tài nguyên và Môi trường", action: "Chi tiết" },
];

// Recent requests table data
const recentRequests = [
  { key: 1, soHD: "HD3112002", tenCS: "Viện Nghiên cứu Khoa học Tây Nguyên", ngayGui: "31/12/2025", mau: 1, chiTieu: 2, tongTien: "285.000 đ" },
  { key: 2, soHD: "HD3112002", tenCS: "Viện Nghiên cứu Khoa học Tây Nguyên", ngayGui: "31/12/2025", mau: 1, chiTieu: 2, tongTien: "285.000 đ" },
  { key: 3, soHD: "HD3112002", tenCS: "Viện Nghiên cứu Khoa học Tây Nguyên", ngayGui: "31/12/2025", mau: 1, chiTieu: 2, tongTien: "285.000 đ" },
  { key: 4, soHD: "HD3112002", tenCS: "Viện Nghiên cứu Khoa học Tây Nguyên", ngayGui: "31/12/2025", mau: 1, chiTieu: 2, tongTien: "285.000 đ" },
  { key: 5, soHD: "HD3112002", tenCS: "Viện Nghiên cứu Khoa học Tây Nguyên", ngayGui: "31/12/2025", mau: 1, chiTieu: 2, tongTien: "285.000 đ" },
];

const columns = [
  { title: "Số HĐ", dataIndex: "soHD", key: "soHD" },
  { title: "Tên CS/DN", dataIndex: "tenCS", key: "tenCS" },
  { title: "Ngày gửi YC", dataIndex: "ngayGui", key: "ngayGui" },
  { title: "Mẫu", dataIndex: "mau", key: "mau", align: "center" as const },
  { title: "Chỉ tiêu", dataIndex: "chiTieu", key: "chiTieu", align: "center" as const },
  { title: "Tổng tiền", dataIndex: "tongTien", key: "tongTien", align: "right" as const },
];

const DemoLayout: React.FC = () => {
  return (
    <div className="demo-layout">
      {/* Sidebar */}
      <aside className="demo-sidebar">
        {/* Logo */}
        <div className="demo-logo">
          <div className="demo-logo-icon">
            <FlaskIcon />
          </div>
          <div className="demo-logo-text">
            <span className="demo-logo-title">LSMS</span>
            <span className="demo-logo-subtitle">Hệ thống Quản Lý Phòng Lab</span>
          </div>
        </div>

        {/* Menu */}
        <nav className="demo-menu">
          {menuItems.map((item) => (
            <div
              key={item.key}
              className={`demo-menu-item ${item.active ? "active" : ""}`}
            >
              <span className="demo-menu-icon">{item.icon}</span>
              <span className="demo-menu-label">{item.label}</span>
              {item.hasSubmenu && (
                <DownOutlined className="demo-menu-arrow" />
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="demo-main">
        {/* Header */}
        <header className="demo-header">
          <div className="demo-header-left">
            <Title level={3} className="demo-header-title">
              Hệ Thống Quản Lý Mẫu Thử Nghiệm
            </Title>
            <Text type="secondary" className="demo-header-subtitle">
              Tổng hợp số liệu hoạt động của phòng Lab
            </Text>
          </div>
          <div className="demo-header-right">
            <Badge count={1} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 20 }} />}
                className="demo-notification-btn"
              />
            </Badge>
            <div className="demo-user-dropdown">
              <Avatar src="/avatar.jpg" size={32} />
              <div className="demo-user-info">
                <span className="demo-user-name">Admin User</span>
                <span className="demo-user-role">Supper Admin</span>
              </div>
              <DownOutlined style={{ fontSize: 12 }} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="demo-content">
          {/* Filter Bar */}
          <div className="demo-filter-bar">
            <Title level={4} style={{ margin: 0 }}>Báo cáo Tổng quan</Title>
            <div className="demo-filter-controls">
              <div className="demo-tab-buttons">
                <Button type="primary" className="demo-tab-active">Tháng</Button>
                <Button type="text">Quý</Button>
                <Button type="text">Nửa năm</Button>
                <Button type="text">Năm</Button>
              </div>
              <DatePicker placeholder="01/01/2026" style={{ width: 150 }} />
            </div>
          </div>

          {/* Stats Cards Row 1 */}
          <Row gutter={16} className="demo-stats-row">
            {statsData.map((stat, index) => (
              <Col span={6} key={index}>
                <Card className="demo-stat-card">
                  <div className="demo-stat-content">
                    <div className="demo-stat-info">
                      <Text type="secondary" className="demo-stat-title">{stat.title}</Text>
                      <div className="demo-stat-value">
                        {stat.prefix}{stat.value}{stat.suffix}
                      </div>
                      <div className={`demo-stat-change ${stat.changeType}`}>
                        {stat.changeType === "up" && <ArrowUpOutlined />}
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div
                      className="demo-stat-icon"
                      style={{ background: stat.iconBg, color: stat.iconColor }}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Stats Cards Row 2 */}
          <Row gutter={16} className="demo-stats-row">
            {secondaryStats.map((stat, index) => (
              <Col span={6} key={index}>
                <Card className="demo-stat-card demo-stat-card-simple">
                  <div className="demo-stat-content">
                    <div className="demo-stat-info">
                      <Text type="secondary" className="demo-stat-title">{stat.title}</Text>
                      <div className="demo-stat-value">{stat.value}</div>
                    </div>
                    <div
                      className="demo-stat-icon"
                      style={{ background: stat.iconBg, color: stat.iconColor }}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Two Column Section */}
          <Row gutter={16} className="demo-two-col">
            {/* Pending Approval */}
            <Col span={8}>
              <Card
                className="demo-card"
                title={
                  <Space>
                    <span>Chờ phê duyệt</span>
                    <Badge count={1} style={{ backgroundColor: '#CF1322' }} />
                  </Space>
                }
                extra={<a href="#">Xem tất cả &gt;</a>}
              >
                {pendingItems.map((item, index) => (
                  <div key={index} className="demo-pending-item">
                    <div className="demo-pending-info">
                      <Text strong style={{ color: '#096DD9' }}>{item.code}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.org}</Text>
                    </div>
                    <Button size="small">{item.action}</Button>
                  </div>
                ))}
              </Card>
            </Col>

            {/* Recent Requests */}
            <Col span={16}>
              <Card
                className="demo-card"
                title="Yêu cầu gần đây"
                extra={<a href="#" style={{ color: '#096DD9' }}>Xem tất cả &gt;</a>}
              >
                <Table
                  dataSource={recentRequests}
                  columns={columns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </div>
      </main>
    </div>
  );
};

export default DemoLayout;
