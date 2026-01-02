import { IndicatorApprovalStatus } from './laboratoryTask';

// Enums
export enum TestRequestStatus {
  New = 0,                      // Mới - vừa tạo, chưa in phiếu
  Pending = 1,                  // Chờ xử lý - đã in phiếu XN
  SampleSent = 2,               // Đã gửi mẫu - đã nhấn gửi mẫu (MỚI)
  InProgress = 3,               // Đang thử nghiệm - QLKT đã gán PP + KTV
  PendingChangeApproval = 4,    // Chờ phê duyệt thay đổi - chỉnh sửa cần QLCL duyệt (MỚI)
  PendingApproval = 5,          // Chờ Phê duyệt KQ - đã in KQ xét nghiệm
  Approved = 6,                 // Đã phê duyệt - lãnh đạo đã duyệt
  ResultSent = 7,               // Đã gửi kết quả - đã nhấn gửi KQ
  Completed = 8                 // Hoàn Thành - kết thúc quy trình
}

// Enum for change approval status
export enum ChangeApprovalStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2
}

// Labels for TestRequestStatus
export const TestRequestStatusLabels: Record<TestRequestStatus, string> = {
  [TestRequestStatus.New]: "Mới",
  [TestRequestStatus.Pending]: "Chờ xử lý",
  [TestRequestStatus.SampleSent]: "Đã gửi mẫu",
  [TestRequestStatus.InProgress]: "Đang thử nghiệm",
  [TestRequestStatus.PendingChangeApproval]: "Chờ phê duyệt thay đổi",
  [TestRequestStatus.PendingApproval]: "Chờ phê duyệt KQ",
  [TestRequestStatus.Approved]: "Đã phê duyệt",
  [TestRequestStatus.ResultSent]: "Gửi khách hàng",
  [TestRequestStatus.Completed]: "Hoàn Thành",
};

// Labels for ChangeApprovalStatus
export const ChangeApprovalStatusLabels: Record<ChangeApprovalStatus, string> = {
  [ChangeApprovalStatus.Pending]: "Chờ duyệt",
  [ChangeApprovalStatus.Approved]: "Đã duyệt",
  [ChangeApprovalStatus.Rejected]: "Từ chối",
};

// Colors for TestRequestStatus (Ant Design Tag colors)
export const TestRequestStatusColors: Record<TestRequestStatus, string> = {
  [TestRequestStatus.New]: "default",
  [TestRequestStatus.Pending]: "processing",
  [TestRequestStatus.SampleSent]: "geekblue",
  [TestRequestStatus.InProgress]: "blue",
  [TestRequestStatus.PendingChangeApproval]: "gold",
  [TestRequestStatus.PendingApproval]: "orange",
  [TestRequestStatus.Approved]: "green",
  [TestRequestStatus.ResultSent]: "purple",
  [TestRequestStatus.Completed]: "success",
};

// Colors for ChangeApprovalStatus
export const ChangeApprovalStatusColors: Record<ChangeApprovalStatus, string> = {
  [ChangeApprovalStatus.Pending]: "gold",
  [ChangeApprovalStatus.Approved]: "green",
  [ChangeApprovalStatus.Rejected]: "red",
};

// Helper functions for TestRequestStatus validation

/**
 * Kiểm tra có thể chỉnh sửa toàn bộ thông tin không
 * Full edit: New, Pending
 */
export const canEditFullInfo = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.New || status === TestRequestStatus.Pending;
};

/**
 * Kiểm tra có thể chỉnh sửa với phê duyệt (limited edit + cần QLCL duyệt)
 * Limited edit: SampleSent, InProgress
 */
export const canEditWithApproval = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.SampleSent || status === TestRequestStatus.InProgress;
};

/**
 * Kiểm tra có thể chỉnh sửa phiếu yêu cầu không (bao gồm full edit và limited edit)
 */
export const canEditTestRequest = (status: TestRequestStatus): boolean => {
  return canEditFullInfo(status) || canEditWithApproval(status);
};

/**
 * Kiểm tra có thể xóa phiếu yêu cầu không
 */
export const canDeleteTestRequest = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.New || status === TestRequestStatus.Pending;
};

/**
 * Kiểm tra có hiển thị actions cho phiếu yêu cầu không
 */
export const showActionsForTestRequest = (status: TestRequestStatus): boolean => {
  return status !== TestRequestStatus.Completed;
};

/**
 * Kiểm tra có thể gửi mẫu không (Pending → SampleSent)
 */
export const canSendSample = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.Pending;
};

/**
 * Kiểm tra có thể phê duyệt/từ chối thay đổi không (cho QLCL)
 */
export const canApproveOrRejectChanges = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.PendingChangeApproval;
};

/**
 * Kiểm tra có thể gửi kết quả không
 */
export const canSendResult = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.Approved;
};

/**
 * Kiểm tra có thể hoàn thành phiếu không
 */
export const canComplete = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.ResultSent;
};

export enum ResultLanguage {
  Vietnamese = 0,
  English = 1,
  VietnameseAndEnglish = 2
}

export enum SamplingRequirement {
  LabSampling = 0,
  CustomerSampling = 1
}

export enum SampleStorageOption {
  No = 0,
  Yes = 1
}

export enum SampleStatus {
  Normal = 0,
  Damaged = 1,
  NotMeetRequirements = 2,
  Testing = 3,
  Completed = 4
}

// Sample Indicator DTOs
export interface TestRequestSampleIndicatorDto {
  id: string;
  testRequestSampleId: string;
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorGroupName?: string;
  unitPrice: number;
  notes?: string;
  laboratoryId?: string;
  laboratoryName?: string;
  testMethodId?: string;
  testMethodCode?: string;
  testMethodName?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment: boolean;
  /** Trạng thái duyệt từ LaboratoryTaskIndicator (null nếu chưa gửi mẫu) */
  approvalStatus?: IndicatorApprovalStatus;
  /** Ngày thử nghiệm (ngày KTV bắt đầu thử nghiệm/check-in) */
  testDate?: string;
}

export interface CreateTestRequestSampleIndicatorDto {
  indicatorId: string;
  laboratoryId?: string;
  unitPrice?: number;
  notes?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment?: boolean;
}

export interface UpdateTestRequestSampleIndicatorDto {
  id?: string;
  indicatorId: string;
  laboratoryId?: string;
  unitPrice?: number;
  notes?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment?: boolean;
}

// Attachment DTO for sample images
export interface SampleAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  url: string;
}

// Postal Delivery Image DTO
export interface PostalDeliveryImageDto {
  fileId: string;
  url: string;
}

// Sample Testing Image DTO (hình trước/sau thử nghiệm)
export enum SampleTestingImageType {
  BeforeTesting = 0,
  AfterTesting = 1
}

export interface SampleTestingImageDto {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  url: string;
  imageType: SampleTestingImageType;
  creationTime: string;
}

// Sample DTOs
export interface TestRequestSampleDto {
  id: string;
  testRequestId: string;
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  totalIndicatorCost: number;
  /** Đánh dấu mẫu đã bị hủy (dùng cho quản lý mẫu lưu kho) */
  isCancelled?: boolean;
  /** Đánh dấu mẫu đã bị khách hàng hủy (sau khi đã gửi mẫu) */
  isCustomerCancelled?: boolean;
  /** Loại mẫu ID */
  specimenTypeId?: string;
  /** Tên loại mẫu */
  specimenTypeName?: string;
  indicators: TestRequestSampleIndicatorDto[];
  attachments?: SampleAttachmentDto[];
  /** Hình ảnh trước thử nghiệm */
  beforeTestingImages?: SampleTestingImageDto[];
  /** Hình ảnh sau thử nghiệm */
  afterTestingImages?: SampleTestingImageDto[];
}

export interface AttachmentInputDto {
  fileId: string;
  fileName: string;
  fileSize: number;
}

export interface CreateTestRequestSampleDto {
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  specimenTypeId?: string;
  indicators: CreateTestRequestSampleIndicatorDto[];
  attachments?: AttachmentInputDto[];
}

export interface UpdateTestRequestSampleDto {
  id?: string;
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  specimenTypeId?: string;
  indicators: UpdateTestRequestSampleIndicatorDto[];
  attachments?: AttachmentInputDto[];
}

// Main TestRequest DTOs
export interface TestRequestDto {
  id: string;

  // Contract Info
  contractNumber?: string;
  contractDate?: string;
  sentToAccounting: boolean;
  paymentReceived: boolean;
  sentToDepartment: boolean;
  resultReturned: boolean;
  customerName: string;
  provinceCode?: string;
  province?: string;
  districtCode?: string;
  district?: string;
  wardCode?: string;
  ward?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;

  // Sample count
  totalSampleCount: number;

  // Testing Method Info
  methodWestHighlandInstitute: boolean;
  methodCustomer: boolean;
  methodCustomerDetail?: string;
  resultLanguage: ResultLanguage;
  resultCopyCount?: string;
  separatePassedResults: boolean;
  conformityDeclaration?: string;
  otherRequirements?: string;
  subContract?: string;
  samplingRequirement: SamplingRequirement;
  deliveryDirectPickup: boolean;
  deliveryPostal: boolean;
  returnStoredSample: boolean;
  sampleTypeService: boolean;
  sampleTypeContract: boolean;
  sampleTypeTask: boolean;
  sampleTypeSubContract: boolean;
  resultDeliveryDate?: string;
  sampleStorage: SampleStorageOption;
  totalCost: number;
  totalCostInWords?: string;
  receiptNumber?: string;

  // User References
  supervisorId?: string;
  supervisorName?: string;
  directorId?: string;
  directorName?: string;
  changeRequest?: string;
  agreeTerms: boolean;

  // Legacy fields
  requestNumber: string;
  requestDate: string;
  notes?: string;
  status: TestRequestStatus;
  expectedCompletionDate?: string;
  subcontractor?: string;

  // Postal Delivery Images (tối đa 5 hình)
  postalDeliveryImages?: PostalDeliveryImageDto[];

  // Samples
  samples: TestRequestSampleDto[];

  // Audit fields from ABP Framework
  isDeleted?: boolean;
  deleterId?: string | null;
  deletionTime?: string | null;
  lastModificationTime?: string | null;
  lastModifierId?: string | null;
  creationTime?: string;
  creatorId?: string | null;
}

export interface CreateTestRequestDto {
  // Contract Info
  contractNumber?: string;
  contractDate?: string;
  sentToAccounting?: boolean;
  paymentReceived?: boolean;
  sentToDepartment?: boolean;
  resultReturned?: boolean;
  customerName: string;
  provinceCode?: string;
  province?: string;
  districtCode?: string;
  district?: string;
  wardCode?: string;
  ward?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;

  // Sample count
  totalSampleCount?: number;

  // Testing Method Info
  methodWestHighlandInstitute?: boolean;
  methodCustomer?: boolean;
  methodCustomerDetail?: string;
  resultLanguage?: ResultLanguage;
  resultCopyCount?: string;
  separatePassedResults?: boolean;
  conformityDeclaration?: string;
  otherRequirements?: string;
  subContract?: string;
  samplingRequirement?: SamplingRequirement;
  deliveryDirectPickup?: boolean;
  deliveryPostal?: boolean;
  returnStoredSample?: boolean;
  sampleTypeService?: boolean;
  sampleTypeContract?: boolean;
  sampleTypeTask?: boolean;
  sampleTypeSubContract?: boolean;
  resultDeliveryDate?: string;
  sampleStorage?: SampleStorageOption;
  totalCost?: number;
  totalCostInWords?: string;
  receiptNumber?: string;

  // User References
  supervisorId?: string;
  directorId?: string;
  changeRequest?: string;
  agreeTerms?: boolean;

  // Legacy fields
  requestDate: string;
  notes?: string;
  expectedCompletionDate?: string;
  subcontractor?: string;

  // Samples
  samples: CreateTestRequestSampleDto[];
}

export interface UpdateTestRequestDto {
  // Contract Info
  contractNumber?: string;
  contractDate?: string;
  sentToAccounting?: boolean;
  paymentReceived?: boolean;
  sentToDepartment?: boolean;
  resultReturned?: boolean;
  customerName: string;
  provinceCode?: string;
  province?: string;
  districtCode?: string;
  district?: string;
  wardCode?: string;
  ward?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;

  // Sample count
  totalSampleCount?: number;

  // Testing Method Info
  methodWestHighlandInstitute?: boolean;
  methodCustomer?: boolean;
  methodCustomerDetail?: string;
  resultLanguage?: ResultLanguage;
  resultCopyCount?: string;
  separatePassedResults?: boolean;
  conformityDeclaration?: string;
  otherRequirements?: string;
  subContract?: string;
  samplingRequirement?: SamplingRequirement;
  deliveryDirectPickup?: boolean;
  deliveryPostal?: boolean;
  returnStoredSample?: boolean;
  sampleTypeService?: boolean;
  sampleTypeContract?: boolean;
  sampleTypeTask?: boolean;
  sampleTypeSubContract?: boolean;
  resultDeliveryDate?: string;
  sampleStorage?: SampleStorageOption;
  totalCost?: number;
  totalCostInWords?: string;
  receiptNumber?: string;

  // User References
  supervisorId?: string;
  directorId?: string;
  changeRequest?: string;
  agreeTerms?: boolean;

  // Legacy fields
  requestDate: string;
  notes?: string;
  status: TestRequestStatus;
  expectedCompletionDate?: string;
  subcontractor?: string;

  // Samples
  samples: UpdateTestRequestSampleDto[];
}

// Paging DTOs
export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface PagedAndSortedResultRequestDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

// Change History DTOs
export interface TestRequestChangeHistoryDto {
  id: string;
  testRequestId: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  approvalStatus: ChangeApprovalStatus;
  previousStatus?: TestRequestStatus;
  approvedById?: string;
  approvedByName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  creationTime: string;
  creatorId?: string;
  creatorName?: string;
}

export interface RejectChangesDto {
  reason: string;
}

// Timeline DTOs
export interface TimelineStepDto {
  title: string;
  status: "completed" | "current" | "pending";
  date?: string;
  userId?: string;
  userName?: string;
  extraInfo?: string[];
}

export interface TestRequestTimelineDto {
  id: string;
  status: TestRequestStatus;
  steps: TimelineStepDto[];
}

// Sample Receiver Pending Task DTO (for popup reminder)
export interface SampleReceiverPendingTaskDto {
  id: string;
  contractNumber: string;
  taskName: string;
  pendingDate: string | null;
  expectedCompletionDate: string | null;
  status: TestRequestStatus;
}
