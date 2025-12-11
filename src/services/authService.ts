import { api } from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfo {
  id: string;
  userName: string;
  email: string;
  name: string;
  roles: string[];
}

export const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/connect/token', {
      grant_type: 'password',
      client_id: 'LabSpecimenManagement_App',
      scope: 'LabSpecimenManagement',
      ...credentials,
    });

    // Store token
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }

    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  },

  // Get current user info
  getCurrentUser: async (): Promise<UserInfo> => {
    const response = await api.get<UserInfo>('/api/identity/my-profile');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
};

export default authService;
