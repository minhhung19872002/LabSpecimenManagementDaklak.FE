/**
 * Offline-enabled services
 *
 * This module exports offline-wrapped versions of all CRUD services.
 * These services automatically:
 * - Cache responses for offline access
 * - Queue operations when offline
 * - Sync when back online using "last write wins" strategy
 */

import { createOfflineService, BaseCrudService } from './createOfflineService';

// Import all services
import { quotationService } from '../quotationService';
import { ncrService } from '../ncrService';
import { specimenService, SpecimenListParams } from '../specimenService';
import { subcontractorService } from '../subcontractorService';
import { employeeService } from '../employeeService';
import { laboratoryTaskService } from '../laboratoryTaskService';
import {
  specimenTypeService,
  testMethodService,
  laboratoryService,
  indicatorService,
  standardService,
  departmentService,
  customerService,
  storageLocationService,
  indicatorGroupService,
} from '../masterDataService';

// Import types
import type {
  QuotationListDto,
  CreateUpdateQuotationDto,
  GetQuotationListInput,
} from '../../types/quotation';
import type {
  NCRDto,
  CreateNCRDto,
  UpdateNCRDto,
  PagedAndSortedResultRequestDto as NCRListParams,
} from '../ncrService';
import type {
  SpecimenDto,
  CreateSpecimenDto,
  UpdateSpecimenDto,
} from '../../types/specimen';
import type {
  SubcontractorDto,
  CreateUpdateSubcontractorDto,
  GetSubcontractorListInput,
} from '../subcontractorService';
import type {
  EmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../employeeService';
import type {
  LaboratoryTaskDto,
  UpdateLaboratoryTaskDto,
  GetLaboratoryTaskListDto,
} from '../../types/laboratoryTask';
import type {
  SpecimenTypeDto,
  CreateUpdateSpecimenTypeDto,
  TestMethodDto,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  LaboratoryDto,
  CreateUpdateLaboratoryDto,
  IndicatorDto,
  CreateIndicatorDto,
  UpdateIndicatorDto,
  IndicatorFilterDto,
  StandardDto,
  CreateStandardDto,
  UpdateStandardDto,
  DepartmentDto,
  CreateUpdateDepartmentDto,
  CustomerDto,
  CreateUpdateCustomerDto,
  StorageLocationDto,
  CreateUpdateStorageLocationDto,
  IndicatorGroupDto,
  CreateUpdateIndicatorGroupDto,
  PagedAndSortedResultRequestDto,
} from '../masterDataService';

// ============ Quotation Service ============
const quotationBaseService: BaseCrudService<QuotationListDto, CreateUpdateQuotationDto, CreateUpdateQuotationDto, GetQuotationListInput> = {
  getList: async (params) => quotationService.getList(params),
  get: async (id) => quotationService.get(id) as unknown as QuotationListDto,
  create: async (data) => quotationService.create(data) as unknown as QuotationListDto,
  update: async (id, data) => quotationService.update(id, data) as unknown as QuotationListDto,
  delete: async (id) => quotationService.delete(id),
};

export const offlineQuotationService = createOfflineService<
  QuotationListDto,
  CreateUpdateQuotationDto,
  CreateUpdateQuotationDto,
  GetQuotationListInput
>('Quotation', quotationBaseService);

// ============ NCR Service ============
const ncrBaseService: BaseCrudService<NCRDto, CreateNCRDto, UpdateNCRDto, NCRListParams> = {
  getList: async (params) => ncrService.getList(params),
  get: async (id) => ncrService.get(id),
  create: async (data) => ncrService.create(data),
  update: async (id, data) => ncrService.update(id, data),
  delete: async (id) => ncrService.delete(id),
};

export const offlineNCRService = createOfflineService<
  NCRDto,
  CreateNCRDto,
  UpdateNCRDto,
  NCRListParams
>('NCR', ncrBaseService);

// ============ Specimen Service ============
const specimenBaseService: BaseCrudService<SpecimenDto, CreateSpecimenDto, UpdateSpecimenDto, SpecimenListParams> = {
  getList: async (params) => specimenService.getList(params),
  get: async (id) => specimenService.get(id),
  create: async (data) => specimenService.create(data),
  update: async (id, data) => specimenService.update(id, data),
  delete: async (id) => specimenService.delete(id),
};

export const offlineSpecimenService = createOfflineService<
  SpecimenDto,
  CreateSpecimenDto,
  UpdateSpecimenDto,
  SpecimenListParams
>('Specimen', specimenBaseService);

// ============ Subcontractor Service ============
const subcontractorBaseService: BaseCrudService<SubcontractorDto, CreateUpdateSubcontractorDto, CreateUpdateSubcontractorDto, GetSubcontractorListInput> = {
  getList: async (params) => subcontractorService.getList(params),
  get: async (id) => subcontractorService.get(id),
  create: async (data) => subcontractorService.create(data),
  update: async (id, data) => subcontractorService.update(id, data),
  delete: async (id) => subcontractorService.delete(id),
};

export const offlineSubcontractorService = createOfflineService<
  SubcontractorDto,
  CreateUpdateSubcontractorDto,
  CreateUpdateSubcontractorDto,
  GetSubcontractorListInput
>('Subcontractor', subcontractorBaseService);

// ============ Employee Service ============
interface EmployeeListParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  filter?: string;
  departmentId?: string;
  role?: string;
  isActive?: boolean;
}

const employeeBaseService: BaseCrudService<EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto, EmployeeListParams> = {
  getList: async (params) => employeeService.getList(params),
  get: async (id) => employeeService.get(id),
  create: async (data) => employeeService.create(data),
  update: async (id, data) => employeeService.update(id, data),
  delete: async (id) => employeeService.delete(id),
};

export const offlineEmployeeService = createOfflineService<
  EmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeListParams
>('Employee', employeeBaseService);

// ============ Laboratory Task Service ============
// Note: LaboratoryTask doesn't have a create method in the standard sense,
// tasks are created by the system. We only support get/update/delete.
const laboratoryTaskBaseService: BaseCrudService<LaboratoryTaskDto, UpdateLaboratoryTaskDto, UpdateLaboratoryTaskDto, GetLaboratoryTaskListDto> = {
  getList: async (params) => laboratoryTaskService.getList(params),
  get: async (id) => laboratoryTaskService.get(id),
  create: async (_data) => { throw new Error('LaboratoryTask cannot be created directly'); },
  update: async (id, data) => laboratoryTaskService.update(id, data),
  delete: async (id) => laboratoryTaskService.delete(id),
};

export const offlineLaboratoryTaskService = createOfflineService<
  LaboratoryTaskDto,
  UpdateLaboratoryTaskDto,
  UpdateLaboratoryTaskDto,
  GetLaboratoryTaskListDto
>('LaboratoryTask', laboratoryTaskBaseService);

// ============ Master Data Services ============

// Specimen Type Service
const specimenTypeBaseService: BaseCrudService<SpecimenTypeDto, CreateUpdateSpecimenTypeDto, CreateUpdateSpecimenTypeDto, PagedAndSortedResultRequestDto> = {
  getList: async (params) => specimenTypeService.getList(params),
  get: async (id) => specimenTypeService.get(id),
  create: async (data) => specimenTypeService.create(data),
  update: async (id, data) => specimenTypeService.update(id, data),
  delete: async (id) => specimenTypeService.delete(id),
};

export const offlineSpecimenTypeService = createOfflineService<
  SpecimenTypeDto,
  CreateUpdateSpecimenTypeDto,
  CreateUpdateSpecimenTypeDto,
  PagedAndSortedResultRequestDto
>('SpecimenType', specimenTypeBaseService);

// Test Method Service
const testMethodBaseService: BaseCrudService<TestMethodDto, CreateTestMethodDto, UpdateTestMethodDto, PagedAndSortedResultRequestDto> = {
  getList: async (params) => testMethodService.getList(params),
  get: async (id) => testMethodService.get(id),
  create: async (data) => testMethodService.create(data),
  update: async (id, data) => testMethodService.update(id, data),
  delete: async (id) => testMethodService.delete(id),
};

export const offlineTestMethodService = createOfflineService<
  TestMethodDto,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  PagedAndSortedResultRequestDto
>('TestMethod', testMethodBaseService);

// Laboratory Service
const laboratoryBaseService: BaseCrudService<LaboratoryDto, CreateUpdateLaboratoryDto, CreateUpdateLaboratoryDto, PagedAndSortedResultRequestDto> = {
  getList: async (_params) => {
    const items = await laboratoryService.getAll();
    return { items, totalCount: items.length };
  },
  get: async (id) => laboratoryService.get(id),
  create: async (data) => laboratoryService.create(data),
  update: async (id, data) => laboratoryService.update(id, data),
  delete: async (id) => laboratoryService.delete(id),
};

export const offlineLaboratoryService = createOfflineService<
  LaboratoryDto,
  CreateUpdateLaboratoryDto,
  CreateUpdateLaboratoryDto,
  PagedAndSortedResultRequestDto
>('Laboratory', laboratoryBaseService);

// Standard Indicator Service (using Standard as entity type since StandardIndicator is part of Standard)
const standardBaseService: BaseCrudService<StandardDto, CreateStandardDto, UpdateStandardDto, PagedAndSortedResultRequestDto> = {
  getList: async (params) => standardService.getList(params),
  get: async (id) => standardService.get(id),
  create: async (data) => standardService.create(data),
  update: async (id, data) => standardService.update(id, data),
  delete: async (id) => standardService.delete(id),
};

export const offlineStandardService = createOfflineService<
  StandardDto,
  CreateStandardDto,
  UpdateStandardDto,
  PagedAndSortedResultRequestDto
>('StandardIndicator', standardBaseService);

// Department Service
const departmentBaseService: BaseCrudService<DepartmentDto, CreateUpdateDepartmentDto, CreateUpdateDepartmentDto, PagedAndSortedResultRequestDto> = {
  getList: async (params) => departmentService.getList(params),
  get: async (id) => departmentService.get(id),
  create: async (data) => departmentService.create(data),
  update: async (id, data) => departmentService.update(id, data),
  delete: async (id) => departmentService.delete(id),
};

export const offlineDepartmentService = createOfflineService<
  DepartmentDto,
  CreateUpdateDepartmentDto,
  CreateUpdateDepartmentDto,
  PagedAndSortedResultRequestDto
>('Testing', departmentBaseService); // Using Testing as a placeholder entity type

// Customer Service
const customerBaseService: BaseCrudService<CustomerDto, CreateUpdateCustomerDto, CreateUpdateCustomerDto, PagedAndSortedResultRequestDto> = {
  getList: async (params) => customerService.getList(params),
  get: async (id) => customerService.get(id),
  create: async (data) => customerService.create(data),
  update: async (id, data) => customerService.update(id, data),
  delete: async (id) => customerService.delete(id),
};

export const offlineCustomerService = createOfflineService<
  CustomerDto,
  CreateUpdateCustomerDto,
  CreateUpdateCustomerDto,
  PagedAndSortedResultRequestDto
>('QualityManagement', customerBaseService); // Using QualityManagement as a placeholder entity type

// Storage Location Service
const storageLocationBaseService: BaseCrudService<StorageLocationDto, CreateUpdateStorageLocationDto, CreateUpdateStorageLocationDto, PagedAndSortedResultRequestDto> = {
  getList: async (params) => storageLocationService.getList(params),
  get: async (id) => storageLocationService.get(id),
  create: async (data) => storageLocationService.create(data),
  update: async (id, data) => storageLocationService.update(id, data),
  delete: async (id) => storageLocationService.delete(id),
};

export const offlineStorageLocationService = createOfflineService<
  StorageLocationDto,
  CreateUpdateStorageLocationDto,
  CreateUpdateStorageLocationDto,
  PagedAndSortedResultRequestDto
>('Receipt', storageLocationBaseService); // Using Receipt as a placeholder entity type

// Indicator Group Service
const indicatorGroupBaseService: BaseCrudService<IndicatorGroupDto, CreateUpdateIndicatorGroupDto, CreateUpdateIndicatorGroupDto, PagedAndSortedResultRequestDto> = {
  getList: async (params) => indicatorGroupService.getList(params),
  get: async (id) => indicatorGroupService.get(id),
  create: async (data) => indicatorGroupService.create(data),
  update: async (id, data) => indicatorGroupService.update(id, data),
  delete: async (id) => indicatorGroupService.delete(id),
};

export const offlineIndicatorGroupService = createOfflineService<
  IndicatorGroupDto,
  CreateUpdateIndicatorGroupDto,
  CreateUpdateIndicatorGroupDto,
  PagedAndSortedResultRequestDto
>('Testing', indicatorGroupBaseService); // Using Testing as a placeholder entity type

// Indicator Service
const indicatorBaseService: BaseCrudService<IndicatorDto, CreateIndicatorDto, UpdateIndicatorDto, IndicatorFilterDto> = {
  getList: async (params) => indicatorService.getList(params),
  get: async (id) => indicatorService.get(id),
  create: async (data) => indicatorService.create(data),
  update: async (id, data) => indicatorService.update(id, data),
  delete: async (id) => indicatorService.delete(id),
};

export const offlineIndicatorService = createOfflineService<
  IndicatorDto,
  CreateIndicatorDto,
  UpdateIndicatorDto,
  IndicatorFilterDto
>('StandardIndicator', indicatorBaseService);

// ============ Utility Functions ============

/**
 * Initialize all offline services
 * Call this on app startup
 */
export async function initializeOfflineServices(): Promise<void> {
  const { syncManager } = await import('./syncManager');
  await syncManager.init();
}

/**
 * Get pending sync count across all services
 */
export async function getTotalPendingSyncCount(): Promise<number> {
  const { getPendingSyncCount } = await import('./db');
  return getPendingSyncCount();
}

/**
 * Force sync all pending items
 */
export async function forceSyncAll(): Promise<void> {
  const { syncManager } = await import('./syncManager');
  await syncManager.sync();
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Subscribe to online status changes
 */
export function onStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handler = () => callback(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}
