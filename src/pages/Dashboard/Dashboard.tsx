/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
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
import { useNavigate } from "react-router-dom";
import dashboardService, {
  DashboardOverviewDto,
  DashboardRecentRequestDto,
  RevenueByCustomerDto,
  MonthlyRevenueDto,
} from "../../services/dashboardService";
import { qualityManagementService } from "../../services/qualityManagementService";
import { QualityManagementTaskDto } from "../../types/qualityManagement";
import dayjs, { Dayjs } from "dayjs";
import { PATH_ROUTES } from "../../constants";
import { Column } from "@ant-design/charts";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type FilterPeriod = "month" | "quarter" | "half_year" | "year";

// Helper function to calculate date range based on period
const getDateRangeForPeriod = (period: FilterPeriod): [Dayjs, Dayjs] => {
  const now = dayjs();
  const year = now.year();
  const month = now.month() + 1; // dayjs month is 0-indexed

  switch (period) {
    case "month":
      return [now.startOf("month"), now.endOf("month")];
    case "quarter": {
      const quarter = Math.ceil(month / 3);
      const quarterStart = (quarter - 1) * 3 + 1;
      return [
        dayjs().month(quarterStart - 1).startOf("month"),
        dayjs().month(quarterStart + 1).endOf("month"),
      ];
    }
    case "half_year": {
      if (month <= 6) {
        return [dayjs(`${year}-01-01`), dayjs(`${year}-06-30`)];
      } else {
        return [dayjs(`${year}-07-01`), dayjs(`${year}-12-31`)];
      }
    }
    case "year":
      return [now.startOf("year"), now.endOf("year")];
    default:
      return [now.startOf("month"), now.endOf("month")];
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Filter state
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(
    getDateRangeForPeriod("month")
  );
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverviewDto | null>(null);
  const [pendingTasks, setPendingTasks] = useState<QualityManagementTaskDto[]>([]);
  const [recentRequests, setRecentRequests] = useState<DashboardRecentRequestDto[]>([]);
  const [recentRequestsFilter, setRecentRequestsFilter] = useState<string | undefined>();

  // Revenue section state
  const [revenueByCustomer, setRevenueByCustomer] = useState<RevenueByCustomerDto[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueDto[]>([]);
  const [customerNames, setCustomerNames] = useState<string[]>([]);

  const [loadingPendingTasks, setLoadingPendingTasks] = useState(false);
  const [loadingRecentRequests, setLoadingRecentRequests] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingMonthlyRevenue, setLoadingMonthlyRevenue] = useState(false);

  // Load overview data
  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const fromDate = dateRange[0].format("YYYY-MM-DD");
      const toDate = dateRange[1].format("YYYY-MM-DD");
      const data = await dashboardService.getDashboardOverview(fromDate, toDate);
      setOverview(data);
    } catch (err: any) {
      console.error("Failed to load overview:", err);
      setError(err?.response?.data?.error?.message || "Không thể tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  // Load pending tasks from Quality Management (only status = PendingApproval)
  const loadPendingTasks = async () => {
    setLoadingPendingTasks(true);
    try {
      const result = await qualityManagementService.getList({
        skipCount: 0,
        maxResultCount: 10,
        status: 0, // QualityManagementStatus.PendingApproval
      });
      setPendingTasks(result.items || []);
    } catch (err) {
      console.error("Failed to load pending tasks:", err);
    } finally {
      setLoadingPendingTasks(false);
    }
  };

  // Load recent requests (max 5 items)
  const loadRecentRequests = async (customerName?: string) => {
    setLoadingRecentRequests(true);
    try {
      const result = await dashboardService.getDashboardRecentRequests(
        customerName,
        0,
        5
      );
      setRecentRequests(result.items || []);
    } catch (err) {
      console.error("Failed to load recent requests:", err);
    } finally {
      setLoadingRecentRequests(false);
    }
  };

  // Load revenue by customer
  const loadRevenueByCustomer = async () => {
    setLoadingRevenue(true);
    try {
      const result = await dashboardService.getRevenueByCustomer(0, 10);
      setRevenueByCustomer(result.items || []);

      // Select first customer by default if not selected
      if (!selectedCustomer && result.items.length > 0) {
        setSelectedCustomer(result.items[0].customerName);
      }
    } catch (err) {
      console.error("Failed to load revenue by customer:", err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  // Load monthly revenue for chart
  const loadMonthlyRevenue = async (customerName: string) => {
    setLoadingMonthlyRevenue(true);
    try {
      const year = dayjs().year();
      const data = await dashboardService.getMonthlyRevenue(customerName, year);
      setMonthlyRevenue(data);
    } catch (err) {
      console.error("Failed to load monthly revenue:", err);
    } finally {
      setLoadingMonthlyRevenue(false);
    }
  };

  // Load customer names for filter
  const loadCustomerNames = async () => {
    try {
      const names = await dashboardService.getCustomerNames();
      setCustomerNames(names);
    } catch (err) {
      console.error("Failed to load customer names:", err);
    }
  };

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

  // Handle refresh
  const handleRefresh = () => {
    setFilterPeriod("month");
    setDateRange(getDateRangeForPeriod("month"));
    setIsCustomDateRange(false);
  };

  // Initial load
  useEffect(() => {
    loadCustomerNames();
    loadPendingTasks();
    loadRevenueByCustomer();
  }, []);

  // Load overview when date range changes
  useEffect(() => {
    loadOverview();
  }, [dateRange]);

  // Load recent requests when filter changes
  useEffect(() => {
    loadRecentRequests(recentRequestsFilter);
  }, [recentRequestsFilter]);

  // Load monthly revenue when selected customer changes
  useEffect(() => {
    if (selectedCustomer) {
      loadMonthlyRevenue(selectedCustomer);
    }
  }, [selectedCustomer]);

  // Chart config
  const chartConfig = useMemo(() => ({
    data: monthlyRevenue.flatMap((item) => [
      { month: item.monthName, type: "Số hợp đồng", value: item.contractCount },
      { month: item.monthName, type: "Tổng số mẫu", value: item.totalSamples },
      { month: item.monthName, type: "Tổng số chỉ tiêu", value: item.totalIndicators },
      { month: item.monthName, type: "Tổng số tiền", value: item.revenue / 10000 }, // Scale down for display
    ]),
    xField: "month",
    yField: "value",
    seriesField: "type",
    isGroup: true,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    legend: {
      position: "top-right" as const,
    },
    label: {
      position: "top" as const,
      style: {
        fill: "#666",
        fontSize: 10,
      },
      formatter: (datum: any) => {
        if (datum.type === "Tổng số tiền") {
          return formatCurrency(datum.value * 10000);
        }
        return datum.value > 0 ? datum.value : "";
      },
    },
  }), [monthlyRevenue]);

  // Pending tasks columns
  const pendingTasksColumns = [
    {
      title: "Số HĐ",
      dataIndex: "contractNumber",
      key: "contractNumber",
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      ellipsis: true,
    },
    {
      title: "Loại",
      dataIndex: "taskType",
      key: "taskType",
      width: 100,
      render: (type: number) => (
        <Tag color={type === 0 ? "blue" : "orange"}>
          {type === 0 ? "Kết quả" : "Thay đổi"}
        </Tag>
      ),
    },
  ];

  // Recent requests columns
  const recentRequestsColumns = [
    {
      title: "Số HĐ",
      dataIndex: "contractNumber",
      key: "contractNumber",
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Tên CS/DN",
      dataIndex: "customerName",
      key: "customerName",
      ellipsis: true,
    },
    {
      title: "Ngày gửi YC",
      dataIndex: "pendingDate",
      key: "pendingDate",
      width: 110,
      render: (date: string) => date ? dayjs(date).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Mẫu",
      dataIndex: "sampleCount",
      key: "sampleCount",
      width: 60,
      align: "center" as const,
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "indicatorCount",
      key: "indicatorCount",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 120,
      align: "right" as const,
      render: (value: number) => formatCurrency(value),
    },
  ];

  // Revenue by customer columns
  const revenueColumns = [
    {
      title: "Cơ sở/Doanh nghiệp",
      dataIndex: "customerName",
      key: "customerName",
      ellipsis: true,
    },
    {
      title: "Mẫu",
      dataIndex: "totalSamples",
      key: "totalSamples",
      width: 70,
      align: "center" as const,
    },
    {
      title: "Chỉ tiêu",
      dataIndex: "totalIndicators",
      key: "totalIndicators",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      width: 130,
      align: "right" as const,
      render: (value: number) => formatCurrency(value),
    },
  ];

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
                onChange={(e) => handlePeriodChange(e.target.value)}
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
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                allowClear={false}
              />
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
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
                onClick={() => navigate(PATH_ROUTES.qualityManagement)}
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
                  onChange={setRecentRequestsFilter}
                  options={customerNames.map((name) => ({ label: name, value: name }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
                <Button
                  type="link"
                  onClick={() => navigate(PATH_ROUTES.testRequests.index)}
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
                  onClick: () => setSelectedCustomer(record.customerName),
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
                onChange={setSelectedCustomer}
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

export default Dashboard;
