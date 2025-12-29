import { api } from './api';

const AUTH_URL = '/api/v1/auth';

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

export const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(`${AUTH_URL}/login`, credentials);

    // response.data is already unwrapped by axios interceptor
    const data = response.data;

    // Store tokens - check both possible response structures
    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    return data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post(`${AUTH_URL}/logout`);
    } catch {
      // Ignore errors during logout
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('workReminderLastShownTime'); // Clear SampleReceiver work reminder state on logout
    localStorage.removeItem('labTechManagerReminderLastShownTime'); // Clear LabTechManager work reminder state on logout
    localStorage.removeItem('labTechnicianReminderLastShownTime'); // Clear LabTechnician work reminder state on logout
    localStorage.removeItem('qualityManagerReminderLastShownTime'); // Clear QualityManager work reminder state on logout
    window.location.href = '/login';
  },

  // Refresh token
  refreshToken: async (): Promise<LoginResponse> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post<LoginResponse>(`${AUTH_URL}/refresh-token`, { refreshToken });

    // Store new tokens
    if (response.data.accessToken) {
      localStorage.setItem('access_token', response.data.accessToken);
    }
    if (response.data.refreshToken) {
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }

    return response.data;
  },

  // Get current user info
  getCurrentUser: async (): Promise<UserInfo> => {
    const response = await api.get<UserInfo>(`${AUTH_URL}/me`);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post(`${AUTH_URL}/change-password`, data);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
};

export default authService;
