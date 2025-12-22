import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

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

export const statisticsApi = createApi({
  reducerPath: 'statisticsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Statistics'],
  endpoints: (builder) => ({
    getStatisticsOverview: builder.query<StatisticsOverviewDto, StatisticsQueryParams | void>({
      query: (params) => ({
        url: '/api/v1/statistics/overview',
        params: params || undefined,
      }),
      providesTags: ['Statistics'],
    }),

    getStatisticsData: builder.query<StatisticsDataDto, StatisticsQueryParams | void>({
      query: (params) => ({
        url: '/api/v1/statistics',
        params: params || undefined,
      }),
      providesTags: ['Statistics'],
    }),
  }),
});

export const {
  useGetStatisticsOverviewQuery,
  useGetStatisticsDataQuery,
} = statisticsApi;
