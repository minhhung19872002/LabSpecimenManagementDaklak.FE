import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import {
  TestRequestDto,
  CreateTestRequestDto,
  UpdateTestRequestDto,
  PagedResultDto,
  TestRequestStatus,
} from '../../types/testRequest';

const BASE_URL = '/api/v1/test-requests';

// Extended params interface for search and filter
export interface TestRequestListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: TestRequestStatus;
  expectedCompletionDateFrom?: string;
  expectedCompletionDateTo?: string;
}

// Sample selection DTO for BM01 result form
export interface SampleForSelectionDto {
  id: string;
  sampleCode: string;
  sampleName: string;
  testingStatus: string;
  canGenerateResult: boolean;
  requestedCompletionDate?: string;
}

export const testRequestApi = createApi({
  reducerPath: 'testRequestApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TestRequest', 'Sample'],
  endpoints: (builder) => ({
    // Get filtered and paged list of test requests
    getTestRequestList: builder.query<PagedResultDto<TestRequestDto>, TestRequestListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'TestRequest' as const, id })),
              { type: 'TestRequest', id: 'LIST' },
            ]
          : [{ type: 'TestRequest', id: 'LIST' }],
    }),

    // Get single test request by ID
    getTestRequest: builder.query<TestRequestDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'TestRequest', id }],
    }),

    // Create test request
    createTestRequest: builder.mutation<TestRequestDto, CreateTestRequestDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'TestRequest', id: 'LIST' }],
    }),

    // Update test request
    updateTestRequest: builder.mutation<TestRequestDto, { id: string; data: UpdateTestRequestDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestRequest', id },
        { type: 'TestRequest', id: 'LIST' },
      ],
    }),

    // Delete test request
    deleteTestRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'TestRequest', id: 'LIST' }],
    }),

    // ============= Result Form APIs =============

    // Generate result form
    generateResultForm: builder.mutation<
      { fileName: string; sampleCode: string },
      { testRequestId: string; sampleId: string }
    >({
      query: ({ testRequestId, sampleId }) => ({
        url: '/api/v1/result-forms/generate',
        method: 'POST',
        body: { testRequestId, sampleId },
      }),
    }),

    // Get result form editor config
    getResultFormEditorConfig: builder.query<any, string>({
      query: (fileName) => `/api/v1/result-forms/editor-config/${encodeURIComponent(fileName)}`,
    }),

    // Get samples for result form selection
    getSamplesForResultForm: builder.query<SampleForSelectionDto[], string>({
      query: (testRequestId) => `/api/v1/result-forms/samples-for-selection/${testRequestId}`,
      providesTags: (_, __, testRequestId) => [{ type: 'Sample', id: `TR_${testRequestId}` }],
    }),

    // Generate BM01 result form
    generateBM01ResultForm: builder.mutation<
      { fileName: string; sampleCode: string },
      { testRequestId: string; sampleId: string }
    >({
      query: ({ testRequestId, sampleId }) => ({
        url: '/api/v1/result-forms/generate-bm01',
        method: 'POST',
        body: { testRequestId, sampleId },
      }),
    }),

    // Generate test request form (BM05)
    generateTestRequestForm: builder.mutation<
      { fileName: string; requestNumber: string },
      string
    >({
      query: (testRequestId) => ({
        url: '/api/v1/result-forms/generate-test-request',
        method: 'POST',
        body: { testRequestId },
      }),
    }),

    // ============= Status Transition APIs =============

    // Print test request
    printTestRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}/print`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'TestRequest', id },
        { type: 'TestRequest', id: 'LIST' },
      ],
    }),

    // Update to pending approval
    updateToPendingApproval: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}/pending-approval`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'TestRequest', id },
        { type: 'TestRequest', id: 'LIST' },
      ],
    }),

    // Approve test request
    approveTestRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'TestRequest', id },
        { type: 'TestRequest', id: 'LIST' },
      ],
    }),

    // Send result
    sendResult: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}/send-result`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'TestRequest', id },
        { type: 'TestRequest', id: 'LIST' },
      ],
    }),

    // Complete test request
    completeTestRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'TestRequest', id },
        { type: 'TestRequest', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetTestRequestListQuery,
  useLazyGetTestRequestListQuery,
  useGetTestRequestQuery,
  useLazyGetTestRequestQuery,
  useCreateTestRequestMutation,
  useUpdateTestRequestMutation,
  useDeleteTestRequestMutation,
  // Result form hooks
  useGenerateResultFormMutation,
  useGetResultFormEditorConfigQuery,
  useLazyGetResultFormEditorConfigQuery,
  useGetSamplesForResultFormQuery,
  useLazyGetSamplesForResultFormQuery,
  useGenerateBM01ResultFormMutation,
  useGenerateTestRequestFormMutation,
  // Status transition hooks
  usePrintTestRequestMutation,
  useUpdateToPendingApprovalMutation,
  useApproveTestRequestMutation,
  useSendResultMutation,
  useCompleteTestRequestMutation,
} = testRequestApi;

export default testRequestApi;
