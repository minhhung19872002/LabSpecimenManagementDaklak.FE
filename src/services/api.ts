import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:44381';

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
      request.config.headers.Authorization = `Bearer ${token}`;
      request.resolve(apiClient(request.config));
    }
  });
  failedQueue = [];
};

// Clear tokens and redirect to login
const handleAuthFailure = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
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
    const token = localStorage.getItem('access_token');
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
  (response: AxiosResponse) => {
    // Skip processing for blob responses (file downloads)
    if (response.config.responseType === 'blob') {
      return response;
    }

    // Check if response is HTML (redirect to login page)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      // Backend redirected to login page - treat as 401
      handleAuthFailure();
      return Promise.reject({
        response: { status: 401, data: { message: 'Session expired' } }
      });
    }

    // Check if response has the new wrapper format
    const data = response.data;
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      // New API format - unwrap data
      if (!data.success) {
        return Promise.reject({
          response: {
            status: data.statusCode,
            data: data.errors
          }
        });
      }
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized or 403 Forbidden
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Skip refresh for login/refresh endpoints
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
        handleAuthFailure();
        return Promise.reject(error);
      }

      // If this request was already retried, fail
      if (originalRequest._retry) {
        handleAuthFailure();
        return Promise.reject(error);
      }

      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        handleAuthFailure();
        return Promise.reject(error);
      }

      try {
        // Call refresh token API directly (not through apiClient to avoid interceptor loop)
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
          refreshToken
        });

        const newAccessToken = response.data?.accessToken || response.data?.data?.accessToken;
        const newRefreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          // Update authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Process queued requests
          processQueue(null, newAccessToken);

          isRefreshing = false;

          // Retry the original request
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        processQueue(refreshError, null);
        isRefreshing = false;
        handleAuthFailure();
        return Promise.reject(refreshError);
      }
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
