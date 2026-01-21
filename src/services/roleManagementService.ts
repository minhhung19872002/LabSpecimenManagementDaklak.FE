import api from './api';

// ============ Types ============

export interface RoleDto {
  id: string;
  name: string;
  normalizedName: string;
  userCount: number;
  isStatic: boolean;
  isDefault: boolean;
  isPublic: boolean;
  concurrencyStamp?: string;
}

export interface RoleUserDto {
  id: string;
  userName: string;
  fullName?: string;
  email?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  isActive: boolean;
}

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

export interface RoleDetailDto extends RoleDto {
  users: RoleUserDto[];
  permissionGroups: PermissionGroupDto[];
}

export interface CreateRoleInput {
  name: string;
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface UpdateRoleInput {
  name: string;
  isDefault?: boolean;
  isPublic?: boolean;
  concurrencyStamp?: string;
}

export interface UpdateRolePermissionsInput {
  permissions: string[];
}

export interface GetRolesParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
}

export interface GetRoleUsersParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

// ============ API Service ============

const BASE_URL = '/api/app/role-management';

const roleManagementService = {
  // ============ Role CRUD ============

  /**
   * Get paginated list of roles
   */
  getList: async (params?: GetRolesParams): Promise<PagedResult<RoleDto>> => {
    const response = await api.get<PagedResult<RoleDto>>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get role detail by id
   */
  get: async (id: string): Promise<RoleDetailDto> => {
    const response = await api.get<RoleDetailDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create a new role
   */
  create: async (data: CreateRoleInput): Promise<RoleDto> => {
    const response = await api.post<RoleDto>(BASE_URL, data);
    return response.data;
  },

  /**
   * Update a role
   */
  update: async (id: string, data: UpdateRoleInput): Promise<RoleDto> => {
    const response = await api.put<RoleDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a role
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // ============ Permissions ============

  /**
   * Get all available permissions grouped by category
   */
  getAllPermissions: async (): Promise<PermissionGroupDto[]> => {
    const response = await api.get<PermissionGroupDto[]>(`${BASE_URL}/permissions/all`);
    return response.data;
  },

  /**
   * Get permissions for a specific role
   */
  getRolePermissions: async (roleName: string): Promise<PermissionGroupDto[]> => {
    const response = await api.get<PermissionGroupDto[]>(`${BASE_URL}/${roleName}/permissions`);
    return response.data;
  },

  /**
   * Update permissions for a role
   */
  updateRolePermissions: async (roleName: string, data: UpdateRolePermissionsInput): Promise<void> => {
    await api.put(`${BASE_URL}/${roleName}/permissions`, data);
  },

  // ============ Users ============

  /**
   * Get paginated list of users in a role
   */
  getRoleUsers: async (roleId: string, params?: GetRoleUsersParams): Promise<PagedResult<RoleUserDto>> => {
    const response = await api.get<PagedResult<RoleUserDto>>(`${BASE_URL}/${roleId}/users`, { params });
    return response.data;
  },

  /**
   * Add a user to a role
   */
  addUserToRole: async (roleId: string, userId: string): Promise<void> => {
    await api.post(`${BASE_URL}/${roleId}/users/${userId}`);
  },

  /**
   * Remove a user from a role
   */
  removeUserFromRole: async (roleId: string, userId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${roleId}/users/${userId}`);
  },

  /**
   * Get available users that can be added to a role
   */
  getAvailableUsers: async (roleId: string, filter?: string): Promise<RoleUserDto[]> => {
    const response = await api.get<RoleUserDto[]>(`${BASE_URL}/${roleId}/available-users`, {
      params: { filter }
    });
    return response.data;
  },
};

export default roleManagementService;
