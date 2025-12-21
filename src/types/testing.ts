import { IndicatorApprovalStatus } from './laboratoryTask';

// Testing Status Enum (KTV view)
export enum TestingStatus {
  Todo = 0,        // Cần làm
  InProgress = 1,  // Đang thí nghiệm
  Done = 2         // Đã xong
}

// Tab type for Testing list
export enum TestingTabType {
  MyAssignments = 0,  // Phân công của tôi
  All = 1             // Hiển thị tất cả
}

// Status display helper
export const TestingStatusLabels: Record<TestingStatus, string> = {
  [TestingStatus.Todo]: 'Cần làm',
  [TestingStatus.InProgress]: 'Đang thí nghiệm',
  [TestingStatus.Done]: 'Đã xong'
};

export const TestingStatusColors: Record<TestingStatus, string> = {
  [TestingStatus.Todo]: 'default',
  [TestingStatus.InProgress]: 'processing',
  [TestingStatus.Done]: 'success'
};

// Testing List DTO
export interface TestingListDto {
  id: string;
  laboratoryTaskId: string;
  contractNumber?: string;
  totalSampleCount: number;
  totalIndicatorCount: number;
  technicianNames?: string;
  transferDate?: string;
  requestCompletionDate?: string;
  testDate?: string;
  testingStatus: TestingStatus;
  isUrgent: boolean;
  laboratoryName?: string;
  customerName?: string;
}

// Get Testing List Input
export interface GetTestingListInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  tab?: TestingTabType;
  search?: string;
  statuses?: TestingStatus[];
  technicianIds?: string[];
  laboratoryId?: string;
}

// Paged result
export interface PagedTestingResult {
  items: TestingListDto[];
  totalCount: number;
}

// Testing Detail DTO
export interface TestingDetailDto {
  id: string;
  laboratoryTaskId: string;
  contractNumber?: string;
  testingStatus: TestingStatus;
  technicianNames?: string;
  laboratoryName?: string;
  laboratoryId: string;
  requestCompletionDate?: string;
  customerName?: string;
  technicalManagerId?: string;
  technicalManagerName?: string;
  completedIndicatorCount: number;
  totalIndicatorCount: number;
  samples: TestingSampleDto[];
}

// Testing Sample DTO
export interface TestingSampleDto {
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  statusText?: string;
  indicators: TestingIndicatorDto[];
}

// Testing Indicator DTO
export interface TestingIndicatorDto {
  id: string;
  testRequestSampleIndicatorId: string;
  indicatorId: string;
  indicatorName?: string;
  methodId?: string;
  methodName?: string;
  unit?: string;
  result?: string;
  entryDate?: string;
  assignedDate?: string;
  completionDate?: string;
  approvalStatus: IndicatorApprovalStatus;
  latestRejectionReason?: string;
  rejectionHistoryCount: number;
  technicianId?: string;
  technicianName?: string;
  canEdit: boolean;
}

// Save Indicator Result DTO
export interface SaveIndicatorResultDto {
  indicatorId: string;
  methodId?: string;
  unit?: string;
  result?: string;
}

// Save Results Input
export interface SaveResultsInput {
  results: SaveIndicatorResultDto[];
}

// Submit For Approval Input
export interface SubmitForApprovalInput {
  indicatorIds: string[];
}

// Rejection History DTO
export interface RejectionHistoryDto {
  id: string;
  indicatorId: string;
  rejectionReason: string;
  rejectedDate: string;
  rejectedById: string;
  rejectedByName?: string;
}
