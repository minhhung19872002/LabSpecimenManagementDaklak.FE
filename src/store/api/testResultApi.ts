import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import { PagedResultDto } from '../../services/api';
import {
  TestResultDto,
  CreateTestResultDto,
  UpdateTestResultDto,
  ResultApprovalStatus,
} from '../../types/testResult';

const BASE_URL = '/api/v1/test-results';

export interface TestResultListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  approvalStatus?: ResultApprovalStatus;
  isPass?: boolean;
  testId?: string;
}

export interface SubmitForReviewDto {
  comment?: string;
}

export interface ReviewResultDto {
  isApproved: boolean;
  comment?: string;
}

export interface ApproveResultDto {
  isApproved: boolean;
  comment?: string;
}

export interface RejectResultDto {
  reason: string;
}

export const testResultApi = createApi({
  reducerPath: 'testResultApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TestResult'],
  endpoints: (builder) => ({
    getTestResultList: builder.query<PagedResultDto<TestResultDto>, TestResultListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'TestResult' as const, id })),
              { type: 'TestResult', id: 'LIST' },
            ]
          : [{ type: 'TestResult', id: 'LIST' }],
    }),

    getTestResult: builder.query<TestResultDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'TestResult', id }],
    }),

    getTestResultsByTest: builder.query<TestResultDto[], string>({
      query: (testId) => `${BASE_URL}/by-test/${testId}`,
      providesTags: (_, __, testId) => [{ type: 'TestResult', id: `TEST_${testId}` }],
    }),

    createTestResult: builder.mutation<TestResultDto, CreateTestResultDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'TestResult', id: 'LIST' }],
    }),

    updateTestResult: builder.mutation<TestResultDto, { id: string; data: UpdateTestResultDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestResult', id },
        { type: 'TestResult', id: 'LIST' },
      ],
    }),

    deleteTestResult: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'TestResult', id: 'LIST' }],
    }),

    // Workflow endpoints
    submitForReview: builder.mutation<TestResultDto, { id: string; data?: SubmitForReviewDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}/submit`,
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestResult', id },
        { type: 'TestResult', id: 'LIST' },
        { type: 'TestResult', id: 'PENDING_REVIEW' },
      ],
    }),

    reviewResult: builder.mutation<TestResultDto, { id: string; data: ReviewResultDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}/review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestResult', id },
        { type: 'TestResult', id: 'LIST' },
        { type: 'TestResult', id: 'PENDING_REVIEW' },
        { type: 'TestResult', id: 'PENDING_APPROVAL' },
      ],
    }),

    approveResult: builder.mutation<TestResultDto, { id: string; data: ApproveResultDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestResult', id },
        { type: 'TestResult', id: 'LIST' },
        { type: 'TestResult', id: 'PENDING_APPROVAL' },
      ],
    }),

    rejectResult: builder.mutation<TestResultDto, { id: string; data: RejectResultDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestResult', id },
        { type: 'TestResult', id: 'LIST' },
      ],
    }),

    getPendingReviewList: builder.query<PagedResultDto<TestResultDto>, { skipCount?: number; maxResultCount?: number; sorting?: string }>({
      query: (params) => ({
        url: `${BASE_URL}/pending-review`,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'TestResult', id: 'PENDING_REVIEW' }],
    }),

    getPendingApprovalList: builder.query<PagedResultDto<TestResultDto>, { skipCount?: number; maxResultCount?: number; sorting?: string }>({
      query: (params) => ({
        url: `${BASE_URL}/pending-approval`,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'TestResult', id: 'PENDING_APPROVAL' }],
    }),
  }),
});

export const {
  useGetTestResultListQuery,
  useLazyGetTestResultListQuery,
  useGetTestResultQuery,
  useLazyGetTestResultQuery,
  useGetTestResultsByTestQuery,
  useCreateTestResultMutation,
  useUpdateTestResultMutation,
  useDeleteTestResultMutation,
  useSubmitForReviewMutation,
  useReviewResultMutation,
  useApproveResultMutation,
  useRejectResultMutation,
  useGetPendingReviewListQuery,
  useGetPendingApprovalListQuery,
} = testResultApi;

export default testResultApi;
