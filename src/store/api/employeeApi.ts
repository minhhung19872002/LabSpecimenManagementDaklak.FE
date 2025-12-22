import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import { PagedResultDto } from '../../services/api';

const BASE_URL = '/api/app/employee';

export interface EmployeeDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  departmentId: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface CreateEmployeeDto {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  departmentId: string;
  position?: string;
  isActive?: boolean;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  departmentId?: string;
  position?: string;
  isActive?: boolean;
}

export interface EmployeeListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
  departmentId?: string;
  role?: string;
  isActive?: boolean;
}

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Employee'],
  endpoints: (builder) => ({
    getEmployeeList: builder.query<PagedResultDto<EmployeeDto>, EmployeeListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Employee' as const, id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    getEmployee: builder.query<EmployeeDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'Employee', id }],
    }),

    createEmployee: builder.mutation<EmployeeDto, CreateEmployeeDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    updateEmployee: builder.mutation<EmployeeDto, { id: string; data: UpdateEmployeeDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),

    deleteEmployee: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    toggleEmployeeActive: builder.mutation<EmployeeDto, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `${BASE_URL}/${id}/toggle-active`,
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),

    resetEmployeePassword: builder.mutation<{ password: string }, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}/reset-password`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetEmployeeListQuery,
  useLazyGetEmployeeListQuery,
  useGetEmployeeQuery,
  useLazyGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useToggleEmployeeActiveMutation,
  useResetEmployeePasswordMutation,
} = employeeApi;

export default employeeApi;
