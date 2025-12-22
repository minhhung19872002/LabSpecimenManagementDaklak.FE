import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// Types
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

export interface RecentRequestDto {
  id: string;
  requestNumber: string;
  customerName: string;
  status: string | number;
  requestDate: string;
}

export interface PendingApprovalDto {
  id: string;
  testCode: string;
  parameter: string;
  approvalStatus: number;
}

const BASE_URL = '/api/v1/dashboard';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['DashboardSummary', 'RecentActivities', 'RecentRequests', 'PendingApprovals'],
  endpoints: (builder) => ({
    // Get dashboard summary
    getDashboardSummary: builder.query<DashboardSummaryDto, void>({
      query: () => `${BASE_URL}/summary`,
      providesTags: ['DashboardSummary'],
    }),

    // Get recent activities
    getRecentActivities: builder.query<RecentActivityDto[], number | void>({
      query: (count) => ({
        url: `${BASE_URL}/recent-activities`,
        params: count ? { count } : {},
      }),
      providesTags: ['RecentActivities'],
    }),

    // Get recent requests (from test-requests API)
    getRecentRequests: builder.query<RecentRequestDto[], number | void>({
      query: (count) => ({
        url: '/api/v1/test-requests',
        params: {
          limit: count || 5,
          sorting: 'requestDate desc',
          MaxResultCount: count || 5,
        },
      }),
      transformResponse: (response: { items: RecentRequestDto[] } | RecentRequestDto[]) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response?.items || [];
      },
      providesTags: ['RecentRequests'],
    }),

    // Get pending approvals
    getPendingApprovals: builder.query<PendingApprovalDto[], number | void>({
      query: (count) => ({
        url: '/api/v1/test-results/pending-review',
        params: { limit: count || 5 },
      }),
      transformResponse: (response: { items: PendingApprovalDto[] } | PendingApprovalDto[]) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response?.items || [];
      },
      providesTags: ['PendingApprovals'],
    }),

    // Get test requests by status (chart data)
    getTestRequestsByStatus: builder.query<DashboardChartData, void>({
      query: () => `${BASE_URL}/test-requests-by-status`,
    }),

    // Get specimens by status (chart data)
    getSpecimensByStatus: builder.query<DashboardChartData, void>({
      query: () => `${BASE_URL}/specimens-by-status`,
    }),

    // Get tests by status (chart data)
    getTestsByStatus: builder.query<DashboardChartData, void>({
      query: () => `${BASE_URL}/tests-by-status`,
    }),

    // Get monthly test requests (chart data)
    getMonthlyTestRequests: builder.query<DashboardChartData, number | void>({
      query: (year) => ({
        url: `${BASE_URL}/monthly-test-requests`,
        params: year ? { year } : {},
      }),
    }),
  }),
});

// Export hooks
export const {
  useGetDashboardSummaryQuery,
  useLazyGetDashboardSummaryQuery,
  useGetRecentActivitiesQuery,
  useLazyGetRecentActivitiesQuery,
  useGetRecentRequestsQuery,
  useLazyGetRecentRequestsQuery,
  useGetPendingApprovalsQuery,
  useLazyGetPendingApprovalsQuery,
  useGetTestRequestsByStatusQuery,
  useGetSpecimensByStatusQuery,
  useGetTestsByStatusQuery,
  useGetMonthlyTestRequestsQuery,
} = dashboardApi;

export default dashboardApi;
