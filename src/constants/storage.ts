// LocalStorage keys constants
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_INFO: "user_info",
  // Work reminder popup state keys
  WORK_REMINDER_LAST_SHOWN: "workReminderLastShownTime",
  LAB_TECH_MANAGER_REMINDER_LAST_SHOWN: "labTechManagerReminderLastShownTime",
  LAB_TECHNICIAN_REMINDER_LAST_SHOWN: "labTechnicianReminderLastShownTime",
  QUALITY_MANAGER_REMINDER_LAST_SHOWN: "qualityManagerReminderLastShownTime",
  // Offline authentication keys
  OFFLINE_AUTH_CREDENTIALS: "offline_auth_credentials", // Cached credentials for offline login
  TESTING_SAL_VISIBLE_COLUMNS: "testing_sal_visible_columns",
} as const;

export type StorageKeyType = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
