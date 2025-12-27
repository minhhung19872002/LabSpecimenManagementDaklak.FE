// Laboratory Task Status Enum
export enum LaboratoryTaskStatus {
  NotAssigned = 0,       // Chưa giao việc (chưa gán KTV hoặc phương pháp)
  Assigned = 1,          // Đã giao việc (tất cả chỉ tiêu đã có KTV + phương pháp)
  Testing = 2,           // Đang thử nghiệm
  PendingApproval = 3,   // Chờ duyệt kết quả
  Approved = 4,          // Đã duyệt
  SentToQuality = 5      // Đã gửi QL Chất lượng
}

// Indicator Approval Status Enum (Phase 6)
export enum IndicatorApprovalStatus {
  Pending = 0,           // Chờ nhập kết quả
  Entered = 1,           // Đã nhập kết quả
  Approved = 2,          // Đã duyệt
  Rejected = 3,          // Không duyệt
  CustomerCancelled = 4  // Khách hàng hủy
}

// Status display helper
export const LaboratoryTaskStatusLabels: Record<LaboratoryTaskStatus, string> = {
  [LaboratoryTaskStatus.NotAssigned]: 'Chưa giao việc',
  [LaboratoryTaskStatus.Assigned]: 'Đã giao việc',
  [LaboratoryTaskStatus.Testing]: 'Đang thử nghiệm',
  [LaboratoryTaskStatus.PendingApproval]: 'Chờ duyệt kết quả',
  [LaboratoryTaskStatus.Approved]: 'Đã duyệt',
  [LaboratoryTaskStatus.SentToQuality]: 'Đã gửi QLCL'
};

export const LaboratoryTaskStatusColors: Record<LaboratoryTaskStatus, string> = {
  [LaboratoryTaskStatus.NotAssigned]: 'default',
  [LaboratoryTaskStatus.Assigned]: 'blue',
  [LaboratoryTaskStatus.Testing]: 'processing',
  [LaboratoryTaskStatus.PendingApproval]: 'warning',
  [LaboratoryTaskStatus.Approved]: 'success',
  [LaboratoryTaskStatus.SentToQuality]: 'purple'
};

// Indicator Approval Status display helper (Phase 6)
export const IndicatorApprovalStatusLabels: Record<IndicatorApprovalStatus, string> = {
  [IndicatorApprovalStatus.Pending]: 'Chờ nhập KQ',
  [IndicatorApprovalStatus.Entered]: 'Chờ duyệt',
  [IndicatorApprovalStatus.Approved]: 'Đã duyệt',
  [IndicatorApprovalStatus.Rejected]: 'Từ chối',
  [IndicatorApprovalStatus.CustomerCancelled]: 'KH hủy'
};

export const IndicatorApprovalStatusColors: Record<IndicatorApprovalStatus, string> = {
  [IndicatorApprovalStatus.Pending]: 'default',
  [IndicatorApprovalStatus.Entered]: 'warning',
  [IndicatorApprovalStatus.Approved]: 'success',
  [IndicatorApprovalStatus.Rejected]: 'error',
  [IndicatorApprovalStatus.CustomerCancelled]: 'volcano'
};

// Laboratory Task Indicator DTO (Phase 6 - Extended)
export interface LaboratoryTaskIndicatorDto {
  id: string;
  testRequestSampleIndicatorId: string;
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorGroupName?: string;
  unitPrice: number;

  // Phase 6 workflow fields
  methodId?: string;
  methodName?: string;
  technicianId?: string;
  technicianName?: string;
  testDate?: string;  // Ngày thử nghiệm (ngày KTV bắt đầu/check-in)
  result?: string;
  unit?: string;
  entryDate?: string;
  enteredById?: string;
  enteredByName?: string;
  approvalStatus: IndicatorApprovalStatus;
  approvalDate?: string;
  approvedById?: string;
  approvedByName?: string;
  rejectionReason?: string;
}

// Main Laboratory Task DTO
export interface LaboratoryTaskDto {
  id: string;
  testRequestId: string;
  laboratoryId: string;
  contractNumber?: string;
  totalSampleCount: number;
  technicalManagerId?: string;
  technicalManagerName?: string;
  transferDate?: string;
  requestCompletionDate?: string;
  testDate?: string;
  status: LaboratoryTaskStatus;
  notes?: string;
  resultRejectionReason?: string;  // Lý do QLCL từ chối KQ

  // Navigation properties
  testRequestNumber?: string;
  laboratoryName?: string;
  laboratoryCode?: string;
  customerName?: string;
  indicators?: LaboratoryTaskIndicatorDto[];
  supporters?: LaboratoryTaskSupporterDto[];

  // Audit fields
  creationTime?: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
}

// Update Laboratory Task DTO
export interface UpdateLaboratoryTaskDto {
  testDate?: string;
  status?: LaboratoryTaskStatus;
  notes?: string;
}

// Filter/List Input DTO
export interface GetLaboratoryTaskListDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;  // Search by contract number or technical manager name
  laboratoryId?: string;
  status?: LaboratoryTaskStatus;
  technicalManagerId?: string;
  fromDate?: string;
  toDate?: string;
}

// Paged result
export interface PagedLaboratoryTaskResult {
  items: LaboratoryTaskDto[];
  totalCount: number;
}

// List result (for non-paged endpoints)
export interface ListLaboratoryTaskResult {
  items: LaboratoryTaskDto[];
}

// ============= Phase 6 - Workflow Input DTOs =============

// Assign indicator DTO (gán phương pháp + kỹ thuật viên)
export interface AssignIndicatorInput {
  indicatorId: string;
  methodId?: string;
  technicianId?: string;
}

// Update indicator result DTO
export interface UpdateIndicatorResultInput {
  result: string;
  unit?: string;
}

// Approve indicator DTO
export interface ApproveIndicatorInput {
  approve: boolean;
  rejectionReason?: string;
}

// ============= Lookup DTOs =============

// Method lookup for dropdown
export interface MethodLookupDto {
  id: string;
  code?: string;
  name: string;
  description?: string;
}

// User lookup for dropdown
export interface UserLookupDto {
  id: string;
  userName: string;
  name?: string;
  surname?: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  isActive: boolean;
}

// List result for lookups
export interface ListMethodLookupResult {
  items: MethodLookupDto[];
}

export interface ListUserLookupResult {
  items: UserLookupDto[];
}

// ============= Sample Status (Computed) =============

export type SampleStatus = 'notStarted' | 'assigned' | 'testing' | 'pendingApproval' | 'approved' | 'rejected';

export const SampleStatusLabels: Record<SampleStatus, string> = {
  notStarted: 'Chưa thực hiện',
  assigned: 'Chưa thực hiện',  // Internal status, displayed same as notStarted
  testing: 'Đang thử nghiệm',
  pendingApproval: 'Chờ phê duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối'
};

export const SampleStatusColors: Record<SampleStatus, string> = {
  notStarted: 'default',
  assigned: 'default',  // Same color as notStarted
  testing: 'processing',
  pendingApproval: 'warning',
  approved: 'success',
  rejected: 'error'
};

// Sample info (computed from indicators)
export interface SampleInfo {
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  indicatorCount: number;
  indicators: LaboratoryTaskIndicatorDto[];
  sampleStatus: SampleStatus;
  isApproved: boolean;
}

// ============= Supporter DTOs =============

export interface LaboratoryTaskSupporterDto {
  id: string;
  laboratoryTaskId: string;
  userId: string;
  userName?: string;
  fullName?: string;
  email?: string;
  creationTime: string;
}

export interface ManageSupportersInput {
  userIds: string[];
}

// ============= Bulk Approval DTOs =============

export interface BulkApproveIndicatorsInput {
  indicatorIds: string[];
  approve: boolean;
  rejectionReason?: string;
}

// ============= Send to Quality DTOs =============

export interface SendToQualityInput {
  indicatorIds: string[];
  qualityManagerId: string;
}

// ============= Sample Status (Computed for Display) =============

export type SampleTestingStatus = 'notStarted' | 'testing' | 'pendingApproval' | 'approved' | 'rejected';

export const SampleTestingStatusLabels: Record<SampleTestingStatus, string> = {
  notStarted: 'Chưa thực hiện',
  testing: 'Đang TN',
  pendingApproval: 'Chờ phê duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối'
};

export const SampleTestingStatusColors: Record<SampleTestingStatus, string> = {
  notStarted: 'default',
  testing: 'processing',
  pendingApproval: 'warning',
  approved: 'success',
  rejected: 'error'
};
