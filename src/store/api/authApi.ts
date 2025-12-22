import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

const AUTH_URL = '/api/v1/auth';

// Types - matching existing authService types
export interface LoginRequest {
  userNameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  errorMessage?: string | null;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  userName: string;
  email: string;
  name?: string;
  surname?: string;
  fullName: string;
  phoneNumber?: string;
  isActive: boolean;
  emailConfirmed?: boolean;
  phoneNumberConfirmed?: boolean;
  tenantId?: string | null;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  userRole?: number;
  roles: string[];
  permissions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User'],
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: `${AUTH_URL}/login`,
        method: 'POST',
        body: credentials,
      }),
      // Store tokens after successful login
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.accessToken) {
            localStorage.setItem('access_token', data.accessToken);
          }
          if (data.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken);
          }
        } catch {
          // Login failed, tokens not stored
        }
      },
      invalidatesTags: ['Auth', 'User'],
    }),

    // Logout
    logout: builder.mutation<void, void>({
      query: () => ({
        url: `${AUTH_URL}/logout`,
        method: 'POST',
      }),
      // Clear tokens regardless of API result
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // Ignore errors during logout
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
      },
      invalidatesTags: ['Auth', 'User'],
    }),

    // Refresh token
    refreshToken: builder.mutation<LoginResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: `${AUTH_URL}/refresh-token`,
        method: 'POST',
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.accessToken) {
            localStorage.setItem('access_token', data.accessToken);
          }
          if (data.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken);
          }
        } catch {
          // Refresh failed
        }
      },
    }),

    // Get current user
    getCurrentUser: builder.query<UserInfo, void>({
      query: () => `${AUTH_URL}/me`,
      providesTags: ['User'],
    }),

    // Change password
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({
        url: `${AUTH_URL}/change-password`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

// Export hooks
export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useChangePasswordMutation,
} = authApi;

// Helper functions (matching existing authService)
export const authHelpers = {
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
};

export default authApi;
