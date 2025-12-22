import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import {
  SpecimenHistoryDto,
  CreateSpecimenHistoryDto,
  UpdateSpecimenHistoryDto,
  SpecimenStatus,
} from '../../types/specimenHistory';
import { PagedResultDto } from '../../services/api';

const BASE_URL = '/api/v1/specimen-histories';

export interface SpecimenHistoryListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: SpecimenStatus;
  specimenId?: string;
  action?: string;
}

export const specimenHistoryApi = createApi({
  reducerPath: 'specimenHistoryApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['SpecimenHistory'],
  endpoints: (builder) => ({
    getSpecimenHistoryList: builder.query<PagedResultDto<SpecimenHistoryDto>, SpecimenHistoryListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'SpecimenHistory' as const, id })),
              { type: 'SpecimenHistory', id: 'LIST' },
            ]
          : [{ type: 'SpecimenHistory', id: 'LIST' }],
    }),

    getSpecimenHistory: builder.query<SpecimenHistoryDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'SpecimenHistory', id }],
    }),

    getSpecimenHistoriesBySpecimen: builder.query<SpecimenHistoryDto[], string>({
      query: (specimenId) => `${BASE_URL}/by-specimen/${specimenId}`,
      transformResponse: (response: { items: SpecimenHistoryDto[] }) => response.items,
      providesTags: (_, __, specimenId) => [{ type: 'SpecimenHistory', id: `SPECIMEN_${specimenId}` }],
    }),

    createSpecimenHistory: builder.mutation<SpecimenHistoryDto, CreateSpecimenHistoryDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'SpecimenHistory', id: 'LIST' }],
    }),

    updateSpecimenHistory: builder.mutation<SpecimenHistoryDto, { id: string; data: UpdateSpecimenHistoryDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'SpecimenHistory', id },
        { type: 'SpecimenHistory', id: 'LIST' },
      ],
    }),

    deleteSpecimenHistory: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'SpecimenHistory', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSpecimenHistoryListQuery,
  useLazyGetSpecimenHistoryListQuery,
  useGetSpecimenHistoryQuery,
  useLazyGetSpecimenHistoryQuery,
  useGetSpecimenHistoriesBySpecimenQuery,
  useLazyGetSpecimenHistoriesBySpecimenQuery,
  useCreateSpecimenHistoryMutation,
  useUpdateSpecimenHistoryMutation,
  useDeleteSpecimenHistoryMutation,
} = specimenHistoryApi;

export default specimenHistoryApi;
