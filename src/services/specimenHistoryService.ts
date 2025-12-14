import api from './api';
import { PagedResultDto } from './api';
import { SpecimenHistoryDto, CreateSpecimenHistoryDto, UpdateSpecimenHistoryDto, SpecimenStatus } from '../types/specimenHistory';

const BASE_URL = '/api/v1/specimen-histories';

// Extended params interface for search and filter
export interface SpecimenHistoryListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: SpecimenStatus;
  specimenId?: string;
  action?: string;
}

// Helper to convert params for API (ABP Framework uses SkipCount, MaxResultCount, Sorting)
const toApiParams = (params?: SpecimenHistoryListParams) => {
  if (!params) return {};
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.search) apiParams.Search = params.search;
  if (params.status !== undefined) apiParams.Status = params.status;
  if (params.specimenId) apiParams.SpecimenId = params.specimenId;
  if (params.action) apiParams.Action = params.action;
  return apiParams;
};

export const specimenHistoryService = {
  getList: async (params?: SpecimenHistoryListParams): Promise<PagedResultDto<SpecimenHistoryDto>> => {
    const response = await api.get<PagedResultDto<SpecimenHistoryDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  getById: async (id: string): Promise<SpecimenHistoryDto> => {
    const response = await api.get<SpecimenHistoryDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getBySpecimen: async (specimenId: string): Promise<SpecimenHistoryDto[]> => {
    const response = await api.get<{ items: SpecimenHistoryDto[] }>(`${BASE_URL}/by-specimen/${specimenId}`);
    return response.data.items;
  },

  create: async (data: CreateSpecimenHistoryDto): Promise<SpecimenHistoryDto> => {
    const response = await api.post<SpecimenHistoryDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateSpecimenHistoryDto): Promise<SpecimenHistoryDto> => {
    const response = await api.put<SpecimenHistoryDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default specimenHistoryService;
