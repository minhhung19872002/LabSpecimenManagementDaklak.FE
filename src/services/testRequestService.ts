import api from './api';
import {
  TestRequestDto,
  CreateTestRequestDto,
  UpdateTestRequestDto,
  PagedResultDto,
  PagedAndSortedResultRequestDto,
  TestRequestStatus,
  TestRequestChangeHistoryDto,
  RejectChangesDto,
  TestRequestTimelineDto,
  SampleReceiverPendingTaskDto,
  IndicatorPendingConfirmationDto,
  ConfirmIndicatorInput,
  BulkConfirmIndicatorsInput,
  ConfirmDeliveryInput,
  PublishedReportDto,
  CostChangeHistoryDto,
  UpdateIndicatorLaboratoryInput
} from '../types/testRequest';
import { QualityManagementIndicatorDto } from '../types/qualityManagement';
import { syncManager } from './offline/syncManager';
import { isNetworkError } from './offline/createOfflineService';
import { cacheTestRequest, getCachedTestRequest, getOfflineTestRequests, getCachedEntitiesByType, getCachedEntity } from './offline/db';
import { IndicatorDto } from './masterDataService';

const BASE_URL = '/api/v1/test-requests';

/**
 * Response type for offline-aware operations
 */
export interface OfflineAwareResponse<T> {
  data: T;
  isOffline: boolean;
  clientId?: string;
}

/**
 * Extended response type for list operations with offline support
 */
export interface OfflineAwareListResponse<T> {
  data: PagedResultDto<T>;
  isOfflineData: boolean;
}

// Template DTO for result form templates
export interface TemplateDto {
  name: string;
  displayName: string;
  fileName: string;
}

// Print result item for batch print
export interface PrintResultItem {
  fileName: string;
  laboratoryId: string;
  laboratoryName: string;
  templateName: string;
  sampleCode?: string;
  sampleName?: string;
}

// Print multi result output for batch print
export interface PrintMultiResultOutput {
  results: PrintResultItem[];
}

// Preview test request form input - matches BE PreviewTestRequestFormInput
export interface PreviewSampleIndicatorDto {
  indicatorId: string;
  testMethodId?: string;
  specimenTypeId?: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  unitPrice: number;
}

export interface PreviewTestRequestSampleDto {
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  statusText?: string;
  notes?: string;
  indicators: PreviewSampleIndicatorDto[];
}

export interface PreviewTestRequestFormInput {
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
  totalSampleCount: number;
  methodWestHighlandInstitute: boolean;
  methodCustomer: boolean;
  methodCustomerDetail?: string;
  resultLanguage: number; // 0=Vietnamese, 1=English, 2=Both
  resultCopyCount?: string;
  separatePassedResults: boolean;
  conformityDeclaration?: string;
  otherRequirements?: string;
  subContract?: string;
  samplingRequirement: number; // 0=CustomerSampling, 1=LabSampling
  deliveryDirectPickup: boolean;
  deliveryPostal: boolean;
  returnStoredSample: boolean;
  sampleTypeService: boolean;
  sampleTypeContract: boolean;
  sampleTypeTask: boolean;
  sampleTypeSubContract: boolean;
  resultDeliveryDate?: string;
  sampleStorage: number; // 0=No, 1=Yes
  totalCost: number;
  totalCostInWords?: string;
  receiptNumber?: string;
  agreeTerms: boolean;
  requestDate: string;
  notes?: string;
  samples: PreviewTestRequestSampleDto[];
}

export interface QuickCreateIndicatorItemInput {
  specimenTypeId: string;
  name: string;
  formattedName?: string;
  unitPrice: number;
  subIndicators: { name: string; formattedName?: string }[];
}

export interface QuickCreateIndicatorsFromTestRequestInput {
  indicatorGroupId: string;
  laboratoryId: string;
  testRequestId?: string;
  contractNumber?: string;
  indicators: QuickCreateIndicatorItemInput[];
}

export interface QuickCreateIndicatorResultItem {
  indicator: IndicatorDto;
  specimenTypeId: string;
  specimenTypeName: string;
  testMethodId?: string;
  testMethodName?: string;
  unitPrice: number;
  subIndicatorResults: QuickCreateIndicatorResultItem[];
}

export interface QuickCreateIndicatorsFromTestRequestResult {
  results: QuickCreateIndicatorResultItem[];
}

// Extended params interface for search and filter
export interface TestRequestListParams extends PagedAndSortedResultRequestDto {
  search?: string;
  status?: TestRequestStatus;
  expectedCompletionDateFrom?: string;
  expectedCompletionDateTo?: string;
  customerName?: string;
  fromDate?: string;
  toDate?: string;
}

// Helper to convert params for API (ABP Framework uses SkipCount, MaxResultCount, Sorting)
const toApiParams = (params: TestRequestListParams) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.search) apiParams.Search = params.search;
  if (params.status !== undefined) apiParams.Status = params.status;
  if (params.expectedCompletionDateFrom) apiParams.ExpectedCompletionDateFrom = params.expectedCompletionDateFrom;
  if (params.expectedCompletionDateTo) apiParams.ExpectedCompletionDateTo = params.expectedCompletionDateTo;
  if (params.customerName) apiParams.CustomerName = params.customerName;
  if (params.fromDate) apiParams.FromDate = params.fromDate;
  if (params.toDate) apiParams.ToDate = params.toDate;
  return apiParams;
};

export const testRequestService = {
  getList: async (params: TestRequestListParams): Promise<PagedResultDto<TestRequestDto>> => {
    const response = await api.get<PagedResultDto<TestRequestDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  get: async (id: string): Promise<TestRequestDto> => {
    const response = await api.get<TestRequestDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateTestRequestDto): Promise<TestRequestDto> => {
    const response = await api.post<TestRequestDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateTestRequestDto): Promise<TestRequestDto> => {
    const response = await api.put<TestRequestDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Result Form APIs
  generateResultForm: async (testRequestId: string, sampleId: string): Promise<{ fileName: string; sampleCode: string }> => {
    const response = await api.post<{ fileName: string; sampleCode: string }>('/api/v1/result-forms/generate', {
      testRequestId,
      sampleId
    });
    return response.data;
  },

  getResultFormEditorConfig: async (fileName: string): Promise<any> => {
    const response = await api.get(`/api/v1/result-forms/editor-config/${encodeURIComponent(fileName)}`);
    return response.data;
  },

  // BM01 Result Form APIs
  getSamplesForResultForm: async (testRequestId: string): Promise<SampleForSelectionDto[]> => {
    const response = await api.get<SampleForSelectionDto[]>(`/api/v1/result-forms/samples-for-selection/${testRequestId}`);
    return response.data;
  },

  generateBM01ResultForm: async (testRequestId: string, sampleId: string, note?: string, templateName?: string): Promise<{ fileName: string; sampleCode: string }> => {
    const response = await api.post<{ fileName: string; sampleCode: string }>('/api/v1/result-forms/generate-bm01', {
      testRequestId,
      sampleId,
      note,
      templateName
    });
    return response.data;
  },

  // Generate mixed samples result form (In KQ Hỗn hợp cho nhiều mẫu)
  generateMixedSamplesResultForm: async (testRequestId: string, sampleIds: string[], note?: string): Promise<{ fileName: string; sampleCode: string }> => {
    const response = await api.post<{ fileName: string; sampleCode: string }>('/api/v1/result-forms/generate-mixed-samples', {
      testRequestId,
      sampleIds,
      note
    });
    return response.data;
  },

  // Generate test request form (BM05 - phiếu yêu cầu XN)
  generateTestRequestForm: async (testRequestId: string): Promise<{ fileName: string; requestNumber: string; contractNumber: string }> => {
    const response = await api.post<{ fileName: string; requestNumber: string; contractNumber: string }>('/api/v1/result-forms/generate-test-request', {
      testRequestId
    });
    return response.data;
  },

  // Preview test request form (BM05) with form data - no DB save required
  previewTestRequestForm: async (formData: PreviewTestRequestFormInput): Promise<{ fileName: string; requestNumber: string; contractNumber: string }> => {
    const response = await api.post<{ fileName: string; requestNumber: string; contractNumber: string }>('/api/v1/result-forms/preview-test-request', formData);
    return response.data;
  },

  // Get available templates for result forms
  getTemplates: async (): Promise<TemplateDto[]> => {
    const response = await api.get<TemplateDto[]>('/api/v1/result-forms/templates');
    return response.data;
  },

  // Status transition APIs
  printTestRequest: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/print`);
  },

  updateToPendingApproval: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/pending-approval`);
  },

  approve: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/approve`);
  },

  sendResult: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/send-result`);
  },

  complete: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/complete`);
  },

  /**
   * Hoàn thành với hình ảnh gửi bưu điện (tối đa 5 hình)
   * Dùng khi DeliveryPostal = true
   */
  completeWithImage: async (id: string, imageFileIds: string[]): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/complete-with-image`, { imageFileIds });
  },

  // New status transition APIs for sample sent and change approval flow

  /**
   * Gửi mẫu: Pending → SampleSent
   */
  sendSample: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/send-sample`);
  },

  /**
   * Phê duyệt thay đổi: PendingChangeApproval → previous status (SampleSent/InProgress)
   */
  approveChanges: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/approve-changes`);
  },

  /**
   * Từ chối thay đổi: Rollback data + PendingChangeApproval → previous status
   */
  rejectChanges: async (id: string, reason: string): Promise<void> => {
    const data: RejectChangesDto = { reason };
    await api.post(`${BASE_URL}/${id}/reject-changes`, data);
  },

  /**
   * Lấy lịch sử thay đổi của phiếu yêu cầu
   */
  getChangeHistory: async (id: string): Promise<TestRequestChangeHistoryDto[]> => {
    const response = await api.get<TestRequestChangeHistoryDto[]>(`${BASE_URL}/${id}/change-history`);
    return response.data;
  },

  /**
   * QLCL từ chối kết quả: PendingApproval → InProgress
   * Trả lại cho QLKT xem xét
   */
  rejectResult: async (id: string, reason: string): Promise<void> => {
    const data: RejectChangesDto = { reason };
    await api.post(`${BASE_URL}/${id}/reject-result`, data);
  },

  /**
   * Lấy tiến trình/timeline của phiếu yêu cầu
   */
  getTimeline: async (id: string): Promise<TestRequestTimelineDto> => {
    const response = await api.get<TestRequestTimelineDto>(`${BASE_URL}/${id}/timeline`);
    return response.data;
  },

  /**
   * Lấy danh sách công việc cần làm cho SampleReceiver (dùng cho popup reminder)
   */
  getSampleReceiverPendingTasks: async (): Promise<SampleReceiverPendingTaskDto[]> => {
    const response = await api.get<SampleReceiverPendingTaskDto[]>(`${BASE_URL}/sample-receiver-pending-tasks`);
    return response.data;
  },

  /**
   * Lấy danh sách chỉ tiêu đã duyệt cho In KQ
   */
  getApprovedIndicators: async (testRequestId: string): Promise<QualityManagementIndicatorDto[]> => {
    const response = await api.get<QualityManagementIndicatorDto[]>(`${BASE_URL}/${testRequestId}/approved-indicators`);
    return response.data;
  },

  /**
   * In kết quả đơn (1 chỉ tiêu)
   */
  printSingleResult: async (
    testRequestId: string,
    indicatorId: string,
    note?: string,
    templateName?: string
  ): Promise<{ fileName: string }> => {
    const response = await api.post<{ fileName: string }>(`${BASE_URL}/${testRequestId}/print-single`, {
      indicatorId,
      note,
      templateName
    });
    return response.data;
  },

  /**
   * In kết quả hỗn hợp (nhiều chỉ tiêu)
   */
  printMixedResult: async (
    testRequestId: string,
    indicatorIds: string[],
    note?: string,
    templateName?: string,
    vicePresidentId?: string
  ): Promise<{ fileName: string }> => {
    const response = await api.post<{ fileName: string }>(`${BASE_URL}/${testRequestId}/print-mixed`, {
      indicatorIds,
      note,
      templateName,
      vicePresidentId
    });
    return response.data;
  },

  /**
   * In kết quả hỗn hợp theo từng mẫu (mỗi mẫu = 1 file riêng)
   */
  printMixedPerSampleResult: async (
    testRequestId: string,
    indicatorIds: string[],
    templateName?: string,
    note?: string,
    vicePresidentId?: string
  ): Promise<PrintMultiResultOutput> => {
    const response = await api.post<PrintMultiResultOutput>(`${BASE_URL}/${testRequestId}/print-mixed-per-sample`, {
      indicatorIds,
      note,
      templateName,
      vicePresidentId
    });
    return response.data;
  },

  /**
   * Get list of templates for mixed result printing (In KQ Hỗn hợp)
   */
  getMixedTemplates: async (): Promise<TemplateDto[]> => {
    const response = await api.get<TemplateDto[]>('/api/v1/result-forms/mixed-templates');
    return response.data;
  },

  /**
   * In kết quả đơn với nhiều chỉ tiêu và nhiều templates (batch processing)
   * Generates (labs × templates) PDFs
   */
  printMultiSingleResult: async (
    testRequestId: string,
    indicatorIds: string[],
    templateNames: string[],
    note?: string,
    vicePresidentId?: string
  ): Promise<PrintMultiResultOutput> => {
    const response = await api.post<PrintMultiResultOutput>(`${BASE_URL}/${testRequestId}/print-multi-single`, {
      indicatorIds,
      templateNames,
      note,
      vicePresidentId
    });
    return response.data;
  },

  // Payment Flow APIs

  /**
   * Gửi kế toán - Tạo Receipt tự động
   * @returns ID của Receipt được tạo
   */
  sendToAccounting: async (id: string): Promise<string> => {
    const response = await api.post<string>(`${BASE_URL}/${id}/send-to-accounting`);
    return response.data;
  },

  /**
   * Gửi QLKT - Chuyển từ Paid sang UnderReview (Đang xem xét YC)
   */
  sendToQLKT: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/send-to-qlkt`);
  },

  /**
   * Cập nhật LaboratoryId và RequestDate cho các chỉ tiêu trước khi gửi QLKT
   */
  updateIndicatorsLaboratory: async (
    id: string,
    indicators: UpdateIndicatorLaboratoryInput[]
  ): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/update-indicators-laboratory`, { indicators });
  },

  /**
   * Hủy yêu cầu
   * Hủy Receipt (nếu có) + chuyển TestRequest thành Cancelled
   * @param id - ID của yêu cầu
   * @param reason - Lý do hủy (bắt buộc)
   */
  cancelRequest: async (id: string, reason: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/cancel-request`, { reason });
  },

  /**
   * Sinh số hợp đồng tự động theo dãy tuần tự (bắt đầu từ 26170, tăng 1)
   */
  generateContractNumber: async (): Promise<string> => {
    const response = await api.get<string>(`${BASE_URL}/generate-contract-number`);
    return response.data;
  },

  /**
   * Kiểm tra số hợp đồng đã tồn tại hay chưa
   */
  checkContractNumberExists: async (contractNumber: string, excludeId?: string): Promise<boolean> => {
    const response = await api.get<boolean>(`${BASE_URL}/check-contract-number-exists`, {
      params: {
        contractNumber,
        excludeId,
      },
    });
    return response.data;
  },

  quickCreateIndicators: async (
    data: QuickCreateIndicatorsFromTestRequestInput
  ): Promise<QuickCreateIndicatorsFromTestRequestResult> => {
    const response = await api.post<QuickCreateIndicatorsFromTestRequestResult>(
      `${BASE_URL}/quick-create-indicators`,
      data
    );
    return response.data;
  },

  // ============= Workflow Redesign - BPGN Confirmation (Per-Indicator) =============

  /**
   * Lấy danh sách chỉ tiêu chờ KH xác nhận
   */
  getIndicatorsPendingConfirmation: async (id: string): Promise<IndicatorPendingConfirmationDto[]> => {
    const response = await api.get<IndicatorPendingConfirmationDto[]>(
      `${BASE_URL}/${id}/indicators-pending-confirmation`
    );
    return response.data;
  },

  /**
   * BPGN xác nhận từng chỉ tiêu (KH xác nhận đồng ý/không đồng ý)
   */
  confirmIndicator: async (
    testRequestId: string,
    indicatorId: string,
    input: ConfirmIndicatorInput
  ): Promise<IndicatorPendingConfirmationDto> => {
    const response = await api.post<IndicatorPendingConfirmationDto>(
      `${BASE_URL}/${testRequestId}/indicators/${indicatorId}/confirm`,
      input
    );
    return response.data;
  },

  /**
   * BPGN xác nhận nhiều chỉ tiêu cùng lúc (KH xác nhận đồng ý/không đồng ý)
   */
  bulkConfirmIndicators: async (
    testRequestId: string,
    input: BulkConfirmIndicatorsInput
  ): Promise<IndicatorPendingConfirmationDto[]> => {
    const response = await api.post<IndicatorPendingConfirmationDto[]>(
      `${BASE_URL}/${testRequestId}/bulk-confirm-indicators`,
      input
    );
    return response.data;
  },

  // ============= BPGN - Confirm Delivery to Customer =============

  /**
   * BPGN xác nhận đã bàn giao kết quả cho khách hàng
   * Status tự động tính dựa trên chỉ tiêu đã xuất bên QLCL
   */
  confirmDeliveryToCustomer: async (
    testRequestId: string,
    input?: ConfirmDeliveryInput
  ): Promise<void> => {
    await api.post(`${BASE_URL}/${testRequestId}/confirm-delivery`, input || {});
  },

  /**
   * Lấy danh sách báo cáo đã xuất của TestRequest (để xem lịch sử)
   */
  getPublishedReports: async (testRequestId: string): Promise<PublishedReportDto[]> => {
    const response = await api.get<PublishedReportDto[]>(
      `${BASE_URL}/${testRequestId}/published-reports`
    );
    return response.data;
  },

  // ============= Cost Change History =============

  /**
   * Lấy lịch sử thay đổi tiền của phiếu yêu cầu
   */
  getCostChangeHistory: async (testRequestId: string): Promise<CostChangeHistoryDto[]> => {
    const response = await api.get<CostChangeHistoryDto[]>(
      `${BASE_URL}/${testRequestId}/cost-history`
    );
    return response.data;
  },

  /**
   * Lấy danh sách tất cả mẫu từ tất cả phiếu yêu cầu (dùng cho "Thêm mẫu có sẵn")
   * Sắp xếp giảm dần theo số hợp đồng
   */
  getAllSamples: async (params: { search?: string; skipCount?: number; maxResultCount?: number }): Promise<PagedResultDto<ExistingSampleDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.search) apiParams.Search = params.search;
    if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
    if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
    const response = await api.get<PagedResultDto<ExistingSampleDto>>(`${BASE_URL}/all-samples`, { params: apiParams });
    return response.data;
  },

};

// Existing sample DTOs (for "Thêm mẫu có sẵn" feature)
export interface ExistingSampleIndicatorDto {
  indicatorId: string;
  indicatorName?: string;
  indicatorFormattedName?: string;
  testMethodId?: string;
  testMethodName?: string;
  testMethodFormattedName?: string;
  specimenTypeId?: string;
  specimenTypeName?: string;
  unitPrice: number;
}

export interface ExistingSampleDto {
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  sampleQuantity?: string;
  specimenTypeId?: string;
  specimenTypeName?: string;
  status: number;
  statusText?: string;
  contractNumber?: string;
  indicators: ExistingSampleIndicatorDto[];
}

// Sample selection DTO for BM01 result form
export interface SampleForSelectionDto {
  id: string;
  sampleCode: string;
  sampleName: string;
  testingStatus: string;
  canGenerateResult: boolean;
  requestedCompletionDate?: string;
}

/**
 * Offline-aware test request service
 * Automatically queues operations when offline and syncs when back online
 */
export const offlineTestRequestService = {
  /**
   * Create a test request with offline support
   * If offline, queues the operation and returns a temporary ID
   */
  create: async (data: CreateTestRequestDto): Promise<OfflineAwareResponse<TestRequestDto>> => {
    if (navigator.onLine) {
      try {
        const result = await testRequestService.create(data);
        // Cache the result for offline access
        await cacheTestRequest(result.id, result, false);
        return { data: result, isOffline: false };
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        console.warn('Network error in create, queueing for sync:', error);
      }
    }

    // Offline: queue the operation
    const clientId = await syncManager.queueTestRequest(data, 'create');

    // Create a temporary DTO for UI display
    // Convert CreateTestRequestSampleDto[] to TestRequestSampleDto[] with temporary IDs
    const tempSamples = (data.samples || []).map((sample, index) => ({
      id: `${clientId}-sample-${index}`,
      testRequestId: clientId,
      sortOrder: sample.sortOrder,
      sampleCode: sample.sampleCode,
      sampleName: sample.sampleName,
      samplingAddress: sample.samplingAddress,
      sampleQuantity: sample.sampleQuantity,
      status: sample.status,
      statusText: sample.statusText,
      processingStatus: sample.processingStatus,
      notes: sample.notes,
      storageLocation: sample.storageLocation,
      specimenTypeId: sample.specimenTypeId,
      totalIndicatorCost: 0,
      indicators: (sample.indicators || []).map((ind, indIndex) => ({
        id: `${clientId}-sample-${index}-ind-${indIndex}`,
        testRequestSampleId: `${clientId}-sample-${index}`,
        indicatorId: ind.indicatorId,
        unitPrice: ind.unitPrice || 0,
        notes: ind.notes,
        laboratoryId: ind.laboratoryId,
        sentToDepartment: ind.sentToDepartment || false,
      })),
      attachments: sample.attachments || [],
    }));

    const tempDto = {
      id: clientId,
      requestNumber: `OFFLINE-${clientId.substring(0, 8)}`,
      requestDate: data.requestDate || new Date().toISOString(),
      status: TestRequestStatus.New,
      customerName: data.customerName,
      contractNumber: data.contractNumber,
      contractDate: data.contractDate,
      totalSampleCount: data.totalSampleCount || tempSamples.length,
      totalCost: data.totalCost || 0,
      samples: tempSamples,
      // Copy additional fields from input data
      province: data.province,
      ward: data.ward,
      address: data.address,
      taxCode: data.taxCode,
      contactPerson: data.contactPerson,
      phone: data.phone,
      notes: data.notes,
      expectedCompletionDate: data.expectedCompletionDate,
      resultLanguage: data.resultLanguage,
      resultCopyCount: data.resultCopyCount,
      conformityDeclaration: data.conformityDeclaration,
      otherRequirements: data.otherRequirements,
      samplingRequirement: data.samplingRequirement,
      sampleStorage: data.sampleStorage,
      // Mark as offline for UI indication
      isOffline: true,
      // Required fields with defaults for offline mode
      sentToAccounting: false,
      paymentReceived: false,
      sentToDepartment: false,
      resultReturned: false,
      methodWestHighlandInstitute: data.methodWestHighlandInstitute || false,
      methodCustomer: data.methodCustomer || false,
      separatePassedResults: data.separatePassedResults || false,
      deliveryDirectPickup: data.deliveryDirectPickup || false,
      deliveryPostal: data.deliveryPostal || false,
      returnStoredSample: data.returnStoredSample || false,
      sampleTypeService: data.sampleTypeService || false,
      sampleTypeContract: data.sampleTypeContract || false,
      sampleTypeTask: data.sampleTypeTask || false,
      sampleTypeSubContract: data.sampleTypeSubContract || false,
      agreeTerms: data.agreeTerms || false,
    } as unknown as TestRequestDto;

    // Cache the temporary data
    await cacheTestRequest(clientId, tempDto, true);

    return { data: tempDto, isOffline: true, clientId };
  },

  /**
   * Update a test request with offline support
   * If offline, queues the operation
   */
  update: async (id: string, data: UpdateTestRequestDto): Promise<OfflineAwareResponse<TestRequestDto>> => {
    if (navigator.onLine) {
      try {
        const result = await testRequestService.update(id, data);
        // Update cache
        await cacheTestRequest(result.id, result, false);
        return { data: result, isOffline: false };
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        console.warn('Network error in update, queueing for sync:', error);
      }
    }

    // Offline: queue the operation
    const clientId = await syncManager.queueTestRequest(data, 'update', id);

    // Get existing cached data and merge with updates
    const cached = await getCachedTestRequest(id);
    const mergedDto: TestRequestDto = {
      ...(cached?.data as TestRequestDto || {}),
      ...data,
      id,
      isOffline: true,
    } as TestRequestDto & { isOffline: boolean };

    // Update cache with merged data
    await cacheTestRequest(id, mergedDto, true);

    return { data: mergedDto, isOffline: true, clientId };
  },

  /**
   * Get a test request with offline fallback
   * Returns cached data if offline
   */
  get: async (id: string): Promise<TestRequestDto | null> => {
    if (navigator.onLine) {
      try {
        const result = await testRequestService.get(id);
        // Update cache
        await cacheTestRequest(result.id, result, false);
        return result;
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        // Network error - fall through to cache
      }
    }

    // Try to get from cache
    const cached = await getCachedTestRequest(id);
    if (cached) {
      return cached.data as TestRequestDto;
    }

    return null;
  },

  /**
   * Get all offline test requests (pending sync)
   */
  getOfflineItems: async (): Promise<TestRequestDto[]> => {
    const offlineItems = await getOfflineTestRequests();
    return offlineItems.map(item => item.data as TestRequestDto);
  },

  /**
   * Force sync all pending items
   */
  syncNow: async () => {
    return syncManager.sync();
  },

  /**
   * Get pending sync count
   */
  getPendingSyncCount: async (): Promise<number> => {
    return syncManager.getPendingCount();
  },

  /**
   * Get list of test requests with offline support
   * - Online: Calls API, caches each item, returns with isOfflineData: false
   * - Offline: Returns cached items with client-side filtering/pagination
   */
  getList: async (params: TestRequestListParams): Promise<OfflineAwareListResponse<TestRequestDto>> => {
    if (navigator.onLine) {
      try {
        const result = await testRequestService.getList(params);
        // Cache each item for offline access
        for (const item of result.items || []) {
          await cacheTestRequest(item.id, item, false);
        }
        return { data: result, isOfflineData: false };
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        console.warn('Network error in getList, returning cached data:', error);
      }
    }

    // Offline: Return cached items with client-side filtering/pagination
    const cachedEntities = await getCachedEntitiesByType('TestRequest');
    let items = cachedEntities.map(entity => entity.data as TestRequestDto);

    // Apply search filter (customerName, contractNumber, requestNumber)
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      items = items.filter(item =>
        (item.customerName?.toLowerCase().includes(searchLower)) ||
        (item.contractNumber?.toLowerCase().includes(searchLower)) ||
        (item.requestNumber?.toLowerCase().includes(searchLower)) ||
        (item.contactPerson?.toLowerCase().includes(searchLower)) ||
        (item.phone?.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (params.status !== undefined) {
      items = items.filter(item => item.status === params.status);
    }

    // Apply date range filter for expectedCompletionDate
    if (params.expectedCompletionDateFrom) {
      const fromDate = new Date(params.expectedCompletionDateFrom);
      items = items.filter(item =>
        item.expectedCompletionDate && new Date(item.expectedCompletionDate) >= fromDate
      );
    }
    if (params.expectedCompletionDateTo) {
      const toDate = new Date(params.expectedCompletionDateTo);
      items = items.filter(item =>
        item.expectedCompletionDate && new Date(item.expectedCompletionDate) <= toDate
      );
    }

    // Sort by creationTime desc (default)
    items.sort((a, b) => {
      const dateA = a.creationTime ? new Date(a.creationTime).getTime() : 0;
      const dateB = b.creationTime ? new Date(b.creationTime).getTime() : 0;
      return dateB - dateA;
    });

    const totalCount = items.length;

    // Apply pagination
    const skipCount = params.skipCount || 0;
    const maxResultCount = params.maxResultCount || 50;
    items = items.slice(skipCount, skipCount + maxResultCount);

    return {
      data: { items, totalCount },
      isOfflineData: true,
    };
  },

  /**
   * Get a test request with offline fallback - returns response with offline status
   */
  getWithStatus: async (id: string): Promise<{ data: TestRequestDto | null; isOfflineData: boolean }> => {
    // Always check cache first to handle offline-created items
    const cached = await getCachedTestRequest(id);

    // If we're online, try to get fresh data from API
    if (navigator.onLine) {
      try {
        const result = await testRequestService.get(id);
        // Update cache with fresh data
        await cacheTestRequest(result.id, result, false);
        return { data: result, isOfflineData: false };
      } catch (error: any) {
        if (!isNetworkError(error)) throw error;
        // Network error - fall through to return cached data if available
        console.warn('Network error in getWithStatus, returning cached data:', error);
      }
    }

    // Return cached data if available (for both offline mode and API failure cases)
    if (cached) {
      return { data: cached.data as TestRequestDto, isOfflineData: true };
    }

    // Also try entityCache as fallback (data is written to both stores)
    const entityCached = await getCachedEntity('TestRequest', id);
    if (entityCached) {
      return { data: entityCached.data as TestRequestDto, isOfflineData: true };
    }

    return { data: null, isOfflineData: true };
  },
};

export default testRequestService;
