import api from './api';

export interface UserDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

// User lookup DTO cho dropdown
export interface UserLookupDto {
  id: string;
  userName: string;
  name?: string;
  surname?: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  departmentName?: string;
  isActive: boolean;
}

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
}

const BASE_URL = '/api/app/user';

export const userService = {
  getList: async (params?: {
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
    filter?: string;
  }) => {
    const response = await api.get<{ items: UserDto[]; totalCount: number }>(BASE_URL, { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<UserDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUserDto) => {
    const response = await api.post<UserDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto) => {
    const response = await api.put<UserDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const response = await api.put<UserDto>(`${BASE_URL}/${id}/toggle-active`, { isActive });
    return response.data;
  },

  resetPassword: async (id: string) => {
    const response = await api.post<{ password: string }>(`${BASE_URL}/${id}/reset-password`);
    return response.data;
  },

  // ========== User Lookup API (cho dropdown) ==========

  /**
   * Lấy tất cả users đang active cho dropdown
   */
  getLookup: async (): Promise<UserLookupDto[]> => {
    try {
      const response = await api.get('/api/v1/users/lookup');
      // Handle both { items: [...] } and direct array response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch user lookup:', error);
      return [];
    }
  },

  /**
   * Tìm kiếm users theo tên hoặc username
   */
  searchLookup: async (filter?: string): Promise<UserLookupDto[]> => {
    const response = await api.get<{ items: UserLookupDto[] }>('/api/v1/users/lookup/search', {
      params: { filter },
    });
    return response.data.items;
  },

  /**
   * Lấy user theo ID
   */
  getLookupById: async (id: string): Promise<UserLookupDto | null> => {
    try {
      const response = await api.get<UserLookupDto>(`/api/v1/users/lookup/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Lấy nhiều users theo IDs
   */
  getLookupByIds: async (ids: string[]): Promise<UserLookupDto[]> => {
    const response = await api.post<{ items: UserLookupDto[] }>('/api/v1/users/lookup/by-ids', ids);
    return response.data.items;
  },

  /**
   * Lấy danh sách users có chức vụ Phó Giám đốc
   */
  getVicePresidents: async (): Promise<UserLookupDto[]> => {
    try {
      const response = await api.get('/api/v1/users/lookup/vice-presidents');
      // Handle both { items: [...] } and direct array response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.items || [];
    } catch (error) {
      console.error('Failed to fetch vice presidents:', error);
      return [];
    }
  },
};

export default userService;
