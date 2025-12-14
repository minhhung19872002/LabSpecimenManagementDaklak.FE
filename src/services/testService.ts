import api from './api';
import { TestDto, CreateTestDto, UpdateTestDto, PagedResultDto, TestStatus } from '../types/test';

const BASE_URL = '/api/v1/tests';

// Extended params interface for search and filter
export interface TestListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: TestStatus;
  specimenId?: string;
  method?: string;
}

// Helper to convert params for API (ABP Framework uses SkipCount, MaxResultCount, Sorting)
const toApiParams = (params?: TestListParams) => {
  if (!params) return {};
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.search) apiParams.Search = params.search;
  if (params.status !== undefined) apiParams.Status = params.status;
  if (params.specimenId) apiParams.SpecimenId = params.specimenId;
  if (params.method) apiParams.Method = params.method;
  return apiParams;
};

export const testService = {
  async getList(params?: TestListParams): Promise<PagedResultDto<TestDto>> {
    const response = await api.get<PagedResultDto<TestDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  async get(id: string): Promise<TestDto> {
    const response = await api.get<TestDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async getBySpecimen(specimenId: string): Promise<TestDto[]> {
    const response = await api.get<TestDto[]>(`${BASE_URL}/by-specimen/${specimenId}`);
    return response.data;
  },

  async create(data: CreateTestDto): Promise<TestDto> {
    const response = await api.post<TestDto>(BASE_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateTestDto): Promise<TestDto> {
    const response = await api.put<TestDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  }
};

export default testService;
