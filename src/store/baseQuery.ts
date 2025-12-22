import {
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';

// API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:44381';

// Mutex to prevent multiple simultaneous token refresh calls
const mutex = new Mutex();

// Clear tokens and redirect to login
const handleAuthFailure = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

// Helper to convert camelCase params to PascalCase for ABP Framework
export const toAbpParams = (params: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    // Convert first letter to uppercase (camelCase -> PascalCase)
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
    result[pascalKey] = value;
  }
  return result;
};

// Base query with auth header
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 30000,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('X-Requested-With', 'XMLHttpRequest');
    return headers;
  },
  // Custom response handler to unwrap API response format
  responseHandler: async (response) => {
    // Handle blob responses
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
      return response.blob();
    }

    // Check if response is HTML (redirect to login page)
    if (contentType.includes('text/html')) {
      throw new Error('Session expired');
    }

    const text = await response.text();
    if (!text) return null;

    try {
      const data = JSON.parse(text);

      // Check if response has the new wrapper format
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        if (!data.success) {
          throw {
            status: data.statusCode,
            data: data.errors,
          };
        }
        // Convert paginated response to legacy format if needed
        if (data.data && data.data.items && data.data.meta) {
          return {
            items: data.data.items,
            totalCount: data.data.meta.total,
          };
        }
        return data.data;
      }

      return data;
    } catch (e) {
      if (e instanceof SyntaxError) {
        return text;
      }
      throw e;
    }
  },
});

// Base query with automatic token refresh
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait if another request is refreshing the token
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  // Handle 401/403 errors
  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    // Get the request URL
    const requestUrl = typeof args === 'string' ? args : args.url;

    // Skip refresh for auth endpoints
    if (requestUrl?.includes('/auth/login') || requestUrl?.includes('/auth/refresh-token')) {
      handleAuthFailure();
      return result;
    }

    // Check if we're already refreshing
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          handleAuthFailure();
          return result;
        }

        // Try to refresh the token
        const refreshResult = await baseQuery(
          {
            url: '/api/v1/auth/refresh-token',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const data = refreshResult.data as any;
          const newAccessToken = data?.accessToken;
          const newRefreshToken = data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem('access_token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refresh_token', newRefreshToken);
            }

            // Retry the original request with new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            handleAuthFailure();
          }
        } else {
          handleAuthFailure();
        }
      } finally {
        release();
      }
    } else {
      // Another request is refreshing, wait for it to complete
      await mutex.waitForUnlock();
      // Retry the request
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export default baseQueryWithReauth;
