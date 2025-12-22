import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import {
  SpecimenDto,
  CreateSpecimenDto,
  UpdateSpecimenDto,
  PagedResultDto,
  SpecimenStatus,
} from '../../types/specimen';

const BASE_URL = '/api/v1/specimens';

// Extended params interface for search and filter
export interface SpecimenListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: SpecimenStatus;
  type?: string;
}

// Interface for creating multiple specimens
export interface CreateManySpecimensDto {
  testRequestId: string;
  specimens: {
    code?: string;
    name: string;
    type: string;
    receivedDate: string;
    quantity: number;
    unit: string;
    status?: number;
  }[];
  storageLocation?: string;
  storageCondition?: string;
  description?: string;
}

export interface CreateManyResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  createdSpecimens: SpecimenDto[];
  errors: string[];
  success: boolean;
}

export const specimenApi = createApi({
  reducerPath: 'specimenApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Specimen'],
  endpoints: (builder) => ({
    // Get filtered and paged list of specimens
    getSpecimenList: builder.query<PagedResultDto<SpecimenDto>, SpecimenListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Specimen' as const, id })),
              { type: 'Specimen', id: 'LIST' },
            ]
          : [{ type: 'Specimen', id: 'LIST' }],
    }),

    // Get single specimen by ID
    getSpecimen: builder.query<SpecimenDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Specimen', id }],
    }),

    // Get specimens by test request ID
    getSpecimensByTestRequest: builder.query<SpecimenDto[], string>({
      query: (testRequestId) => `${BASE_URL}/by-test-request/${testRequestId}`,
      providesTags: (_, __, testRequestId) => [{ type: 'Specimen', id: `TR_${testRequestId}` }],
    }),

    // Create single specimen
    createSpecimen: builder.mutation<SpecimenDto, CreateSpecimenDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Specimen', id: 'LIST' }],
    }),

    // Create multiple specimens
    createManySpecimens: builder.mutation<CreateManyResult, CreateManySpecimensDto>({
      query: (data) => ({
        url: `${BASE_URL}/create-many`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Specimen', id: 'LIST' }],
    }),

    // Update specimen
    updateSpecimen: builder.mutation<SpecimenDto, { id: string; data: UpdateSpecimenDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Specimen', id },
        { type: 'Specimen', id: 'LIST' },
      ],
    }),

    // Delete specimen
    deleteSpecimen: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Specimen', id: 'LIST' }],
    }),
  }),
});

// Export hooks
export const {
  useGetSpecimenListQuery,
  useLazyGetSpecimenListQuery,
  useGetSpecimenQuery,
  useLazyGetSpecimenQuery,
  useGetSpecimensByTestRequestQuery,
  useLazyGetSpecimensByTestRequestQuery,
  useCreateSpecimenMutation,
  useCreateManySpecimensMutation,
  useUpdateSpecimenMutation,
  useDeleteSpecimenMutation,
} = specimenApi;

export default specimenApi;
