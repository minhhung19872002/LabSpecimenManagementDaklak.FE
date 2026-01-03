// User roles constants - must match backend role names
export const ROLES = {
  ADMIN: "admin",
  LAB_TECHNICAL_MANAGER: "LabTechnicalManager",
  SAMPLE_RECEIVER: "SampleReceiver",
  QUALITY_MANAGER: "QualityManager",
  LAB_TECHNICIAN: "LabTechnician",
  ACCOUNTANT: "Accountant",
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

// Role display names in Vietnamese
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [ROLES.ADMIN]: "Quản trị viên",
  [ROLES.LAB_TECHNICAL_MANAGER]: "Quản lý kỹ thuật",
  [ROLES.SAMPLE_RECEIVER]: "Bộ phận giao nhận mẫu",
  [ROLES.QUALITY_MANAGER]: "Quản lý chất lượng",
  [ROLES.LAB_TECHNICIAN]: "Kỹ thuật viên",
  [ROLES.ACCOUNTANT]: "Kế toán",
};

// Get display name for a role
export const getRoleDisplayName = (role: string): string => {
  return ROLE_DISPLAY_NAMES[role] || role;
};

// Role options for UI dropdowns/selects (User management)
export const ROLE_OPTIONS = [
  { value: "Admin", label: "Quản trị viên", color: "red" },
  { value: "LabManager", label: "Trưởng phòng TN", color: "purple" },
  { value: "Technician", label: "Kỹ thuật viên", color: "blue" },
  { value: "Reviewer", label: "Người duyệt B1", color: "orange" },
  { value: "Approver", label: "Người duyệt B2", color: "green" },
  { value: "Viewer", label: "Xem báo cáo", color: "default" },
] as const;
