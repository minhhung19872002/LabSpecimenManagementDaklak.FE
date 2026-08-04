import api from './api';
import { createOfflineService, BaseCrudService } from './offline/createOfflineService';

export interface EmployeeDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  /** @deprecated Use roles instead */
  role?: string;
  /** Danh sách nhóm quyền của nhân viên */
  roles: string[];
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
  // Note: role field removed - quản lý quyền thông qua "Quản lý phân quyền"
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
  // Note: role field removed - quản lý quyền thông qua "Quản lý phân quyền"
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

// Permission DTOs
export interface PermissionDto {
  name: string;
  displayName: string;
  isGranted: boolean;
}

export interface PermissionGroupDto {
  name: string;
  displayName: string;
  permissions: PermissionDto[];
}

export interface UserPermissionsDto {
  userId: string;
  fullName: string;
  userPermissions: PermissionGroupDto[];
  rolePermissions: PermissionGroupDto[];
  effectivePermissions: string[];
}

export interface UpdateUserPermissionsInput {
  permissions: string[];
}

// Warehouse DTOs
export interface UserWarehouseDto {
  id: string;
  userId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  warehouseLevel: number;
}

export interface AssignUserWarehousesInput {
  warehouseIds: string[];
}

// Role DTOs
export interface UserRoleDto {
  id: string;
  name: string;
  permissionCount: number;
  isAssigned: boolean;
  isStatic: boolean;
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

  // Permission management
  getAllPermissions: async () => {
    const response = await api.get<PermissionGroupDto[]>(`${BASE_URL}/permissions/all`);
    return response.data;
  },
  getUserPermissions: async (id: string) => {
    const response = await api.get<PermissionGroupDto[]>(`${BASE_URL}/${id}/permissions`);
    return response.data;
  },
  updateUserPermissions: async (id: string, data: UpdateUserPermissionsInput) => {
    await api.put(`${BASE_URL}/${id}/permissions`, data);
  },
  getUserFullPermissions: async (id: string) => {
    const response = await api.get<UserPermissionsDto>(`${BASE_URL}/${id}/permissions/full`);
    return response.data;
  },

  // Role management
  getUserRoles: async (id: string) => {
    const response = await api.get<UserRoleDto[]>(`${BASE_URL}/${id}/roles`);
    return response.data;
  },
  addRoleToUser: async (id: string, roleName: string) => {
    await api.post(`${BASE_URL}/${id}/roles/${encodeURIComponent(roleName)}`);
  },
  removeRoleFromUser: async (id: string, roleName: string) => {
    await api.delete(`${BASE_URL}/${id}/roles/${encodeURIComponent(roleName)}`);
  },

  // Warehouse assignments
  getUserWarehouses: async (id: string): Promise<UserWarehouseDto[]> => {
    const response = await api.get<UserWarehouseDto[]>(`${BASE_URL}/${id}/warehouses`);
    return response.data;
  },
  assignUserWarehouses: async (id: string, data: AssignUserWarehousesInput) => {
    await api.put(`${BASE_URL}/${id}/warehouses`, data);
  },
};

export default employeeService;
