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

export interface TATStatusDto {
  onTimeCount: number;
  lateCount: number;
}

export interface LabStatisticsDto {
  labId: string;
  labName: string;
  inProgressCount: number;
  pendingCount: number;
  technicianCount: number;
}

export interface TechnicianWorkDto {
  technicianId: string;
  technicianName: string;
  testingCount: number;
  notTestedCount: number;
  waitingApprovalCount: number;
  rejectedCount: number;
  approvedCount: number;
  totalCount: number;
}

export interface DepartmentWorkAssignmentDto {
  labId: string;
  labName: string;
  totalIndicators: number;
  technicians: TechnicianWorkDto[];
}

export interface RegionalBubbleDto {
  ward: string;
  totalRevenue: number;
  totalSamples: number;
  totalIndicators: number;
}

export interface StatisticsDataDto {
  overview: StatisticsOverviewDto;
  sampleMatrix: SampleMatrixDto[];
  tatCompliance: TATComplianceDto[];
  workloadByDepartment: WorkloadByDepartmentDto[];
  monthlyTrends: MonthlyTrendDto[];
  labStatistics: LabStatisticsDto[];
  tatStatus: TATStatusDto;
  departmentWorkAssignments: DepartmentWorkAssignmentDto[];
  regionalBubbles: RegionalBubbleDto[];
}

export interface StatisticsQueryParams {
  fromDate?: string;
  toDate?: string;
}

const BASE_URL = '/api/v1/statistics';

// ---- LabReport DTOs ----

export interface LabDailyStatDto {
  date: string;         // "2026-07-01"
  sampleCount: number;
  revenue: number;
}

export interface ContractMonthlyIndicatorDto {
  testRequestId: string;
  requestNumber: string;
  contractDate?: string;
  createdAt: string;
  month: number;
  year: number;
  indicatorCount: number;
}

export interface LabContractSummaryDto {
  testRequestId: string;
  requestNumber: string;
  contractDate?: string;
  sampleCount: number;
  indicatorCount: number;
  totalPrice: number;
}

export interface LabReportDataDto {
  dailyStats: LabDailyStatDto[];
  contractIndicators: ContractMonthlyIndicatorDto[];
  contracts: LabContractSummaryDto[];
}

export interface SamplePriceItemDto {
  sampleCode: string;
  price: number;
}

export interface LabContractDetailDto {
  requestNumber: string;
  contractDate?: string;
  totalSamples: number;
  totalPrice: number;
  samples: SamplePriceItemDto[];
}

export interface LabReportQueryParams {
  labId: string;
  fromDate: string;
  toDate: string;
}

// ---- Services ----

const LAB_REPORT_URL = '/api/v1/lab-report';

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

  // Get lab report data (daily stats + contract list)
  getLabReportData: async (params: LabReportQueryParams): Promise<LabReportDataDto> => {
    const response = await api.get<LabReportDataDto>(LAB_REPORT_URL, { params });
    return response.data;
  },

  // Get contract detail (samples + prices)
  getLabContractDetail: async (testRequestId: string, labId: string): Promise<LabContractDetailDto> => {
    const response = await api.get<LabContractDetailDto>(`${LAB_REPORT_URL}/contract/${testRequestId}`, {
      params: { labId },
    });
    return response.data;
  },

  // Export lab report to Excel
  exportLabReport: async (params: LabReportQueryParams): Promise<Blob> => {
    const response = await api.download(`${LAB_REPORT_URL}/export`, { params });
    return response.data;
  },
};

export default statisticsService;
