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
      const params = { limit: count || 5, sorting: 'requestDate desc' };
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
};

export default dashboardService;
