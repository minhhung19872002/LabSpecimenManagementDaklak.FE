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
import {
  mockTestRequests,
  mockSpecimens,
  mockTests,
  mockNCRs,
  mockCustomers,
  mockUsers,
  TestRequestStatus,
  TestStatus,
} from '../../mocks/mockData';
import dayjs from 'dayjs';

// Calculate stats from centralized mock data
const mockStats = {
  totalRequests: mockTestRequests.length,
  totalSpecimens: mockSpecimens.length,
  totalTests: mockTests.length,
  ncrCount: mockNCRs.filter(n => n.status !== 'Closed').length,
  pendingRequests: mockTestRequests.filter(r => r.status === TestRequestStatus.Pending).length,
  inProgressTests: mockTests.filter(t => t.status === TestStatus.InProgress).length,
  completedToday: mockTests.filter(t => t.status === TestStatus.Completed).length,
  avgTAT: 3.2,
};

// Use centralized mock data for recent requests
const recentRequests = mockTestRequests.slice(0, 5).map(req => {
  const customer = mockCustomers.find(c => c.id === req.customerId);
  return {
    id: req.id,
    requestNumber: req.requestNumber,
    customerName: customer?.name || 'N/A',
    status: req.status,
    date: dayjs(req.requestDate).format('YYYY-MM-DD'),
  };
});

// Use centralized mock data for pending approvals
const pendingApprovals = mockTests
  .filter(t => t.status === TestStatus.Completed || t.status === TestStatus.Reviewed)
  .slice(0, 3)
  .map(test => ({
    id: test.id,
    testCode: test.code,
    parameter: test.name,
    status: test.status === TestStatus.Completed ? 'PendingReview' : 'PendingApproval',
  }));

// Use centralized mock data for recent activities
const recentActivities = mockUsers.slice(0, 5).map((user, i) => ({
  time: `${10 - i}:${30 - i * 15 >= 0 ? 30 - i * 15 : 45}`.padStart(5, '0'),
  action: ['Nhập kết quả PCR', 'Tiếp nhận mẫu huyết thanh', 'Phê duyệt kết quả', 'Tạo yêu cầu XN', 'Hoàn thành XN'][i],
  user: user.fullName,
  detail: mockTests[i]?.code || mockTestRequests[i]?.requestNumber || 'N/A',
}));

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
              styles={{ content: { color: '#cf1322' } }}
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
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Đang thử nghiệm"
              value={mockStats.inProgressTests}
              prefix={<SyncOutlined spin style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="Hoàn thành hôm nay"
              value={mockStats.completedToday}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a' } }}
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
              styles={{ content: { color: '#13c2c2' } }}
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
