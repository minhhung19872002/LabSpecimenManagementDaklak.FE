import { IndicatorApprovalStatus } from './laboratoryTask';
import { TestRequestStatus } from './testRequest';

// Testing Status Enum (Task level - 6 statuses)
export enum TestingStatus {
  NotStarted = 0,     // Chưa bắt đầu - Mới được assign
  InProgress = 1,     // Đang thử nghiệm - Đã check-in >=1 chỉ tiêu
  PendingApproval = 2, // Chờ phê duyệt - Đã gửi >=1 chỉ tiêu
  Rejected = 3,       // Bị từ chối - Có >=1 chỉ tiêu bị từ chối
  Completed = 4,      // Hoàn thành - Tất cả đã duyệt
  CannotTest = 5      // Không TN được - Có chỉ tiêu KTV báo không thể TN
}

// Indicator Testing Status Enum (Indicator level - 7 statuses)
export enum IndicatorTestingStatus {
  Todo = 0,           // Cần làm - Chưa check-in
  Testing = 1,        // Đang thí nghiệm - Đã check-in
  PendingApproval = 2, // Chờ phê duyệt - Đã gửi kết quả
  Rejected = 3,       // Bị từ chối - QLKT từ chối
  Done = 4,           // Đã xong - QLKT đã duyệt
  Cancelled = 5,      // KH hủy - Khách hàng đã hủy chỉ tiêu này
  CannotTest = 6      // Không TN được - KTV báo không thể thử nghiệm
}

// Sample Testing Image Type
export enum SampleTestingImageType {
  BeforeTesting = 0,  // Hình trước thử nghiệm
  AfterTesting = 1    // Hình sau thử nghiệm
}

// Tab type for Testing list
export enum TestingTabType {
  MyAssignments = 0,  // Phân công của tôi
  All = 1             // Hiển thị tất cả
}

// Status display helper - Task level
export const TestingStatusLabels: Record<TestingStatus, string> = {
  [TestingStatus.NotStarted]: 'Chưa bắt đầu',
  [TestingStatus.InProgress]: 'Đang thử nghiệm',
  [TestingStatus.PendingApproval]: 'Chờ phê duyệt',
  [TestingStatus.Rejected]: 'Bị từ chối',
  [TestingStatus.Completed]: 'Hoàn thành',
  [TestingStatus.CannotTest]: 'Không TN được'
};

export const TestingStatusColors: Record<TestingStatus, string> = {
  [TestingStatus.NotStarted]: 'default',
  [TestingStatus.InProgress]: 'processing',
  [TestingStatus.PendingApproval]: 'warning',
  [TestingStatus.Rejected]: 'error',
  [TestingStatus.Completed]: 'success',
  [TestingStatus.CannotTest]: 'orange'
};

// Status display helper - Indicator level
export const IndicatorTestingStatusLabels: Record<IndicatorTestingStatus, string> = {
  [IndicatorTestingStatus.Todo]: 'Cần làm',
  [IndicatorTestingStatus.Testing]: 'Đang thí nghiệm',
  [IndicatorTestingStatus.PendingApproval]: 'Chờ phê duyệt',
  [IndicatorTestingStatus.Rejected]: 'Bị từ chối',
  [IndicatorTestingStatus.Done]: 'Đã xong',
  [IndicatorTestingStatus.Cancelled]: 'KH hủy',
  [IndicatorTestingStatus.CannotTest]: 'Không TN được'
};

export const IndicatorTestingStatusColors: Record<IndicatorTestingStatus, string> = {
  [IndicatorTestingStatus.Todo]: 'default',
  [IndicatorTestingStatus.Testing]: 'processing',
  [IndicatorTestingStatus.PendingApproval]: 'warning',
  [IndicatorTestingStatus.Rejected]: 'error',
  [IndicatorTestingStatus.Done]: 'success',
  [IndicatorTestingStatus.Cancelled]: 'volcano',
  [IndicatorTestingStatus.CannotTest]: 'orange'
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
  sampleSentDate?: string;
  testDate?: string;
  testingStatus: TestingStatus;
  isUrgent: boolean;
  laboratoryName?: string;
  customerName?: string;
  testRequestStatus?: TestRequestStatus;
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
  requestCompletionDateFrom?: string;
  requestCompletionDateTo?: string;
  indicatorIds?: string[];
}

// Paged result
export interface PagedTestingResult {
  items: TestingListDto[];
  totalCount: number;
}

// Sample Attachment DTO (from TestRequest - readonly)
export interface SampleAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
}

// Sample Testing Image DTO (before/after testing)
export interface SampleTestingImageDto {
  id: string;
  sampleId: string;
  fileId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  imageType: SampleTestingImageType;
  creationTime: string;
  creatorId?: string;
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
  sampleSentDate?: string;
  underReviewDate?: string;
  customerName?: string;
  technicalManagerId?: string;
  technicalManagerName?: string;
  completedIndicatorCount: number;
  totalIndicatorCount: number;
  samples: TestingSampleDto[];
  isMy: boolean;  // Có phải công việc của user hiện tại hay không
  testRequestStatus?: TestRequestStatus;  // Trạng thái phiếu yêu cầu
}

// Testing Sample DTO
export interface TestingSampleDto {
  sampleId: string;
  sampleCode?: string;
  sampleName?: string;
  statusText?: string;
  sampleImages: SampleAttachmentDto[];           // Hình mẫu từ TestRequest (readonly)
  beforeTestingImages: SampleTestingImageDto[];  // Hình trước TN (max 5)
  afterTestingImages: SampleTestingImageDto[];   // Hình sau TN (max 5)
  indicators: TestingIndicatorDto[];
  isReceived: boolean;                           // KTV đã nhận mẫu chưa
  receivedDate?: string;                         // Ngày nhận mẫu
  receivedByUserName?: string;                   // Tên KTV nhận mẫu
}

// Testing Indicator DTO
export interface TestingIndicatorDto {
  id: string;
  testRequestSampleIndicatorId: string;
  indicatorId: string;
  specimenTypeId?: string;  // Nền mẫu (để filter kết quả recommend theo indicator+specimenType)
  indicatorName?: string;
  indicatorFormattedName?: string;  // Tên chỉ tiêu có định dạng HTML
  methodId?: string;
  methodName?: string;
  methodFormattedName?: string;  // Tên phương pháp có định dạng HTML
  unit?: string;
  result?: string;
  note?: string;
  entryDate?: string;
  assignedDate?: string;
  startDate?: string;           // Ngày bắt đầu TN (khi ấn "Thực hiện")
  testDate?: string;            // Ngày thử nghiệm (do KTV chọn)
  submitDate?: string;          // Ngày gửi kết quả cho QLKT
  completionDate?: string;      // Ngày duyệt
  approvalStatus: IndicatorApprovalStatus;
  testingStatus: IndicatorTestingStatus;  // Trạng thái thử nghiệm
  latestRejectionReason?: string;
  rejectionHistoryCount: number;
  technicianId?: string;
  technicianName?: string;
  canEdit: boolean;
  canCheckIn: boolean;          // Có thể check-in (Thực hiện) không
  canSubmit: boolean;           // Có thể gửi kết quả không
  images: IndicatorImageDto[];  // Hình ảnh chỉ tiêu (max 5)
  standardId?: string;          // ID tiêu chuẩn so sánh (set by QLKT)
  standardName?: string;        // Tên tiêu chuẩn
  limitDescription?: string;    // Mô tả quy chuẩn
  referenceLimit?: string;      // Giới hạn tham chiếu
  comparisonOperator?: string;  // Ký hiệu so sánh (<=, >=, <, >, =)
  allowedLimit?: string;        // Giới hạn cho phép (giá trị cụ thể)
  lowerOperator?: string;       // Ký hiệu cận dưới (>, >=) - cho khoảng
  lowerLimit?: string;          // Giá trị cận dưới - cho khoảng
  upperOperator?: string;       // Ký hiệu cận trên (<, <=) - cho khoảng
  upperLimit?: string;          // Giá trị cận trên - cho khoảng
  parentIndicatorId?: string;   // ID chỉ tiêu cha (null nếu là chỉ tiêu gốc)
}

// Save Indicator Result DTO
export interface SaveIndicatorResultDto {
  indicatorId: string;
  methodId?: string;
  unit?: string;
  result?: string;
  note?: string;
  testDate?: string;  // Ngày thử nghiệm
}

// Save Results Input
export interface SaveResultsInput {
  results: SaveIndicatorResultDto[];
}

// Submit For Approval Input
export interface SubmitForApprovalInput {
  indicatorIds: string[];
}

// Check In Indicators Input
export interface CheckInIndicatorsInput {
  sampleId: string;
  indicatorIds: string[];
}

// Submit Indicator Input
export interface SubmitIndicatorInput {
  indicatorId: string;
  testDate: string;
}

// Submit Results Input
export interface SubmitResultsInput {
  sampleId: string;
  indicators: SubmitIndicatorInput[];
}

// Upload Sample Testing Image Input
export interface UploadSampleTestingImageInput {
  sampleId: string;
  imageType: SampleTestingImageType;
}

// Rejection History Image DTO
export interface RejectionHistoryImageDto {
  id: string;
  rejectionHistoryId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  url: string;
  creationTime: string;
  creatorId?: string;
}

// Rejection History DTO
export interface RejectionHistoryDto {
  id: string;
  indicatorId: string;
  rejectionReason: string;
  rejectedDate: string;
  rejectedById: string;
  rejectedByName?: string;
  isCannotTest: boolean;           // true = KTV báo không TN được
  reportedByRole?: string;         // "Technician" hoặc "QualityManager"
  images: RejectionHistoryImageDto[]; // Hình ảnh đính kèm
}

// Cannot Test DTO (KTV báo không TN được)
export interface CannotTestDto {
  reason: string;
}

// Indicator Image DTO
export interface IndicatorImageDto {
  id: string;
  laboratoryTaskIndicatorId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  url: string;
  creationTime: string;
  creatorId?: string;
}
