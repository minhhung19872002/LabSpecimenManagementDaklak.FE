import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';

// Types
export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface UserLookupDto {
  id: string;
  userName: string;
  name?: string;
  surname?: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  departmentName?: string;
  isActive: boolean;
}

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
}

export interface UserListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
}

export interface PagedUserResult {
  items: UserDto[];
  totalCount: number;
}

const BASE_URL = '/api/app/user';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'UserLookup'],
  endpoints: (builder) => ({
    // Get user list
    getUserList: builder.query<PagedUserResult, UserListParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // Get single user
    getUser: builder.query<UserDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }],
    }),

    // Create user
    createUser: builder.mutation<UserDto, CreateUserDto>({
      query: (data) => ({
        url: BASE_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, { type: 'UserLookup', id: 'LIST' }],
    }),

    // Update user
    updateUser: builder.mutation<UserDto, { id: string; data: UpdateUserDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'UserLookup', id: 'LIST' },
      ],
    }),

    // Delete user
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, { type: 'UserLookup', id: 'LIST' }],
    }),

    // Toggle user active status
    toggleUserActive: builder.mutation<UserDto, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `${BASE_URL}/${id}/toggle-active`,
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'UserLookup', id: 'LIST' },
      ],
    }),

    // Reset user password
    resetUserPassword: builder.mutation<{ password: string }, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}/reset-password`,
        method: 'POST',
      }),
    }),

    // ============= User Lookup APIs =============

    // Get all active users for dropdown
    getUserLookup: builder.query<UserLookupDto[], void>({
      query: () => '/api/v1/users/lookup',
      transformResponse: (response: UserLookupDto[] | { items: UserLookupDto[] }) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response?.items || [];
      },
      providesTags: [{ type: 'UserLookup', id: 'LIST' }],
    }),

    // Search users by name or username
    searchUserLookup: builder.query<UserLookupDto[], string | undefined>({
      query: (filter) => ({
        url: '/api/v1/users/lookup/search',
        params: filter ? { filter } : {},
      }),
      transformResponse: (response: { items: UserLookupDto[] }) => response.items,
    }),

    // Get user lookup by ID
    getUserLookupById: builder.query<UserLookupDto | null, string>({
      query: (id) => `/api/v1/users/lookup/${id}`,
      providesTags: (_, __, id) => [{ type: 'UserLookup', id }],
    }),

    // Get multiple users by IDs
    getUserLookupByIds: builder.mutation<UserLookupDto[], string[]>({
      query: (ids) => ({
        url: '/api/v1/users/lookup/by-ids',
        method: 'POST',
        body: ids,
      }),
      transformResponse: (response: { items: UserLookupDto[] }) => response.items,
    }),
  }),
});

// Export hooks
export const {
  useGetUserListQuery,
  useLazyGetUserListQuery,
  useGetUserQuery,
  useLazyGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserActiveMutation,
  useResetUserPasswordMutation,
  // Lookup hooks
  useGetUserLookupQuery,
  useLazyGetUserLookupQuery,
  useSearchUserLookupQuery,
  useLazySearchUserLookupQuery,
  useGetUserLookupByIdQuery,
  useLazyGetUserLookupByIdQuery,
  useGetUserLookupByIdsMutation,
} = userApi;

export default userApi;
