import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';
import {
  TestingDetailDto,
  GetTestingListInput,
  PagedTestingResult,
  SaveResultsInput,
  SubmitForApprovalInput,
  RejectionHistoryDto,
  TestingStatus,
  TestingTabType,
} from '../../types/testing';

const BASE_URL = '/api/v1/testing';

// Helper to convert params for API (ABP Framework uses PascalCase)
const toTestingApiParams = (params: GetTestingListInput) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.tab !== undefined) apiParams.Tab = params.tab;
  if (params.search) apiParams.Search = params.search;
  if (params.statuses && params.statuses.length > 0) {
    // ABP supports array params like Statuses[0]=0&Statuses[1]=1
    params.statuses.forEach((status, index) => {
      apiParams[`Statuses[${index}]`] = status;
    });
  }
  if (params.technicianIds && params.technicianIds.length > 0) {
    params.technicianIds.forEach((id, index) => {
      apiParams[`TechnicianIds[${index}]`] = id;
    });
  }
  if (params.laboratoryId) apiParams.LaboratoryId = params.laboratoryId;
  return apiParams;
};

export const testingApi = createApi({
  reducerPath: 'testingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Testing', 'TestingDetail', 'RejectionHistory'],
  endpoints: (builder) => ({
    // Get filtered and paged list of testing tasks
    getTestingList: builder.query<PagedTestingResult, GetTestingListInput>({
      query: (params) => ({
        url: BASE_URL,
        params: toTestingApiParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Testing' as const, id })),
              { type: 'Testing', id: 'LIST' },
            ]
          : [{ type: 'Testing', id: 'LIST' }],
    }),

    // Get testing task detail by LaboratoryTask ID
    getTestingDetail: builder.query<TestingDetailDto, { id: string; viewMode?: 'my' | 'all' }>({
      query: ({ id, viewMode }) => ({
        url: `${BASE_URL}/${id}`,
        params: viewMode ? { ViewMode: viewMode } : {},
      }),
      providesTags: (_, __, { id }) => [{ type: 'TestingDetail', id }],
    }),

    // Save results (draft) for indicators
    saveResults: builder.mutation<void, { id: string; input: SaveResultsInput }>({
      query: ({ id, input }) => ({
        url: `${BASE_URL}/${id}/save-results`,
        method: 'POST',
        body: input,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestingDetail', id },
        { type: 'Testing', id: 'LIST' },
      ],
    }),

    // Submit indicators for approval
    submitForApproval: builder.mutation<void, { id: string; input: SubmitForApprovalInput }>({
      query: ({ id, input }) => ({
        url: `${BASE_URL}/${id}/submit-approval`,
        method: 'POST',
        body: input,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'TestingDetail', id },
        { type: 'Testing', id: 'LIST' },
      ],
    }),

    // Get rejection history for an indicator
    getRejectionHistory: builder.query<RejectionHistoryDto[], string>({
      query: (indicatorId) => `${BASE_URL}/indicators/${indicatorId}/rejection-history`,
      providesTags: (_, __, indicatorId) => [{ type: 'RejectionHistory', id: indicatorId }],
    }),
  }),
});

// Export hooks
export const {
  useGetTestingListQuery,
  useLazyGetTestingListQuery,
  useGetTestingDetailQuery,
  useLazyGetTestingDetailQuery,
  useSaveResultsMutation,
  useSubmitForApprovalMutation,
  useGetRejectionHistoryQuery,
  useLazyGetRejectionHistoryQuery,
} = testingApi;

// Re-export types for convenience
export type { TestingStatus, TestingTabType };

export default testingApi;
