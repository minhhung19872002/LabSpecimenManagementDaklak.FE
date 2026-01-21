import api from './api';
import { createOfflineService, BaseCrudService } from './offline/createOfflineService';

export interface EmployeeDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  departmentId: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  accountExpirationDate: string | null;
  isTemporaryAccount: boolean;
  isExpired: boolean;
}

export interface CreateEmployeeDto {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  departmentId: string;
  position?: string;
  isActive?: boolean;
  isTemporaryAccount?: boolean;
  accountExpirationDate?: string;
  useManualPassword?: boolean;
  password?: string;
  confirmPassword?: string;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  departmentId?: string;
  position?: string;
  isActive?: boolean;
  isTemporaryAccount?: boolean;
  accountExpirationDate?: string | null;
}

export interface ResetPasswordDto {
  useManualPassword?: boolean;
  password?: string;
  confirmPassword?: string;
}

export interface EmployeeListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
  departmentId?: string;
  role?: string;
  isActive?: boolean;
}

const BASE_URL = '/api/app/employee';

const employeeApiService = {
  getList: async (params?: EmployeeListParams) => {
    const response = await api.get<{ items: EmployeeDto[]; totalCount: number }>(BASE_URL, { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get<EmployeeDto>(`${BASE_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateEmployeeDto) => {
    const response = await api.post<EmployeeDto>(BASE_URL, data);
    return response.data;
  },
  update: async (id: string, data: UpdateEmployeeDto) => {
    const response = await api.put<EmployeeDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

const baseService: BaseCrudService<EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto, EmployeeListParams> = {
  getList: employeeApiService.getList,
  get: employeeApiService.get,
  create: employeeApiService.create,
  update: employeeApiService.update,
  delete: employeeApiService.delete,
};

const offlineEnabledService = createOfflineService<EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto, EmployeeListParams>('Employee', baseService);

export const employeeService = {
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
  toggleActive: async (id: string, isActive: boolean) => {
    const response = await api.put<EmployeeDto>(`${BASE_URL}/${id}/toggle-active`, { isActive });
    return response.data;
  },
  resetPassword: async (id: string, data: ResetPasswordDto = {}) => {
    const response = await api.post<{ password: string }>(`${BASE_URL}/${id}/reset-password`, data);
    return response.data;
  },
};

export default employeeService;
