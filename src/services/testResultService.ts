import api from './api';
import { TestResultDto, CreateTestResultDto, UpdateTestResultDto, ResultApprovalStatus } from '../types/testResult';

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

export const testResultService = {
  async getList(params?: GetTestResultListParams): Promise<PagedResultDto<TestResultDto>> {
    const response = await api.get<PagedResultDto<TestResultDto>>(BASE_URL, { params });
    return response.data;
  },

  async get(id: string): Promise<TestResultDto> {
    const response = await api.get<TestResultDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async getByTest(testId: string): Promise<TestResultDto[]> {
    const response = await api.get<TestResultDto[]>(`${BASE_URL}/by-test/${testId}`);
    return response.data;
  },

  async create(data: CreateTestResultDto): Promise<TestResultDto> {
    const response = await api.post<TestResultDto>(BASE_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateTestResultDto): Promise<TestResultDto> {
    const response = await api.put<TestResultDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // ==================== WORKFLOW METHODS ====================

  /**
   * KTV submit kết quả để chờ duyệt
   */
  async submitForReview(id: string, data: SubmitForReviewDto = {}): Promise<TestResultDto> {
    const response = await api.post<TestResultDto>(`${BASE_URL}/${id}/submit`, data);
    return response.data;
  },

  /**
   * Trưởng phòng duyệt kết quả (Step 1 - B1)
   */
  async review(id: string, data: ReviewResultDto): Promise<TestResultDto> {
    const response = await api.post<TestResultDto>(`${BASE_URL}/${id}/review`, data);
    return response.data;
  },

  /**
   * Giám đốc phê duyệt kết quả (Step 2 - B2)
   */
  async approve(id: string, data: ApproveResultDto): Promise<TestResultDto> {
    const response = await api.post<TestResultDto>(`${BASE_URL}/${id}/approve`, data);
    return response.data;
  },

  /**
   * Từ chối kết quả
   */
  async reject(id: string, data: RejectResultDto): Promise<TestResultDto> {
    const response = await api.post<TestResultDto>(`${BASE_URL}/${id}/reject`, data);
    return response.data;
  },

  /**
   * Lấy danh sách kết quả chờ duyệt B1 (cho Trưởng phòng)
   */
  async getPendingReviewList(params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestResultDto>> {
    const response = await api.get<PagedResultDto<TestResultDto>>(`${BASE_URL}/pending-review`, { params });
    return response.data;
  },

  /**
   * Lấy danh sách kết quả chờ duyệt B2 (cho Giám đốc)
   */
  async getPendingApprovalList(params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestResultDto>> {
    const response = await api.get<PagedResultDto<TestResultDto>>(`${BASE_URL}/pending-approval`, { params });
    return response.data;
  },
};

export default testResultService;
