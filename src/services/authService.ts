import { api } from './api';
import { STORAGE_KEYS } from '../constants';

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
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
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
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(STORAGE_KEYS.WORK_REMINDER_LAST_SHOWN); // Clear SampleReceiver work reminder state on logout
    localStorage.removeItem(STORAGE_KEYS.LAB_TECH_MANAGER_REMINDER_LAST_SHOWN); // Clear LabTechManager work reminder state on logout
    localStorage.removeItem(STORAGE_KEYS.LAB_TECHNICIAN_REMINDER_LAST_SHOWN); // Clear LabTechnician work reminder state on logout
    localStorage.removeItem(STORAGE_KEYS.QUALITY_MANAGER_REMINDER_LAST_SHOWN); // Clear QualityManager work reminder state on logout
    window.location.href = '/login';
  },

  // Refresh token
  refreshToken: async (): Promise<LoginResponse> => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post<LoginResponse>(`${AUTH_URL}/refresh-token`, { refreshToken });

    // Store new tokens
    if (response.data.accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
    }
    if (response.data.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
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
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // Get stored user info
  getUserInfo: (): UserInfo | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as UserInfo;
    } catch {
      return null;
    }
  },

  // Get user permissions from stored user info
  getUserPermissions: (): string[] => {
    const userInfo = authService.getUserInfo();
    return userInfo?.permissions || [];
  },

  // Get user roles from stored user info
  getUserRoles: (): string[] => {
    const userInfo = authService.getUserInfo();
    return userInfo?.roles || [];
  },

  // Check if user has a specific permission
  hasPermission: (permissionName: string): boolean => {
    const permissions = authService.getUserPermissions();
    // Admin có tất cả quyền
    if (permissions.includes('Role:admin')) {
      return true;
    }
    return permissions.includes(permissionName);
  },

  // Check if user has ANY of the specified permissions
  hasAnyPermission: (permissionNames: string[]): boolean => {
    if (!permissionNames || permissionNames.length === 0) {
      return true;
    }
    const permissions = authService.getUserPermissions();
    // Admin có tất cả quyền
    if (permissions.includes('Role:admin')) {
      return true;
    }
    return permissionNames.some(name => permissions.includes(name));
  },

  // Check if user has ALL of the specified permissions
  hasAllPermissions: (permissionNames: string[]): boolean => {
    if (!permissionNames || permissionNames.length === 0) {
      return true;
    }
    const permissions = authService.getUserPermissions();
    // Admin có tất cả quyền
    if (permissions.includes('Role:admin')) {
      return true;
    }
    return permissionNames.every(name => permissions.includes(name));
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    const roles = authService.getUserRoles();
    return roles.includes('admin');
  },
};

export default authService;
