import api from './api';
import { PagedResultDto } from './api';

// Common interfaces
export interface PagedAndSortedResultRequestDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  page?: number;
  limit?: number;
}

// Re-export for backward compatibility
export type { PagedResultDto };

// Department
export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  creationTime: string;
}

export interface CreateUpdateDepartmentDto {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
}

// SpecimenType
export interface SpecimenTypeDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  creationTime: string;
}

export interface CreateUpdateSpecimenTypeDto {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
}

// TestMethod
export interface TestMethodDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  standard?: string;
  isActive: boolean;
  sortOrder: number;
  creationTime: string;
}

export interface CreateUpdateTestMethodDto {
  code: string;
  name: string;
  description?: string;
  standard?: string;
  isActive: boolean;
  sortOrder?: number;
}

// StorageLocation
export interface StorageLocationDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  temperature?: string;
  humidity?: string;
  capacity?: number;
  currentCount: number;
  isActive: boolean;
  sortOrder: number;
  creationTime: string;
}

export interface CreateUpdateStorageLocationDto {
  code: string;
  name: string;
  description?: string;
  temperature?: string;
  humidity?: string;
  capacity?: number;
  isActive: boolean;
  sortOrder?: number;
}

// Customer
export interface CustomerDto {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  isActive: boolean;
  creationTime: string;
}

export interface CreateUpdateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  isActive: boolean;
}

// Service implementations - Using new API v1 endpoints
const DEPARTMENT_URL = '/api/v1/departments';
const SPECIMEN_TYPE_URL = '/api/v1/specimen-types';
const TEST_METHOD_URL = '/api/v1/test-methods';
const STORAGE_LOCATION_URL = '/api/v1/storage-locations';
const CUSTOMER_URL = '/api/v1/customers';

// Helper to convert params for API (ABP Framework uses SkipCount, MaxResultCount, Sorting)
const toApiParams = (params: PagedAndSortedResultRequestDto) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  return apiParams;
};

export const departmentService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<DepartmentDto>> => {
    const response = await api.get<PagedResultDto<DepartmentDto>>(DEPARTMENT_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<DepartmentDto> => {
    const response = await api.get<DepartmentDto>(`${DEPARTMENT_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateDepartmentDto): Promise<DepartmentDto> => {
    const response = await api.post<DepartmentDto>(DEPARTMENT_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateDepartmentDto): Promise<DepartmentDto> => {
    const response = await api.put<DepartmentDto>(`${DEPARTMENT_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${DEPARTMENT_URL}/${id}`);
  },
  getActive: async (): Promise<PagedResultDto<DepartmentDto>> => {
    const response = await api.get<DepartmentDto[]>(`${DEPARTMENT_URL}/active`);
    return { items: response.data, totalCount: response.data.length };
  },
};

export const specimenTypeService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<SpecimenTypeDto>> => {
    const response = await api.get<PagedResultDto<SpecimenTypeDto>>(SPECIMEN_TYPE_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<SpecimenTypeDto> => {
    const response = await api.get<SpecimenTypeDto>(`${SPECIMEN_TYPE_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateSpecimenTypeDto): Promise<SpecimenTypeDto> => {
    const response = await api.post<SpecimenTypeDto>(SPECIMEN_TYPE_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateSpecimenTypeDto): Promise<SpecimenTypeDto> => {
    const response = await api.put<SpecimenTypeDto>(`${SPECIMEN_TYPE_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${SPECIMEN_TYPE_URL}/${id}`);
  },
  getActive: async (): Promise<PagedResultDto<SpecimenTypeDto>> => {
    const response = await api.get<SpecimenTypeDto[]>(`${SPECIMEN_TYPE_URL}/active`);
    return { items: response.data, totalCount: response.data.length };
  },
};

export const testMethodService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<TestMethodDto>> => {
    const response = await api.get<PagedResultDto<TestMethodDto>>(TEST_METHOD_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<TestMethodDto> => {
    const response = await api.get<TestMethodDto>(`${TEST_METHOD_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateTestMethodDto): Promise<TestMethodDto> => {
    const response = await api.post<TestMethodDto>(TEST_METHOD_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateTestMethodDto): Promise<TestMethodDto> => {
    const response = await api.put<TestMethodDto>(`${TEST_METHOD_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${TEST_METHOD_URL}/${id}`);
  },
  getActive: async (): Promise<PagedResultDto<TestMethodDto>> => {
    const response = await api.get<TestMethodDto[]>(`${TEST_METHOD_URL}/active`);
    return { items: response.data, totalCount: response.data.length };
  },
  getByDepartment: async (departmentId: string): Promise<TestMethodDto[]> => {
    const response = await api.get<TestMethodDto[]>(`${TEST_METHOD_URL}/by-department/${departmentId}`);
    return response.data;
  },
};

export const storageLocationService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<StorageLocationDto>> => {
    const response = await api.get<PagedResultDto<StorageLocationDto>>(STORAGE_LOCATION_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<StorageLocationDto> => {
    const response = await api.get<StorageLocationDto>(`${STORAGE_LOCATION_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateStorageLocationDto): Promise<StorageLocationDto> => {
    const response = await api.post<StorageLocationDto>(STORAGE_LOCATION_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateStorageLocationDto): Promise<StorageLocationDto> => {
    const response = await api.put<StorageLocationDto>(`${STORAGE_LOCATION_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${STORAGE_LOCATION_URL}/${id}`);
  },
  getActive: async (): Promise<PagedResultDto<StorageLocationDto>> => {
    const response = await api.get<StorageLocationDto[]>(`${STORAGE_LOCATION_URL}/active`);
    return { items: response.data, totalCount: response.data.length };
  },
  getAvailable: async (): Promise<StorageLocationDto[]> => {
    const response = await api.get<StorageLocationDto[]>(`${STORAGE_LOCATION_URL}/available`);
    return response.data;
  },
};

export const customerService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<CustomerDto>> => {
    const response = await api.get<PagedResultDto<CustomerDto>>(CUSTOMER_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<CustomerDto> => {
    const response = await api.get<CustomerDto>(`${CUSTOMER_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateCustomerDto): Promise<CustomerDto> => {
    const response = await api.post<CustomerDto>(CUSTOMER_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateCustomerDto): Promise<CustomerDto> => {
    const response = await api.put<CustomerDto>(`${CUSTOMER_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${CUSTOMER_URL}/${id}`);
  },
  getActive: async (): Promise<PagedResultDto<CustomerDto>> => {
    const response = await api.get<CustomerDto[]>(`${CUSTOMER_URL}/active`);
    return { items: response.data, totalCount: response.data.length };
  },
};
