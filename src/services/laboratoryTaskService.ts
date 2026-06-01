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
  UpdateSubContractMethodInput,
  ApproveIndicatorInput,
  ManageSupportersInput,
  BulkApproveIndicatorsInput,
  SendToQualityInput,
  MethodLookupDto,
  UserLookupDto,
  LabTechManagerPendingTaskDto,
  LabTechnicianPendingTaskDto,
  EvaluateIndicatorInput,
  RequestMethodChangeInput,
  RejectIndicatorsForTestingInput,
  LaboratoryDepartmentSupporterDto,
  AddDepartmentSupportersInput,
  TaskStatusStatisticsDto
} from '../types/laboratoryTask';
import { SampleAssignmentLogStatisticsDto } from '../types/qualityManagement';

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
  if (params.testRequestStatus !== undefined) apiParams.TestRequestStatus = params.testRequestStatus;
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
   * Get task status statistics (counts per status, no filter)
   */
  getTaskStatusStatistics: async (): Promise<TaskStatusStatisticsDto> => {
    const response = await api.get<TaskStatusStatisticsDto>(`${BASE_URL}/task-status-statistics`);
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
   * Gán phương pháp và Thử nghiệm viên cho các chỉ tiêu của một mẫu
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
   * Lấy danh sách Thử nghiệm viên theo khoa phòng (nếu không truyền laboratoryId thì lấy tất cả)
   */
  getTechniciansByLaboratory: async (laboratoryId?: string): Promise<UserLookupDto[]> => {
    const params = laboratoryId ? { laboratoryId } : {};
    const response = await api.get<UserLookupDto[]>(
      `${BASE_URL}/technicians-lookup`,
      { params }
    );
    return response.data;
  },

  /**
   * Lấy danh sách Thử nghiệm viên theo phòng ban của QLKT (role LabTechnician + cùng DepartmentId với QLKT của task)
   */
  getTechniciansByTask: async (taskId: string): Promise<UserLookupDto[]> => {
    const response = await api.get<UserLookupDto[] | { items: UserLookupDto[] }>(
      `${BASE_URL}/${taskId}/technicians`
    );
    // Handle both array response and { items: [] } response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.items || [];
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

  /**
   * Check if current user is a supporter for any incomplete task
   * Used for sidebar visibility - "Quản lý công việc" and "Quản lý thử nghiệm"
   */
  isCurrentUserSupporter: async (): Promise<boolean> => {
    const response = await api.get<boolean>(`${BASE_URL}/is-supporter`);
    return response.data;
  },

  // ============= Department Supporter Management =============

  /**
   * Get department supporters for current user's managed labs
   */
  getDepartmentSupporters: async (): Promise<LaboratoryDepartmentSupporterDto[]> => {
    const response = await api.get<any>('/api/v1/department-supporters');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.items) return data.items;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * Add department supporters (with expiration date)
   */
  addDepartmentSupporters: async (input: AddDepartmentSupportersInput): Promise<LaboratoryDepartmentSupporterDto[]> => {
    const response = await api.post<any>(
      '/api/v1/department-supporters',
      input
    );
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.items) return data.items;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * Remove a department supporter
   */
  removeDepartmentSupporter: async (supporterId: string): Promise<void> => {
    await api.delete(`/api/v1/department-supporters/${supporterId}`);
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
  },

  /**
   * Cập nhật ghi chú cho nhiều chỉ tiêu cùng lúc
   * - freeTextNote: Lưu cho TẤT CẢ indicators trong sample (allIndicatorIds)
   * - masterDataNoteIds: Lưu cho CHỈ selected indicators (selectedIndicatorIds)
   * - skipMasterDataUpdate: Nếu true, không cập nhật MasterDataNoteIds (giữ nguyên)
   */
  bulkUpdateIndicatorNote: async (
    taskId: string,
    input: {
      allIndicatorIds: string[];
      selectedIndicatorIds: string[];
      freeTextNote: string | null;
      masterDataNoteIds: string[] | null;
      appendMode?: boolean;
      skipMasterDataUpdate?: boolean;
    }
  ): Promise<void> => {
    await api.put(`${BASE_URL}/${taskId}/indicators/bulk-note`, input);
  },

  /**
   * Cập nhật tiêu chuẩn so sánh cho chỉ tiêu
   */
  updateIndicatorStandard: async (indicatorId: string, standardId: string | null): Promise<LaboratoryTaskIndicatorDto> => {
    const response = await api.put<LaboratoryTaskIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/standard`,
      JSON.stringify(standardId),
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  /**
   * Cập nhật phương pháp cho chỉ tiêu
   */
  updateIndicatorMethod: async (indicatorId: string, methodId: string | null): Promise<LaboratoryTaskIndicatorDto> => {
    const response = await api.put<LaboratoryTaskIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/method`,
      JSON.stringify(methodId),
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  /**
   * Cập nhật thông tin phương pháp phụ cho chỉ tiêu có phương pháp gốc là "-"
   */
  updateSubContractMethod: async (
    indicatorId: string,
    input: UpdateSubContractMethodInput
  ): Promise<LaboratoryTaskIndicatorDto> => {
    const response = await api.put<LaboratoryTaskIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/subcontract-method`,
      input
    );
    return response.data;
  },

  /**
   * Cập nhật đơn vị tính cho chỉ tiêu (không cập nhật ngược master data)
   */
  updateIndicatorUnit: async (indicatorId: string, unit: string | null): Promise<LaboratoryTaskIndicatorDto> => {
    const response = await api.put<LaboratoryTaskIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/unit`,
      JSON.stringify(unit),
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  // ============= Workflow Redesign - QLKT Evaluation (Per-Indicator) =============

  /**
   * QLKT đánh giá từng chỉ tiêu (Accept/RequestMethodChange/Reject)
   */
  evaluateIndicator: async (
    indicatorId: string,
    input: EvaluateIndicatorInput
  ): Promise<LaboratoryTaskIndicatorDto> => {
    const response = await api.post<LaboratoryTaskIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/evaluate`,
      input
    );
    return response.data;
  },

  /**
   * QLKT yêu cầu đổi phương pháp cho nhiều chỉ tiêu cùng lúc
   */
  requestMethodChange: async (
    taskId: string,
    input: RequestMethodChangeInput
  ): Promise<LaboratoryTaskIndicatorDto[]> => {
    const response = await api.post<LaboratoryTaskIndicatorDto[]>(
      `${BASE_URL}/${taskId}/request-method-change`,
      input
    );
    return response.data;
  },

  /**
   * QLKT từ chối thử nghiệm cho nhiều chỉ tiêu cùng lúc
   */
  rejectIndicatorsForTesting: async (
    taskId: string,
    input: RejectIndicatorsForTestingInput
  ): Promise<LaboratoryTaskIndicatorDto[]> => {
    const response = await api.post<LaboratoryTaskIndicatorDto[]>(
      `${BASE_URL}/${taskId}/reject-indicators`,
      input
    );
    return response.data;
  },

  /**
   * QLKT duyệt tất cả chỉ tiêu còn lại (status = Pending) của task
   */
  approveAllRemainingIndicators: async (taskId: string): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(
      `${BASE_URL}/${taskId}/approve-all-remaining`
    );
    return response.data;
  },

  // ============= Shared Sample (Mẫu chung) APIs =============

  /**
   * QLKT Vi Sinh gửi mẫu chung cho Lab Hóa
   * Điều kiện: Task.Status = Approved, IsSharedSampleTask = true, SampleSentToNextLab = false
   */
  sendSharedSample: async (taskId: string, input?: { note?: string }): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(
      `${BASE_URL}/${taskId}/send-shared-sample`,
      input || {}
    );
    return response.data;
  },

  /**
   * QLKT Lab Hóa xác nhận nhận mẫu chung từ Lab Vi Sinh
   * Điều kiện: IsWaitingForPriorLab = true, PriorLab đã gửi mẫu
   */
  receiveSharedSample: async (
    taskId: string,
    input?: { receivedDate?: string; note?: string }
  ): Promise<LaboratoryTaskDto> => {
    const response = await api.post<LaboratoryTaskDto>(
      `${BASE_URL}/${taskId}/receive-shared-sample`,
      input || {}
    );
    return response.data;
  },

  /**
   * Kiểm tra xem có cần ẩn nút từ chối cho task này không
   * Task của Lab Hóa trong mẫu chung không được từ chối chỉ tiêu
   */
  shouldHideRejectButton: async (taskId: string): Promise<boolean> => {
    const response = await api.get<boolean>(
      `${BASE_URL}/${taskId}/should-hide-reject-button`
    );
    return response.data;
  },

  // ============= Sample Assignment Log (Sổ nhận mẫu giao việc) =============

  /**
   * Lấy danh sách Sổ nhận mẫu giao việc cho QLKT - hiển thị tất cả công việc của Lab mà user quản lý
   */
  getSampleAssignmentLog: async (input: {
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
    search?: string;
    testRequestStatus?: number;
    fromDate?: string;
    toDate?: string;
    laboratoryId?: string;
    indicatorIds?: string[];
    technicianIds?: string[];
    qlktDisplayStatuses?: number[];
  }): Promise<{ items: any[]; totalCount: number }> => {
    const params: Record<string, any> = {
      SkipCount: input.skipCount,
      MaxResultCount: input.maxResultCount,
      Sorting: input.sorting,
      Search: input.search,
      TestRequestStatus: input.testRequestStatus,
      FromDate: input.fromDate,
      ToDate: input.toDate,
      LaboratoryId: input.laboratoryId,
    };
    if (input.indicatorIds && input.indicatorIds.length > 0) {
      input.indicatorIds.forEach((id, index) => {
        params[`IndicatorIds[${index}]`] = id;
      });
    }
    if (input.technicianIds && input.technicianIds.length > 0) {
      input.technicianIds.forEach((id, index) => {
        params[`TechnicianIds[${index}]`] = id;
      });
    }
    if (input.qlktDisplayStatuses && input.qlktDisplayStatuses.length > 0) {
      input.qlktDisplayStatuses.forEach((status, index) => {
        params[`QlktDisplayStatuses[${index}]`] = status;
      });
    }
    const response = await api.get<{ items: any[]; totalCount: number }>(
      `${BASE_URL}/sample-assignment-log`,
      { params }
    );
    return response.data;
  },

  /**
   * Thống kê Sổ nhận mẫu giao việc cho QLKT theo QLKTDisplayStatus
   */
  getSampleAssignmentLogStatistics: async (): Promise<SampleAssignmentLogStatisticsDto> => {
    const response = await api.get<SampleAssignmentLogStatisticsDto>(
      `${BASE_URL}/sample-assignment-log/statistics`
    );
    return response.data;
  },
};

export default laboratoryTaskService;
