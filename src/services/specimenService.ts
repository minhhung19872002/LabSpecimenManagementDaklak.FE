import api from './api';
import {
  SpecimenDto,
  CreateSpecimenDto,
  UpdateSpecimenDto,
  PagedResultDto,
  PagedAndSortedResultRequestDto,
  SpecimenStatus
} from '../types/specimen';

const BASE_URL = '/api/v1/specimens';

// Extended params interface for search and filter
export interface SpecimenListParams extends PagedAndSortedResultRequestDto {
  search?: string;
  status?: SpecimenStatus;
  type?: string;
}

// Helper to convert params for API (ABP Framework uses SkipCount, MaxResultCount, Sorting)
const toApiParams = (params: SpecimenListParams) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.search) apiParams.Search = params.search;
  if (params.status !== undefined) apiParams.Status = params.status;
  if (params.type) apiParams.Type = params.type;
  return apiParams;
};

// Interface for creating multiple specimens
export interface CreateManySpecimensDto {
  testRequestId: string;
  specimens: {
    code?: string;
    name: string;
    type: string;
    receivedDate: string;
    quantity: number;
    unit: string;
    status?: number;
  }[];
  storageLocation?: string;
  storageCondition?: string;
  description?: string;
}

export interface CreateManyResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  createdSpecimens: SpecimenDto[];
  errors: string[];
  success: boolean;
}

export const specimenService = {
  getList: async (params: SpecimenListParams): Promise<PagedResultDto<SpecimenDto>> => {
    const response = await api.get<PagedResultDto<SpecimenDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  get: async (id: string): Promise<SpecimenDto> => {
    const response = await api.get<SpecimenDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getByTestRequest: async (testRequestId: string): Promise<SpecimenDto[]> => {
    const response = await api.get<SpecimenDto[]>(`${BASE_URL}/by-test-request/${testRequestId}`);
    return response.data;
  },

  create: async (data: CreateSpecimenDto): Promise<SpecimenDto> => {
    const response = await api.post<SpecimenDto>(BASE_URL, data);
    return response.data;
  },

  createMany: async (data: CreateManySpecimensDto): Promise<CreateManyResult> => {
    const response = await api.post<CreateManyResult>(`${BASE_URL}/create-many`, data);
    return response.data;
  },

  update: async (id: string, data: UpdateSpecimenDto): Promise<SpecimenDto> => {
    const response = await api.put<SpecimenDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  }
};

export default specimenService;
