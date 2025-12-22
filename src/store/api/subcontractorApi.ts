import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import { PagedResultDto } from '../../services/api';

const BASE_URL = '/api/v1/subcontractors';

export interface SubcontractorCertificationDto {
  id: string;
  subcontractorId: string;
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  certificateNumber?: string;
  filePath?: string;
}

export interface SubcontractorDto {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  taxCode?: string;
  isActive: boolean;
  capabilities?: string;
  evaluationScore?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
  certifications?: SubcontractorCertificationDto[];
  creationTime: string;
  lastModificationTime?: string;
}

export interface CreateUpdateSubcontractorDto {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  taxCode?: string;
  isActive?: boolean;
  capabilities?: string | null;
  evaluationScore?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
}

export interface SubcontractorListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
  isActive?: boolean;
}

export const subcontractorApi = createApi({
  reducerPath: 'subcontractorApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Subcontractor'],
  endpoints: (builder) => ({
    getSubcontractorList: builder.query<PagedResultDto<SubcontractorDto>, SubcontractorListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Subcontractor' as const, id })),
              { type: 'Subcontractor', id: 'LIST' },
            ]
          : [{ type: 'Subcontractor', id: 'LIST' }],
    }),

    getSubcontractor: builder.query<SubcontractorDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Subcontractor', id }],
    }),

    getActiveSubcontractors: builder.query<SubcontractorDto[], void>({
      query: () => `${BASE_URL}/active`,
      providesTags: [{ type: 'Subcontractor', id: 'ACTIVE' }],
    }),

    createSubcontractor: builder.mutation<SubcontractorDto, CreateUpdateSubcontractorDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Subcontractor', id: 'LIST' },
        { type: 'Subcontractor', id: 'ACTIVE' },
      ],
    }),

    updateSubcontractor: builder.mutation<SubcontractorDto, { id: string; data: CreateUpdateSubcontractorDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Subcontractor', id },
        { type: 'Subcontractor', id: 'LIST' },
        { type: 'Subcontractor', id: 'ACTIVE' },
      ],
    }),

    deleteSubcontractor: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Subcontractor', id: 'LIST' },
        { type: 'Subcontractor', id: 'ACTIVE' },
      ],
    }),
  }),
});

export const {
  useGetSubcontractorListQuery,
  useLazyGetSubcontractorListQuery,
  useGetSubcontractorQuery,
  useLazyGetSubcontractorQuery,
  useGetActiveSubcontractorsQuery,
  useCreateSubcontractorMutation,
  useUpdateSubcontractorMutation,
  useDeleteSubcontractorMutation,
} = subcontractorApi;

export default subcontractorApi;
