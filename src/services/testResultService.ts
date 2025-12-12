import api from './api';
import { TestResultDto, CreateTestResultDto, UpdateTestResultDto } from '../types/testResult';

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface SubmitForReviewDto {
  notes?: string;
}

export interface ReviewResultDto {
  isApproved: boolean;
  comment?: string;
}

export interface ApproveResultDto {
  isApproved: boolean;
  comment?: string;
}

const BASE_URL = '/api/app/test-result';

export const testResultService = {
  async getList(params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestResultDto>> {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  async get(id: string): Promise<TestResultDto> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(data: CreateTestResultDto): Promise<TestResultDto> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateTestResultDto): Promise<TestResultDto> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
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
    const response = await api.post(`${BASE_URL}/${id}/submit`, data);
    return response.data;
  },

  /**
   * Trưởng phòng duyệt kết quả (Step 1)
   */
  async review(id: string, data: ReviewResultDto): Promise<TestResultDto> {
    const response = await api.post(`${BASE_URL}/${id}/review`, data);
    return response.data;
  },

  /**
   * Giám đốc phê duyệt kết quả (Step 2)
   */
  async approve(id: string, data: ApproveResultDto): Promise<TestResultDto> {
    const response = await api.post(`${BASE_URL}/${id}/approve`, data);
    return response.data;
  },

  /**
   * Lấy danh sách kết quả chờ duyệt B1 (cho Trưởng phòng)
   */
  async getPendingReviewList(params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestResultDto>> {
    const response = await api.get(`${BASE_URL}/pending-review`, { params });
    return response.data;
  },

  /**
   * Lấy danh sách kết quả chờ duyệt B2 (cho Giám đốc)
   */
  async getPendingApprovalList(params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestResultDto>> {
    const response = await api.get(`${BASE_URL}/pending-approval`, { params });
    return response.data;
  },
};
