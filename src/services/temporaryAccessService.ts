import { api } from './api';

export enum TemporaryEmployeeType {
  Internal = 0,
  External = 1,
}

export enum GrantStatus {
  Active = 0,
  Expired = 1,
}

export interface TemporaryAccessGrantDto {
  id: string;
  employeeType: TemporaryEmployeeType;
  userId?: string;
  externalUserId?: string;
  externalUsername?: string;
  employeeFullName: string;
  employeeEmail?: string;
  employeePhone?: string;
  startDate: string;
  expiryDate: string;
  status: GrantStatus;
  selectedModules: string[];
  reason?: string;
  creationTime: string;
}

export interface CreateTemporaryAccessGrantDto {
  employeeType: TemporaryEmployeeType;
  // Internal
  userId?: string;
  // External
  externalUsername?: string;
  externalFullName?: string;
  externalPhone?: string;
  externalEmail?: string;
  externalPassword?: string;
  externalConfirmPassword?: string;
  // Common
  startDate: string;
  expiryDate: string;
  selectedModules: string[];
  reason?: string;
}

export interface UpdateTemporaryAccessGrantDto {
  startDate: string;
  expiryDate: string;
  selectedModules: string[];
  reason?: string;
}

export interface TemporaryAccessGrantPagedRequestDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
  status?: GrantStatus;
}

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export interface TemporaryAccessGrantStatsDto {
  total: number;
  active: number;
  expired: number;
}

const BASE_URL = '/api/v1/temporary-access';

export const temporaryAccessService = {
  getList: async (params: TemporaryAccessGrantPagedRequestDto): Promise<PagedResult<TemporaryAccessGrantDto>> => {
    const response = await api.get<PagedResult<TemporaryAccessGrantDto>>(BASE_URL, { params });
    return response.data;
  },

  get: async (id: string): Promise<TemporaryAccessGrantDto> => {
    const response = await api.get<TemporaryAccessGrantDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (input: CreateTemporaryAccessGrantDto): Promise<TemporaryAccessGrantDto> => {
    const response = await api.post<TemporaryAccessGrantDto>(BASE_URL, input);
    return response.data;
  },

  update: async (id: string, input: UpdateTemporaryAccessGrantDto): Promise<TemporaryAccessGrantDto> => {
    const response = await api.put<TemporaryAccessGrantDto>(`${BASE_URL}/${id}`, input);
    return response.data;
  },

  expire: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/expire`);
  },

  getStats: async (): Promise<TemporaryAccessGrantStatsDto> => {
    const response = await api.get<TemporaryAccessGrantStatsDto>(`${BASE_URL}/stats`);
    return response.data;
  },
};

export default temporaryAccessService;
