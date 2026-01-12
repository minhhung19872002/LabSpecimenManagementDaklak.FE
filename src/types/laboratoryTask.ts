import { IndicatorImageDto } from './testing';

// Laboratory Task Status Enum
export enum LaboratoryTaskStatus {
  UnderEvaluation = 0,      // Đang đánh giá thử nghiệm - QLKT đang xem xét
  WaitingCustomerResponse = 1, // Chờ KH phản hồi - chờ KH xác nhận
  PartialAccepted = 2,      // Chấp nhận 1 phần
  FullyAccepted = 3,        // Chấp nhận thử nghiệm (toàn bộ)
  TestingRejected = 4,      // Từ chối thử nghiệm (toàn bộ)
  Assigned = 5,             // Đã giao việc (tất cả chỉ tiêu đã có KTV + phương pháp)
  InProgress = 6,           // Đang thử nghiệm
  WaitingApproval = 7,      // Chờ duyệt kết quả
  Approved = 8,             // Đã duyệt
  Rejected = 9,             // Từ chối (KQ không đạt)
  SentToQuality = 10        // Đã gửi QL Chất lượng
}

// Indicator Approval Status Enum (Phase 6 + Workflow Redesign)
export enum IndicatorApprovalStatus {
  Pending = 0,              // Chờ nhập kết quả / Chờ QLKT đánh giá
  Entered = 1,              // Đã nhập kết quả
  Approved = 2,             // Đã duyệt (QLKT duyệt kết quả)
  Rejected = 3,             // Không duyệt (Từ chối kết quả)
  CustomerCancelled = 4,    // Khách hàng hủy
  MethodChangeRequested = 5, // Yêu cầu đổi phương pháp - chờ KH xác nhận
  MethodChanged = 6,        // Đã đổi phương pháp - KH đã xác nhận
  TestingRejected = 7,      // Từ chối thử nghiệm - QLKT từ chối, KH xác nhận
  AcceptedForTesting = 8,   // Chấp nhận thử nghiệm - QLKT chấp nhận
  CannotTest = 9            // Không TN được - KTV báo không thể thử nghiệm
}

// Status display helper
export const LaboratoryTaskStatusLabels: Record<LaboratoryTaskStatus, string> = {
  [LaboratoryTaskStatus.UnderEvaluation]: 'Đánh giá thử nghiệm',
  [LaboratoryTaskStatus.WaitingCustomerResponse]: 'Chờ KH phản hồi',
  [LaboratoryTaskStatus.PartialAccepted]: 'Chấp nhận 1 phần',
  [LaboratoryTaskStatus.FullyAccepted]: 'Chấp nhận TN',
  [LaboratoryTaskStatus.TestingRejected]: 'Từ chối TN',
  [LaboratoryTaskStatus.Assigned]: 'Đã phân công',
  [LaboratoryTaskStatus.InProgress]: 'Đang thử nghiệm',
  [LaboratoryTaskStatus.WaitingApproval]: 'Chờ duyệt kết quả',
  [LaboratoryTaskStatus.Approved]: 'Đã duyệt',
  [LaboratoryTaskStatus.Rejected]: 'Từ chối KQ',
  [LaboratoryTaskStatus.SentToQuality]: 'Đã gửi QLCL'
};

export const LaboratoryTaskStatusColors: Record<LaboratoryTaskStatus, string> = {
  [LaboratoryTaskStatus.UnderEvaluation]: 'processing',
  [LaboratoryTaskStatus.WaitingCustomerResponse]: 'warning',
  [LaboratoryTaskStatus.PartialAccepted]: 'cyan',
  [LaboratoryTaskStatus.FullyAccepted]: 'lime',
  [LaboratoryTaskStatus.TestingRejected]: 'red',
  [LaboratoryTaskStatus.Assigned]: 'blue',
  [LaboratoryTaskStatus.InProgress]: 'processing',
  [LaboratoryTaskStatus.WaitingApproval]: 'orange',
  [LaboratoryTaskStatus.Approved]: 'success',
  [LaboratoryTaskStatus.Rejected]: 'error',
  [LaboratoryTaskStatus.SentToQuality]: 'purple'
};

// Indicator Approval Status display helper (Phase 6 + Workflow Redesign)
export const IndicatorApprovalStatusLabels: Record<IndicatorApprovalStatus, string> = {
  [IndicatorApprovalStatus.Pending]: 'Chờ đánh giá',
  [IndicatorApprovalStatus.Entered]: 'Chờ duyệt KQ',
  [IndicatorApprovalStatus.Approved]: 'Đã duyệt KQ',
  [IndicatorApprovalStatus.Rejected]: 'Từ chối KQ',
  [IndicatorApprovalStatus.CustomerCancelled]: 'KH hủy',
  [IndicatorApprovalStatus.MethodChangeRequested]: 'Yêu cầu đổi PP',
  [IndicatorApprovalStatus.MethodChanged]: 'Đã đổi PP',
  [IndicatorApprovalStatus.TestingRejected]: 'Từ chối TN',
  [IndicatorApprovalStatus.AcceptedForTesting]: 'Chấp nhận TN',
  [IndicatorApprovalStatus.CannotTest]: 'Không TN được'
};

export const IndicatorApprovalStatusColors: Record<IndicatorApprovalStatus, string> = {
  [IndicatorApprovalStatus.Pending]: 'default',
  [IndicatorApprovalStatus.Entered]: 'warning',
  [IndicatorApprovalStatus.Approved]: 'success',
  [IndicatorApprovalStatus.Rejected]: 'error',
  [IndicatorApprovalStatus.CustomerCancelled]: 'volcano',
  [IndicatorApprovalStatus.MethodChangeRequested]: 'gold',
  [IndicatorApprovalStatus.MethodChanged]: 'cyan',
  [IndicatorApprovalStatus.TestingRejected]: 'red',
  [IndicatorApprovalStatus.AcceptedForTesting]: 'lime',
  [IndicatorApprovalStatus.CannotTest]: 'orange'
};

// Laboratory Task Indicator DTO (Phase 6 - Extended + Workflow Redesign)
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
  assignedDate?: string;  // Ngày giao việc cho KTV
  testDate?: string;  // Ngày thử nghiệm (ngày KTV bắt đầu/check-in)
  result?: string;
  note?: string;  // Ghi chú từ KTV
  unit?: string;
  entryDate?: string;
  enteredById?: string;
  enteredByName?: string;
  approvalStatus: IndicatorApprovalStatus;
  approvalDate?: string;
  approvedById?: string;
  approvedByName?: string;
  rejectionReason?: string;
  isSentToQuality?: boolean;  // Đã gửi cho QLCL chưa

  // Workflow Redesign - Testing Rejection fields
  testingRejectionReason?: string;  // Lý do từ chối thử nghiệm (QLKT từ chối)
  testingRejectionDate?: string;    // Ngày QLKT từ chối TN
  testingRejectedById?: string;     // Người từ chối TN
  testingRejectedByName?: string;

  // Workflow Redesign - Customer Confirmation fields
  customerConfirmationDate?: string;  // Ngày KH xác nhận
  customerConfirmedById?: string;     // Người xác nhận KH (BPGN)
  customerConfirmedByName?: string;

  // Phase 7 - Standard comparison fields
  standardId?: string;  // ID tiêu chuẩn so sánh
  standardName?: string;  // Tên tiêu chuẩn
  comparisonOperator?: string;  // Ký hiệu so sánh (<=, >=, <, >, =)
  allowedLimit?: string;  // Giới hạn cho phép
  images?: IndicatorImageDto[];  // Hình ảnh chỉ tiêu (max 5)

  // Workflow Redesign - Method Change History
  methodChangeHistories?: MethodChangeHistoryDto[];
}

// Method Change History DTO
export interface MethodChangeHistoryDto {
  id: string;
  indicatorId: string;
  oldMethodId?: string;
  oldMethodName?: string;
  newMethodId: string;
  newMethodName: string;
  reason: string;
  requestedDate: string;
  requestedByUserId: string;
  requestedByUserName: string;
  confirmedDate?: string;
  confirmedByUserId?: string;
  confirmedByUserName?: string;
  isApproved?: boolean;  // null = chờ, true = đồng ý, false = không đồng ý
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

  // Current user role flags
  isCurrentUserTechnicalManager?: boolean;  // Current user là QLKT của task này
  isCurrentUserSupporter?: boolean;  // Current user là Supporter của task này

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
  standardId?: string | null;
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

export type SampleStatus = 'notStarted' | 'assigned' | 'testing' | 'pendingApproval' | 'approved' | 'rejected' | 'customerCancelled';

export const SampleStatusLabels: Record<SampleStatus, string> = {
  notStarted: 'Chưa thực hiện',
  assigned: 'Chưa thực hiện',  // Internal status, displayed same as notStarted
  testing: 'Đang thử nghiệm',
  pendingApproval: 'Chờ phê duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  customerCancelled: 'KH hủy'
};

export const SampleStatusColors: Record<SampleStatus, string> = {
  notStarted: 'default',
  assigned: 'default',  // Same color as notStarted
  testing: 'processing',
  pendingApproval: 'warning',
  approved: 'success',
  rejected: 'error',
  customerCancelled: 'volcano'
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
  standardIds?: Record<string, string | null>;
}

// ============= Send to Quality DTOs =============

export interface SendToQualityInput {
  indicatorIds: string[];
  qualityManagerId: string;
  noteContent?: string | null;
  selectedNoteIds?: string[] | null;
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

// ============= Lab Tech Manager Pending Task DTO (Work Reminder) =============

export interface LabTechManagerPendingTaskDto {
  id: string;
  contractNumber: string;
  taskName: string;
  transferDate: string | null;
  requestCompletionDate: string | null;
  status: LaboratoryTaskStatus;
  daysUntilDeadline: number | null;
}

// ============= Lab Technician (KTV) Pending Task DTO (Work Reminder) =============

export interface LabTechnicianPendingTaskDto {
  id: string;
  contractNumber: string;
  taskName: string;
  transferDate: string | null;
  requestCompletionDate: string | null;
  pendingCount: number;
  enteredCount: number;
  rejectedCount: number;
}

// ============= Workflow Redesign - QLKT Evaluation DTOs =============

// Enum for indicator evaluation actions
export enum IndicatorEvaluationAction {
  Accept = 0,             // Chấp nhận thử nghiệm
  RequestMethodChange = 1, // Yêu cầu đổi phương pháp
  Reject = 2              // Từ chối thử nghiệm
}

// DTO for QLKT to evaluate a single indicator
export interface EvaluateIndicatorInput {
  action: IndicatorEvaluationAction;
  newMethodId?: string;   // Required when action = RequestMethodChange
  reason?: string;        // Required when action = RequestMethodChange or Reject
}

// Item in method change request
export interface MethodChangeRequestItem {
  indicatorId: string;
  newMethodId: string;
}

// DTO for QLKT to request method change for multiple indicators
export interface RequestMethodChangeInput {
  items: MethodChangeRequestItem[];
  reason: string;
}

// DTO for QLKT to reject indicators for testing
export interface RejectIndicatorsForTestingInput {
  indicatorIds: string[];
  reason: string;
}
