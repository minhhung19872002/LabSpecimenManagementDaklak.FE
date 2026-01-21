import api from './api';
import { TestResultDto, CreateTestResultDto, UpdateTestResultDto, ResultApprovalStatus } from '../types/testResult';
import { createOfflineService, BaseCrudService } from './offline/createOfflineService';

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface GetTestResultListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  approvalStatus?: ResultApprovalStatus;
  isPass?: boolean;
  testId?: string;
}

export interface SubmitForReviewDto {
  comment?: string;
}

export interface ReviewResultDto {
  isApproved: boolean;
  comment?: string;
}

export interface ApproveResultDto {
  isApproved: boolean;
  comment?: string;
}

export interface RejectResultDto {
  reason: string;
}

const BASE_URL = '/api/v1/test-results';

const testResultApiService = {
  getList: async (params?: GetTestResultListParams): Promise<PagedResultDto<TestResultDto>> => {
    const response = await api.get<PagedResultDto<TestResultDto>>(BASE_URL, { params });
    return response.data;
  },
  get: async (id: string): Promise<TestResultDto> => {
    const response = await api.get<TestResultDto>(`${BASE_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateTestResultDto): Promise<TestResultDto> => {
    const response = await api.post<TestResultDto>(BASE_URL, data);
    return response.data;
  },
  update: async (id: string, data: UpdateTestResultDto): Promise<TestResultDto> => {
    const response = await api.put<TestResultDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

const baseService: BaseCrudService<TestResultDto, CreateTestResultDto, UpdateTestResultDto, GetTestResultListParams> = {
  getList: testResultApiService.getList,
  get: testResultApiService.get,
  create: testResultApiService.create,
  update: testResultApiService.update,
  delete: testResultApiService.delete,
};

const offlineEnabledService = createOfflineService<TestResultDto, CreateTestResultDto, UpdateTestResultDto, GetTestResultListParams>('TestResult', baseService);

export const testResultService = {
  // Offline-enabled CRUD operations
  getList: offlineEnabledService.getList,
  get: offlineEnabledService.get,
  create: offlineEnabledService.create,
  update: offlineEnabledService.update,
  delete: offlineEnabledService.delete,
  // Offline utilities
  isOnline: offlineEnabledService.isOnline,
  getPendingSyncCount: offlineEnabledService.getPendingSyncCount,
  forceSync: offlineEnabledService.forceSync,
  getCachedList: offlineEnabledService.getCachedList,
  getCached: offlineEnabledService.getCached,

  // Online-only methods (require server for workflow operations)
  getByTest: async (testId: string): Promise<TestResultDto[]> => {
    const response = await api.get<TestResultDto[]>(`${BASE_URL}/by-test/${testId}`);
    return response.data;
  },

  // ==================== WORKFLOW METHODS (Online-only) ====================

  /**
   * KTV submit kết quả để chờ duyệt
   */
  submitForReview: async (id: string, data: SubmitForReviewDto = {}): Promise<TestResultDto> => {
    const response = await api.post<TestResultDto>(`${BASE_URL}/${id}/submit`, data);
    return response.data;
  },

  /**
   * Trưởng phòng duyệt kết quả (Step 1 - B1)
   */
  review: async (id: string, data: ReviewResultDto): Promise<TestResultDto> => {
    const response = await api.post<TestResultDto>(`${BASE_URL}/${id}/review`, data);
    return response.data;
  },

  /**
   * Giám đốc phê duyệt kết quả (Step 2 - B2)
   */
  approve: async (id: string, data: ApproveResultDto): Promise<TestResultDto> => {
    const response = await api.post<TestResultDto>(`${BASE_URL}/${id}/approve`, data);
    return response.data;
  },

  /**
   * Từ chối kết quả
   */
  reject: async (id: string, data: RejectResultDto): Promise<TestResultDto> => {
    const response = await api.post<TestResultDto>(`${BASE_URL}/${id}/reject`, data);
    return response.data;
  },

  /**
   * Lấy danh sách kết quả chờ duyệt B1 (cho Trưởng phòng)
   */
  getPendingReviewList: async (params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestResultDto>> => {
    const response = await api.get<PagedResultDto<TestResultDto>>(`${BASE_URL}/pending-review`, { params });
    return response.data;
  },

  /**
   * Lấy danh sách kết quả chờ duyệt B2 (cho Giám đốc)
   */
  getPendingApprovalList: async (params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestResultDto>> => {
    const response = await api.get<PagedResultDto<TestResultDto>>(`${BASE_URL}/pending-approval`, { params });
    return response.data;
  },
};

export default testResultService;
