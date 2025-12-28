// User roles constants - must match backend role names
export const ROLES = {
  ADMIN: "admin",
  LAB_TECHNICAL_MANAGER: "LabTechnicalManager",
  SAMPLE_RECEIVER: "SampleReceiver",
  QUALITY_MANAGER: "QualityManager",
  LAB_TECHNICIAN: "LabTechnician",
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];
