import api from './api';

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

const BASE_URL = '/api/v1/ncrs';

// Helper to convert params for API (ABP Framework uses SkipCount, MaxResultCount, Sorting)
const toApiParams = (params: PagedAndSortedResultRequestDto) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  return apiParams;
};

export interface CloseNCRDto {
  resolutionNotes?: string;
}

export interface AssignNCRDto {
  assignedToId: string;
}

export const ncrService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<NCRDto>> => {
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
