import api from './api';

export interface TestResultValueDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateUpdateTestResultValueDto {
  name: string;
  description?: string;
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
};

export default testResultValueService;
