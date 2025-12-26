// Laboratory Task Status Enum
export enum LaboratoryTaskStatus {
  NotAssignedTechnician = 0,   // Chưa gán KTV (Phương pháp đã có từ phiếu yêu cầu)
  AssignedTechnician = 1,      // Đã gán KTV
  Testing = 2,                 // Đang thí nghiệm
  PendingApproval = 3,         // Chờ duyệt kết quả
  Approved = 4,                // Đã duyệt
  ResultSent = 5,              // Đã gửi kết quả
  ResultRejected = 6           // QLCL từ chối KQ
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
  [LaboratoryTaskStatus.NotAssignedTechnician]: 'Chưa gán KTV',
  [LaboratoryTaskStatus.AssignedTechnician]: 'Đã gán KTV',
  [LaboratoryTaskStatus.Testing]: 'Đang thí nghiệm',
  [LaboratoryTaskStatus.PendingApproval]: 'Chờ duyệt kết quả',
  [LaboratoryTaskStatus.Approved]: 'Đã duyệt',
  [LaboratoryTaskStatus.ResultSent]: 'Đã gửi kết quả',
  [LaboratoryTaskStatus.ResultRejected]: 'QLCL từ chối'
};

export const LaboratoryTaskStatusColors: Record<LaboratoryTaskStatus, string> = {
  [LaboratoryTaskStatus.NotAssignedTechnician]: 'default',
  [LaboratoryTaskStatus.AssignedTechnician]: 'blue',
  [LaboratoryTaskStatus.Testing]: 'processing',
  [LaboratoryTaskStatus.PendingApproval]: 'warning',
  [LaboratoryTaskStatus.Approved]: 'success',
  [LaboratoryTaskStatus.ResultSent]: 'purple',
  [LaboratoryTaskStatus.ResultRejected]: 'error'
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
  indicators?: LaboratoryTaskIndicatorDto[];

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

export type SampleStatus = 'pending' | 'assigned' | 'testing' | 'pendingApproval' | 'approved';

export const SampleStatusLabels: Record<SampleStatus, string> = {
  pending: 'Chưa gán KTV',
  assigned: 'Đã gán KTV',
  testing: 'Đang TN',
  pendingApproval: 'Chờ duyệt',
  approved: 'Đã duyệt'
};

export const SampleStatusColors: Record<SampleStatus, string> = {
  pending: 'default',
  assigned: 'blue',
  testing: 'processing',
  pendingApproval: 'warning',
  approved: 'success'
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
