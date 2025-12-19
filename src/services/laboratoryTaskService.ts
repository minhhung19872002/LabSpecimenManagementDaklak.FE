import api from './api';
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  UpdateLaboratoryTaskDto,
  GetLaboratoryTaskListDto,
  PagedLaboratoryTaskResult,
  ListLaboratoryTaskResult,
  LaboratoryTaskIndicatorDto,
  AssignIndicatorInput,
  UpdateIndicatorResultInput,
  ApproveIndicatorInput,
  ListMethodLookupResult,
  ListUserLookupResult
} from '../types/laboratoryTask';

const BASE_URL = '/api/v1/laboratory-tasks';

// Helper to convert params for API (ABP Framework uses PascalCase)
const toApiParams = (params: GetLaboratoryTaskListDto) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.search) apiParams.Search = params.search;
  if (params.laboratoryId) apiParams.LaboratoryId = params.laboratoryId;
  if (params.status !== undefined) apiParams.Status = params.status;
  if (params.technicalManagerId) apiParams.TechnicalManagerId = params.technicalManagerId;
  if (params.fromDate) apiParams.FromDate = params.fromDate;
  if (params.toDate) apiParams.ToDate = params.toDate;
  return apiParams;
};

export const laboratoryTaskService = {
  /**
   * Get filtered and paged list of laboratory tasks
   */
  getList: async (params: GetLaboratoryTaskListDto = {}): Promise<PagedLaboratoryTaskResult> => {
    const response = await api.get<PagedLaboratoryTaskResult>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  /**
   * Get a single laboratory task by ID
   */
  get: async (id: string): Promise<LaboratoryTaskDto> => {
    const response = await api.get<LaboratoryTaskDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Update laboratory task (TestDate, Status, Notes)
   */
  update: async (id: string, data: UpdateLaboratoryTaskDto): Promise<LaboratoryTaskDto> => {
    const response = await api.put<LaboratoryTaskDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Update laboratory task status (workflow)
   */
  updateStatus: async (id: string, newStatus: LaboratoryTaskStatus): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(`${BASE_URL}/${id}/status`, newStatus, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  /**
   * Set test date for laboratory task
   */
  setTestDate: async (id: string, testDate: string): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(`${BASE_URL}/${id}/test-date`, JSON.stringify(testDate), {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  /**
   * Get tasks for current user (if user is Technical Manager of any laboratory)
   */
  getMyTasks: async (): Promise<ListLaboratoryTaskResult> => {
    const response = await api.get<ListLaboratoryTaskResult>(`${BASE_URL}/my-tasks`);
    return response.data;
  },

  /**
   * Get tasks by laboratory ID
   */
  getByLaboratory: async (laboratoryId: string): Promise<ListLaboratoryTaskResult> => {
    const response = await api.get<ListLaboratoryTaskResult>(`${BASE_URL}/by-laboratory/${laboratoryId}`);
    return response.data;
  },

  /**
   * Delete laboratory task
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // ============= Phase 6 - Workflow Methods =============

  /**
   * Gán phương pháp và kỹ thuật viên cho các chỉ tiêu của một mẫu
   */
  assignSampleIndicators: async (
    taskId: string,
    sampleId: string,
    assignments: AssignIndicatorInput[]
  ): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(
      `${BASE_URL}/${taskId}/samples/${sampleId}/assign`,
      assignments
    );
    return response.data;
  },

  /**
   * Cập nhật kết quả cho một chỉ tiêu
   */
  updateIndicatorResult: async (
    indicatorId: string,
    input: UpdateIndicatorResultInput
  ): Promise<LaboratoryTaskIndicatorDto> => {
    const response = await api.put<LaboratoryTaskIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/result`,
      input
    );
    return response.data;
  },

  /**
   * Phê duyệt hoặc từ chối kết quả chỉ tiêu
   */
  approveIndicator: async (
    indicatorId: string,
    input: ApproveIndicatorInput
  ): Promise<LaboratoryTaskIndicatorDto> => {
    const response = await api.post<LaboratoryTaskIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/approve`,
      input
    );
    return response.data;
  },

  /**
   * Gửi kết quả (chuyển status sang ResultSent)
   */
  sendResults: async (taskId: string): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(
      `${BASE_URL}/${taskId}/send-results`
    );
    return response.data;
  },

  /**
   * Lấy danh sách phương pháp theo chỉ tiêu
   */
  getMethodsByIndicator: async (indicatorId: string): Promise<ListMethodLookupResult> => {
    const response = await api.get<ListMethodLookupResult>(
      `${BASE_URL}/methods-lookup`,
      { params: { indicatorId } }
    );
    return response.data;
  },

  /**
   * Lấy danh sách kỹ thuật viên theo khoa phòng
   */
  getTechniciansByLaboratory: async (laboratoryId: string): Promise<ListUserLookupResult> => {
    const response = await api.get<ListUserLookupResult>(
      `${BASE_URL}/technicians-lookup`,
      { params: { laboratoryId } }
    );
    return response.data;
  }
};

export default laboratoryTaskService;
