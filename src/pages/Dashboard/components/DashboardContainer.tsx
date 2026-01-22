import React from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Spin,
  Radio,
  Button,
  Select,
  Typography,
  Space,
  Alert,
  Badge,
} from "antd";
import { DatePicker } from "antd";

const { RangePicker } = DatePicker;
import {
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EditOutlined,
  SyncOutlined,
  RightOutlined,
  ExclamationCircleOutlined,
} from "../../../components/common/Icon";
import { Column } from "@ant-design/charts";
import { Dayjs } from "dayjs";
import {
  DashboardOverviewDto,
  DashboardRecentRequestDto,
  RevenueByCustomerDto,
  MonthlyRevenueDto,
} from "../../../services/dashboardService";
import { QualityManagementTaskDto } from "../../../types/qualityManagement";
import {
  getRecentRequestsColumns,
  getRevenueColumns,
  formatCurrency,
} from "../columns";
import "../Dashboard.css";

const { Title, Text } = Typography;

type FilterPeriod = "month" | "quarter" | "half_year" | "year";

interface DashboardContainerProps {
  // Filter state
  filterPeriod: FilterPeriod;
  dateRange: [Dayjs, Dayjs];
  isCustomDateRange: boolean;
  recentRequestsFilter: string | undefined;
  selectedCustomer: string | null;
  customerNames: string[];

  // Data state
  loading: boolean;
  error: string | null;
  overview: DashboardOverviewDto | null;
  pendingTasks: QualityManagementTaskDto[];
  recentRequests: DashboardRecentRequestDto[];
  revenueByCustomer: RevenueByCustomerDto[];
  monthlyRevenue: MonthlyRevenueDto[];

  // Loading states
  loadingPendingTasks: boolean;
  loadingRecentRequests: boolean;
  loadingRevenue: boolean;
  loadingMonthlyRevenue: boolean;

  // Chart config
  chartConfig: any;

  // Handlers
  onPeriodChange: (period: FilterPeriod) => void;
  onDateRangeChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onRefresh: () => void;
  onRecentRequestsFilterChange: (value: string | undefined) => void;
  onSelectedCustomerChange: (value: string | null) => void;
  onNavigateToQualityManagement: () => void;
  onNavigateToQualityManagementDetail: (id: string) => void;
  onNavigateToTestRequests: () => void;
}

// Stats data configuration - all stats in one grid
const getAllStats = (overview: DashboardOverviewDto | null) => {
  const total = (overview?.onTimeTests || 0) + (overview?.lateTests || 0);
  const onTimePercent =
    total > 0 ? Math.round(((overview?.onTimeTests || 0) / total) * 100) : 0;
  const latePercent =
    total > 0 ? Math.round(((overview?.lateTests || 0) / total) * 100) : 0;

  return [
    {
      title: "Tổng số hợp đồng",
      value: overview?.totalContracts || 0,
      iconBg: "blue",
      icon: <FileTextOutlined />,
    },
    {
      title: "Tổng số mẫu",
      value: (overview?.totalSamples || 0).toLocaleString(),
      iconBg: "purple",
      icon: <ExperimentOutlined />,
    },
    {
      title: "Tổng doanh thu",
      value: formatCurrency(overview?.totalRevenue || 0),
      iconBg: "orange",
      icon: <DollarOutlined />,
    },
    {
      title: "Báo cáo NCT",
      value: overview?.totalNCRs || 0,
      iconBg: "red",
      icon: <ExclamationCircleOutlined />,
    },
    {
      title: "TN Đúng hạn",
      value: `${onTimePercent}%`,
      iconBg: "green",
      icon: <CheckCircleOutlined />,
    },
    {
      title: "TN Trễ hạn",
      value: `${latePercent}%`,
      iconBg: "orange",
      icon: <ClockCircleOutlined />,
    },
    {
      title: "Chờ phê duyệt",
      value: overview?.pendingApproval || 0,
      iconBg: "blue",
      icon: <EditOutlined />,
    },
    {
      title: "Đang thực hiện",
      value: total,
      iconBg: "purple",
      icon: <SyncOutlined />,
    },
  ];
};

const DashboardContainer: React.FC<DashboardContainerProps> = ({
  filterPeriod,
  dateRange,
  isCustomDateRange,
  selectedCustomer,
  customerNames,
  loading,
  error,
  overview,
  pendingTasks,
  recentRequests,
  revenueByCustomer,
  monthlyRevenue,
  loadingPendingTasks,
  loadingRecentRequests,
  loadingRevenue,
  loadingMonthlyRevenue,
  chartConfig,
  onPeriodChange,
  onDateRangeChange,
  onSelectedCustomerChange,
  onNavigateToQualityManagement,
  onNavigateToQualityManagementDetail,
  onNavigateToTestRequests,
}) => {
  const recentRequestsColumns = getRecentRequestsColumns();
  const revenueColumns = getRevenueColumns();

  const allStats = getAllStats(overview);

  if (error) {
    return (
      <div>
        <Title level={3} style={{ marginBottom: 24 }}>
          Báo cáo Tổng quan
        </Title>
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="dashboard-filter-bar">
        <Title level={3} className="dashboard-title">
          Báo cáo Tổng quan
        </Title>
        <div className="dashboard-filter-controls">
          <div className="dashboard-period-tabs">
            <Radio.Group
              value={isCustomDateRange ? undefined : filterPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
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
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                onDateRangeChange(dates as [Dayjs | null, Dayjs | null]);
              }
            }}
            format="DD/MM/YYYY"
            allowClear={false}
            style={{ width: 240 }}
          />
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Stats Cards Grid */}
        <div className="dashboard-stats-grid">
          {allStats.map((stat, index) => (
            <Card key={index} className="dashboard-stat-card" bordered={false}>
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-info">
                  <Text className="dashboard-stat-title">{stat.title}</Text>
                  <div className="dashboard-stat-value">{stat.value}</div>
                </div>
                <div className={`dashboard-stat-icon ${stat.iconBg}`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Spin>

      {/* Two Column Section: Pending Approval & Recent Requests */}
      <Row
        gutter={32}
        className="dashboard-two-col-row"
      >
        {/* Pending Approval - 1/3 width */}
        <Col xs={24} lg={8}>
          <Card
            className="dashboard-pending-card"
            bordered={false}
            title={
              <Space>
                <span>Chờ phê duyệt</span>
                <Badge
                  count={pendingTasks.length}
                  style={{ backgroundColor: "#CF1322" }}
                />
              </Space>
            }
            extra={
              <Button type="link" onClick={onNavigateToQualityManagement}>
                Xem tất cả <RightOutlined />
              </Button>
            }
          >
            <Spin spinning={loadingPendingTasks}>
              {pendingTasks.slice(0, 3).map((task, index) => (
                <div key={task.id || index} className="dashboard-pending-item">
                  <div className="dashboard-pending-item-info">
                    <span className="dashboard-pending-item-code">
                      {task.contractNumber || `HD${task.id?.slice(0, 7)}`}
                    </span>
                    <span className="dashboard-pending-item-org">
                      {task.customerName || "Không có thông tin"}
                    </span>
                  </div>
                  <Button
                    size="small"
                    onClick={() => onNavigateToQualityManagementDetail(task.testRequestId)}
                  >
                    Kết quả
                  </Button>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#8C8C8C",
                  }}
                >
                  Không có yêu cầu chờ phê duyệt
                </div>
              )}
            </Spin>
          </Card>
        </Col>

        {/* Recent Requests - 2/3 width */}
        <Col xs={24} lg={16}>
          <Card
            className="dashboard-recent-card"
            bordered={false}
            title={<span>Yêu cầu gần đây</span>}
            extra={
              <Button type="link" onClick={onNavigateToTestRequests}>
                Xem tất cả <RightOutlined />
              </Button>
            }
          >
            <Spin spinning={loadingRecentRequests}>
              <Table
                dataSource={recentRequests.slice(0, 5)}
                columns={recentRequestsColumns}
                rowKey="id"
                size="small"
                scroll={{ x: 600 }}
                pagination={false}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Revenue Report Section */}
      <Card
        className="dashboard-revenue-card"
        bordered={false}
        title={
          <div className="dashboard-revenue-header">
            <span className="dashboard-revenue-title">
              Báo cáo chi tiết doanh thu
            </span>
            <span className="dashboard-revenue-subtitle">
              Tổng doanh thu theo tháng trong năm {new Date().getFullYear()}
            </span>
          </div>
        }
      >
        <div className="dashboard-revenue-content">
          {/* Revenue Table - Left */}
          <div className="dashboard-revenue-table">
            <Spin spinning={loadingRevenue}>
              <Table
                dataSource={revenueByCustomer}
                columns={revenueColumns}
                rowKey="customerName"
                size="small"
                pagination={false}
                scroll={{ x: 280 }}
                onRow={(record) => ({
                  onClick: () => onSelectedCustomerChange(record.customerName),
                  style: {
                    cursor: "pointer",
                  },
                })}
                rowClassName={(record) =>
                  selectedCustomer === record.customerName ? "selected-row" : ""
                }
              />
            </Spin>
          </div>

          {/* Revenue Chart - Right */}
          <div className="dashboard-revenue-chart">
            <div className="dashboard-revenue-chart-header">
              <Select
                placeholder="Chọn Cơ sở/DN"
                style={{ width: 280 }}
                value={selectedCustomer}
                onChange={onSelectedCustomerChange}
                options={customerNames.map((name) => ({
                  label: name,
                  value: name,
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </div>
            <Spin spinning={loadingMonthlyRevenue}>
              {monthlyRevenue.length > 0 ? (
                <Column {...chartConfig} height={300} />
              ) : (
                <div
                  style={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  {selectedCustomer
                    ? "Không có dữ liệu doanh thu cho doanh nghiệp này"
                    : "Chọn một doanh nghiệp để xem biểu đồ"}
                </div>
              )}
            </Spin>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardContainer;
