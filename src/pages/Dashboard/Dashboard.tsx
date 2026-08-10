import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dashboardService, {
  DashboardOverviewDto,
  DashboardRecentRequestDto,
  RevenueByCustomerDto,
  RevenueByContactDto,
  MonthlyRevenueDto,
} from "../../services/dashboardService";
import { qualityManagementService } from "../../services/qualityManagementService";
import { QualityManagementTaskDto, QualityManagementStatus } from "../../types/qualityManagement";
import dayjs, { Dayjs } from "dayjs";
import { PATH_ROUTES } from "../../constants";
import { formatCurrency } from "./columns";
import DashboardContainer from "./components/DashboardContainer";

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

  // Revenue by contact section state
  const [revenueByContact, setRevenueByContact] = useState<RevenueByContactDto[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [monthlyRevenueByContact, setMonthlyRevenueByContact] = useState<MonthlyRevenueDto[]>([]);
  const [contactPersonNames, setContactPersonNames] = useState<string[]>([]);

  const [loadingPendingTasks, setLoadingPendingTasks] = useState(false);
  const [loadingRecentRequests, setLoadingRecentRequests] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingMonthlyRevenue, setLoadingMonthlyRevenue] = useState(false);
  const [loadingRevenueByContact, setLoadingRevenueByContact] = useState(false);
  const [loadingMonthlyRevenueByContact, setLoadingMonthlyRevenueByContact] = useState(false);

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
        status: QualityManagementStatus.PendingApproval,
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

  // Load revenue by contact person
  const loadRevenueByContact = async () => {
    setLoadingRevenueByContact(true);
    try {
      const result = await dashboardService.getRevenueByContact(0, 10);
      setRevenueByContact(result.items || []);

      if (!selectedContact && result.items.length > 0) {
        setSelectedContact(result.items[0].contactPerson);
      }
    } catch (err) {
      console.error("Failed to load revenue by contact:", err);
    } finally {
      setLoadingRevenueByContact(false);
    }
  };

  // Load monthly revenue for contact person chart
  const loadMonthlyRevenueByContact = async (contactPerson: string) => {
    setLoadingMonthlyRevenueByContact(true);
    try {
      const year = dayjs().year();
      const data = await dashboardService.getMonthlyRevenueByContact(contactPerson, year);
      setMonthlyRevenueByContact(data);
    } catch (err) {
      console.error("Failed to load monthly revenue by contact:", err);
    } finally {
      setLoadingMonthlyRevenueByContact(false);
    }
  };

  // Load contact person names for filter
  const loadContactPersonNames = async () => {
    try {
      const names = await dashboardService.getContactPersonNames();
      setContactPersonNames(names);
    } catch (err) {
      console.error("Failed to load contact person names:", err);
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

  // Load monthly revenue by contact when selected contact changes
  useEffect(() => {
    if (selectedContact) {
      loadMonthlyRevenueByContact(selectedContact);
    }
  }, [selectedContact]);

  // Initial load
  useEffect(() => {
    loadCustomerNames();
    loadPendingTasks();
    loadRevenueByCustomer();
    loadContactPersonNames();
    loadRevenueByContact();
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

  // Chart config - Simple bar chart showing revenue by month
  const formatYAxisValue = (v: number) => {
    if (v >= 1000000000) {
      const val = v / 1000000000;
      return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}tỷ`;
    }
    if (v >= 1000000) {
      const val = v / 1000000;
      return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}tr`;
    }
    if (v >= 1000) {
      const val = v / 1000;
      return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}k`;
    }
    return String(v);
  };

  const chartConfig = useMemo(() => ({
    data: monthlyRevenue.map((item) => ({
      month: item.monthName,
      revenue: item.revenue,
    })),
    xField: "month",
    yField: "revenue",
    color: "#597EF7",
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    axis: {
      x: {
        label: {
          style: {
            fill: "#8C8C8C",
            fontSize: 12,
          },
        },
      },
      y: {
        labelFormatter: (v: number) => formatYAxisValue(v),
        label: {
          style: {
            fill: "#8C8C8C",
            fontSize: 12,
          },
        },
      },
    },
    label: false,
    tooltip: {
      items: [
        {
          channel: "y",
          name: "Doanh thu",
          valueFormatter: (v: number) => formatCurrency(v),
        },
      ],
    },
  }), [monthlyRevenue]);

  const contactChartConfig = useMemo(() => ({
    data: monthlyRevenueByContact.map((item) => ({
      month: item.monthName,
      revenue: item.revenue,
    })),
    xField: "month",
    yField: "revenue",
    color: "#36CFC9",
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    axis: {
      x: {
        label: {
          style: {
            fill: "#8C8C8C",
            fontSize: 12,
          },
        },
      },
      y: {
        labelFormatter: (v: number) => formatYAxisValue(v),
        label: {
          style: {
            fill: "#8C8C8C",
            fontSize: 12,
          },
        },
      },
    },
    label: false,
    tooltip: {
      items: [
        {
          channel: "y",
          name: "Doanh thu",
          valueFormatter: (v: number) => formatCurrency(v),
        },
      ],
    },
  }), [monthlyRevenueByContact]);

  return (
    <DashboardContainer
      filterPeriod={filterPeriod}
      dateRange={dateRange}
      isCustomDateRange={isCustomDateRange}
      recentRequestsFilter={recentRequestsFilter}
      selectedCustomer={selectedCustomer}
      customerNames={customerNames}
      loading={loading}
      error={error}
      overview={overview}
      pendingTasks={pendingTasks}
      recentRequests={recentRequests}
      revenueByCustomer={revenueByCustomer}
      monthlyRevenue={monthlyRevenue}
      loadingPendingTasks={loadingPendingTasks}
      loadingRecentRequests={loadingRecentRequests}
      loadingRevenue={loadingRevenue}
      loadingMonthlyRevenue={loadingMonthlyRevenue}
      revenueByContact={revenueByContact}
      selectedContact={selectedContact}
      monthlyRevenueByContact={monthlyRevenueByContact}
      contactPersonNames={contactPersonNames}
      loadingRevenueByContact={loadingRevenueByContact}
      loadingMonthlyRevenueByContact={loadingMonthlyRevenueByContact}
      chartConfig={chartConfig}
      contactChartConfig={contactChartConfig}
      onPeriodChange={handlePeriodChange}
      onDateRangeChange={handleDateRangeChange}
      onRefresh={handleRefresh}
      onRecentRequestsFilterChange={setRecentRequestsFilter}
      onSelectedCustomerChange={setSelectedCustomer}
      onSelectedContactChange={setSelectedContact}
      onNavigateToQualityManagement={() => navigate(PATH_ROUTES.qualityManagement.index)}
      onNavigateToQualityManagementDetail={(id: string) => navigate(PATH_ROUTES.qualityManagement.detail(id))}
      onNavigateToTestRequests={() => navigate(PATH_ROUTES.testRequests.index)}
    />
  );
};

export default Dashboard;
