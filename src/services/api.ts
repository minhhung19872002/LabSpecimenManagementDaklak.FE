import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS, HTTP_STATUS } from '../constants';

// API Base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:44381';

// API Response wrapper format
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  statusCode: number;
  errors: Record<string, string[]> | null;
}

// Paginated response format
export interface PaginatedMeta {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginatedMeta;
}

// Legacy format for backward compatibility
export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

// Track if we're currently refreshing the token
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// Process the queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else if (token) {
      // Mark as retried to prevent infinite loop
      (request.config as InternalAxiosRequestConfig & { _retry?: boolean })._retry = true;
      request.config.headers.Authorization = `Bearer ${token}`;
      request.resolve(apiClient(request.config));
    }
  });
  failedQueue = [];
};

// Handle 401 Unauthorized - redirect to 401 page (let user decide to logout)
const handleUnauthorized = () => {
  if (!window.location.pathname.includes('/401') && !window.location.pathname.includes('/login')) {
    window.location.href = '/401';
  }
};

// Handle 403 Forbidden - redirect to forbidden page
const handleForbidden = () => {
  if (!window.location.pathname.includes('/403')) {
    window.location.href = '/403';
  }
};

// Try to refresh token and retry the request
const tryRefreshTokenAndRetry = async (originalConfig: InternalAxiosRequestConfig): Promise<AxiosResponse | null> => {
  // Check if another tab already refreshed the token
  const currentToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const requestToken = (originalConfig.headers.Authorization as string)?.replace('Bearer ', '');
  if (currentToken && requestToken && currentToken !== requestToken) {
    originalConfig.headers.Authorization = `Bearer ${currentToken}`;
    return apiClient(originalConfig);
  }

  // If we're already refreshing, queue this request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject, config: originalConfig });
    });
  }

  isRefreshing = true;
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    isRefreshing = false;
    processQueue(new Error('No refresh token'), null);
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
      refreshToken
    });

    const newAccessToken = response.data?.accessToken || response.data?.data?.accessToken;
    const newRefreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;

    if (newAccessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      }

      // Update authorization header for the original request
      originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;

      // Process queued requests with new token
      processQueue(null, newAccessToken);
      isRefreshing = false;

      // Retry the original request
      return apiClient(originalConfig);
    } else {
      // API returned success but no token - treat as error
      throw new Error('No access token in refresh response');
    }
  } catch (refreshError) {
    // Process queued requests with error
    processQueue(refreshError, null);
    isRefreshing = false;
    return null;
  }
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Tell backend this is an AJAX request, not browser navigation
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - unwrap API response
apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    // Skip processing for blob responses (file downloads)
    if (response.config.responseType === 'blob') {
      return response;
    }

    // Check if response is HTML (redirect to login page after 302)
    // This happens when backend returns 302 redirect and axios follows it
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      // Try to refresh token and retry the request
      const originalConfig = response.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Skip if already retried or is auth endpoint
      if (originalConfig._retry ||
          originalConfig.url?.includes('/auth/login') ||
          originalConfig.url?.includes('/auth/refresh-token')) {
        handleUnauthorized();
        return Promise.reject({
          response: { status: 401, data: { message: 'Phiên đăng nhập đã hết hạn' } }
        });
      }

      originalConfig._retry = true;
      const retryResult = await tryRefreshTokenAndRetry(originalConfig);

      if (retryResult) {
        return retryResult;
      }

      // Refresh failed, redirect to 401 page
      handleUnauthorized();
      return Promise.reject({
        response: { status: 401, data: { message: 'Phiên đăng nhập đã hết hạn' } }
      });
    }

    // Check if response has the wrapper format
    const data = response.data;
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      // Unwrap API response - BE now returns proper HTTP status codes
      // so we don't need to check data.success here (non-2xx will go to error handler)
      // Convert paginated response to legacy format if needed
      if (data.data && data.data.items && data.data.meta) {
        response.data = {
          items: data.data.items,
          totalCount: data.data.meta.total
        };
      } else {
        response.data = data.data;
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean } | undefined;

    // Unwrap errors from wrapper format if present
    // BE returns: { data: null, success: false, statusCode: xxx, errors: {...} }
    // We need to extract errors so errorHandler.ts can process them
    if (error.response?.data) {
      const data = error.response.data as Record<string, unknown>;
      if (data && typeof data === 'object' && 'errors' in data && data.errors) {
        // Keep errors in response.data for errorHandler.ts to extract
        error.response.data = data.errors;
      }
    }

    // Handle 403 Forbidden - redirect to forbidden page (not logout)
    if (error.response?.status === HTTP_STATUS.FORBIDDEN) {
      handleForbidden();
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      // If no config (network error), just redirect
      if (!originalRequest) {
        handleUnauthorized();
        return Promise.reject(error);
      }

      // Skip refresh for login/refresh endpoints
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
        handleUnauthorized();
        return Promise.reject(error);
      }

      // If this request was already retried, fail
      if (originalRequest._retry) {
        handleUnauthorized();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const retryResult = await tryRefreshTokenAndRetry(originalRequest);

      if (retryResult) {
        return retryResult;
      }

      // Refresh failed, redirect to 401 page
      handleUnauthorized();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Helper to convert page-based pagination to skip-based
export const toSkipTake = (page: number, limit: number) => ({
  skipCount: (page - 1) * limit,
  maxResultCount: limit
});

// Helper to convert skip-based pagination to page-based
export const toPageLimit = (skipCount: number, maxResultCount: number) => ({
  page: Math.floor(skipCount / maxResultCount) + 1,
  limit: maxResultCount
});

// API methods
export const api = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },

  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },

  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },

  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },

  // Upload file (multipart/form-data)
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Download file
  download: (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Blob>> => {
    return apiClient.get(url, {
      ...config,
      responseType: 'blob',
    });
  },
};

export default apiClient;
