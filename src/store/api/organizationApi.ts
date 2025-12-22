import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import { PagedResultDto } from '../../services/api';

const BASE_URL = '/api/app/organization';

export interface OrganizationDto {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  creationTime?: string;
  lastModificationTime?: string;
}

export interface CreateUpdateOrganizationDto {
  name: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface OrganizationListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  isActive?: boolean;
}

export const organizationApi = createApi({
  reducerPath: 'organizationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Organization'],
  endpoints: (builder) => ({
    getOrganizationList: builder.query<PagedResultDto<OrganizationDto>, OrganizationListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Organization' as const, id })),
              { type: 'Organization', id: 'LIST' },
            ]
          : [{ type: 'Organization', id: 'LIST' }],
    }),

    getOrganization: builder.query<OrganizationDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Organization', id }],
    }),

    getActiveOrganizations: builder.query<OrganizationDto[], void>({
      query: () => `${BASE_URL}/active-organizations`,
      providesTags: [{ type: 'Organization', id: 'ACTIVE' }],
    }),

    createOrganization: builder.mutation<OrganizationDto, CreateUpdateOrganizationDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Organization', id: 'LIST' }, { type: 'Organization', id: 'ACTIVE' }],
    }),

    updateOrganization: builder.mutation<OrganizationDto, { id: string; data: CreateUpdateOrganizationDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Organization', id },
        { type: 'Organization', id: 'LIST' },
        { type: 'Organization', id: 'ACTIVE' },
      ],
    }),

    deleteOrganization: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Organization', id: 'LIST' }, { type: 'Organization', id: 'ACTIVE' }],
    }),
  }),
});

export const {
  useGetOrganizationListQuery,
  useLazyGetOrganizationListQuery,
  useGetOrganizationQuery,
  useLazyGetOrganizationQuery,
  useGetActiveOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} = organizationApi;

export default organizationApi;
