import api from './api';

export interface TestResultValueIndicatorDto {
  id: string;
  testResultValueId: string;
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  indicatorFormattedName?: string;
  specimenTypeId: string;
  specimenTypeCode: string;
  specimenTypeName: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TestResultValueDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  indicatorCount: number;
  indicators?: TestResultValueIndicatorDto[];
}

export interface CreateUpdateTestResultValueDto {
  name: string;
  description?: string;
}

export interface AddIndicatorsDto {
  indicators: { indicatorId: string; specimenTypeId: string }[];
}

export interface BatchRemoveIndicatorsDto {
  keys: { indicatorId: string; specimenTypeId: string }[];
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface GetListInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

const BASE_URL = '/api/v1/test-result-values';

export const testResultValueService = {
  async getList(input: GetListInput = {}): Promise<PagedResultDto<TestResultValueDto>> {
    const params = new URLSearchParams();
    if (input.skipCount !== undefined) params.append('skipCount', input.skipCount.toString());
    if (input.maxResultCount !== undefined) params.append('maxResultCount', input.maxResultCount.toString());
    if (input.sorting) params.append('sorting', input.sorting);

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  async get(id: string): Promise<TestResultValueDto> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(input: CreateUpdateTestResultValueDto): Promise<TestResultValueDto> {
    const response = await api.post(BASE_URL, input);
    return response.data;
  },

  async update(id: string, input: CreateUpdateTestResultValueDto): Promise<TestResultValueDto> {
    const response = await api.put(`${BASE_URL}/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  async getActive(): Promise<TestResultValueDto[]> {
    const response = await api.get(`${BASE_URL}/active`);
    return response.data.items || response.data;
  },

  /**
   * Lấy danh sách kết quả recommend cho chỉ tiêu
   * - Nếu chỉ tiêu có kết quả riêng: chỉ trả về kết quả của chỉ tiêu đó
   * - Nếu chỉ tiêu không có kết quả riêng: trả về tất cả kết quả không gắn chỉ tiêu
   */
  async getResultsForIndicator(indicatorId: string): Promise<TestResultValueDto[]> {
    const response = await api.get(`${BASE_URL}/for-indicator/${indicatorId}`);
    return response.data.items || response.data;
  },

  // Indicator management methods

  /**
   * Lấy danh sách kết quả kèm theo danh sách chỉ tiêu
   */
  async getWithIndicators(): Promise<TestResultValueDto[]> {
    const response = await api.get(`${BASE_URL}/with-indicators`);
    return response.data.items || response.data;
  },

  /**
   * Thêm chỉ tiêu vào kết quả thử nghiệm
   */
  async addIndicators(id: string, data: AddIndicatorsDto): Promise<void> {
    await api.post(`${BASE_URL}/${id}/indicators`, data);
  },

  /**
   * Xóa một chỉ tiêu khỏi kết quả thử nghiệm
   */
  async removeIndicator(id: string, indicatorId: string, specimenTypeId: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}/indicators/${indicatorId}?specimenTypeId=${specimenTypeId}`);
  },

  /**
   * Toggle trạng thái active của chỉ tiêu trong kết quả thử nghiệm
   */
  async toggleIndicatorActive(id: string, indicatorId: string, specimenTypeId: string): Promise<TestResultValueIndicatorDto> {
    const response = await api.post(`${BASE_URL}/${id}/indicators/${indicatorId}/toggle-active?specimenTypeId=${specimenTypeId}`);
    return response.data;
  },

  /**
   * Xóa nhiều chỉ tiêu khỏi kết quả thử nghiệm (batch)
   */
  async batchRemoveIndicators(id: string, data: BatchRemoveIndicatorsDto): Promise<number> {
    const response = await api.post(`${BASE_URL}/${id}/indicators/batch-remove`, data);
    return response.data;
  },
};

export default testResultValueService;
