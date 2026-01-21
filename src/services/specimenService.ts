import api from './api';
import {
  SpecimenDto,
  CreateSpecimenDto,
  UpdateSpecimenDto,
  PagedResultDto,
  PagedAndSortedResultRequestDto,
  SpecimenStatus
} from '../types/specimen';
import { createOfflineService, BaseCrudService } from './offline/createOfflineService';

const BASE_URL = '/api/v1/specimens';

export interface SpecimenListParams extends PagedAndSortedResultRequestDto {
  search?: string;
  status?: SpecimenStatus;
  type?: string;
}

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

const specimenApiService = {
  getList: async (params: SpecimenListParams): Promise<PagedResultDto<SpecimenDto>> => {
    const response = await api.get<PagedResultDto<SpecimenDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<SpecimenDto> => {
    const response = await api.get<SpecimenDto>(`${BASE_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateSpecimenDto): Promise<SpecimenDto> => {
    const response = await api.post<SpecimenDto>(BASE_URL, data);
    return response.data;
  },
  update: async (id: string, data: UpdateSpecimenDto): Promise<SpecimenDto> => {
    const response = await api.put<SpecimenDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

const baseService: BaseCrudService<SpecimenDto, CreateSpecimenDto, UpdateSpecimenDto, SpecimenListParams> = {
  getList: specimenApiService.getList,
  get: specimenApiService.get,
  create: specimenApiService.create,
  update: specimenApiService.update,
  delete: specimenApiService.delete,
};

const offlineEnabledService = createOfflineService<SpecimenDto, CreateSpecimenDto, UpdateSpecimenDto, SpecimenListParams>('Specimen', baseService);

export const specimenService = {
  getList: offlineEnabledService.getList,
  get: offlineEnabledService.get,
  create: offlineEnabledService.create,
  update: offlineEnabledService.update,
  delete: offlineEnabledService.delete,
  isOnline: offlineEnabledService.isOnline,
  getPendingSyncCount: offlineEnabledService.getPendingSyncCount,
  forceSync: offlineEnabledService.forceSync,
  getCachedList: offlineEnabledService.getCachedList,
  getCached: offlineEnabledService.getCached,
  getByTestRequest: async (testRequestId: string): Promise<SpecimenDto[]> => {
    const response = await api.get<SpecimenDto[]>(`${BASE_URL}/by-test-request/${testRequestId}`);
    return response.data;
  },
  createMany: async (data: CreateManySpecimensDto): Promise<CreateManyResult> => {
    const response = await api.post<CreateManyResult>(`${BASE_URL}/create-many`, data);
    return response.data;
  },
};

export default specimenService;
