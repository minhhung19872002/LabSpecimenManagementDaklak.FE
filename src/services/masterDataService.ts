import { api, PagedResultDto } from './api';

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
  indicatorCount: number;
  creationTime: string;
}

export interface CreateUpdateSpecimenTypeDto {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface SpecimenTypeIndicatorDto {
  id: string;
  specimenTypeId: string;
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  indicatorFormattedName?: string;  // Tên chỉ tiêu có định dạng HTML
  indicatorGroupName?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SpecimenTypeWithIndicatorsDto extends SpecimenTypeDto {
  indicators: SpecimenTypeIndicatorDto[];
}

export interface AddIndicatorsToSpecimenTypeDto {
  indicatorIds: string[];
}

// TestMethod
export interface TestMethodDto {
  id: string;
  code: string;
  name: string;
  formattedName?: string | null;
  unit: string;
  isActive: boolean;
  sortOrder: number;
  indicatorCount: number;
  creationTime: string;
}

export interface CreateTestMethodDto {
  name: string;
  formattedName?: string | null;
  unit: string;
  isActive?: boolean;
}

export interface UpdateTestMethodDto {
  name: string;
  formattedName?: string | null;
  unit: string;
  isActive: boolean;
}

export interface TestMethodIndicatorDto {
  id: string;
  testMethodId: string;
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  indicatorFormattedName?: string;  // Tên chỉ tiêu có định dạng HTML
  unitPrice: number;
  isActive: boolean;
  sortOrder: number;
}

export interface TestMethodWithIndicatorsDto extends TestMethodDto {
  indicators: TestMethodIndicatorDto[];
}

export interface AddIndicatorsToTestMethodDto {
  indicators: { indicatorId: string; unitPrice: number }[];
}

// Standard
export interface StandardDto {
  id: string;
  code: string;
  name: string;
  limitDescription?: string;
  isActive: boolean;
  sortOrder: number;
  indicatorCount: number;
  creationTime: string;
}

export interface CreateStandardDto {
  name: string;
  limitDescription?: string;
  isActive?: boolean;
}

export interface UpdateStandardDto {
  name: string;
  limitDescription?: string;
  isActive: boolean;
}

export interface StandardIndicatorDto {
  id: string;
  standardId: string;
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  indicatorFormattedName?: string;  // Tên chỉ tiêu có định dạng HTML
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  testMethodFormattedName?: string | null;
  unit: string;
  comparisonOperator?: string;
  allowedLimit?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface StandardWithIndicatorsDto extends StandardDto {
  indicators: StandardIndicatorDto[];
}

export interface AddIndicatorsToStandardDto {
  indicators: {
    indicatorId: string;
    testMethodId: string;
    unit: string;
    comparisonOperator?: string;
    allowedLimit?: string;
  }[];
}

export interface UpdateStandardIndicatorDto {
  comparisonOperator?: string;
  allowedLimit?: string;
  isActive: boolean;
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

// Laboratory (Khoa phòng)
export interface LaboratoryDto {
  id: string;
  code: string;
  name: string;
  technicalManagerId?: string;
  technicalManagerName?: string;
  isActive: boolean;
  sortOrder: number;
  creationTime: string;
}

export interface CreateUpdateLaboratoryDto {
  code: string;
  name: string;
  technicalManagerId?: string;
  isActive: boolean;
  sortOrder?: number;
}

// IndicatorGroup
export interface IndicatorGroupDto {
  id: string;
  name: string;
  isActive: boolean;
  indicatorCount: number;
  creationTime: string;
  /** Khoa phòng thực hiện (để auto-fill khi gửi QLKT) */
  laboratoryId?: string;
  laboratoryName?: string;
}

export interface CreateUpdateIndicatorGroupDto {
  name: string;
  isActive: boolean;
  /** Khoa phòng thực hiện (không bắt buộc) - để auto-fill khi gửi QLKT */
  laboratoryId?: string;
}

// Indicator
export interface IndicatorDto {
  id: string;
  code: string;
  name: string;
  /** Tên có định dạng HTML (bold, italic, underline, sub, sup) */
  formattedName?: string;
  isActive: boolean;
  indicatorGroupId: string;
  indicatorGroupName: string;
  sortOrder: number;
  canDelete: boolean;
  creationTime: string;
}

export interface CreateIndicatorDto {
  name: string;
  /** Tên có định dạng HTML */
  formattedName?: string;
  isActive: boolean;
  indicatorGroupId: string;
  sortOrder?: number;
}

export interface UpdateIndicatorDto {
  name: string;
  /** Tên có định dạng HTML */
  formattedName?: string;
  isActive: boolean;
  indicatorGroupId: string;
  sortOrder?: number;
}

export interface CreateBulkIndicatorsDto {
  indicatorGroupId: string;
  indicators: { name: string; formattedName?: string }[];
}

export interface IndicatorFilterDto extends PagedAndSortedResultRequestDto {
  search?: string;
  indicatorGroupId?: string;
  isActive?: boolean;
}

// MasterData Statistics
export interface MasterDataStatisticsDto {
  departmentCount: number;
  laboratoryCount: number;
  specimenTypeCount: number;
  testMethodCount: number;
  standardCount: number;
  storageLocationCount: number;
  customerCount: number;
  indicatorGroupCount: number;
  indicatorCount: number;
  formTemplateCount: number;
}

// Service implementations - Using new API v1 endpoints
const DEPARTMENT_URL = '/api/v1/departments';
const SPECIMEN_TYPE_URL = '/api/v1/specimen-types';
const TEST_METHOD_URL = '/api/v1/test-methods';
const STANDARD_URL = '/api/v1/standards';
const STORAGE_LOCATION_URL = '/api/v1/storage-locations';
const CUSTOMER_URL = '/api/v1/customers';
const INDICATOR_GROUP_URL = '/api/v1/indicator-groups';
const INDICATOR_URL = '/api/v1/indicators';
const LABORATORY_URL = '/api/v1/laboratories';
const MASTER_DATA_STATISTICS_URL = '/api/v1/master-data/statistics';

// Helper to convert params for API (API uses Page/Limit instead of SkipCount/MaxResultCount)
const toApiParams = (params: PagedAndSortedResultRequestDto) => {
  const apiParams: Record<string, any> = {};
  // Convert skipCount/maxResultCount to Page/Limit
  const limit = params.maxResultCount || 10;
  const skipCount = params.skipCount || 0;
  const page = Math.floor(skipCount / limit) + 1;

  apiParams.Page = page;
  apiParams.Limit = limit;
  if (params.sorting) apiParams.Sorting = params.sorting;
  return apiParams;
};

// MasterData Statistics Service
export const masterDataStatisticsService = {
  getStatistics: async (): Promise<MasterDataStatisticsDto> => {
    const response = await api.get<MasterDataStatisticsDto>(MASTER_DATA_STATISTICS_URL);
    return response.data;
  },
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
  // Indicator management methods
  getWithIndicators: async (): Promise<SpecimenTypeWithIndicatorsDto[]> => {
    const response = await api.get<SpecimenTypeWithIndicatorsDto[]>(`${SPECIMEN_TYPE_URL}/with-indicators`);
    return response.data;
  },
  getOneWithIndicators: async (id: string): Promise<SpecimenTypeWithIndicatorsDto> => {
    const response = await api.get<SpecimenTypeWithIndicatorsDto>(`${SPECIMEN_TYPE_URL}/${id}/with-indicators`);
    return response.data;
  },
  getIndicators: async (id: string): Promise<SpecimenTypeIndicatorDto[]> => {
    const response = await api.get<SpecimenTypeIndicatorDto[]>(`${SPECIMEN_TYPE_URL}/${id}/indicators`);
    return response.data;
  },
  addIndicators: async (id: string, data: AddIndicatorsToSpecimenTypeDto): Promise<void> => {
    await api.post(`${SPECIMEN_TYPE_URL}/${id}/indicators`, data);
  },
  removeIndicator: async (id: string, indicatorId: string): Promise<void> => {
    await api.delete(`${SPECIMEN_TYPE_URL}/${id}/indicators/${indicatorId}`);
  },
  toggleIndicatorActive: async (id: string, indicatorId: string): Promise<SpecimenTypeIndicatorDto> => {
    const response = await api.post<SpecimenTypeIndicatorDto>(`${SPECIMEN_TYPE_URL}/${id}/indicators/${indicatorId}/toggle-active`);
    return response.data;
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
  create: async (data: CreateTestMethodDto): Promise<TestMethodDto> => {
    const response = await api.post<TestMethodDto>(TEST_METHOD_URL, data);
    return response.data;
  },
  update: async (id: string, data: UpdateTestMethodDto): Promise<TestMethodDto> => {
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
  // Methods with indicators
  getWithIndicators: async (): Promise<TestMethodWithIndicatorsDto[]> => {
    const response = await api.get<TestMethodWithIndicatorsDto[]>(`${TEST_METHOD_URL}/with-indicators`);
    return response.data;
  },
  getOneWithIndicators: async (id: string): Promise<TestMethodWithIndicatorsDto> => {
    const response = await api.get<TestMethodWithIndicatorsDto>(`${TEST_METHOD_URL}/${id}/with-indicators`);
    return response.data;
  },
  // Indicator management
  getIndicators: async (testMethodId: string): Promise<TestMethodIndicatorDto[]> => {
    const response = await api.get<TestMethodIndicatorDto[]>(`${TEST_METHOD_URL}/${testMethodId}/indicators`);
    return response.data;
  },
  addIndicators: async (testMethodId: string, data: AddIndicatorsToTestMethodDto): Promise<void> => {
    await api.post(`${TEST_METHOD_URL}/${testMethodId}/indicators`, data);
  },
  removeIndicator: async (testMethodId: string, indicatorId: string): Promise<void> => {
    await api.delete(`${TEST_METHOD_URL}/${testMethodId}/indicators/${indicatorId}`);
  },
  toggleActive: async (id: string): Promise<TestMethodDto> => {
    const response = await api.post<TestMethodDto>(`${TEST_METHOD_URL}/${id}/toggle-active`);
    return response.data;
  },
};

export const standardService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<StandardDto>> => {
    const response = await api.get<PagedResultDto<StandardDto>>(STANDARD_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<StandardDto> => {
    const response = await api.get<StandardDto>(`${STANDARD_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateStandardDto): Promise<StandardDto> => {
    const response = await api.post<StandardDto>(STANDARD_URL, data);
    return response.data;
  },
  update: async (id: string, data: UpdateStandardDto): Promise<StandardDto> => {
    const response = await api.put<StandardDto>(`${STANDARD_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${STANDARD_URL}/${id}`);
  },
  getActive: async (): Promise<PagedResultDto<StandardDto>> => {
    const response = await api.get<StandardDto[]>(`${STANDARD_URL}/active`);
    return { items: response.data, totalCount: response.data.length };
  },
  toggleActive: async (id: string): Promise<StandardDto> => {
    const response = await api.post<StandardDto>(`${STANDARD_URL}/${id}/toggle-active`);
    return response.data;
  },
  // Standards with indicators
  getWithIndicators: async (): Promise<StandardWithIndicatorsDto[]> => {
    const response = await api.get<StandardWithIndicatorsDto[]>(`${STANDARD_URL}/with-indicators`);
    return response.data;
  },
  getOneWithIndicators: async (id: string): Promise<StandardWithIndicatorsDto> => {
    const response = await api.get<StandardWithIndicatorsDto>(`${STANDARD_URL}/${id}/with-indicators`);
    return response.data;
  },
  // Indicator management
  getIndicators: async (standardId: string): Promise<StandardIndicatorDto[]> => {
    const response = await api.get<StandardIndicatorDto[]>(`${STANDARD_URL}/${standardId}/indicators`);
    return response.data;
  },
  addIndicators: async (standardId: string, data: AddIndicatorsToStandardDto): Promise<void> => {
    await api.post(`${STANDARD_URL}/${standardId}/indicators`, data);
  },
  updateIndicator: async (standardId: string, indicatorId: string, data: UpdateStandardIndicatorDto): Promise<StandardIndicatorDto> => {
    const response = await api.put<StandardIndicatorDto>(`${STANDARD_URL}/${standardId}/indicators/${indicatorId}`, data);
    return response.data;
  },
  removeIndicator: async (standardId: string, indicatorId: string): Promise<void> => {
    await api.delete(`${STANDARD_URL}/${standardId}/indicators/${indicatorId}`);
  },
  toggleIndicatorActive: async (standardId: string, indicatorId: string): Promise<StandardIndicatorDto> => {
    const response = await api.post<StandardIndicatorDto>(`${STANDARD_URL}/${standardId}/indicators/${indicatorId}/toggle-active`);
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

export const laboratoryService = {
  getAll: async (): Promise<LaboratoryDto[]> => {
    const response = await api.get<LaboratoryDto[] | { items: LaboratoryDto[] }>(LABORATORY_URL);
    // Handle both array and { items: [...] } format
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.items || [];
  },
  get: async (id: string): Promise<LaboratoryDto> => {
    const response = await api.get<LaboratoryDto>(`${LABORATORY_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateLaboratoryDto): Promise<LaboratoryDto> => {
    const response = await api.post<LaboratoryDto>(LABORATORY_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateLaboratoryDto): Promise<LaboratoryDto> => {
    const response = await api.put<LaboratoryDto>(`${LABORATORY_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${LABORATORY_URL}/${id}`);
  },
  getActive: async (): Promise<LaboratoryDto[]> => {
    const response = await api.get<LaboratoryDto[] | { items: LaboratoryDto[] }>(`${LABORATORY_URL}/active`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.items || [];
  },
};

export const indicatorGroupService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<IndicatorGroupDto>> => {
    const response = await api.get<PagedResultDto<IndicatorGroupDto>>(INDICATOR_GROUP_URL, { params: toApiParams(params) });
    return response.data;
  },
  get: async (id: string): Promise<IndicatorGroupDto> => {
    const response = await api.get<IndicatorGroupDto>(`${INDICATOR_GROUP_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateIndicatorGroupDto): Promise<IndicatorGroupDto> => {
    const response = await api.post<IndicatorGroupDto>(INDICATOR_GROUP_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateIndicatorGroupDto): Promise<IndicatorGroupDto> => {
    const response = await api.put<IndicatorGroupDto>(`${INDICATOR_GROUP_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${INDICATOR_GROUP_URL}/${id}`);
  },
  getActive: async (): Promise<IndicatorGroupDto[]> => {
    const response = await api.get<IndicatorGroupDto[]>(`${INDICATOR_GROUP_URL}/active`);
    return response.data || [];
  },
  getWithCount: async (): Promise<IndicatorGroupDto[]> => {
    const response = await api.get<IndicatorGroupDto[]>(`${INDICATOR_GROUP_URL}/with-count`);
    return response.data || [];
  },
  importFromExcel: async (file: File): Promise<ImportIndicatorGroupsResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportIndicatorGroupsResultDto>(`${INDICATOR_GROUP_URL}/import`, formData);
    return response.data;
  },
  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${INDICATOR_GROUP_URL}/template`);
    return response.data;
  },
};

export const indicatorService = {
  getList: async (params: IndicatorFilterDto): Promise<PagedResultDto<IndicatorDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
    if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
    if (params.sorting) apiParams.Sorting = params.sorting;
    if (params.search) apiParams.Search = params.search;
    if (params.indicatorGroupId) apiParams.IndicatorGroupId = params.indicatorGroupId;
    if (params.isActive !== undefined) apiParams.IsActive = params.isActive;
    const response = await api.get<PagedResultDto<IndicatorDto>>(INDICATOR_URL, { params: apiParams });
    return response.data || { items: [], totalCount: 0 };
  },
  get: async (id: string): Promise<IndicatorDto> => {
    const response = await api.get<IndicatorDto>(`${INDICATOR_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateIndicatorDto): Promise<IndicatorDto> => {
    const response = await api.post<IndicatorDto>(INDICATOR_URL, data);
    return response.data;
  },
  createBulk: async (data: CreateBulkIndicatorsDto): Promise<IndicatorDto[]> => {
    const response = await api.post<IndicatorDto[]>(`${INDICATOR_URL}/bulk`, data);
    return response.data;
  },
  update: async (id: string, data: UpdateIndicatorDto): Promise<IndicatorDto> => {
    const response = await api.put<IndicatorDto>(`${INDICATOR_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${INDICATOR_URL}/${id}`);
  },
  toggleActive: async (id: string): Promise<IndicatorDto> => {
    const response = await api.put<IndicatorDto>(`${INDICATOR_URL}/${id}/toggle-active`);
    return response.data;
  },
  getByGroup: async (groupId: string): Promise<IndicatorDto[]> => {
    const response = await api.get<IndicatorDto[]>(`${INDICATOR_URL}/by-group/${groupId}`);
    return response.data;
  },
  getActive: async (): Promise<IndicatorDto[]> => {
    const response = await api.get<IndicatorDto[]>(`${INDICATOR_URL}/get-active`);
    return response.data;
  },
  canDelete: async (id: string): Promise<boolean> => {
    const response = await api.get<boolean>(`${INDICATOR_URL}/can-delete/${id}`);
    return response.data;
  },
  importFromExcel: async (file: File): Promise<ImportIndicatorsResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportIndicatorsResultDto>(`${INDICATOR_URL}/import`, formData);
    return response.data;
  },
  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${INDICATOR_URL}/template`);
    return response.data;
  },
  batchDelete: async (ids: string[]): Promise<BatchOperationResultDto> => {
    const response = await api.post<BatchOperationResultDto>(`${INDICATOR_URL}/batch-delete`, { ids });
    return response.data;
  },
  batchDeactivate: async (ids: string[]): Promise<BatchOperationResultDto> => {
    const response = await api.post<BatchOperationResultDto>(`${INDICATOR_URL}/batch-deactivate`, { ids });
    return response.data;
  },
  batchActivate: async (ids: string[]): Promise<BatchOperationResultDto> => {
    const response = await api.post<BatchOperationResultDto>(`${INDICATOR_URL}/batch-activate`, { ids });
    return response.data;
  },
};

// Batch operation DTOs
export interface BatchOperationResultDto {
  totalCount: number;
  successCount: number;
  failedCount: number;
  errors: BatchOperationErrorDto[];
}

export interface BatchOperationErrorDto {
  id: string;
  name: string;
  errorMessage: string;
}

// Import result DTOs
export interface ImportIndicatorsResultDto {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportIndicatorErrorDto[];
}

export interface ImportIndicatorErrorDto {
  rowNumber: number;
  indicatorName: string;
  errorMessage: string;
}

export interface ImportIndicatorGroupsResultDto {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportIndicatorGroupErrorDto[];
}

export interface ImportIndicatorGroupErrorDto {
  rowNumber: number;
  groupName: string;
  errorMessage: string;
}

// FormTemplate
export interface FormTemplateDto {
  fileName: string;
  name: string;
}

export interface OnlyOfficeEditorConfigDto {
  documentServerUrl: string;
  config: OnlyOfficeConfig;
}

export interface OnlyOfficeConfig {
  document: OnlyOfficeDocument;
  documentType: string;
  editorConfig: OnlyOfficeEditorSettings;
  height: string;
  width: string;
  type: string;
  token?: string;
}

export interface OnlyOfficeDocument {
  fileType: string;
  key: string;
  title: string;
  url: string;
  permissions?: OnlyOfficePermissions;
}

export interface OnlyOfficePermissions {
  comment: boolean;
  copy: boolean;
  download: boolean;
  edit: boolean;
  fillForms: boolean;
  modifyContentControl: boolean;
  modifyFilter: boolean;
  print: boolean;
  review: boolean;
}

export interface OnlyOfficeEditorSettings {
  callbackUrl: string;
  lang: string;
  mode: string;
  user?: OnlyOfficeUser;
  customization: OnlyOfficeCustomization;
}

export interface OnlyOfficeUser {
  id: string;
  name: string;
}

export interface OnlyOfficeCustomization {
  autosave: boolean;
  chat: boolean;
  comments: boolean;
  compactHeader: boolean;
  compactToolbar: boolean;
  feedback: boolean;
  forceSave: boolean;
  help: boolean;
  hideRightMenu: boolean;
  hideRulers: boolean;
  integrationMode: string;
  logo: any;
  macrosMode: string;
  mentionShare: boolean;
  plugins: boolean;
  reviewDisplay: string;
  toolbarHideFileName: boolean;
  toolbarNoTabs: boolean;
  uiicons: boolean;
  unit: string;
  zoom: number;
}

const FORM_TEMPLATE_URL = '/api/v1/form-templates';

export const formTemplateService = {
  getList: async (): Promise<FormTemplateDto[]> => {
    const response = await api.get<FormTemplateDto[]>(FORM_TEMPLATE_URL);
    return response.data || [];
  },
  getDownloadUrl: (fileName: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:44381';
    return `${baseUrl}${FORM_TEMPLATE_URL}/download/${encodeURIComponent(fileName)}`;
  },
  download: async (fileName: string): Promise<Blob> => {
    const response = await api.download(`${FORM_TEMPLATE_URL}/download/${encodeURIComponent(fileName)}`);
    return response.data;
  },
  getEditorConfig: async (fileName: string): Promise<OnlyOfficeEditorConfigDto> => {
    const response = await api.get<OnlyOfficeEditorConfigDto>(`${FORM_TEMPLATE_URL}/editor-config/${encodeURIComponent(fileName)}`);
    return response.data;
  },
};
