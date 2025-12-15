import { api } from './api';

// DTO interfaces matching backend
export interface StatisticsOverviewDto {
  totalTestRequests: number;
  totalSpecimens: number;
  totalTests: number;
  totalReports: number;
  completionRate: number;
  tatComplianceRate: number;
}

export interface SampleMatrixDto {
  specimenType: string;
  totalCount: number;
  receivedCount: number;
  testingCount: number;
  completedCount: number;
}

export interface TATComplianceDto {
  period: string;
  totalRequests: number;
  onTimeRequests: number;
  delayedRequests: number;
  complianceRate: number;
}

export interface WorkloadByDepartmentDto {
  department: string;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface MonthlyTrendDto {
  month: string;
  testRequests: number;
  specimens: number;
  tests: number;
  reports: number;
}

export interface StatisticsDataDto {
  overview: StatisticsOverviewDto;
  sampleMatrix: SampleMatrixDto[];
  tatCompliance: TATComplianceDto[];
  workloadByDepartment: WorkloadByDepartmentDto[];
  monthlyTrends: MonthlyTrendDto[];
}

export interface StatisticsQueryParams {
  fromDate?: string;
  toDate?: string;
}

const BASE_URL = '/api/v1/statistics';

export const statisticsService = {
  // Get overview statistics
  getOverview: async (params?: StatisticsQueryParams): Promise<StatisticsOverviewDto> => {
    const response = await api.get<StatisticsOverviewDto>(`${BASE_URL}/overview`, { params });
    return response.data;
  },

  // Get full statistics data
  getStatisticsData: async (params?: StatisticsQueryParams): Promise<StatisticsDataDto> => {
    const response = await api.get<StatisticsDataDto>(BASE_URL, { params });
    return response.data;
  },

  // Export statistics to Excel
  exportToExcel: async (params?: StatisticsQueryParams): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/export`, { params });
    return response.data;
  },
};

export default statisticsService;
