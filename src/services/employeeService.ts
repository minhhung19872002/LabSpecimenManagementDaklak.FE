import api from './api';

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

const BASE_URL = '/api/app/employee';

export const employeeService = {
  getList: async (params?: {
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
    filter?: string;
    departmentId?: string;
    role?: string;
    isActive?: boolean;
  }) => {
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
