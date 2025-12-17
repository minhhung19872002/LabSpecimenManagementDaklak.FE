import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Button,
  Space,
  Progress,
  Tabs,
  Spin,
  message,
  Empty
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
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  statisticsService,
  StatisticsDataDto,
  SampleMatrixDto,
  WorkloadByDepartmentDto,
  TATComplianceDto
} from '../../services/statisticsService';

const { RangePicker } = DatePicker;

const StatisticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statisticsData, setStatisticsData] = useState<StatisticsDataDto | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const params: { fromDate?: string; toDate?: string } = {};
      if (dateRange) {
        params.fromDate = dateRange[0].format('YYYY-MM-DD');
        params.toDate = dateRange[1].format('YYYY-MM-DD');
      }
      const data = await statisticsService.getStatisticsData(params);
      setStatisticsData(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      message.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: { fromDate?: string; toDate?: string } = {};
      if (dateRange) {
        params.fromDate = dateRange[0].format('YYYY-MM-DD');
        params.toDate = dateRange[1].format('YYYY-MM-DD');
      }
      const blob = await statisticsService.exportToExcel(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = dateRange
        ? `statistics_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.xlsx`
        : `statistics_${dayjs().format('YYYYMMDD')}.xlsx`;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Xuất báo cáo thành công');
    } catch (error) {
      console.error('Error exporting statistics:', error);
      message.error('Không thể xuất báo cáo');
    } finally {
      setExporting(false);
    }
  };

  const overview = statisticsData?.overview;
  const monthlyTrends = statisticsData?.monthlyTrends || [];
  const sampleMatrix = statisticsData?.sampleMatrix || [];
  const workloadByDepartment = statisticsData?.workloadByDepartment || [];
  const tatCompliance = statisticsData?.tatCompliance || [];

  // Calculate totals from monthly trends
  const totalRequests = monthlyTrends.reduce((sum, m) => sum + m.testRequests, 0);
  const totalSpecimens = monthlyTrends.reduce((sum, m) => sum + m.specimens, 0);
  const totalTests = monthlyTrends.reduce((sum, m) => sum + m.tests, 0);
  const totalReports = monthlyTrends.reduce((sum, m) => sum + m.reports, 0);

  const monthlyColumns = [
    { title: 'Tháng', dataIndex: 'month', key: 'month' },
    { title: 'Yêu cầu', dataIndex: 'testRequests', key: 'testRequests' },
    { title: 'Mẫu', dataIndex: 'specimens', key: 'specimens' },
    { title: 'Phép thử', dataIndex: 'tests', key: 'tests' },
    { title: 'Báo cáo', dataIndex: 'reports', key: 'reports' },
  ];

  const specimenColumns = [
    { title: 'Loại mẫu', dataIndex: 'specimenType', key: 'specimenType' },
    { title: 'Tổng', dataIndex: 'totalCount', key: 'totalCount' },
    { title: 'Đã nhận', dataIndex: 'receivedCount', key: 'receivedCount' },
    { title: 'Đang thử', dataIndex: 'testingCount', key: 'testingCount' },
    { title: 'Hoàn thành', dataIndex: 'completedCount', key: 'completedCount' },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (_: unknown, record: SampleMatrixDto) => {
        const rate = record.totalCount > 0
          ? parseFloat(((record.completedCount / record.totalCount) * 100).toFixed(1))
          : 0;
        return <Progress percent={rate} size="small" style={{ width: 100 }} />;
      },
    },
  ];

  const departmentColumns = [
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Tổng công việc', dataIndex: 'totalTasks', key: 'totalTasks' },
    { title: 'Chờ xử lý', dataIndex: 'pendingTasks', key: 'pendingTasks' },
    { title: 'Đang thực hiện', dataIndex: 'inProgressTasks', key: 'inProgressTasks' },
    { title: 'Hoàn thành', dataIndex: 'completedTasks', key: 'completedTasks' },
    {
      title: 'Hiệu suất',
      key: 'completionRate',
      render: (_: unknown, record: WorkloadByDepartmentDto) => {
        const rate = record.completionRate;
        return (
          <Progress
            percent={rate}
            size="small"
            style={{ width: 100 }}
            strokeColor={rate >= 90 ? '#52c41a' : rate >= 70 ? '#faad14' : '#cf1322'}
          />
        );
      },
    },
  ];

  const tatColumns = [
    { title: 'Kỳ', dataIndex: 'period', key: 'period' },
    { title: 'Tổng yêu cầu', dataIndex: 'totalRequests', key: 'totalRequests' },
    { title: 'Đúng hạn', dataIndex: 'onTimeRequests', key: 'onTimeRequests' },
    { title: 'Trễ hạn', dataIndex: 'delayedRequests', key: 'delayedRequests' },
    {
      title: 'Tỷ lệ tuân thủ',
      key: 'complianceRate',
      render: (_: unknown, record: TATComplianceDto) => {
        const rate = record.complianceRate;
        return (
          <Progress
            percent={rate}
            size="small"
            style={{ width: 100 }}
            strokeColor={rate >= 95 ? '#52c41a' : rate >= 85 ? '#faad14' : '#cf1322'}
          />
        );
      },
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
              <RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchStatistics}
                loading={loading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exporting}
              >
                Xuất Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* Summary Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng yêu cầu"
                value={overview?.totalTestRequests ?? totalRequests}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng mẫu thử"
                value={overview?.totalSpecimens ?? totalSpecimens}
                prefix={<ExperimentOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng phép thử"
                value={overview?.totalTests ?? totalTests}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tỷ lệ đúng hạn"
                value={overview?.tatComplianceRate ?? 0}
                suffix="%"
                precision={1}
                prefix={<ClockCircleOutlined style={{ color: '#13c2c2' }} />}
                valueStyle={{
                  color: (overview?.tatComplianceRate ?? 0) >= 95 ? '#52c41a' : '#faad14'
                }}
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
                  percent={overview?.completionRate ?? 0}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  format={(percent) => (
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 'bold' }}>{percent?.toFixed(1)}%</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Hoàn thành</div>
                    </div>
                  )}
                  size={180}
                />
              </div>
              <Row gutter={16} style={{ textAlign: 'center', marginTop: 16 }}>
                <Col span={8}>
                  <Statistic
                    title="Tổng phép thử"
                    value={overview?.totalTests ?? 0}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Báo cáo"
                    value={overview?.totalReports ?? totalReports}
                    valueStyle={{ fontSize: 18, color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="TAT"
                    value={overview?.tatComplianceRate ?? 0}
                    suffix="%"
                    precision={1}
                    valueStyle={{ fontSize: 18, color: '#13c2c2' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<><PieChartOutlined /> Phân bố loại mẫu</>}>
              {sampleMatrix.length > 0 ? (
                <Table
                  dataSource={sampleMatrix}
                  columns={specimenColumns}
                  rowKey="specimenType"
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty description="Không có dữ liệu" />
              )}
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
                children: monthlyTrends.length > 0 ? (
                  <Table
                    dataSource={monthlyTrends}
                    columns={monthlyColumns}
                    rowKey="month"
                    pagination={false}
                    scroll={{ x: 600 }}
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                          <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>{totalRequests}</Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>{totalSpecimens}</Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>{totalTests}</Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>{totalReports}</Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                ) : (
                  <Empty description="Không có dữ liệu" />
                ),
              },
              {
                key: 'department',
                label: 'Theo phòng ban',
                children: workloadByDepartment.length > 0 ? (
                  <Table
                    dataSource={workloadByDepartment}
                    columns={departmentColumns}
                    rowKey="department"
                    pagination={false}
                  />
                ) : (
                  <Empty description="Không có dữ liệu" />
                ),
              },
              {
                key: 'tat',
                label: 'TAT Compliance',
                children: tatCompliance.length > 0 ? (
                  <Table
                    dataSource={tatCompliance}
                    columns={tatColumns}
                    rowKey="period"
                    pagination={false}
                  />
                ) : (
                  <Empty description="Không có dữ liệu" />
                ),
              },
            ]}
          />
        </Card>
      </Spin>
    </div>
  );
};

export default StatisticsPage;
