import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

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

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['UserProfile', 'SystemSettings', 'EmailSettings', 'NotificationSettings', 'SecuritySettings'],
  endpoints: (builder) => ({
    // User Profile
    getUserProfile: builder.query<UserProfileDto, void>({
      query: () => '/api/v1/settings/profile',
      providesTags: ['UserProfile'],
    }),

    updateUserProfile: builder.mutation<UserProfileDto, UpdateUserProfileDto>({
      query: (data) => ({
        url: '/api/v1/settings/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['UserProfile'],
    }),

    changePassword: builder.mutation<void, ChangePasswordDto>({
      query: (data) => ({
        url: '/api/v1/settings/profile/change-password',
        method: 'POST',
        body: data,
      }),
    }),

    // System Settings
    getSystemSettings: builder.query<SystemSettingsDto, void>({
      query: () => '/api/v1/settings/system',
      providesTags: ['SystemSettings'],
    }),

    updateSystemSettings: builder.mutation<SystemSettingsDto, SystemSettingsDto>({
      query: (data) => ({
        url: '/api/v1/settings/system',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SystemSettings'],
    }),

    // Email Settings
    getEmailSettings: builder.query<EmailSettingsDto, void>({
      query: () => '/api/v1/settings/email',
      providesTags: ['EmailSettings'],
    }),

    updateEmailSettings: builder.mutation<EmailSettingsDto, UpdateEmailSettingsDto>({
      query: (data) => ({
        url: '/api/v1/settings/email',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['EmailSettings'],
    }),

    testEmail: builder.mutation<void, TestEmailDto>({
      query: (data) => ({
        url: '/api/v1/settings/email/test',
        method: 'POST',
        body: data,
      }),
    }),

    // Notification Settings
    getNotificationSettings: builder.query<NotificationSettingsDto, void>({
      query: () => '/api/v1/settings/notifications',
      providesTags: ['NotificationSettings'],
    }),

    updateNotificationSettings: builder.mutation<NotificationSettingsDto, NotificationSettingsDto>({
      query: (data) => ({
        url: '/api/v1/settings/notifications',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['NotificationSettings'],
    }),

    // Security Settings
    getSecuritySettings: builder.query<SecuritySettingsDto, void>({
      query: () => '/api/v1/settings/security',
      providesTags: ['SecuritySettings'],
    }),

    updateSecuritySettings: builder.mutation<SecuritySettingsDto, SecuritySettingsDto>({
      query: (data) => ({
        url: '/api/v1/settings/security',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SecuritySettings'],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetEmailSettingsQuery,
  useUpdateEmailSettingsMutation,
  useTestEmailMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useGetSecuritySettingsQuery,
  useUpdateSecuritySettingsMutation,
} = settingsApi;
