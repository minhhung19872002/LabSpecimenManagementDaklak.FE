import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import { TestDto, CreateTestDto, UpdateTestDto, TestStatus } from '../../types/test';
import { PagedResultDto } from '../../services/api';

const BASE_URL = '/api/v1/tests';

export interface TestListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: TestStatus;
  specimenId?: string;
  method?: string;
}

export const testApi = createApi({
  reducerPath: 'testApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Test'],
  endpoints: (builder) => ({
    getTestList: builder.query<PagedResultDto<TestDto>, TestListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Test' as const, id })),
              { type: 'Test', id: 'LIST' },
            ]
          : [{ type: 'Test', id: 'LIST' }],
    }),

    getTest: builder.query<TestDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Test', id }],
    }),

    getTestsBySpecimen: builder.query<TestDto[], string>({
      query: (specimenId) => `${BASE_URL}/by-specimen/${specimenId}`,
      providesTags: (_, __, specimenId) => [{ type: 'Test', id: `SPECIMEN_${specimenId}` }],
    }),

    createTest: builder.mutation<TestDto, CreateTestDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Test', id: 'LIST' }],
    }),

    updateTest: builder.mutation<TestDto, { id: string; data: UpdateTestDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Test', id },
        { type: 'Test', id: 'LIST' },
      ],
    }),

    deleteTest: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Test', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTestListQuery,
  useLazyGetTestListQuery,
  useGetTestQuery,
  useLazyGetTestQuery,
  useGetTestsBySpecimenQuery,
  useLazyGetTestsBySpecimenQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
} = testApi;

export default testApi;
