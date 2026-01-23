import api from './api';
import { createOfflineService, BaseCrudService } from './offline/createOfflineService';

export interface NCRDto {
  id: string;
  ncrNumber: string;
  title: string;
  description: string;
  type: NCRType;
  severity: NCRSeverity;
  status: NCRStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  department?: string;
  reportedById: string;
  reportedAt: string;
  assignedToId?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  dueDate: string;
  closedById?: string;
  closedAt?: string;
  notes?: string;
  creationTime: string;
  lastModificationTime?: string;
}

export enum NCRType {
  Equipment = 0,
  Process = 1,
  Personnel = 2,
  Environment = 3,
  Material = 4,
  Other = 5,
}

export enum NCRSeverity {
  Minor = 0,
  Major = 1,
  Critical = 2,
}

export enum NCRStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
  Closed = 3,
  Cancelled = 4,
}

export interface CreateNCRDto {
  title: string;
  description: string;
  type: NCRType;
  severity: NCRSeverity;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  department?: string;
  dueDate: string;
  notes?: string;
}

export interface UpdateNCRDto {
  title: string;
  description: string;
  type: NCRType;
  severity: NCRSeverity;
  status: NCRStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  department?: string;
  assignedToId?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  dueDate: string;
  notes?: string;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface PagedAndSortedResultRequestDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface NCRListParams extends PagedAndSortedResultRequestDto {
  search?: string;
  status?: NCRStatus;
}

const BASE_URL = '/api/v1/ncrs';

const toApiParams = (params: NCRListParams) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.search) apiParams.Search = params.search;
  if (params.status !== undefined) apiParams.Status = params.status;
  return apiParams;
};

export interface CloseNCRDto {
  resolutionNotes?: string;
}

export interface AssignNCRDto {
  assignedToId: string;
}

const ncrApiService = {
  getList: async (params: NCRListParams): Promise<PagedResultDto<NCRDto>> => {
    const response = await api.get<PagedResultDto<NCRDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<NCRDto> => {
    const response = await api.get<NCRDto>(`${BASE_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateNCRDto): Promise<NCRDto> => {
    const response = await api.post<NCRDto>(BASE_URL, data);
    return response.data;
  },
  update: async (id: string, data: UpdateNCRDto): Promise<NCRDto> => {
    const response = await api.put<NCRDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

const baseService: BaseCrudService<NCRDto, CreateNCRDto, UpdateNCRDto, NCRListParams> = {
  getList: ncrApiService.getList,
  get: ncrApiService.get,
  create: ncrApiService.create,
  update: ncrApiService.update,
  delete: ncrApiService.delete,
};

const offlineEnabledService = createOfflineService<NCRDto, CreateNCRDto, UpdateNCRDto, NCRListParams>('NCR', baseService);

export const ncrService = {
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
  assign: async (id: string, data: AssignNCRDto): Promise<NCRDto> => {
    const response = await api.post<NCRDto>(`${BASE_URL}/${id}/assign`, data);
    return response.data;
  },
  close: async (id: string, data: CloseNCRDto = {}): Promise<NCRDto> => {
    const response = await api.post<NCRDto>(`${BASE_URL}/${id}/close`, data);
    return response.data;
  },
  getOpenNCRs: async (): Promise<NCRDto[]> => {
    const response = await api.get<NCRDto[]>(`${BASE_URL}/open`);
    return response.data;
  },
};

export default ncrService;
