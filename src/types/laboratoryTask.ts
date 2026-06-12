import { IndicatorImageDto } from './testing';
import { TestRequestStatus } from './testRequest';

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
  SentToQuality = 10,       // Đã gửi QL Chất lượng
  WaitingSharedSample = 11  // Chờ nhận mẫu chung - Task của Lab Hóa đang chờ Lab Vi Sinh
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
  CannotTest = 9,           // Không TN được - KTV báo không thể thử nghiệm
  SupplementaryRequested = 10 // Yêu cầu bổ sung - QLKT yêu cầu KH cung cấp thông tin bổ sung
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
  [LaboratoryTaskStatus.SentToQuality]: 'Đã gửi QLCL',
  [LaboratoryTaskStatus.WaitingSharedSample]: 'Chờ Lab khác'
};

export const LaboratoryTaskStatusColors: Record<LaboratoryTaskStatus, string> = {
  [LaboratoryTaskStatus.UnderEvaluation]: 'geekblue',
  [LaboratoryTaskStatus.WaitingCustomerResponse]: 'warning',
  [LaboratoryTaskStatus.PartialAccepted]: 'cyan',
  [LaboratoryTaskStatus.FullyAccepted]: 'lime',
  [LaboratoryTaskStatus.TestingRejected]: 'red',
  [LaboratoryTaskStatus.Assigned]: 'blue',
  [LaboratoryTaskStatus.InProgress]: 'processing',
  [LaboratoryTaskStatus.WaitingApproval]: 'orange',
  [LaboratoryTaskStatus.Approved]: 'success',
  [LaboratoryTaskStatus.Rejected]: 'error',
  [LaboratoryTaskStatus.SentToQuality]: 'purple',
  [LaboratoryTaskStatus.WaitingSharedSample]: 'gold'
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
  [IndicatorApprovalStatus.CannotTest]: 'Không TN được',
  [IndicatorApprovalStatus.SupplementaryRequested]: 'YC bổ sung'
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
  [IndicatorApprovalStatus.AcceptedForTesting]: 'geekblue',
  [IndicatorApprovalStatus.CannotTest]: 'orange',
  [IndicatorApprovalStatus.SupplementaryRequested]: 'purple'
};

// Laboratory Task Indicator DTO (Phase 6 - Extended + Workflow Redesign)
export interface LaboratoryTaskIndicatorDto {
  id: string;
  testRequestSampleIndicatorId: string;
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  specimenTypeId?: string;  // ID nền mẫu (loại mẫu)
  specimenTypeName?: string;  // Tên nền mẫu
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorFormattedName?: string;  // Tên chỉ tiêu có định dạng HTML
  indicatorGroupName?: string;
  parentIndicatorId?: string;  // ID chỉ tiêu cha (null nếu là chỉ tiêu gốc)
  unitPrice: number;

  // Phase 6 workflow fields
  methodId?: string;
  methodName?: string;
  methodFormattedName?: string;  // Tên phương pháp có định dạng HTML
  isSubContractMethod?: boolean; // Chỉ tiêu thuộc luồng cập nhật PP phụ (PP gốc là '-')
  subContractMethodName?: string;
  subContractNumber?: string;
  subContractCost?: number;
  technicianId?: string;
  technicianName?: string;
  assignedDate?: string;  // Ngày giao việc cho KTV
  testDate?: string;  // Ngày thử nghiệm (ngày KTV bắt đầu/check-in)
  result?: string;
  freeTextNote?: string;  // Ghi chú tự do (áp dụng cho tất cả chỉ tiêu trong sample)
  masterDataNoteIds?: string;  // Danh sách ID của Master Data Notes (comma-separated)
  masterDataNoteContents?: string[];  // Nội dung các Master Data Notes (để hiển thị UI)
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
  isWaitingForSharedSample?: boolean;  // Chỉ tiêu này đang chờ mẫu chung từ lab khác (Vi Sinh)

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
  lowerOperator?: string;  // Ký hiệu cận dưới (>, >=) - cho khoảng
  lowerLimit?: string;  // Giá trị cận dưới - cho khoảng
  upperOperator?: string;  // Ký hiệu cận trên (<, <=) - cho khoảng
  upperLimit?: string;  // Giá trị cận trên - cho khoảng
  images?: IndicatorImageDto[];  // Hình ảnh chỉ tiêu (max 5)

  // Workflow Redesign - Method Change History
  methodChangeHistories?: MethodChangeHistoryDto[];

  // Supplementary Request fields
  supplementaryRequestReason?: string;  // Lý do yêu cầu bổ sung
  supplementaryRequestDate?: string;    // Ngày yêu cầu bổ sung
  supplementaryRequestedById?: string;  // ID người yêu cầu bổ sung (QLKT)
  supplementaryRequestedByName?: string; // Tên người yêu cầu bổ sung
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
  testDateRange?: string;  // Khoảng ngày thử nghiệm: "dd/MM/yyyy - dd/MM/yyyy" (Min - Max từ indicators)
  status: LaboratoryTaskStatus;
  notes?: string;
  resultRejectionReason?: string;  // Lý do QLCL từ chối KQ

  // Shared Sample (Mẫu chung) fields
  isSharedSampleTask?: boolean;     // Task này thuộc về mẫu chung
  isWaitingForPriorLab?: boolean;   // Đang chờ lab trước hoàn thành (Lab Hóa chờ Vi Sinh)
  sampleSentToNextLab?: boolean;    // Đã gửi mẫu cho lab tiếp theo
  sampleSentDate?: string;          // Ngày gửi mẫu
  underReviewDate?: string;         // Ngày gửi QLKT
  sampleReceivedDate?: string;      // Ngày nhận mẫu từ lab trước
  sampleReceivedNote?: string;      // Ghi chú khi nhận mẫu
  priorLabTaskId?: string;          // ID của Task lab trước (Lab Hóa reference đến Task Vi Sinh)
  priorLabSentSample?: boolean;     // Lab trước đã gửi mẫu chưa (true = Vi Sinh đã gửi, có thể nhận)

  // Navigation properties
  testRequestNumber?: string;
  testRequestStatus?: TestRequestStatus;
  laboratoryName?: string;
  laboratoryCode?: string;
  customerName?: string;
  indicators?: LaboratoryTaskIndicatorDto[];
  supporters?: LaboratoryTaskSupporterDto[];

  // Current user role flags
  isCurrentUserTechnicalManager?: boolean;  // Current user là QLKT của task này
  isCurrentUserSupporter?: boolean;  // Current user là Supporter của task này
  isCurrentUserDepartmentSupporter?: boolean;  // Current user là Department Supporter của khoa phòng

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
  testRequestStatus?: TestRequestStatus;
  technicalManagerId?: string;
  fromDate?: string;
  toDate?: string;
}

// Paged result
export interface PagedLaboratoryTaskResult {
  items: LaboratoryTaskDto[];
  totalCount: number;
}

// Task status statistics (counts per status, no filter)
export interface TaskStatusStatisticsDto {
  total: number;
  underEvaluation: number;
  waitingCustomerResponse: number;
  partialAccepted: number;
  fullyAccepted: number;
  assigned: number;
  inProgress: number;
  waitingApproval: number;
  approved: number;
  sentToQuality: number;
}

// List result (for non-paged endpoints)
export interface ListLaboratoryTaskResult {
  items: LaboratoryTaskDto[];
}

// ============= Phase 6 - Workflow Input DTOs =============

// Assign indicator DTO (gán phương pháp + Thử nghiệm viên)
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

export interface UpdateSubContractMethodInput {
  subContractMethodName: string;
  subContractNumber: string;
  subContractCost?: number;
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
  specimenTypeName?: string;
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

// ============= Department Supporter DTOs =============

export interface LaboratoryDepartmentSupporterDto {
  id: string;
  laboratoryId: string;
  userId: string;
  userName?: string;
  fullName?: string;
  email?: string;
  expirationDate: string;
  creationTime: string;
}

export interface DepartmentSupporterEntry {
  userId: string;
  expirationDate: string;
}

export interface AddDepartmentSupportersInput {
  entries: DepartmentSupporterEntry[];
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
  taskType?: string;
  creationTime?: string;
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
  Reject = 2,             // Từ chối thử nghiệm
  RequestSupplementary = 3 // Yêu cầu bổ sung thông tin
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

// ============= QLKT Display Status (Sổ nhận việc - Cột Tình trạng) =============

/**
 * Trạng thái hiển thị tại cột "Tình trạng" trong tab Sổ nhận việc QLKT
 * Mapping từ IndicatorApprovalStatus + các field khác
 */
export enum QLKTDisplayStatus {
  UnderReview = 0,              // Đang xem xét YC
  MethodChangeRequested = 1,    // Yêu cầu đổi PP
  MethodChanged = 2,            // Đã đổi PP
  TestingRejected = 3,          // Từ chối TN
  SupplementaryRequested = 4,   // YC bổ sung
  CustomerCancelled = 5,        // KH hủy
  CannotTest = 6,               // Không TN được
  WaitingForAssignment = 7,     // Chờ giao việc
  ToDo = 8,                     // Cần làm
  Testing = 9,                  // Đang thử nghiệm
  WaitingQLKTApproval = 10,     // Chờ QLKT phê duyệt
  ResultRejected = 11,          // Từ chối KQ
  WaitingQLCLApproval = 12,     // Chờ QLCL Duyệt
  QLCLRejected = 13,            // QLCL từ chối
  Completed = 14,               // Hoàn thành
  RequestCancelled = 15         // Hủy bỏ yêu cầu
}

export const QLKTDisplayStatusLabels: Record<QLKTDisplayStatus, string> = {
  [QLKTDisplayStatus.UnderReview]: 'Đang xem xét YC',
  [QLKTDisplayStatus.MethodChangeRequested]: 'Yêu cầu đổi PP',
  [QLKTDisplayStatus.MethodChanged]: 'Đã đổi PP',
  [QLKTDisplayStatus.TestingRejected]: 'Từ chối TN',
  [QLKTDisplayStatus.SupplementaryRequested]: 'YC bổ sung',
  [QLKTDisplayStatus.CustomerCancelled]: 'KH hủy',
  [QLKTDisplayStatus.CannotTest]: 'Không TN được',
  [QLKTDisplayStatus.WaitingForAssignment]: 'Chờ giao việc',
  [QLKTDisplayStatus.ToDo]: 'Cần làm',
  [QLKTDisplayStatus.Testing]: 'Đang thử nghiệm',
  [QLKTDisplayStatus.WaitingQLKTApproval]: 'Chờ QLKT phê duyệt',
  [QLKTDisplayStatus.ResultRejected]: 'Từ chối KQ',
  [QLKTDisplayStatus.WaitingQLCLApproval]: 'Chờ QLCL Duyệt',
  [QLKTDisplayStatus.QLCLRejected]: 'QLCL từ chối',
  [QLKTDisplayStatus.Completed]: 'Hoàn thành',
  [QLKTDisplayStatus.RequestCancelled]: 'Hủy bỏ'
};

export const QLKTDisplayStatusColors: Record<QLKTDisplayStatus, string> = {
  [QLKTDisplayStatus.UnderReview]: 'processing',       // Xanh dương nhạt - đang xử lý
  [QLKTDisplayStatus.MethodChangeRequested]: 'gold',   // Vàng - chờ xác nhận
  [QLKTDisplayStatus.MethodChanged]: 'cyan',           // Xanh cyan - đã thay đổi
  [QLKTDisplayStatus.TestingRejected]: 'red',          // Đỏ - từ chối
  [QLKTDisplayStatus.SupplementaryRequested]: 'orange', // Cam - yêu cầu bổ sung
  [QLKTDisplayStatus.CustomerCancelled]: 'volcano',    // Đỏ cam - KH hủy
  [QLKTDisplayStatus.CannotTest]: 'magenta',           // Hồng - không TN được
  [QLKTDisplayStatus.WaitingForAssignment]: 'default', // Xám - chờ giao việc
  [QLKTDisplayStatus.ToDo]: 'blue',                    // Xanh - cần làm
  [QLKTDisplayStatus.Testing]: 'processing',           // Xanh dương nhạt - đang TN
  [QLKTDisplayStatus.WaitingQLKTApproval]: 'warning',  // Vàng cam - chờ duyệt
  [QLKTDisplayStatus.ResultRejected]: 'error',         // Đỏ - từ chối KQ
  [QLKTDisplayStatus.WaitingQLCLApproval]: 'purple',   // Tím - chờ QLCL
  [QLKTDisplayStatus.QLCLRejected]: 'error',           // Đỏ - QLCL từ chối
  [QLKTDisplayStatus.Completed]: 'success',             // Xanh lá - hoàn thành
  [QLKTDisplayStatus.RequestCancelled]: 'error'         // Đỏ - hủy bỏ yêu cầu
};
