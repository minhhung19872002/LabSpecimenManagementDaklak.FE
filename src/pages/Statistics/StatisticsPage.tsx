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
  DownloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ReloadOutlined
} from '../../components/common/Icon';
import { Column, Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import {
  statisticsService,
  StatisticsDataDto,
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
              />
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
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Tổng yêu cầu"
                value={overview?.totalTestRequests ?? totalRequests}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Tổng mẫu thử"
                value={overview?.totalSpecimens ?? totalSpecimens}
                prefix={<ExperimentOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="Tổng phép thử"
                value={overview?.totalTests ?? totalTests}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Row 1: Monthly Trends & Sample Distribution */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={14}>
            <Card title={<><BarChartOutlined /> Xu hướng theo tháng</>}>
              {monthlyTrends.length > 0 ? (
                <Column
                  data={monthlyTrends.flatMap(item => [
                    { month: item.month, type: 'Yêu cầu', value: item.testRequests },
                    { month: item.month, type: 'Mẫu', value: item.specimens },
                    { month: item.month, type: 'Phép thử', value: item.tests },
                    { month: item.month, type: 'Báo cáo', value: item.reports },
                  ])}
                  xField="month"
                  yField="value"
                  colorField="type"
                  group={true}
                  height={300}
                  legend={{ position: 'top' }}
                  color={['#1890ff', '#722ed1', '#52c41a', '#faad14']}
                />
              ) : (
                <Empty description="Không có dữ liệu" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title={<><PieChartOutlined /> Phân bố loại mẫu</>}>
              {sampleMatrix.length > 0 ? (
                <Pie
                  data={sampleMatrix.map(item => ({
                    type: item.specimenType,
                    value: item.totalCount
                  }))}
                  angleField="value"
                  colorField="type"
                  height={300}
                  radius={0.8}
                  innerRadius={0.5}
                  label={{
                    text: 'value',
                    position: 'outside',
                  }}
                  legend={{ position: 'right' }}
                  tooltip={{
                    title: 'type',
                  }}
                />
              ) : (
                <Empty description="Không có dữ liệu" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              )}
            </Card>
          </Col>
        </Row>

        {/* Charts Row 2: Department Workload */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24}>
            <Card title={<><BarChartOutlined /> Khối lượng công việc theo khoa phòng</>}>
              {workloadByDepartment.length > 0 ? (
                <Column
                  data={workloadByDepartment.flatMap(item => [
                    { department: item.department, type: 'Chờ xử lý', value: item.pendingTasks },
                    { department: item.department, type: 'Đang thực hiện', value: item.inProgressTasks },
                    { department: item.department, type: 'Hoàn thành', value: item.completedTasks },
                  ])}
                  xField="department"
                  yField="value"
                  colorField="type"
                  isStack={true}
                  height={300}
                  legend={{ position: 'top' }}
                  color={['#faad14', '#1890ff', '#52c41a']}
                  label={{
                    text: 'value',
                    position: 'inside',
                    textBaseline: 'bottom',
                  }}
                />
              ) : (
                <Empty description="Không có dữ liệu" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
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
