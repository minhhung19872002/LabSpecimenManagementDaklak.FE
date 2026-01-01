import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Spin,
  Radio,
  DatePicker,
  Button,
  Select,
  Typography,
  Space,
  Alert,
} from "antd";
import {
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ReloadOutlined,
  AuditOutlined,
  FieldTimeOutlined,
  RightOutlined,
} from "@ant-design/icons";
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
  getPendingTasksColumns,
  getRecentRequestsColumns,
  getRevenueColumns,
  formatCurrency,
} from "../columns";

const { Title } = Typography;
const { RangePicker } = DatePicker;

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
  onNavigateToTestRequests: () => void;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({
  filterPeriod,
  dateRange,
  isCustomDateRange,
  recentRequestsFilter,
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
  onRefresh,
  onRecentRequestsFilterChange,
  onSelectedCustomerChange,
  onNavigateToQualityManagement,
  onNavigateToTestRequests,
}) => {
  const pendingTasksColumns = getPendingTasksColumns();
  const recentRequestsColumns = getRecentRequestsColumns();
  const revenueColumns = getRevenueColumns();

  if (error) {
    return (
      <div>
        <Title level={3} style={{ marginBottom: 24 }}>Báo cáo Tổng quan</Title>
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header with Title and Filters */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>Báo cáo Tổng quan</Title>
          </Col>
          <Col>
            <Space wrap>
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
              <RangePicker
                value={dateRange}
                onChange={onDateRangeChange}
                format="DD/MM/YYYY"
                allowClear={false}
              />
              <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards - Row 1 */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Tổng số hợp đồng"
                value={overview?.totalContracts || 0}
                prefix={<FileTextOutlined style={{ color: "#1890ff" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Tổng số mẫu"
                value={overview?.totalSamples || 0}
                prefix={<ExperimentOutlined style={{ color: "#722ed1" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Tổng số chỉ tiêu"
                value={overview?.totalIndicators || 0}
                prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Báo cáo NCT"
                value={overview?.totalNCRs || 0}
                prefix={<WarningOutlined style={{ color: "#cf1322" }} />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Statistics Cards - Row 2 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Tổng doanh thu"
                value={overview?.totalRevenue || 0}
                prefix={<DollarOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: "#faad14" }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="TN đúng hạn"
                value={overview?.onTimeTests || 0}
                prefix={<FieldTimeOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="TN trễ hạn"
                value={overview?.lateTests || 0}
                prefix={<ClockCircleOutlined style={{ color: "#ff4d4f" }} />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="Chờ phê duyệt"
                value={overview?.pendingApproval || 0}
                prefix={<AuditOutlined style={{ color: "#13c2c2" }} />}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Pending Approvals & Recent Requests - 50/50 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <AuditOutlined />
                <span>Chờ phê duyệt</span>
                <Tag color="orange">{pendingTasks.length}</Tag>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={onNavigateToQualityManagement}
              >
                Xem tất cả <RightOutlined />
              </Button>
            }
            bodyStyle={{ padding: 0, minHeight: 280 }}
          >
            <Spin spinning={loadingPendingTasks}>
              <Table
                dataSource={pendingTasks.slice(0, 5)}
                columns={pendingTasksColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>Yêu cầu gần đây</span>
              </Space>
            }
            extra={
              <Space>
                <Select
                  placeholder="Chọn CS/DN"
                  allowClear
                  style={{ width: 180 }}
                  value={recentRequestsFilter}
                  onChange={onRecentRequestsFilterChange}
                  options={customerNames.map((name) => ({ label: name, value: name }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
                <Button
                  type="link"
                  onClick={onNavigateToTestRequests}
                >
                  Xem tất cả <RightOutlined />
                </Button>
              </Space>
            }
            bodyStyle={{ padding: 0, minHeight: 280 }}
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
        title={
          <Space>
            <DollarOutlined />
            <span>Báo cáo chi tiết doanh thu</span>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Row gutter={[16, 16]}>
          {/* Revenue Table - Left */}
          <Col xs={24} lg={12}>
            <Spin spinning={loadingRevenue}>
              <Table
                className="revenue-table"
                dataSource={revenueByCustomer}
                columns={revenueColumns}
                rowKey="customerName"
                size="small"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => onSelectedCustomerChange(record.customerName),
                  style: {
                    cursor: "pointer",
                    backgroundColor: selectedCustomer === record.customerName ? "#fff1f0" : undefined,
                  },
                })}
                rowClassName={(record) =>
                  selectedCustomer === record.customerName ? "selected-row" : ""
                }
              />
            </Spin>
          </Col>

          {/* Revenue Chart - Right */}
          <Col xs={24} lg={12}>
            <div style={{ marginBottom: 16 }}>
              <Select
                placeholder="Chọn Cơ sở/DN"
                style={{ width: 300 }}
                value={selectedCustomer}
                onChange={onSelectedCustomerChange}
                options={customerNames.map((name) => ({ label: name, value: name }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
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
          </Col>
        </Row>
      </Card>

      <style>{`
        .selected-row {
          background-color: #fff1f0 !important;
        }
        .selected-row:hover > td {
          background-color: #ffccc7 !important;
        }
        .revenue-table .ant-table-tbody > tr > td {
          height: 32px;
          padding: 2px 10px !important;
        }
      `}</style>
    </div>
  );
};

export default DashboardContainer;
