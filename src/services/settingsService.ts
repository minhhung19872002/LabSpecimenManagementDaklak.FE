import { api } from './api';

const BASE_URL = '/api/v1/settings';

// User Profile
export interface UserProfileDto {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  departmentId?: string;
  position?: string;
  avatarUrl?: string;
}

export interface UpdateUserProfileDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// System Settings
export interface SystemSettingsDto {
  labName: string;
  labCode: string;
  address: string;
  defaultTAT: number;
  workingDays: string[];
  language: string;
  timezone: string;
}

// Email Settings
export interface EmailSettingsDto {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword?: string;
  enableSsl: boolean;
  fromEmail: string;
  fromName: string;
}

export interface UpdateEmailSettingsDto {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword?: string;
  enableSsl: boolean;
  fromEmail: string;
  fromName: string;
}

export interface TestEmailDto {
  toEmail: string;
}

// Notification Settings
export interface NotificationSettingsDto {
  emailEnabled: boolean;
  newRequestAlert: boolean;
  resultApprovalAlert: boolean;
  tatWarningAlert: boolean;
  ncrAlert: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

// Security Settings
export interface SecuritySettingsDto {
  requireStrongPassword: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordExpiryDays: number;
  twoFactorEnabled: boolean;
}

export const settingsService = {
  // User Profile
  getUserProfile: async (): Promise<UserProfileDto> => {
    const response = await api.get<UserProfileDto>(`${BASE_URL}/profile`);
    return response.data;
  },

  updateUserProfile: async (data: UpdateUserProfileDto): Promise<UserProfileDto> => {
    const response = await api.put<UserProfileDto>(`${BASE_URL}/profile`, data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await api.post(`${BASE_URL}/profile/change-password`, data);
  },

  // System Settings
  getSystemSettings: async (): Promise<SystemSettingsDto> => {
    const response = await api.get<SystemSettingsDto>(`${BASE_URL}/system`);
    return response.data;
  },

  updateSystemSettings: async (data: SystemSettingsDto): Promise<SystemSettingsDto> => {
    const response = await api.put<SystemSettingsDto>(`${BASE_URL}/system`, data);
    return response.data;
  },

  // Email Settings
  getEmailSettings: async (): Promise<EmailSettingsDto> => {
    const response = await api.get<EmailSettingsDto>(`${BASE_URL}/email`);
    return response.data;
  },

  updateEmailSettings: async (data: UpdateEmailSettingsDto): Promise<EmailSettingsDto> => {
    const response = await api.put<EmailSettingsDto>(`${BASE_URL}/email`, data);
    return response.data;
  },

  testEmail: async (data: TestEmailDto): Promise<void> => {
    await api.post(`${BASE_URL}/email/test`, data);
  },

  // Notification Settings
  getNotificationSettings: async (): Promise<NotificationSettingsDto> => {
    const response = await api.get<NotificationSettingsDto>(`${BASE_URL}/notifications`);
    return response.data;
  },

  updateNotificationSettings: async (data: NotificationSettingsDto): Promise<NotificationSettingsDto> => {
    const response = await api.put<NotificationSettingsDto>(`${BASE_URL}/notifications`, data);
    return response.data;
  },

  // Security Settings
  getSecuritySettings: async (): Promise<SecuritySettingsDto> => {
    const response = await api.get<SecuritySettingsDto>(`${BASE_URL}/security`);
    return response.data;
  },

  updateSecuritySettings: async (data: SecuritySettingsDto): Promise<SecuritySettingsDto> => {
    const response = await api.put<SecuritySettingsDto>(`${BASE_URL}/security`, data);
    return response.data;
  },
};

export default settingsService;
