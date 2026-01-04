import api from './api';
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  UpdateLaboratoryTaskDto,
  GetLaboratoryTaskListDto,
  PagedLaboratoryTaskResult,
  ListLaboratoryTaskResult,
  LaboratoryTaskIndicatorDto,
  LaboratoryTaskSupporterDto,
  AssignIndicatorInput,
  UpdateIndicatorResultInput,
  ApproveIndicatorInput,
  ManageSupportersInput,
  BulkApproveIndicatorsInput,
  SendToQualityInput,
  MethodLookupDto,
  UserLookupDto,
  LabTechManagerPendingTaskDto,
  LabTechnicianPendingTaskDto
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
   * Gửi kết quả (chuyển status sang SentToQuality) - old method, sends all approved indicators
   */
  sendResults: async (taskId: string): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(
      `${BASE_URL}/${taskId}/send-results`
    );
    return response.data;
  },

  /**
   * Lấy danh sách phương pháp theo chỉ tiêu (indicatorId optional - nếu không truyền sẽ trả về tất cả)
   */
  getMethodsByIndicator: async (indicatorId?: string): Promise<MethodLookupDto[]> => {
    const params = indicatorId ? { indicatorId } : {};
    const response = await api.get<MethodLookupDto[]>(
      `${BASE_URL}/methods-lookup`,
      { params }
    );
    return response.data;
  },

  /**
   * Lấy danh sách kỹ thuật viên theo khoa phòng (nếu không truyền laboratoryId thì lấy tất cả)
   */
  getTechniciansByLaboratory: async (laboratoryId?: string): Promise<UserLookupDto[]> => {
    const params = laboratoryId ? { laboratoryId } : {};
    const response = await api.get<UserLookupDto[]>(
      `${BASE_URL}/technicians-lookup`,
      { params }
    );
    return response.data;
  },

  // ============= Supporter Management =============

  /**
   * Get supporters for a task
   */
  getSupporters: async (taskId: string): Promise<LaboratoryTaskSupporterDto[]> => {
    const response = await api.get<LaboratoryTaskSupporterDto[]>(
      `${BASE_URL}/${taskId}/supporters`
    );
    return response.data;
  },

  /**
   * Add supporters to a task
   */
  addSupporters: async (taskId: string, input: ManageSupportersInput): Promise<LaboratoryTaskSupporterDto[]> => {
    const response = await api.post<LaboratoryTaskSupporterDto[]>(
      `${BASE_URL}/${taskId}/supporters`,
      input
    );
    return response.data;
  },

  /**
   * Remove a supporter from a task
   */
  removeSupporter: async (taskId: string, supporterId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${taskId}/supporters/${supporterId}`);
  },

  /**
   * Get available users to add as supporters
   */
  getAvailableSupporters: async (taskId: string): Promise<UserLookupDto[]> => {
    const response = await api.get<UserLookupDto[]>(
      `${BASE_URL}/${taskId}/available-supporters`
    );
    return response.data;
  },

  // ============= Bulk Approval =============

  /**
   * Bulk approve/reject indicators
   */
  bulkApproveIndicators: async (taskId: string, input: BulkApproveIndicatorsInput): Promise<LaboratoryTaskIndicatorDto[]> => {
    const response = await api.post<LaboratoryTaskIndicatorDto[]>(
      `${BASE_URL}/${taskId}/bulk-approve`,
      input
    );
    return response.data;
  },

  // ============= Send to Quality Management =============

  /**
   * Send selected indicators to Quality Management
   */
  sendToQuality: async (taskId: string, input: SendToQualityInput): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(
      `${BASE_URL}/${taskId}/send-to-quality`,
      input
    );
    return response.data;
  },

  /**
   * Get list of Quality Managers (filtered by same department as QLKT of task)
   */
  getQualityManagers: async (taskId: string): Promise<UserLookupDto[]> => {
    const response = await api.get<UserLookupDto[] | { items: UserLookupDto[] }>(
      `${BASE_URL}/${taskId}/quality-managers`
    );
    // Handle both array response and { items: [] } response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
  },

  // ============= Work Reminder =============

  /**
   * Lấy danh sách công việc cần làm cho Lab Technical Manager (popup reminder)
   */
  getLabTechManagerPendingTasks: async (): Promise<LabTechManagerPendingTaskDto[]> => {
    const response = await api.get<LabTechManagerPendingTaskDto[]>(
      `${BASE_URL}/lab-tech-manager-pending-tasks`
    );
    return response.data;
  },

  /**
   * Lấy danh sách công việc cần làm cho Lab Technician/KTV (popup reminder)
   */
  getLabTechnicianPendingTasks: async (): Promise<LabTechnicianPendingTaskDto[]> => {
    const response = await api.get<LabTechnicianPendingTaskDto[]>(
      `${BASE_URL}/lab-technician-pending-tasks`
    );
    return response.data;
  },

  /**
   * Cập nhật ghi chú cho chỉ tiêu
   */
  updateIndicatorNote: async (indicatorId: string, note: string | null): Promise<LaboratoryTaskIndicatorDto> => {
    const response = await api.put<LaboratoryTaskIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/note`,
      JSON.stringify(note),
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
};

export default laboratoryTaskService;
