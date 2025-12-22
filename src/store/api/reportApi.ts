import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';

// DTO interfaces
export interface ReportDto {
  id: string;
  reportNumber: string;
  title: string;
  testRequestId: string;
  testRequestNumber?: string;
  customerId?: string;
  customerName: string;
  specimenIds?: string;
  testIds?: string;
  specimenCodes?: string[];
  testCount?: number;
  status: ReportStatus;
  reportDate: string;
  issuedDate?: string;
  preparedById?: string;
  preparedByName?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedDate?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: string;
  qrCode?: string;
  pdfPath?: string;
  isEmailSent: boolean;
  emailSentDate?: string;
  notes?: string;
  creationTime: string;
  lastModificationTime?: string;
}

export enum ReportStatus {
  Draft = 0,
  PendingReview = 1,
  Reviewed = 2,
  Approved = 3,
  Issued = 4,
  Rejected = 5,
}

export interface CreateReportDto {
  title: string;
  testRequestId: string;
  customerId?: string;
  customerName: string;
  specimenIds?: string;
  testIds?: string;
  notes?: string;
}

export interface UpdateReportDto {
  title: string;
  customerId?: string;
  customerName: string;
  specimenIds?: string;
  testIds?: string;
  notes?: string;
}

export interface ReviewReportDto {
  comments?: string;
}

export interface ApproveReportDto {
  comments?: string;
}

export interface RejectReportDto {
  reason: string;
}

export interface SendEmailDto {
  email: string;
}

export interface VerifyReportDto {
  isValid: boolean;
  reportNumber: string;
  title: string;
  customerName: string;
  status: ReportStatus;
  issuedDate?: string;
  message: string;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface ReportListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: ReportStatus;
}

export const reportApi = createApi({
  reducerPath: 'reportApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    getReportList: builder.query<PagedResultDto<ReportDto>, ReportListParams | void>({
      query: (params) => ({
        url: '/api/v1/reports',
        params: params ? toAbpParams(params) : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Report' as const, id })),
              { type: 'Report', id: 'LIST' },
            ]
          : [{ type: 'Report', id: 'LIST' }],
    }),

    getReport: builder.query<ReportDto, string>({
      query: (id) => `/api/v1/reports/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Report', id }],
    }),

    createReport: builder.mutation<ReportDto, CreateReportDto>({
      query: (data) => ({
        url: '/api/v1/reports',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }],
    }),

    updateReport: builder.mutation<ReportDto, { id: string; data: UpdateReportDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/reports/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    deleteReport: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }],
    }),

    submitReportForReview: builder.mutation<ReportDto, string>({
      query: (id) => ({
        url: `/api/v1/reports/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    reviewReport: builder.mutation<ReportDto, { id: string; data?: ReviewReportDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/reports/${id}/review`,
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    approveReport: builder.mutation<ReportDto, { id: string; data?: ApproveReportDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/reports/${id}/approve`,
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    rejectReport: builder.mutation<ReportDto, { id: string; data: RejectReportDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/reports/${id}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    issueReport: builder.mutation<ReportDto, string>({
      query: (id) => ({
        url: `/api/v1/reports/${id}/issue`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
      ],
    }),

    sendReportEmail: builder.mutation<void, { id: string; data: SendEmailDto }>({
      query: ({ id, data }) => ({
        url: `/api/v1/reports/${id}/send-email`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Report', id }],
    }),

    verifyReport: builder.query<VerifyReportDto, string>({
      query: (reportNumber) => `/api/v1/reports/verify/${reportNumber}`,
    }),

    getReportsByTestRequest: builder.query<ReportDto[], string>({
      query: (testRequestId) => `/api/v1/reports/by-test-request/${testRequestId}`,
      providesTags: [{ type: 'Report', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetReportListQuery,
  useGetReportQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useSubmitReportForReviewMutation,
  useReviewReportMutation,
  useApproveReportMutation,
  useRejectReportMutation,
  useIssueReportMutation,
  useSendReportEmailMutation,
  useVerifyReportQuery,
  useGetReportsByTestRequestQuery,
} = reportApi;
