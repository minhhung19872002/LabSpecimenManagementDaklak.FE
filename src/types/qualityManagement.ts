// Quality Management Status Enum
export enum QualityManagementStatus {
  PendingApproval = 0,    // Chờ phê duyệt
  Testing = 1,            // Đang thử nghiệm
  Approved = 2,           // Đã duyệt
  Rejected = 3,           // Từ chối phê duyệt
  PendingSignature = 4,   // Chờ ký
  ResultSent = 5          // Đã trả KQ
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
  [QualityManagementStatus.Testing]: 'Đang thử nghiệm',
  [QualityManagementStatus.Approved]: 'Đã duyệt',
  [QualityManagementStatus.Rejected]: 'Từ chối phê duyệt',
  [QualityManagementStatus.PendingSignature]: 'Chờ ký',
  [QualityManagementStatus.ResultSent]: 'Đã trả KQ'
};

export const QualityManagementStatusColors: Record<QualityManagementStatus, string> = {
  [QualityManagementStatus.PendingApproval]: 'warning',
  [QualityManagementStatus.Testing]: 'processing',
  [QualityManagementStatus.Approved]: 'success',
  [QualityManagementStatus.Rejected]: 'error',
  [QualityManagementStatus.PendingSignature]: 'purple',
  [QualityManagementStatus.ResultSent]: 'cyan'
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
  resultSentDate?: string;
  status: QualityManagementStatus;
  customerName?: string;
  technicalManagerNames?: string;
  changeHistoryId?: string;
  changeHistory?: ChangeHistoryDto;
  indicators?: QualityManagementIndicatorDto[];

  // Audit fields
  creationTime?: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
}

// Quality Management Indicator DTO
export interface QualityManagementIndicatorDto {
  id: string;
  laboratoryTaskIndicatorId: string;
  laboratoryId: string;
  laboratoryName?: string;
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  methodId?: string;
  methodName?: string;
  unit?: string;
  result?: string;
  resultSentDate?: string;
  approvalDate?: string;
  standardId?: string;
  standardName?: string;
  referenceLimit?: string;
  approvalStatus: QualityIndicatorApprovalStatus;
  rejectionReason?: string;
  approvedById?: string;
  approvedByName?: string;
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
  pendingSignatureCount: number;
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

// Change Approval History DTO
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

// Task History Response DTO - supports both ResultApproval and ChangeApproval
export interface TaskHistoryResponseDto {
  taskType: QualityTaskType;
  indicatorHistories: QualityTaskHistoryDto[];
  changeHistories: ChangeApprovalHistoryDto[];
}
