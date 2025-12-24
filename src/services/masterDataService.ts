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
  sortOrder: number;
  indicatorCount: number;
  creationTime: string;
}

export interface CreateUpdateIndicatorGroupDto {
  name: string;
  isActive: boolean;
  sortOrder?: number;
}

// Indicator
export interface IndicatorDto {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  isActive: boolean;
  indicatorGroupId: string;
  indicatorGroupName: string;
  sortOrder: number;
  canDelete: boolean;
  creationTime: string;
}

export interface CreateIndicatorDto {
  name: string;
  unitPrice: number;
  isActive: boolean;
  indicatorGroupId: string;
  sortOrder?: number;
}

export interface UpdateIndicatorDto {
  name: string;
  unitPrice: number;
  isActive: boolean;
  indicatorGroupId: string;
  sortOrder?: number;
}

export interface CreateBulkIndicatorsDto {
  indicatorGroupId: string;
  indicators: { name: string; unitPrice: number }[];
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
    const response = await api.get<IndicatorDto[]>(`${INDICATOR_URL}/active`);
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
};

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
