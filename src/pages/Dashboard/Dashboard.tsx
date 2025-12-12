import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, List, Avatar, Timeline } from 'antd';
import {
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RiseOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// Mock data for dashboard
const mockStats = {
  totalRequests: 156,
  totalSpecimens: 423,
  totalTests: 892,
  ncrCount: 7,
  pendingRequests: 23,
  inProgressTests: 45,
  completedToday: 12,
  avgTAT: 3.2,
};

// Mock data - Viện Vệ sinh Dịch tễ Tây Nguyên
const recentRequests = [
  { id: 1, requestNumber: 'REQ-20251212-0001', customerName: 'BV Đa khoa tỉnh Đắk Lắk', status: 'Pending', date: '2025-12-12' },
  { id: 2, requestNumber: 'REQ-20251212-0002', customerName: 'TTYT TP. Buôn Ma Thuột', status: 'InProgress', date: '2025-12-12' },
  { id: 3, requestNumber: 'REQ-20251211-0015', customerName: 'CDC Đắk Nông', status: 'Completed', date: '2025-12-11' },
  { id: 4, requestNumber: 'REQ-20251211-0014', customerName: 'BV Đa khoa Vùng Tây Nguyên', status: 'InProgress', date: '2025-12-11' },
  { id: 5, requestNumber: 'REQ-20251210-0010', customerName: 'CDC Gia Lai', status: 'Completed', date: '2025-12-10' },
];

const pendingApprovals = [
  { id: 1, testCode: 'TEST-20251212-0003', parameter: 'PCR SARS-CoV-2', status: 'PendingReview' },
  { id: 2, testCode: 'TEST-20251212-0005', parameter: 'ELISA Dengue NS1', status: 'PendingApproval' },
  { id: 3, testCode: 'TEST-20251211-0012', parameter: 'Nuôi cấy vi khuẩn', status: 'PendingReview' },
];

const recentActivities = [
  { time: '10:30', action: 'Nhập kết quả PCR', user: 'ThS. Nguyễn Văn A', detail: 'TEST-20251212-0003' },
  { time: '10:15', action: 'Tiếp nhận mẫu huyết thanh', user: 'CN. Trần Thị B', detail: 'SPE-20251212-0005' },
  { time: '09:45', action: 'Phê duyệt kết quả HIV', user: 'PGS.TS. Lê Văn C', detail: 'TEST-20251211-0010' },
  { time: '09:30', action: 'Tạo yêu cầu XN Sốt rét', user: 'KTV. Phạm Thị D', detail: 'REQ-20251212-0002' },
  { time: '09:00', action: 'Hoàn thành XN Cúm A/B', user: 'ThS. Nguyễn Văn A', detail: 'TEST-20251211-0008' },
];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Pending: 'gold',
    InProgress: 'blue',
    Completed: 'green',
    Cancelled: 'red',
    PendingReview: 'orange',
    PendingApproval: 'purple',
  };
  return colors[status] || 'default';
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  const requestColumns = [
    { title: 'Mã yêu cầu', dataIndex: 'requestNumber', key: 'requestNumber' },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    { title: 'Ngày', dataIndex: 'date', key: 'date' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>{t('menu.dashboard')}</h2>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t('statistics.totalRequests')}
              value={mockStats.totalRequests}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>+12 tháng này</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t('statistics.totalSpecimens')}
              value={mockStats.totalSpecimens}
              prefix={<ExperimentOutlined style={{ color: '#722ed1' }} />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>+28 tháng này</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={t('statistics.totalTests')}
              value={mockStats.totalTests}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>+65 tháng này</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Báo cáo NCR"
              value={mockStats.ncrCount}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Stats */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Chờ xử lý"
              value={mockStats.pendingRequests}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Đang thử nghiệm"
              value={mockStats.inProgressTests}
              prefix={<SyncOutlined spin style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Hoàn thành hôm nay"
              value={mockStats.completedToday}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="TAT trung bình (ngày)"
              value={mockStats.avgTAT}
              prefix={<RiseOutlined style={{ color: '#13c2c2' }} />}
              precision={1}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Recent Requests */}
        <Col xs={24} lg={14}>
          <Card title="Yêu cầu gần đây" extra={<a href="/requests">Xem tất cả</a>}>
            <Table
              dataSource={recentRequests}
              columns={requestColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Pending Approvals */}
        <Col xs={24} lg={10}>
          <Card title="Chờ phê duyệt" extra={<Tag color="orange">{pendingApprovals.length}</Tag>}>
            <List
              itemLayout="horizontal"
              dataSource={pendingApprovals}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ExperimentOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={<a href={`/test/${item.id}`}>{item.testCode}</a>}
                    description={item.parameter}
                  />
                  <Tag color={getStatusColor(item.status)}>
                    {item.status === 'PendingReview' ? 'Chờ duyệt B1' : 'Chờ duyệt B2'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Bottom Row */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Progress Overview */}
        <Col xs={24} lg={12}>
          <Card title="Tiến độ công việc">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Yêu cầu hoàn thành</span>
                <span>85%</span>
              </div>
              <Progress percent={85} status="active" strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Thử nghiệm đúng hạn</span>
                <span>92%</span>
              </div>
              <Progress percent={92} status="active" strokeColor="#1890ff" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Kết quả đã phê duyệt</span>
                <span>78%</span>
              </div>
              <Progress percent={78} status="active" strokeColor="#722ed1" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Tỷ lệ NCR</span>
                <span>2%</span>
              </div>
              <Progress percent={2} status="exception" strokeColor="#cf1322" />
            </div>
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card title="Hoạt động gần đây">
            <Timeline
              items={recentActivities.map((activity) => ({
                color: 'blue',
                children: (
                  <div>
                    <span style={{ fontWeight: 500 }}>{activity.time}</span> - {activity.action}
                    <br />
                    <span style={{ color: '#666' }}>
                      <UserOutlined /> {activity.user} | {activity.detail}
                    </span>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
