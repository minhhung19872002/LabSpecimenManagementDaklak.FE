import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import { PagedResultDto } from '../../services/api';

const BASE_URL = '/api/v1/ncrs';

// NCR Types and Enums
export enum NCRType {
  Equipment = 0,
  Process = 1,
  Personnel = 2,
  Environment = 3,
  Material = 4,
  Other = 5,
}

export enum NCRSeverity {
  Minor = 0,
  Major = 1,
  Critical = 2,
}

export enum NCRStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
  Closed = 3,
  Cancelled = 4,
}

export interface NCRDto {
  id: string;
  ncrNumber: string;
  title: string;
  description: string;
  type: NCRType;
  severity: NCRSeverity;
  status: NCRStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  department?: string;
  reportedById: string;
  reportedAt: string;
  assignedToId?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  dueDate: string;
  closedById?: string;
  closedAt?: string;
  notes?: string;
  creationTime: string;
  lastModificationTime?: string;
}

export interface CreateNCRDto {
  title: string;
  description: string;
  type: NCRType;
  severity: NCRSeverity;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  department?: string;
  dueDate: string;
  notes?: string;
}

export interface UpdateNCRDto {
  title: string;
  description: string;
  type: NCRType;
  severity: NCRSeverity;
  status: NCRStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  department?: string;
  assignedToId?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  dueDate: string;
  notes?: string;
}

export interface CloseNCRDto {
  resolutionNotes?: string;
}

export interface AssignNCRDto {
  assignedToId: string;
}

export interface NCRListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export const ncrApi = createApi({
  reducerPath: 'ncrApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['NCR'],
  endpoints: (builder) => ({
    getNCRList: builder.query<PagedResultDto<NCRDto>, NCRListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'NCR' as const, id })),
              { type: 'NCR', id: 'LIST' },
            ]
          : [{ type: 'NCR', id: 'LIST' }],
    }),

    getNCR: builder.query<NCRDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'NCR', id }],
    }),

    getOpenNCRs: builder.query<NCRDto[], void>({
      query: () => `${BASE_URL}/open`,
      providesTags: [{ type: 'NCR', id: 'OPEN' }],
    }),

    createNCR: builder.mutation<NCRDto, CreateNCRDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'NCR', id: 'LIST' }, { type: 'NCR', id: 'OPEN' }],
    }),

    updateNCR: builder.mutation<NCRDto, { id: string; data: UpdateNCRDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'NCR', id },
        { type: 'NCR', id: 'LIST' },
        { type: 'NCR', id: 'OPEN' },
      ],
    }),

    deleteNCR: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'NCR', id: 'LIST' }, { type: 'NCR', id: 'OPEN' }],
    }),

    assignNCR: builder.mutation<NCRDto, { id: string; data: AssignNCRDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}/assign`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'NCR', id },
        { type: 'NCR', id: 'LIST' },
      ],
    }),

    closeNCR: builder.mutation<NCRDto, { id: string; data?: CloseNCRDto }>({
      query: ({ id, data = {} }) => ({
        url: `${BASE_URL}/${id}/close`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'NCR', id },
        { type: 'NCR', id: 'LIST' },
        { type: 'NCR', id: 'OPEN' },
      ],
    }),
  }),
});

export const {
  useGetNCRListQuery,
  useLazyGetNCRListQuery,
  useGetNCRQuery,
  useLazyGetNCRQuery,
  useGetOpenNCRsQuery,
  useCreateNCRMutation,
  useUpdateNCRMutation,
  useDeleteNCRMutation,
  useAssignNCRMutation,
  useCloseNCRMutation,
} = ncrApi;

export default ncrApi;
