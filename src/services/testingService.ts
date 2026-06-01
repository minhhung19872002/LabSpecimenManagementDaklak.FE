import api from './api';
import {
  TestingDetailDto,
  TestingIndicatorDto,
  GetTestingListInput,
  PagedTestingResult,
  SaveResultsInput,
  SubmitForApprovalInput,
  CheckInIndicatorsInput,
  SubmitResultsInput,
  RejectionHistoryDto,
  RejectionHistoryImageDto,
  SampleTestingImageDto,
  SampleTestingImageType,
  IndicatorImageDto,
  CannotTestDto,
} from '../types/testing';
import {
  GetSampleAssignmentLogInput,
  PagedSampleAssignmentLogResult,
  SampleAssignmentLogStatisticsDto,
} from '../types/qualityManagement';

const BASE_URL = '/api/v1/testing';

// Helper to convert params for API (ABP Framework uses PascalCase)
const toApiParams = (params: GetTestingListInput) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.tab !== undefined) apiParams.Tab = params.tab;
  if (params.search) apiParams.Search = params.search;
  if (params.statuses && params.statuses.length > 0) {
    // ABP supports array params like Statuses[0]=0&Statuses[1]=1
    params.statuses.forEach((status, index) => {
      apiParams[`Statuses[${index}]`] = status;
    });
  }
  if (params.technicianIds && params.technicianIds.length > 0) {
    params.technicianIds.forEach((id, index) => {
      apiParams[`TechnicianIds[${index}]`] = id;
    });
  }
  if (params.laboratoryId) apiParams.LaboratoryId = params.laboratoryId;
  if (params.requestCompletionDateFrom) apiParams.RequestCompletionDateFrom = params.requestCompletionDateFrom;
  if (params.requestCompletionDateTo) apiParams.RequestCompletionDateTo = params.requestCompletionDateTo;
  if (params.indicatorIds && params.indicatorIds.length > 0) {
    params.indicatorIds.forEach((id, index) => {
      apiParams[`IndicatorIds[${index}]`] = id;
    });
  }
  return apiParams;
};

export interface TestingStatusStatisticsDto {
  total: number;
  notStarted: number;
  inProgress: number;
  pendingApproval: number;
  rejected: number;
  completed: number;
}

export const testingService = {
  /**
   * Get status statistics for testing tasks
   */
  getStatusStatistics: async (tab: number): Promise<TestingStatusStatisticsDto> => {
    const response = await api.get<TestingStatusStatisticsDto>(`${BASE_URL}/statistics`, {
      params: { Tab: tab }
    });
    return response.data;
  },

  /**
   * Get filtered and paged list of testing tasks
   */
  getList: async (params: GetTestingListInput = {}): Promise<PagedTestingResult> => {
    const response = await api.get<PagedTestingResult>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  /**
   * Get sample assignment log for testing page
   * Query from LaboratoryTaskIndicator (không yêu cầu QualityManagementTask)
   */
  getSampleAssignmentLog: async (input: GetSampleAssignmentLogInput): Promise<PagedSampleAssignmentLogResult> => {
    const queryParams: Record<string, any> = {};
    if (input.skipCount !== undefined) queryParams.SkipCount = input.skipCount;
    if (input.maxResultCount !== undefined) queryParams.MaxResultCount = input.maxResultCount;
    if (input.sorting) queryParams.Sorting = input.sorting;
    if (input.search) queryParams.Search = input.search;
    if (input.testRequestStatus !== undefined) queryParams.TestRequestStatus = input.testRequestStatus;
    if (input.fromDate) queryParams.FromDate = input.fromDate;
    if (input.toDate) queryParams.ToDate = input.toDate;
    if (input.laboratoryId) queryParams.LaboratoryId = input.laboratoryId;
    if (input.indicatorIds && input.indicatorIds.length > 0) {
      input.indicatorIds.forEach((id, index) => {
        queryParams[`IndicatorIds[${index}]`] = id;
      });
    }
    if (input.technicianIds && input.technicianIds.length > 0) {
      input.technicianIds.forEach((id, index) => {
        queryParams[`TechnicianIds[${index}]`] = id;
      });
    }
    if (input.qlktDisplayStatuses && input.qlktDisplayStatuses.length > 0) {
      input.qlktDisplayStatuses.forEach((status, index) => {
        queryParams[`QlktDisplayStatuses[${index}]`] = status;
      });
    }

    const response = await api.get<PagedSampleAssignmentLogResult>(`${BASE_URL}/sample-assignment-log`, { params: queryParams });
    return response.data;
  },

  /**
   * Get statistics for sample assignment log (by QLKTDisplayStatus)
   */
  getSampleAssignmentLogStatistics: async (): Promise<SampleAssignmentLogStatisticsDto> => {
    const response = await api.get<SampleAssignmentLogStatisticsDto>(`${BASE_URL}/sample-assignment-log/statistics`);
    return response.data;
  },

  /**
   * Get testing task detail by LaboratoryTask ID
   * @param id LaboratoryTask ID
   * @param viewMode Optional view mode - 'my' (only user's data), 'all' (full data)
   */
  get: async (id: string, viewMode?: 'my' | 'all'): Promise<TestingDetailDto> => {
    const params: Record<string, any> = {};
    if (viewMode) params.ViewMode = viewMode;
    const response = await api.get<TestingDetailDto>(`${BASE_URL}/${id}`, { params });
    return response.data;
  },

  /**
   * Save results (draft) for indicators
   */
  saveResults: async (id: string, input: SaveResultsInput): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/save-results`, input);
  },

  /**
   * Submit indicators for approval (legacy)
   */
  submitForApproval: async (id: string, input: SubmitForApprovalInput): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/submit-approval`, input);
  },

  /**
   * Check-in indicators (bắt đầu thử nghiệm - ấn "Thực hiện")
   */
  checkInIndicators: async (id: string, input: CheckInIndicatorsInput): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/check-in`, input);
  },

  /**
   * Submit results for approval (gửi kết quả cho QLKT)
   */
  submitResults: async (id: string, input: SubmitResultsInput): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/submit-results`, input);
  },

  /**
   * Get rejection history for an indicator
   */
  getRejectionHistory: async (indicatorId: string): Promise<RejectionHistoryDto[]> => {
    const response = await api.get<RejectionHistoryDto[]>(
      `${BASE_URL}/indicators/${indicatorId}/rejection-history`
    );
    return response.data;
  },

  /**
   * Upload sample testing image (before/after testing) - single file
   */
  uploadSampleTestingImage: async (
    taskId: string,
    sampleId: string,
    imageType: SampleTestingImageType,
    file: File
  ): Promise<SampleTestingImageDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<SampleTestingImageDto>(
      `${BASE_URL}/${taskId}/samples/${sampleId}/images`,
      formData,
      {
        params: { imageType },
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  /**
   * Upload multiple sample testing images (before/after testing) - batch upload
   */
  uploadSampleTestingImages: async (
    taskId: string,
    sampleId: string,
    imageType: SampleTestingImageType,
    files: File[]
  ): Promise<SampleTestingImageDto[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await api.post<SampleTestingImageDto[]>(
      `${BASE_URL}/${taskId}/samples/${sampleId}/images/batch`,
      formData,
      {
        params: { imageType },
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  /**
   * Delete sample testing image
   */
  deleteSampleTestingImage: async (imageId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/samples/images/${imageId}`);
  },

  /**
   * Get sample testing images
   */
  getSampleTestingImages: async (
    taskId: string,
    sampleId: string,
    imageType?: SampleTestingImageType
  ): Promise<SampleTestingImageDto[]> => {
    const params: Record<string, any> = {};
    if (imageType !== undefined) params.imageType = imageType;
    const response = await api.get<SampleTestingImageDto[]>(
      `${BASE_URL}/${taskId}/samples/${sampleId}/images`,
      { params }
    );
    return response.data;
  },

  // ============= Indicator Image APIs =============

  /**
   * Upload indicator image - single file
   */
  uploadIndicatorImage: async (
    taskId: string,
    indicatorId: string,
    file: File
  ): Promise<IndicatorImageDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<IndicatorImageDto>(
      `${BASE_URL}/${taskId}/indicators/${indicatorId}/images`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  /**
   * Upload multiple indicator images - batch upload
   */
  uploadIndicatorImages: async (
    taskId: string,
    indicatorId: string,
    files: File[]
  ): Promise<IndicatorImageDto[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await api.post<IndicatorImageDto[]>(
      `${BASE_URL}/${taskId}/indicators/${indicatorId}/images/batch`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  /**
   * Delete indicator image
   */
  deleteIndicatorImage: async (imageId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/indicators/images/${imageId}`);
  },

  /**
   * Get indicator images
   */
  getIndicatorImages: async (indicatorId: string): Promise<IndicatorImageDto[]> => {
    const response = await api.get<IndicatorImageDto[]>(
      `${BASE_URL}/indicators/${indicatorId}/images`
    );
    return response.data;
  },

  // ============= Sample Received APIs =============

  /**
   * KTV nhận mẫu - đánh dấu mẫu đã nhận trước khi thực hiện thí nghiệm
   */
  receiveSample: async (taskId: string, sampleId: string): Promise<void> => {
    await api.post(`${BASE_URL}/${taskId}/samples/${sampleId}/receive`);
  },

  /**
   * Kiểm tra mẫu đã được nhận chưa
   */
  isSampleReceived: async (taskId: string, sampleId: string): Promise<boolean> => {
    const response = await api.get<boolean>(
      `${BASE_URL}/${taskId}/samples/${sampleId}/is-received`
    );
    return response.data;
  },

  // ============= Cannot Test (KTV báo không TN được) APIs =============

  /**
   * KTV báo không thể thử nghiệm chỉ tiêu
   */
  markCannotTest: async (
    taskId: string,
    indicatorId: string,
    input: CannotTestDto
  ): Promise<TestingIndicatorDto> => {
    const response = await api.post<TestingIndicatorDto>(
      `${BASE_URL}/${taskId}/indicators/${indicatorId}/cannot-test`,
      input
    );
    return response.data;
  },

  /**
   * Upload hình ảnh cho rejection history - single file
   */
  uploadRejectionHistoryImage: async (
    rejectionHistoryId: string,
    file: File
  ): Promise<RejectionHistoryImageDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<RejectionHistoryImageDto>(
      `${BASE_URL}/rejection-histories/${rejectionHistoryId}/images`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  /**
   * Upload nhiều hình ảnh cho rejection history - batch upload
   */
  uploadRejectionHistoryImages: async (
    rejectionHistoryId: string,
    files: File[]
  ): Promise<RejectionHistoryImageDto[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await api.post<RejectionHistoryImageDto[]>(
      `${BASE_URL}/rejection-histories/${rejectionHistoryId}/images/batch`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  /**
   * Xóa hình ảnh rejection history
   */
  deleteRejectionHistoryImage: async (imageId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/rejection-histories/images/${imageId}`);
  }
};

export default testingService;
