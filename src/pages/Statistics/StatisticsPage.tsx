// @ts-nocheck
import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Progress,
  Tag,
  Tabs
} from 'antd';
import {
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

// Mock data for statistics
const monthlyData = [
  { month: 'T1/2025', requests: 45, specimens: 120, tests: 280, completed: 275, onTime: 268 },
  { month: 'T2/2025', requests: 52, specimens: 135, tests: 310, completed: 305, onTime: 295 },
  { month: 'T3/2025', requests: 48, specimens: 128, tests: 295, completed: 290, onTime: 282 },
  { month: 'T4/2025', requests: 61, specimens: 158, tests: 365, completed: 360, onTime: 348 },
  { month: 'T5/2025', requests: 55, specimens: 142, tests: 330, completed: 325, onTime: 315 },
  { month: 'T6/2025', requests: 68, specimens: 175, tests: 405, completed: 398, onTime: 385 },
  { month: 'T7/2025', requests: 72, specimens: 188, tests: 435, completed: 428, onTime: 412 },
  { month: 'T8/2025', requests: 65, specimens: 168, tests: 390, completed: 385, onTime: 372 },
  { month: 'T9/2025', requests: 78, specimens: 202, tests: 468, completed: 460, onTime: 445 },
  { month: 'T10/2025', requests: 82, specimens: 215, tests: 498, completed: 490, onTime: 475 },
  { month: 'T11/2025', requests: 75, specimens: 195, tests: 452, completed: 445, onTime: 430 },
  { month: 'T12/2025', requests: 58, specimens: 150, tests: 348, completed: 320, onTime: 305 },
];

const specimenTypeData = [
  { type: 'Nước ngầm', count: 245, percentage: 28 },
  { type: 'Nước mặt', count: 189, percentage: 22 },
  { type: 'Đất', count: 156, percentage: 18 },
  { type: 'Thực phẩm', count: 132, percentage: 15 },
  { type: 'Phân bón', count: 98, percentage: 11 },
  { type: 'Khác', count: 52, percentage: 6 },
];

const departmentData = [
  { department: 'Phòng Hóa học', tests: 425, completed: 418, avgTAT: 2.8 },
  { department: 'Phòng Vi sinh', tests: 312, completed: 305, avgTAT: 3.5 },
  { department: 'Phòng Vật lý', tests: 198, completed: 195, avgTAT: 2.2 },
  { department: 'Phòng Môi trường', tests: 156, completed: 152, avgTAT: 3.1 },
];

const topCustomers = [
  { name: 'Công ty TNHH ABC', requests: 45, revenue: 125000000 },
  { name: 'Sở NN&PTNT Đắk Lắk', requests: 38, revenue: 98000000 },
  { name: 'Viện Nghiên cứu Tây Nguyên', requests: 32, revenue: 85000000 },
  { name: 'Trường ĐH Tây Nguyên', requests: 28, revenue: 72000000 },
  { name: 'Công ty CP XYZ', requests: 25, revenue: 65000000 },
];

const StatisticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedYear, setSelectedYear] = useState('2025');

  // Calculate totals
  const totalRequests = monthlyData.reduce((sum, m) => sum + m.requests, 0);
  const totalSpecimens = monthlyData.reduce((sum, m) => sum + m.specimens, 0);
  const totalTests = monthlyData.reduce((sum, m) => sum + m.tests, 0);
  const totalCompleted = monthlyData.reduce((sum, m) => sum + m.completed, 0);
  const totalOnTime = monthlyData.reduce((sum, m) => sum + m.onTime, 0);
  const completionRate = ((totalCompleted / totalTests) * 100).toFixed(1);
  const onTimeRate = ((totalOnTime / totalCompleted) * 100).toFixed(1);

  const handleExport = () => {
    // Mock export
    const blob = new Blob(['Mock Excel Data'], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${selectedYear}.xlsx`;
    a.click();
  };

  const monthlyColumns = [
    { title: 'Tháng', dataIndex: 'month', key: 'month' },
    { title: 'Yêu cầu', dataIndex: 'requests', key: 'requests' },
    { title: 'Mẫu', dataIndex: 'specimens', key: 'specimens' },
    { title: 'Phép thử', dataIndex: 'tests', key: 'tests' },
    { title: 'Hoàn thành', dataIndex: 'completed', key: 'completed' },
    { title: 'Đúng hạn', dataIndex: 'onTime', key: 'onTime' },
    {
      title: 'Tỷ lệ đúng hạn',
      key: 'rate',
      render: (_: any, record: any) => {
        const rate = ((record.onTime / record.completed) * 100).toFixed(1);
        return (
          <Space>
            <Progress
              percent={parseFloat(rate)}
              size="small"
              style={{ width: 80 }}
              strokeColor={parseFloat(rate) >= 95 ? '#52c41a' : parseFloat(rate) >= 90 ? '#faad14' : '#cf1322'}
            />
            <span>{rate}%</span>
          </Space>
        );
      },
    },
  ];

  const specimenColumns = [
    { title: 'Loại mẫu', dataIndex: 'type', key: 'type' },
    { title: 'Số lượng', dataIndex: 'count', key: 'count' },
    {
      title: 'Tỷ lệ',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (val: number) => (
        <Space>
          <Progress percent={val} size="small" style={{ width: 100 }} />
          <span>{val}%</span>
        </Space>
      ),
    },
  ];

  const departmentColumns = [
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Số phép thử', dataIndex: 'tests', key: 'tests' },
    { title: 'Hoàn thành', dataIndex: 'completed', key: 'completed' },
    {
      title: 'TAT TB (ngày)',
      dataIndex: 'avgTAT',
      key: 'avgTAT',
      render: (val: number) => <Tag color={val <= 3 ? 'green' : 'orange'}>{val}</Tag>,
    },
    {
      title: 'Hiệu suất',
      key: 'efficiency',
      render: (_: any, record: any) => {
        const rate = ((record.completed / record.tests) * 100).toFixed(1);
        return <Progress percent={parseFloat(rate)} size="small" style={{ width: 100 }} />;
      },
    },
  ];

  const customerColumns = [
    { title: '#', key: 'index', render: (_: any, __: any, index: number) => index + 1 },
    { title: 'Khách hàng', dataIndex: 'name', key: 'name' },
    { title: 'Số yêu cầu', dataIndex: 'requests', key: 'requests' },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val: number) => val.toLocaleString('vi-VN') + ' đ',
    },
  ];

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0 }}>
              <BarChartOutlined /> Thống kê & Báo cáo
            </h2>
          </Col>
          <Col>
            <Space>
              <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 100 }}>
                <Select.Option value="2024">2024</Select.Option>
                <Select.Option value="2025">2025</Select.Option>
              </Select>
              <RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              />
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                Xuất Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng yêu cầu"
              value={totalRequests}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  <RiseOutlined /> +12%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng mẫu thử"
              value={totalSpecimens}
              prefix={<ExperimentOutlined style={{ color: '#722ed1' }} />}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  <RiseOutlined /> +8%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng phép thử"
              value={totalTests}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <span style={{ fontSize: 14, color: '#52c41a' }}>
                  <RiseOutlined /> +15%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ lệ đúng hạn"
              value={onTimeRate}
              suffix="%"
              prefix={<ClockCircleOutlined style={{ color: '#13c2c2' }} />}
              styles={{ content: { color: parseFloat(onTimeRate) >= 95 ? '#52c41a' : '#faad14' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title={<><LineChartOutlined /> Tỷ lệ hoàn thành</>}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="dashboard"
                percent={parseFloat(completionRate)}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 'bold' }}>{percent}%</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Hoàn thành</div>
                  </div>
                )}
                size={180}
              />
            </div>
            <Row gutter={16} style={{ textAlign: 'center', marginTop: 16 }}>
              <Col span={8}>
                <Statistic title="Tổng" value={totalTests} styles={{ content: { fontSize: 18 } }} />
              </Col>
              <Col span={8}>
                <Statistic title="Hoàn thành" value={totalCompleted} styles={{ content: { fontSize: 18, color: '#52c41a' } }} />
              </Col>
              <Col span={8}>
                <Statistic title="Còn lại" value={totalTests - totalCompleted} styles={{ content: { fontSize: 18, color: '#faad14' } }} />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><PieChartOutlined /> Phân bố loại mẫu</>}>
            <Table
              dataSource={specimenTypeData}
              columns={specimenColumns}
              rowKey="type"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for detailed stats */}
      <Card>
        <Tabs
          items={[
            {
              key: 'monthly',
              label: 'Theo tháng',
              children: (
                <Table
                  dataSource={monthlyData}
                  columns={monthlyColumns}
                  rowKey="month"
                  pagination={false}
                  scroll={{ x: 800 }}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>{totalRequests}</Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>{totalSpecimens}</Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>{totalTests}</Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>{totalCompleted}</Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>{totalOnTime}</Table.Summary.Cell>
                        <Table.Summary.Cell index={6}>
                          <Tag color="blue">{onTimeRate}%</Tag>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              ),
            },
            {
              key: 'department',
              label: 'Theo phòng ban',
              children: (
                <Table
                  dataSource={departmentData}
                  columns={departmentColumns}
                  rowKey="department"
                  pagination={false}
                />
              ),
            },
            {
              key: 'customer',
              label: 'Top khách hàng',
              children: (
                <Table
                  dataSource={topCustomers}
                  columns={customerColumns}
                  rowKey="name"
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default StatisticsPage;
