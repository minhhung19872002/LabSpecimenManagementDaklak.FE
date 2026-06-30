import { IndicatorImageDto, TestingStatus } from './testing';
import { TestRequestStatus } from './testRequest';
import { IndicatorApprovalStatus, QLKTDisplayStatus } from './laboratoryTask';

// Quality Management Status Enum
export enum QualityManagementStatus {
  PendingApproval = 0,    // Chờ phê duyệt
  Rejected = 1,           // Từ chối phê duyệt
  PendingPublish = 2,     // Chờ phát hành
  PartialPublished = 3,   // Đã phát hành 1 phần
  FullyPublished = 4,     // Đã phát hành
  HandedOver = 5          // Đã giao BPGN
}

// Quality Indicator Approval Status Enum
export enum QualityIndicatorApprovalStatus {
  PendingApproval = 0,    // Chờ phê duyệt
  Approved = 1,           // Đã duyệt
  Rejected = 2            // Từ chối phê duyệt
}

// Quality Task Type Enum
export enum QualityTaskType {
  ResultApproval = 0,     // Phê duyệt kết quả xét nghiệm
  ChangeApproval = 1      // Phê duyệt thay đổi phiếu yêu cầu
}

// Status display helper
export const QualityManagementStatusLabels: Record<QualityManagementStatus, string> = {
  [QualityManagementStatus.PendingApproval]: 'Chờ phê duyệt',
  [QualityManagementStatus.Rejected]: 'Từ chối phê duyệt',
  [QualityManagementStatus.PendingPublish]: 'Chờ phát hành',
  [QualityManagementStatus.PartialPublished]: 'Đã phát hành 1 phần',
  [QualityManagementStatus.FullyPublished]: 'Đã phát hành',
  [QualityManagementStatus.HandedOver]: 'Đã giao BPGN'
};

export const QualityManagementStatusColors: Record<QualityManagementStatus, string> = {
  [QualityManagementStatus.PendingApproval]: 'warning',
  [QualityManagementStatus.Rejected]: 'error',
  [QualityManagementStatus.PendingPublish]: 'warning',
  [QualityManagementStatus.PartialPublished]: 'cyan',
  [QualityManagementStatus.FullyPublished]: 'blue',
  [QualityManagementStatus.HandedOver]: 'success'
};

// Indicator Approval Status display helper
export const QualityIndicatorApprovalStatusLabels: Record<QualityIndicatorApprovalStatus, string> = {
  [QualityIndicatorApprovalStatus.PendingApproval]: 'Chờ duyệt',
  [QualityIndicatorApprovalStatus.Approved]: 'Đã duyệt',
  [QualityIndicatorApprovalStatus.Rejected]: 'Từ chối'
};

export const QualityIndicatorApprovalStatusColors: Record<QualityIndicatorApprovalStatus, string> = {
  [QualityIndicatorApprovalStatus.PendingApproval]: 'warning',
  [QualityIndicatorApprovalStatus.Approved]: 'success',
  [QualityIndicatorApprovalStatus.Rejected]: 'error'
};

// Quality Task Type Labels
export const QualityTaskTypeLabels: Record<QualityTaskType, string> = {
  [QualityTaskType.ResultApproval]: 'Phê duyệt kết quả',
  [QualityTaskType.ChangeApproval]: 'Phê duyệt thay đổi'
};

// ============= QLCL Display Status (Sổ nhận việc QLCL - Cột Tình trạng) =============

/**
 * Trạng thái hiển thị tại cột "Tình trạng" trong tab Sổ nhận việc QLCL
 * Mapping từ TestRequestStatus + IndicatorApprovalStatus + QualityIndicatorApprovalStatus + các field khác
 */
export enum QLCLDisplayStatus {
  New = 0,                        // Mới
  WaitingForPayment = 1,          // Chờ thanh toán
  UnderReview = 2,                // Đang xem xét YC
  Rejected = 3,                   // Từ chối (QLCL từ chối YC)
  WaitingForAssignment = 4,       // Chờ giao việc
  ToDo = 5,                       // Cần làm
  Testing = 6,                    // Đang thử nghiệm
  WaitingQLKTApproval = 7,        // Chờ QLKT phê duyệt
  ResultRejected = 8,             // Từ chối KQ
  WaitingQLCLApproval = 9,        // Chờ QLCL Duyệt
  QLCLRejected = 10,              // QLCL từ chối
  WaitingForPublishing = 11,      // Chờ phát hành
  Published = 12,                 // Đã phát hành báo cáo
  RequestCancelled = 13           // Hủy bỏ yêu cầu
}

export const QLCLDisplayStatusLabels: Record<QLCLDisplayStatus, string> = {
  [QLCLDisplayStatus.New]: 'Mới',
  [QLCLDisplayStatus.WaitingForPayment]: 'Chờ thanh toán',
  [QLCLDisplayStatus.UnderReview]: 'Đang xem xét YC',
  [QLCLDisplayStatus.Rejected]: 'Từ chối',
  [QLCLDisplayStatus.WaitingForAssignment]: 'Chờ giao việc',
  [QLCLDisplayStatus.ToDo]: 'Cần làm',
  [QLCLDisplayStatus.Testing]: 'Đang thử nghiệm',
  [QLCLDisplayStatus.WaitingQLKTApproval]: 'Chờ QLKT phê duyệt',
  [QLCLDisplayStatus.ResultRejected]: 'Từ chối KQ',
  [QLCLDisplayStatus.WaitingQLCLApproval]: 'Chờ QLCL Duyệt',
  [QLCLDisplayStatus.QLCLRejected]: 'QLCL từ chối',
  [QLCLDisplayStatus.WaitingForPublishing]: 'Chờ phát hành',
  [QLCLDisplayStatus.Published]: 'Đã phát hành',
  [QLCLDisplayStatus.RequestCancelled]: 'Hủy bỏ'
};

export const QLCLDisplayStatusColors: Record<QLCLDisplayStatus, string> = {
  [QLCLDisplayStatus.New]: 'default',                    // Xám - mới
  [QLCLDisplayStatus.WaitingForPayment]: 'gold',         // Vàng - chờ thanh toán
  [QLCLDisplayStatus.UnderReview]: 'processing',         // Xanh dương nhạt - đang xử lý
  [QLCLDisplayStatus.Rejected]: 'red',                   // Đỏ - từ chối
  [QLCLDisplayStatus.WaitingForAssignment]: 'default',   // Xám - chờ giao việc
  [QLCLDisplayStatus.ToDo]: 'blue',                      // Xanh - cần làm
  [QLCLDisplayStatus.Testing]: 'processing',             // Xanh dương nhạt - đang TN
  [QLCLDisplayStatus.WaitingQLKTApproval]: 'warning',    // Vàng cam - chờ QLKT duyệt
  [QLCLDisplayStatus.ResultRejected]: 'error',           // Đỏ - từ chối KQ
  [QLCLDisplayStatus.WaitingQLCLApproval]: 'purple',     // Tím - chờ QLCL
  [QLCLDisplayStatus.QLCLRejected]: 'error',             // Đỏ - QLCL từ chối
  [QLCLDisplayStatus.WaitingForPublishing]: 'cyan',      // Xanh cyan - chờ phát hành
  [QLCLDisplayStatus.Published]: 'success',               // Xanh lá - đã phát hành
  [QLCLDisplayStatus.RequestCancelled]: 'error'           // Đỏ - hủy bỏ yêu cầu
};

// Change History DTO (for ChangeApproval tasks)
export interface ChangeHistoryDto {
  id: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  rejectionReason?: string;
  creationTime: string;
  createdById?: string;
  createdByName?: string;
}

// Quality Management Task DTO
export interface QualityManagementTaskDto {
  id: string;
  testRequestId: string;
  contractNumber: string;
  taskType: QualityTaskType;
  totalSampleCount: number;
  totalIndicatorCount: number;
  laboratoryNames?: string;
  transferDate?: string;
  requestCompletionDate?: string;
  status: QualityManagementStatus;
  // Thông tin giao BPGN
  handoverDate?: string;
  handoverByUserName?: string;
  handoverNote?: string;
  customerName?: string;
  technicalManagerNames?: string;
  changeHistoryId?: string;
  assignedQualityManagerId?: string;
  assignedQualityManagerName?: string;
  changeHistory?: ChangeHistoryDto;
  testRequestStatus?: TestRequestStatus;
  latestApprovalDate?: string;
  latestIndicatorApprovalDate?: string;
  indicators?: QualityManagementIndicatorDto[];
  allIndicators?: QualityManagementIndicatorDto[];

  // Audit fields
  creationTime?: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
}

// Quality Management Indicator DTO
export interface QualityManagementIndicatorDto {
  id: string;
  qualityManagementIndicatorId?: string;
  testRequestSampleIndicatorId: string;
  laboratoryTaskIndicatorId?: string;
  laboratoryTaskId?: string;
  laboratoryId: string;
  laboratoryName?: string;
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  specimenTypeName?: string;
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorFormattedName?: string;  // Tên chỉ tiêu có định dạng HTML
  methodId?: string;
  methodName?: string;
  methodFormattedName?: string;  // Tên phương pháp có định dạng HTML
  unit?: string;
  result?: string;
  resultSentDate?: string;
  approvalDate?: string;
  standardId?: string;
  standardName?: string;
  referenceLimit?: string;
  comparisonOperator?: string;  // Ký hiệu so sánh (<=, >=, <, >, =)
  allowedLimit?: string;  // Giới hạn cho phép
  lowerOperator?: string;       // Ký hiệu cận dưới (>, >=) - cho khoảng
  lowerLimit?: string;          // Giá trị cận dưới - cho khoảng
  upperOperator?: string;       // Ký hiệu cận trên (<, <=) - cho khoảng
  upperLimit?: string;          // Giá trị cận trên - cho khoảng
  approvalStatus?: QualityIndicatorApprovalStatus;
  rejectionReason?: string;
  isResultSent: boolean;  // DEPRECATED
  qualityResultSentDate?: string;  // DEPRECATED
  // Thông tin in kết quả
  isPrinted: boolean;
  printedDate?: string;
  approvedById?: string;
  approvedByName?: string;
  images?: IndicatorImageDto[];  // Hình ảnh chỉ tiêu (max 5)
  freeTextNote?: string;  // Ghi chú tự do từ QLKT
  masterDataNotes?: string[];  // Danh sách nội dung Master Data Notes
  parentIndicatorId?: string;  // ID chỉ tiêu cha (null nếu là chỉ tiêu gốc)
  technicalManagerName?: string;
  technicianId?: string;
  technicianName?: string;
  qlktApprovalDate?: string;
  indicatorApprovalStatus?: IndicatorApprovalStatus;
  testingStatus?: TestingStatus;
  qlclDisplayStatus?: QLCLDisplayStatus;
  isInQualityScope?: boolean;
}

// Quality Indicator Status History DTO
export interface QualityIndicatorStatusHistoryDto {
  id: string;
  qualityManagementIndicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  oldStatus: QualityIndicatorApprovalStatus;
  newStatus: QualityIndicatorApprovalStatus;
  comment?: string;
  creationTime: string;
  creatorId?: string;
  creatorName?: string;
}

// Statistics DTO
export interface QualityManagementStatisticsDto {
  pendingApprovalCount: number;
  overdueCount: number;
  pendingPublishCount: number;   // Chờ phát hành
  publishedCount: number;        // Đã phát hành (1 phần hoặc toàn bộ)
}

// Filter Input DTO
export interface GetQualityManagementListInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: QualityManagementStatus;
  taskType?: QualityTaskType;
  fromDate?: string;
  toDate?: string;
  isOverdue?: boolean;
  requestCompletionDateFrom?: string;
  requestCompletionDateTo?: string;
  laboratoryIds?: string[];
  dateFilterField?: string;
}

// Paged result
export interface PagedQualityManagementResult {
  items: QualityManagementTaskDto[];
  totalCount: number;
}

// Standard Lookup DTO
export interface StandardLookupDto {
  id: string;
  code: string;
  name: string;
}

// Standard Indicator Info DTO
export interface StandardIndicatorInfoDto {
  standardId: string;
  indicatorId: string;
  methodId: string;
  unit?: string;
  comparisonOperator?: string;
  allowedLimit?: string;
  referenceLimit?: string;
}

// List result for lookups
export interface ListStandardLookupResult {
  items: StandardLookupDto[];
}

// Quality Task History DTO (grouped by indicator)
export interface QualityTaskHistoryDto {
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorFormattedName?: string;  // Tên chỉ tiêu có định dạng HTML
  sampleCode?: string;
  sampleName?: string;
  histories: QualityIndicatorStatusHistoryDto[];
}

// Change Approval Status (from TestRequest)
export enum ChangeApprovalStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2
}

// Change Approval History DTO (legacy flat format)
export interface ChangeApprovalHistoryDto {
  id: string;
  action: string;
  status: ChangeApprovalStatus;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  rejectionReason?: string;
  creationTime: string;
  creatorId?: string;
  creatorName?: string;
  approvalDate?: string;
  approvedById?: string;
  approvedByName?: string;
}

// Change Approval Field DTO (for grouped batch format)
export interface ChangeApprovalFieldDto {
  id: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
}

// Change Approval Batch DTO (grouped by CreationTime)
export interface ChangeApprovalBatchDto {
  creationTime: string;
  creatorId?: string;
  creatorName?: string;
  status: ChangeApprovalStatus;
  action: string;
  approvalDate?: string;
  approvedById?: string;
  approvedByName?: string;
  rejectionReason?: string;
  fields: ChangeApprovalFieldDto[];
}

// Task History Response DTO - supports both ResultApproval and ChangeApproval
export interface TaskHistoryResponseDto {
  taskType: QualityTaskType;
  indicatorHistories: QualityTaskHistoryDto[];
  changeHistories: ChangeApprovalHistoryDto[];
  changeHistoryBatches: ChangeApprovalBatchDto[];
}

// Quality Manager Pending Task DTO (for popup reminder)
export interface QualityManagerPendingTaskDto {
  id: string;
  testRequestId: string;
  contractNumber: string;
  taskName: string;
  transferDate?: string;
  requestCompletionDate?: string;
  status: QualityManagementStatus;
  daysUntilDeadline?: number;
}

// Bulk Approve Indicators Result DTO
export interface BulkApproveIndicatorsResultDto {
  successCount: number;
  failedCount: number;
  failedIndicators: string[];
  approvedIndicators: QualityManagementIndicatorDto[];
}

// Bulk Reject Indicators Result DTO
export interface BulkRejectIndicatorsResultDto {
  successCount: number;
  failedCount: number;
  failedIndicators: string[];
  rejectedIndicators: QualityManagementIndicatorDto[];
}

// Confirm Handover Input DTO
export interface ConfirmHandoverInput {
  note?: string;
}

// =====================
// Sample Assignment Log Types
// =====================

// Sample Assignment Log DTO - Flat indicator list for "Sổ nhận mẫu giao việc" tab
export interface SampleAssignmentLogDto {
  // TestRequest info
  testRequestId: string;
  qualityTaskId: string;
  laboratoryTaskId: string;
  contractNumber?: string;
  testRequestStatus: TestRequestStatus;
  requestCompletionDate?: string;

  // Sample info
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  sampleQuantity?: string;
  sampleStatusText?: string;

  // Indicator info
  indicatorId: string;
  laboratoryTaskIndicatorId: string;
  indicatorName?: string;
  indicatorFormattedName?: string;
  methodName?: string;
  methodFormattedName?: string;
  unit?: string;
  transferDate?: string;
  testDate?: string;
  result?: string;

  // Assignment info
  technicalManagerName?: string;
  technicianName?: string;
  entryDate?: string;
  qlktApprovalDate?: string;

  // Status for highlighting
  indicatorApprovalStatus: IndicatorApprovalStatus;
  testingStatus?: TestingStatus;
  qlktDisplayStatus?: QLKTDisplayStatus;
  qlclDisplayStatus?: QLCLDisplayStatus;
  qualityApprovalStatus?: QualityIndicatorApprovalStatus;
  isReportPublished: boolean;
}

// Input DTO for getting Sample Assignment Log list
export interface GetSampleAssignmentLogInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  testRequestStatus?: TestRequestStatus;
  fromDate?: string;
  toDate?: string;
  laboratoryIds?: string[];
  indicatorIds?: string[];
  technicianIds?: string[];
  qlclDisplayStatuses?: number[];
  qlktDisplayStatuses?: number[];
  results?: string[];
}

// Paged result for Sample Assignment Log
export interface PagedSampleAssignmentLogResult {
  items: SampleAssignmentLogDto[];
  totalCount: number;
}

// Statistics for Sample Assignment Log (by QLKTDisplayStatus)
export interface SampleAssignmentLogStatisticsDto {
  total: number;
  underReview: number;
  toDo: number;
  testing: number;
  waitingApproval: number;
  resultRejected: number;
  completed: number;
}

// Statistics for QLCL Sample Assignment Log (by QLCLDisplayStatus)
export interface QLCLSampleAssignmentLogStatisticsDto {
  total: number;
  toDo: number;                // ToDo + Testing
  waitingQLKTApproval: number;
  waitingQLCLApproval: number;
  waitingForPublishing: number;
  published: number;
}
