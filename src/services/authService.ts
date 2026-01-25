import { api } from './api';
import { STORAGE_KEYS } from '../constants';

const AUTH_URL = '/api/v1/auth';

/**
 * Cached credentials structure for offline login
 */
interface OfflineCredentials {
  userNameOrEmail: string;
  passwordHash: string; // SHA-256 hash of the password
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
  cachedAt: string; // ISO timestamp
}

/**
 * Hash a password using SHA-256 (Web Crypto API)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cache credentials for offline login after successful online login
 */
async function cacheCredentialsForOffline(
  userNameOrEmail: string,
  password: string,
  accessToken: string,
  refreshToken: string,
  user: UserInfo
): Promise<void> {
  try {
    const passwordHash = await hashPassword(password);
    const credentials: OfflineCredentials = {
      userNameOrEmail: userNameOrEmail.toLowerCase(), // Normalize for comparison
      passwordHash,
      accessToken,
      refreshToken,
      user,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.OFFLINE_AUTH_CREDENTIALS, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to cache credentials for offline:', error);
  }
}

/**
 * Get cached offline credentials
 */
function getOfflineCredentials(): OfflineCredentials | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_AUTH_CREDENTIALS);
    if (!stored) return null;
    return JSON.parse(stored) as OfflineCredentials;
  } catch {
    return null;
  }
}

/**
 * Validate credentials offline against cached credentials
 */
async function validateOfflineCredentials(
  userNameOrEmail: string,
  password: string
): Promise<OfflineCredentials | null> {
  const cached = getOfflineCredentials();
  if (!cached) return null;

  // Check if username matches (case-insensitive)
  if (cached.userNameOrEmail !== userNameOrEmail.toLowerCase()) {
    return null;
  }

  // Verify password hash
  const passwordHash = await hashPassword(password);
  if (cached.passwordHash !== passwordHash) {
    return null;
  }

  return cached;
}

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

    // Cache credentials for offline login on successful login
    if (data.success && accessToken && refreshToken && data.user) {
      await cacheCredentialsForOffline(
        credentials.userNameOrEmail,
        credentials.password,
        accessToken,
        refreshToken,
        data.user
      );
    }

    return data;
  },

  /**
   * Login offline using cached credentials
   * Returns LoginResponse if credentials match cached data
   * Throws error if no cached credentials or credentials don't match
   */
  loginOffline: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const cached = await validateOfflineCredentials(
      credentials.userNameOrEmail,
      credentials.password
    );

    if (!cached) {
      throw new Error('OFFLINE_AUTH_FAILED');
    }

    // Restore session from cached data
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, cached.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, cached.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(cached.user));

    return {
      success: true,
      accessToken: cached.accessToken,
      refreshToken: cached.refreshToken,
      expiresIn: 0, // Unknown in offline mode
      tokenType: 'Bearer',
      user: cached.user,
    };
  },

  /**
   * Check if offline login is available (has cached credentials)
   */
  hasOfflineCredentials: (): boolean => {
    return getOfflineCredentials() !== null;
  },

  /**
   * Get the cached offline username (for display purposes)
   */
  getOfflineUsername: (): string | null => {
    const cached = getOfflineCredentials();
    return cached?.userNameOrEmail || null;
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
