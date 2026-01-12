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
  Empty,
  Modal,
  Tooltip,
  Radio
} from 'antd';
import {
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '../../components/common/Icon';
import { Column, Pie } from '@ant-design/charts';
import dayjs, { Dayjs } from 'dayjs';
import {
  statisticsService,
  StatisticsDataDto,
  WorkloadByDepartmentDto,
  TATComplianceDto
} from '../../services/statisticsService';

const { RangePicker } = DatePicker;

type FilterPeriod = 'month' | 'quarter' | 'half_year' | 'year';

// Helper function to calculate date range based on period
const getDateRangeForPeriod = (period: FilterPeriod): [Dayjs, Dayjs] => {
  const now = dayjs();
  const year = now.year();
  const month = now.month() + 1; // dayjs month is 0-indexed

  switch (period) {
    case 'month':
      return [now.startOf('month'), now.endOf('month')];
    case 'quarter': {
      const quarter = Math.ceil(month / 3);
      const quarterStart = (quarter - 1) * 3 + 1;
      return [
        dayjs().month(quarterStart - 1).startOf('month'),
        dayjs().month(quarterStart + 1).endOf('month'),
      ];
    }
    case 'half_year': {
      if (month <= 6) {
        return [dayjs(`${year}-01-01`), dayjs(`${year}-06-30`)];
      } else {
        return [dayjs(`${year}-07-01`), dayjs(`${year}-12-31`)];
      }
    }
    case 'year':
      return [now.startOf('year'), now.endOf('year')];
    default:
      return [now.startOf('month'), now.endOf('month')];
  }
};

// Fullscreen modal state
type FullscreenState = boolean;

const StatisticsPage: React.FC = () => {
  // Filter state
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(getDateRangeForPeriod('month'));
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statisticsData, setStatisticsData] = useState<StatisticsDataDto | null>(null);
  const [showFullscreen, setShowFullscreen] = useState<FullscreenState>(false);
  const [chartReady, setChartReady] = useState(false);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const params: { fromDate?: string; toDate?: string } = {
        fromDate: dateRange[0].format('YYYY-MM-DD'),
        toDate: dateRange[1].format('YYYY-MM-DD'),
      };
      const data = await statisticsService.getStatisticsData(params);
      setStatisticsData(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      message.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Handle period change
  const handlePeriodChange = (period: FilterPeriod) => {
    setFilterPeriod(period);
    setDateRange(getDateRangeForPeriod(period));
    setIsCustomDateRange(false);
  };

  // Handle date range change
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      setIsCustomDateRange(true);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Delay chart render until modal animation completes
  useEffect(() => {
    if (showFullscreen) {
      setChartReady(false);
      const timer = setTimeout(() => setChartReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setChartReady(false);
    }
  }, [showFullscreen]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: { fromDate?: string; toDate?: string } = {
        fromDate: dateRange[0].format('YYYY-MM-DD'),
        toDate: dateRange[1].format('YYYY-MM-DD'),
      };
      const blob = await statisticsService.exportToExcel(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `statistics_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.xlsx`;
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

  // Render Monthly Trend Chart
  // autoFit = true means chart will fit to container width
  const renderMonthlyTrendChart = (autoFit: boolean = false) => (
    monthlyTrends.length > 0 ? (
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
        height={autoFit ? undefined : 300}
        autoFit={autoFit}
        legend={{ position: 'top' }}
        color={['#1890ff', '#722ed1', '#52c41a', '#faad14']}
      />
    ) : (
      <Empty description="Không có dữ liệu" style={{ height: autoFit ? '100%' : 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
    )
  );

  return (
    <div>
      {/* Header - Filter Bar */}
      <div className="statistics-filter-bar">
        <h2 className="statistics-title">
          <BarChartOutlined /> Thống kê & Báo cáo
        </h2>
        <div className="statistics-filter-controls">
          <div className="statistics-period-tabs">
            <Radio.Group
              value={isCustomDateRange ? undefined : filterPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="month">Tháng</Radio.Button>
              <Radio.Button value="quarter">Quý</Radio.Button>
              <Radio.Button value="half_year">Nửa năm</Radio.Button>
              <Radio.Button value="year">Năm</Radio.Button>
            </Radio.Group>
          </div>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            allowClear={false}
            style={{ width: 240 }}
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
        </div>
      </div>

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
            <Card
              title={<><BarChartOutlined /> Xu hướng theo tháng</>}
              extra={
                <Tooltip title="Xem toàn màn hình">
                  <Button
                    type="text"
                    size="small"
                    icon={<FullscreenOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullscreen(true);
                    }}
                  />
                </Tooltip>
              }
              hoverable
              style={{ cursor: 'pointer' }}
              onClick={() => setShowFullscreen(true)}
            >
              <div style={{ height: 300, width: '100%' }}>
                {renderMonthlyTrendChart(true)}
              </div>
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

      {/* Fullscreen Modal for Monthly Trends */}
      <Modal
        title={
          <Space>
            <BarChartOutlined /> Xu hướng theo tháng
          </Space>
        }
        open={showFullscreen}
        onCancel={() => setShowFullscreen(false)}
        footer={null}
        width="90%"
        centered
        styles={{
          body: {
            padding: '24px 0 0 0',
            overflow: 'hidden'
          }
        }}
        wrapClassName="chart-fullscreen-modal"
      >
        <div style={{ width: '100%', height: 'calc(80vh - 100px)' }}>
          {showFullscreen && chartReady && renderMonthlyTrendChart(true)}
        </div>
      </Modal>
    </div>
  );
};

export default StatisticsPage;
