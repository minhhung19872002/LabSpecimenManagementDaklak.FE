import api from './api';

export interface DashboardSummaryDto {
  totalTestRequests: number;
  pendingTestRequests: number;
  totalSpecimens: number;
  specimenInTesting: number;
  totalTests: number;
  pendingTests: number;
  completedTests: number;
  totalTestResults: number;
  pendingApprovalResults: number;
  openNCRs: number;
  pendingTasks: number;
  totalReports: number;
  issuedReports: number;
}

export interface DashboardChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface RecentActivityDto {
  id: string;
  type: string;
  description: string;
  entityType: string;
  entityId: string;
  entityCode: string;
  performedById?: string;
  performedByName?: string;
  performedAt: string;
}

// New Dashboard Overview DTOs
export interface DashboardOverviewDto {
  totalContracts: number;
  totalSamples: number;
  totalIndicators: number;
  totalNCRs: number;
  totalRevenue: number;
  onTimeTests: number;
  lateTests: number;
  pendingApproval: number;
}

export interface DashboardRecentRequestDto {
  id: string;
  contractNumber: string;
  customerName: string;
  pendingDate?: string;
  sampleCount: number;
  indicatorCount: number;
  totalCost: number;
  status: number;
}

export interface DashboardRecentRequestPagedResult {
  items: DashboardRecentRequestDto[];
  totalCount: number;
}

export interface RevenueByCustomerDto {
  customerName: string;
  totalSamples: number;
  totalIndicators: number;
  revenue: number;
}

export interface RevenueByCustomerPagedResult {
  items: RevenueByCustomerDto[];
  totalCount: number;
}

export interface MonthlyRevenueDto {
  month: number;
  monthName: string;
  contractCount: number;
  totalSamples: number;
  totalIndicators: number;
  revenue: number;
}

export interface RevenueByContactDto {
  contactPerson: string;
  totalSamples: number;
  totalIndicators: number;
  revenue: number;
}

export interface RevenueByContactPagedResult {
  items: RevenueByContactDto[];
  totalCount: number;
}

const BASE_URL = '/api/v1/dashboard';
const STATISTICS_URL = '/api/v1/statistics';

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummaryDto> => {
    const response = await api.get<DashboardSummaryDto>(`${BASE_URL}/summary`);
    return response.data;
  },

  getTestRequestsByStatus: async (): Promise<DashboardChartData> => {
    const response = await api.get<DashboardChartData>(`${BASE_URL}/test-requests-by-status`);
    return response.data;
  },

  getSpecimensByStatus: async (): Promise<DashboardChartData> => {
    const response = await api.get<DashboardChartData>(`${BASE_URL}/specimens-by-status`);
    return response.data;
  },

  getTestsByStatus: async (): Promise<DashboardChartData> => {
    const response = await api.get<DashboardChartData>(`${BASE_URL}/tests-by-status`);
    return response.data;
  },

  getMonthlyTestRequests: async (year?: number): Promise<DashboardChartData> => {
    const params = year ? { year } : {};
    const response = await api.get<DashboardChartData>(`${BASE_URL}/monthly-test-requests`, { params });
    return response.data;
  },

  getRecentActivities: async (count?: number): Promise<RecentActivityDto[]> => {
    const params = count ? { count } : {};
    const response = await api.get<RecentActivityDto[]>(`${BASE_URL}/recent-activities`, { params });
    return response.data;
  },

  getTestResultsApprovalStatus: async (): Promise<DashboardChartData> => {
    const response = await api.get<DashboardChartData>(`${BASE_URL}/test-results-approval-status`);
    return response.data;
  },

  getNCRsBySeverity: async (): Promise<DashboardChartData> => {
    const response = await api.get<DashboardChartData>(`${BASE_URL}/ncrs-by-severity`);
    return response.data;
  },

  // Additional methods for dashboard widgets
  getRecentRequests: async (count?: number): Promise<any[]> => {
    try {
      const params = { limit: count || 5, sorting: 'creationTime desc' };
      const response = await api.get('/api/v1/test-requests', { params });
      return response.data.items || [];
    } catch {
      return [];
    }
  },

  getPendingApprovals: async (count?: number): Promise<any[]> => {
    try {
      const params = { limit: count || 5 };
      const response = await api.get('/api/v1/test-results/pending-review', { params });
      return response.data.items || [];
    } catch {
      return [];
    }
  },

  // Statistics API endpoints
  getOverview: async (): Promise<any> => {
    const response = await api.get(`${STATISTICS_URL}/overview`);
    return response.data;
  },

  getTestRequestStatistics: async (startDate?: string, endDate?: string): Promise<any> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`${STATISTICS_URL}/test-requests`, { params });
    return response.data;
  },

  getSpecimenStatistics: async (startDate?: string, endDate?: string): Promise<any> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`${STATISTICS_URL}/specimens`, { params });
    return response.data;
  },

  getPerformanceMetrics: async (): Promise<any> => {
    const response = await api.get(`${STATISTICS_URL}/performance`);
    return response.data;
  },

  // New Dashboard Overview APIs
  getDashboardOverview: async (fromDate: string, toDate: string): Promise<DashboardOverviewDto> => {
    const response = await api.get<DashboardOverviewDto>(`${BASE_URL}/overview`, {
      params: { fromDate, toDate }
    });
    return response.data;
  },

  getDashboardRecentRequests: async (
    customerName?: string,
    skipCount: number = 0,
    maxResultCount: number = 10
  ): Promise<DashboardRecentRequestPagedResult> => {
    const response = await api.get<DashboardRecentRequestPagedResult>(`${BASE_URL}/recent-requests`, {
      params: { customerName, skipCount, maxResultCount }
    });
    return response.data;
  },

  getRevenueByCustomer: async (
    skipCount: number = 0,
    maxResultCount: number = 10
  ): Promise<RevenueByCustomerPagedResult> => {
    const response = await api.get<RevenueByCustomerPagedResult>(`${BASE_URL}/revenue-by-customer`, {
      params: { skipCount, maxResultCount }
    });
    return response.data;
  },

  getMonthlyRevenue: async (customerName: string, year: number): Promise<MonthlyRevenueDto[]> => {
    const response = await api.get<MonthlyRevenueDto[]>(`${BASE_URL}/monthly-revenue`, {
      params: { customerName, year }
    });
    return response.data;
  },

  getCustomerNames: async (): Promise<string[]> => {
    const response = await api.get<string[]>(`${BASE_URL}/customer-names`);
    return response.data;
  },

  getRevenueByContact: async (
    skipCount: number = 0,
    maxResultCount: number = 10
  ): Promise<RevenueByContactPagedResult> => {
    const response = await api.get<RevenueByContactPagedResult>(`${BASE_URL}/revenue-by-contact`, {
      params: { skipCount, maxResultCount }
    });
    return response.data;
  },

  getMonthlyRevenueByContact: async (contactPerson: string, year: number): Promise<MonthlyRevenueDto[]> => {
    const response = await api.get<MonthlyRevenueDto[]>(`${BASE_URL}/monthly-revenue-by-contact`, {
      params: { contactPerson, year }
    });
    return response.data;
  },

  getContactPersonNames: async (): Promise<string[]> => {
    const response = await api.get<string[]>(`${BASE_URL}/contact-person-names`);
    return response.data;
  },
};

export default dashboardService;
