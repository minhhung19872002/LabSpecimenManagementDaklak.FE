import { IndicatorApprovalStatus } from './laboratoryTask';

// Enums
export enum TestRequestStatus {
  New = 0,                      // Mới - vừa tạo, chưa gửi kế toán
  PendingPayment = 1,           // Chờ thanh toán - đã gửi kế toán, chờ thanh toán
  Paid = 2,                     // Đã thanh toán - kế toán xác nhận đã thanh toán
  SampleSent = 3,               // Đã gửi mẫu - người dùng xác nhận đã gửi mẫu
  InProgress = 4,               // Đang thử nghiệm - QLKT đã gán PP + KTV
  PendingChangeApproval = 5,    // Chờ phê duyệt thay đổi - chỉnh sửa cần QLCL duyệt
  PendingApproval = 6,          // [DEPRECATED] Chờ phê duyệt KQ - QLKT đã gửi kết quả
  Approved = 7,                 // [DEPRECATED] Đã phê duyệt - QLCL đã duyệt KQ
  ResultSent = 8,               // [DEPRECATED] Gửi khách hàng - đã nhấn gửi KQ
  Completed = 9,                // Hoàn Thành - kết thúc quy trình
  Cancelled = 10,               // Hủy phiếu yêu cầu - BP Giao nhận hủy
  UnderReview = 11,             // Đang xem xét YC - đã gửi QLKT xem xét
  WaitingCustomerConfirm = 12,  // Chờ KH xác nhận - QLKT yêu cầu đổi PP hoặc từ chối
  RequestApproved = 13,         // Đã duyệt yêu cầu - Tất cả phòng LAB đã duyệt
  PartialResultSent = 14,       // Đã trả 1 phần KQ - đã trả một phần kết quả cho KH
  ReportPublished = 15,         // Đã phát hành BC - BC đã được phát hành
  NoPaymentRequired = 16        // Không cần thanh toán - Mẫu nhiệm vụ
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
  [TestRequestStatus.PendingPayment]: "Chờ thanh toán",
  [TestRequestStatus.Paid]: "Đã thanh toán",
  [TestRequestStatus.SampleSent]: "Đã gửi mẫu",
  [TestRequestStatus.InProgress]: "Đang thử nghiệm",
  [TestRequestStatus.PendingChangeApproval]: "Chờ phê duyệt thay đổi",
  [TestRequestStatus.PendingApproval]: "Chờ phê duyệt KQ",
  [TestRequestStatus.Approved]: "Đã phê duyệt",
  [TestRequestStatus.ResultSent]: "Gửi khách hàng",
  [TestRequestStatus.Completed]: "Hoàn Thành",
  [TestRequestStatus.Cancelled]: "Hủy phiếu yêu cầu",
  [TestRequestStatus.UnderReview]: "Đang xem xét YC",
  [TestRequestStatus.WaitingCustomerConfirm]: "Chờ KH xác nhận",
  [TestRequestStatus.RequestApproved]: "Đã duyệt yêu cầu",
  [TestRequestStatus.PartialResultSent]: "Đã trả 1 phần KQ",
  [TestRequestStatus.ReportPublished]: "Đã phát hành BC",
  [TestRequestStatus.NoPaymentRequired]: "Không cần thanh toán",
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
  [TestRequestStatus.PendingPayment]: "gold",
  [TestRequestStatus.Paid]: "cyan",
  [TestRequestStatus.SampleSent]: "geekblue",
  [TestRequestStatus.InProgress]: "blue",
  [TestRequestStatus.PendingChangeApproval]: "orange",
  [TestRequestStatus.PendingApproval]: "orange",
  [TestRequestStatus.Approved]: "green",
  [TestRequestStatus.ResultSent]: "purple",
  [TestRequestStatus.Completed]: "success",
  [TestRequestStatus.Cancelled]: "red",
  [TestRequestStatus.UnderReview]: "processing",
  [TestRequestStatus.WaitingCustomerConfirm]: "warning",
  [TestRequestStatus.RequestApproved]: "lime",
  [TestRequestStatus.PartialResultSent]: "volcano",
  [TestRequestStatus.ReportPublished]: "magenta",
  [TestRequestStatus.NoPaymentRequired]: "green",
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
 * [TEMPORARY] KH yêu cầu cho phép edit tất cả trạng thái trừ Completed & Cancelled
 */
export const canEditFullInfo = (status: TestRequestStatus): boolean => {
  // [OLD LOGIC] Full edit: New, PendingPayment, Paid
  // return status === TestRequestStatus.New ||
  //        status === TestRequestStatus.PendingPayment ||
  //        status === TestRequestStatus.Paid;

  // [TEMPORARY] Cho phép edit tất cả trạng thái trừ Completed & Cancelled
  return status !== TestRequestStatus.Completed &&
         status !== TestRequestStatus.Cancelled;
};

/**
 * Kiểm tra có thể chỉnh sửa với phê duyệt (limited edit + cần QLCL duyệt)
 * [TEMPORARY] Tạm tắt - không cần approval, edit trực tiếp
 */
export const canEditWithApproval = (_status: TestRequestStatus): boolean => {
  // [OLD LOGIC] Limited edit: SampleSent, InProgress
  // return status === TestRequestStatus.SampleSent || status === TestRequestStatus.InProgress;

  // [TEMPORARY] Không cần approval nữa
  return false;
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
  return status === TestRequestStatus.New ||
         status === TestRequestStatus.PendingPayment ||
         status === TestRequestStatus.Paid;
};

/**
 * Kiểm tra có hiển thị actions cho phiếu yêu cầu không
 */
export const showActionsForTestRequest = (status: TestRequestStatus): boolean => {
  return status !== TestRequestStatus.Completed &&
         status !== TestRequestStatus.Cancelled;
};

/**
 * Kiểm tra có thể gửi mẫu không (RequestApproved → SampleSent)
 */
export const canSendSample = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.RequestApproved;
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

// Payment Flow Helper Functions

/**
 * Kiểm tra có thể gửi kế toán không
 * Điều kiện: status = PendingPayment VÀ chưa gửi kế toán (sentToAccounting = false)
 */
export const canSendToAccounting = (status: TestRequestStatus, sentToAccounting?: boolean): boolean => {
  return status === TestRequestStatus.PendingPayment && !sentToAccounting;
};

/**
 * Kiểm tra có thể gửi QLKT không
 * Cho phép khi status = PendingPayment (đã in phiếu thu), Paid (mẫu thường) hoặc NoPaymentRequired (mẫu nhiệm vụ)
 */
export const canSendToQLKT = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.PendingPayment ||
         status === TestRequestStatus.Paid ||
         status === TestRequestStatus.NoPaymentRequired;
};

/**
 * Kiểm tra có thể hủy yêu cầu không (logic cũ - chỉ New và PendingPayment)
 * Điều kiện: status = New hoặc PendingPayment
 * @deprecated Sử dụng canCancelRequest thay thế
 */
export const canCancelPaymentRequest = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.New || status === TestRequestStatus.PendingPayment;
};

/**
 * Kiểm tra có thể hủy yêu cầu không (logic mới)
 * Điều kiện: tất cả status NGOẠI TRỪ Completed, ResultSent và Cancelled
 * Cho phép hủy khi KH đổi ý không muốn làm nữa
 */
export const canCancelRequest = (status: TestRequestStatus): boolean => {
  return status !== TestRequestStatus.Completed &&
         status !== TestRequestStatus.ResultSent &&
         status !== TestRequestStatus.Cancelled;
};

/**
 * Kiểm tra phiếu đã bị hủy chưa
 */
export const isCancelledRequest = (status: TestRequestStatus): boolean => {
  return status === TestRequestStatus.Cancelled;
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

export const SampleStatusLabels: Record<SampleStatus, string> = {
  [SampleStatus.Normal]: 'Bình thường',
  [SampleStatus.Damaged]: 'Hư hỏng',
  [SampleStatus.NotMeetRequirements]: 'Không đạt yêu cầu',
  [SampleStatus.Testing]: 'Đang thử nghiệm',
  [SampleStatus.Completed]: 'Hoàn thành'
};

// Sample Indicator DTOs
/** Hình ảnh của chỉ tiêu (từ IndicatorImage) */
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

export interface TestRequestSampleIndicatorDto {
  id: string;
  testRequestSampleId: string;
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorFormattedName?: string;  // Tên chỉ tiêu có định dạng HTML
  indicatorGroupName?: string;
  /** Khoa phòng mặc định của chỉ tiêu (để auto-fill khi gửi QLKT) */
  indicatorDefaultLaboratoryId?: string;
  unitPrice: number;
  /** Giá gốc trước khi áp dụng combo giảm giá (chỉ có khi được miễn phí do combo kim loại nặng) */
  originalUnitPrice?: number;
  notes?: string;
  laboratoryId?: string;
  laboratoryName?: string;
  testMethodId?: string;
  testMethodCode?: string;
  testMethodName?: string;
  testMethodFormattedName?: string | null;
  /** Nền mẫu ID - để phân biệt giá của cùng indicator+method ở các nền mẫu khác nhau */
  specimenTypeId?: string;
  /** Tên nền mẫu (để hiển thị) */
  specimenTypeName?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment: boolean;
  /** Trạng thái duyệt từ LaboratoryTaskIndicator (null nếu chưa gửi mẫu) */
  approvalStatus?: IndicatorApprovalStatus;
  /** Ngày thử nghiệm (ngày KTV bắt đầu thử nghiệm/check-in) */
  testDate?: string;
  /** Hình ảnh của chỉ tiêu */
  images?: IndicatorImageDto[];
  /** ID chỉ tiêu cha (null nếu là chỉ tiêu gốc) - dùng để nhóm sub-indicators */
  parentIndicatorId?: string;
  /** Đã gửi đến QLKT (true = đã gửi, không thể gửi lại) */
  isSentToQLKT?: boolean;
  /** Hợp đồng phụ (từ TestMethodIndicator.IsSubcontract) */
  isSubcontract?: boolean;
}

export interface CreateTestRequestSampleIndicatorDto {
  indicatorId: string;
  testMethodId?: string;
  /** Nền mẫu ID - để phân biệt giá của cùng indicator+method ở các nền mẫu khác nhau */
  specimenTypeId?: string;
  laboratoryId?: string;
  unitPrice?: number;
  originalUnitPrice?: number;
  notes?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment?: boolean;
  isSubcontract?: boolean;
}

export interface UpdateTestRequestSampleIndicatorDto {
  id?: string;
  indicatorId: string;
  testMethodId?: string;
  /** Nền mẫu ID - để phân biệt giá của cùng indicator+method ở các nền mẫu khác nhau */
  specimenTypeId?: string;
  laboratoryId?: string;
  unitPrice?: number;
  originalUnitPrice?: number;
  notes?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment?: boolean;
  isSubcontract?: boolean;
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
  /** Mẫu chung - Mẫu có chỉ tiêu ở cả Lab Vi Sinh và Lab Hóa */
  isSharedSample?: boolean;
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
  email?: string;

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
  sampleTypeSurveillance: boolean;
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

  // Quotation reference
  quotationId?: string;

  // Audit fields from ABP Framework
  isDeleted?: boolean;
  deleterId?: string | null;
  deletionTime?: string | null;
  lastModificationTime?: string | null;
  lastModifierId?: string | null;
  creationTime?: string;
  creatorId?: string | null;

  // Client-only: phiếu tạo/sửa offline chưa đồng bộ lên server
  isOffline?: boolean;
  syncStatus?: TestRequestSyncStatus;
  syncError?: string;
}

export type TestRequestSyncStatus = 'pending' | 'syncing' | 'failed';

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
  email?: string;

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
  sampleTypeSurveillance?: boolean;
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

  // Quotation reference
  quotationId?: string;
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
  email?: string;

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
  sampleTypeSurveillance?: boolean;
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
  status: "completed" | "current" | "pending" | "cancelled";
  date?: string;
  userId?: string;
  userName?: string;
  extraInfo?: string[];
  note?: string;
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

// ============= Workflow Redesign - BPGN Confirmation DTOs =============

// DTO for pending indicator confirmation (for BPGN to confirm)
export interface IndicatorPendingConfirmationDto {
  id: string;                           // LaboratoryTaskIndicator ID
  sampleCode?: string;
  sampleName?: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorFormattedName?: string;      // Tên chỉ tiêu có định dạng HTML
  laboratoryName?: string;
  approvalStatus: IndicatorApprovalStatus;
  testingRejectionReason?: string;      // Lý do từ chối TN (nếu có)
  oldMethodName?: string;               // PP cũ (nếu yêu cầu đổi PP)
  newMethodName?: string;               // PP mới đề xuất (nếu yêu cầu đổi PP)
  methodChangeReason?: string;          // Lý do yêu cầu đổi PP (nếu có)
  requestedByName?: string;             // Người yêu cầu đổi PP / từ chối TN
  requestedDate?: string;               // Ngày yêu cầu
  // Supplementary Request fields
  supplementaryRequestReason?: string;  // Lý do yêu cầu bổ sung
  supplementaryRequestDate?: string;    // Ngày yêu cầu bổ sung
  supplementaryRequestedByName?: string; // Tên người yêu cầu bổ sung
}

// DTO for BPGN to confirm a single indicator
export interface ConfirmIndicatorInput {
  confirmed: boolean;                   // true = KH đồng ý, false = KH không đồng ý
}

// DTO for BPGN to bulk confirm indicators
export interface BulkConfirmIndicatorsInput {
  indicatorIds: string[];               // Danh sách LaboratoryTaskIndicator IDs
  confirmed: boolean;                   // true = KH đồng ý, false = KH không đồng ý
}

// ============= BPGN - Confirm Delivery to Customer =============

// Input for BPGN confirming delivery to customer
export interface ConfirmDeliveryInput {
  note?: string;
}

// Kết quả "In phiếu bàn giao" (BM03 - Sổ quản lý mẫu)
export interface PrintHandoverOutput {
  fileName: string;                     // File .docx trong wwwroot/temp, mở bằng Document Editor
  status: TestRequestStatus;            // Trạng thái sau khi in
}

// Lịch sử in phiếu bàn giao
export interface TestRequestDeliveryHistoryDto {
  id: string;
  testRequestId: string;
  printedDate: string;
  printedByUserName?: string;
  statusAfter: TestRequestStatus;
}

// DTO for published report (log history)
export interface PublishedReportDto {
  id: string;
  testRequestId: string;
  qualityManagementTaskId: string;
  fileName: string;
  reportType: 'Single' | 'Mixed';
  printNote?: string;
  indicatorIds: string[];
  indicatorNames: string[];
  creationTime: string;
  creatorName?: string;
}

// ============= Cost Change History =============

// Loại thay đổi tiền
export enum CostChangeType {
  IndicatorCancelled = 1,   // KH hủy chỉ tiêu (không đồng ý đổi PP)
  MethodChanged = 2,        // KH đồng ý đổi PP (giá có thể thay đổi)
  SampleCancelled = 3,      // KH hủy cả mẫu
  ManualAdjustment = 4      // Điều chỉnh thủ công
}

export const CostChangeTypeLabels: Record<CostChangeType, string> = {
  [CostChangeType.IndicatorCancelled]: 'KH hủy chỉ tiêu',
  [CostChangeType.MethodChanged]: 'Thay đổi phương pháp',
  [CostChangeType.SampleCancelled]: 'KH hủy mẫu',
  [CostChangeType.ManualAdjustment]: 'Điều chỉnh thủ công'
};

// DTO for cost change history
export interface CostChangeHistoryDto {
  id: string;
  testRequestId: string;
  changeType: CostChangeType;
  changeTypeLabel: string;
  oldTotalCost: number;
  newTotalCost: number;
  differenceAmount: number;
  affectedIndicatorId?: string;
  affectedIndicatorName?: string;
  indicatorUnitPrice?: number;
  reason?: string;
  creationTime: string;
  creatorName?: string;
}

// ============= Update Indicators Laboratory (Send to QLKT) =============

// Input để cập nhật LaboratoryId cho từng chỉ tiêu
export interface UpdateIndicatorLaboratoryInput {
  sampleIndicatorId: string;
  laboratoryId: string;
  requestDate?: string; // ISO date string
}
