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
  TestRequestTimelineDto
} from '../types/testRequest';

const BASE_URL = '/api/v1/test-requests';

// Extended params interface for search and filter
export interface TestRequestListParams extends PagedAndSortedResultRequestDto {
  search?: string;
  status?: TestRequestStatus;
  expectedCompletionDateFrom?: string;
  expectedCompletionDateTo?: string;
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

  generateBM01ResultForm: async (testRequestId: string, sampleId: string): Promise<{ fileName: string; sampleCode: string }> => {
    const response = await api.post<{ fileName: string; sampleCode: string }>('/api/v1/result-forms/generate-bm01', {
      testRequestId,
      sampleId
    });
    return response.data;
  },

  // Generate test request form (BM05 - phiếu yêu cầu XN)
  generateTestRequestForm: async (testRequestId: string): Promise<{ fileName: string; requestNumber: string }> => {
    const response = await api.post<{ fileName: string; requestNumber: string }>('/api/v1/result-forms/generate-test-request', {
      testRequestId
    });
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

};

// Sample selection DTO for BM01 result form
export interface SampleForSelectionDto {
  id: string;
  sampleCode: string;
  sampleName: string;
  testingStatus: string;
  canGenerateResult: boolean;
  requestedCompletionDate?: string;
}

export default testRequestService;
