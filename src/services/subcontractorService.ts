import api from './api';
import { createOfflineService, BaseCrudService } from './offline/createOfflineService';

export interface SubcontractorDto {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  taxCode?: string;
  isActive: boolean;
  capabilities?: string;
  evaluationScore?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
  certifications?: SubcontractorCertificationDto[];
  creationTime: string;
  lastModificationTime?: string;
}

export interface SubcontractorCertificationDto {
  id: string;
  subcontractorId: string;
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  certificateNumber?: string;
  filePath?: string;
}

export interface CreateUpdateSubcontractorDto {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  taxCode?: string;
  isActive?: boolean;
  capabilities?: string | null;
  evaluationScore?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
}

export interface CreateSubcontractorCertificationDto {
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  certificateNumber?: string;
  filePath?: string;
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

export interface GetSubcontractorListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  isActive?: boolean;
}

const BASE_URL = '/api/v1/subcontractors';

const toApiParams = (params: GetSubcontractorListInput) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.filter) apiParams.Filter = params.filter;
  if (params.isActive !== undefined) apiParams.IsActive = params.isActive;
  return apiParams;
};

const subcontractorApiService = {
  getList: async (params: GetSubcontractorListInput = {}): Promise<PagedResultDto<SubcontractorDto>> => {
    const response = await api.get<PagedResultDto<SubcontractorDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<SubcontractorDto> => {
    const response = await api.get<SubcontractorDto>(`${BASE_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateSubcontractorDto): Promise<SubcontractorDto> => {
    const response = await api.post<SubcontractorDto>(BASE_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateSubcontractorDto): Promise<SubcontractorDto> => {
    const response = await api.put<SubcontractorDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

const baseService: BaseCrudService<SubcontractorDto, CreateUpdateSubcontractorDto, CreateUpdateSubcontractorDto, GetSubcontractorListInput> = {
  getList: subcontractorApiService.getList,
  get: subcontractorApiService.get,
  create: subcontractorApiService.create,
  update: subcontractorApiService.update,
  delete: subcontractorApiService.delete,
};

const offlineEnabledService = createOfflineService<SubcontractorDto, CreateUpdateSubcontractorDto, CreateUpdateSubcontractorDto, GetSubcontractorListInput>('Subcontractor', baseService);

export const subcontractorService = {
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
  getActive: async (): Promise<SubcontractorDto[]> => {
    const response = await api.get<SubcontractorDto[]>(`${BASE_URL}/active`);
    return response.data;
  },
  addCertification: async (id: string, data: CreateSubcontractorCertificationDto): Promise<SubcontractorCertificationDto> => {
    const response = await api.post<SubcontractorCertificationDto>(`${BASE_URL}/${id}/certifications`, data);
    return response.data;
  },
  removeCertification: async (id: string, certificationId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}/certifications/${certificationId}`);
  },
};

export default subcontractorService;
