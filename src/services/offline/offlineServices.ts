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
import { userService, UserLookupDto } from '../userService';
import { organizationService } from '../organizationService';
import type { OrganizationDto } from '../../types/organization';
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
  sampleConditionService,
  sampleTypeCategoryService,
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
  PagedResultDto,
  TestMethodWithIndicatorsDto,
  SpecimenTypeWithIndicatorsDto,
  SampleConditionDto,
  SampleTypeCategoryDto,
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

// ============ Offline-Aware getActive Methods ============

/**
 * Get active indicator groups with offline support
 * Caches results and returns cached data when offline
 */
export async function getActiveIndicatorGroupsOffline(): Promise<IndicatorGroupDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');

  if (navigator.onLine) {
    try {
      const data = await indicatorGroupService.getActive();
      // Cache each item
      for (const item of data) {
        await cacheEntity('IndicatorGroup', item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('IndicatorGroup');
        if (cachedEntities.length > 0) {
          console.log(`API returned empty, using ${cachedEntities.length} cached indicator groups`);
          return cachedEntities.map(e => e.data as IndicatorGroupDto);
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getActive failed for IndicatorGroup, returning cached data:', error);
    }
  }

  // Return cached data
  const cachedEntities = await getCachedEntitiesByType('IndicatorGroup');
  console.log(`Returning ${cachedEntities.length} cached indicator groups`);
  return cachedEntities.map(e => e.data as IndicatorGroupDto);
}

/**
 * Get active indicators with offline support
 * Caches results and returns cached data when offline
 */
export async function getActiveIndicatorsOffline(): Promise<IndicatorDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');

  if (navigator.onLine) {
    try {
      const data = await indicatorService.getActive();
      // Cache each item
      for (const item of data) {
        await cacheEntity('StandardIndicator', item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('StandardIndicator');
        if (cachedEntities.length > 0) {
          console.log(`API returned empty, using ${cachedEntities.length} cached indicators`);
          return cachedEntities.map(e => e.data as IndicatorDto);
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getActive failed for Indicator, returning cached data:', error);
    }
  }

  // Return cached data
  const cachedEntities = await getCachedEntitiesByType('StandardIndicator');
  console.log(`Returning ${cachedEntities.length} cached indicators`);
  return cachedEntities.map(e => e.data as IndicatorDto);
}

/**
 * Get active storage locations with offline support
 */
export async function getActiveStorageLocationsOffline(): Promise<PagedResultDto<StorageLocationDto>> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');
  const CACHE_KEY_PREFIX = 'StorageLocation:';

  if (navigator.onLine) {
    try {
      const data = await storageLocationService.getActive();
      // Cache each item with StorageLocation prefix to distinguish from actual receipts
      for (const item of data.items) {
        await cacheEntity('Receipt', CACHE_KEY_PREFIX + item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.items.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('Receipt');
        const cachedItems = cachedEntities
          .filter(e => (e.id as string).startsWith('Receipt:' + CACHE_KEY_PREFIX))
          .map(e => e.data as StorageLocationDto);
        if (cachedItems.length > 0) {
          console.log(`API returned empty, using ${cachedItems.length} cached storage locations`);
          return { items: cachedItems, totalCount: cachedItems.length };
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getActive failed for StorageLocation, returning cached data:', error);
    }
  }

  // Return cached data - filter by StorageLocation prefix
  // Note: cache key format is 'Receipt:StorageLocation:id'
  const cachedEntities = await getCachedEntitiesByType('Receipt');
  const items = cachedEntities
    .filter(e => (e.id as string).startsWith('Receipt:' + CACHE_KEY_PREFIX))
    .map(e => e.data as StorageLocationDto);
  console.log(`Returning ${items.length} cached storage locations`);
  return { items, totalCount: items.length };
}

/**
 * Get active laboratories with offline support
 */
export async function getActiveLaboratoriesOffline(): Promise<LaboratoryDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');

  if (navigator.onLine) {
    try {
      const data = await laboratoryService.getActive();
      // Cache each item
      for (const item of data) {
        await cacheEntity('Laboratory', item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('Laboratory');
        if (cachedEntities.length > 0) {
          console.log(`API returned empty, using ${cachedEntities.length} cached laboratories`);
          return cachedEntities.map(e => e.data as LaboratoryDto);
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getActive failed for Laboratory, returning cached data:', error);
    }
  }

  // Return cached data
  const cachedEntities = await getCachedEntitiesByType('Laboratory');
  console.log(`Returning ${cachedEntities.length} cached laboratories`);
  return cachedEntities.map(e => e.data as LaboratoryDto);
}

/**
 * Get active specimen types with offline support
 */
export async function getActiveSpecimenTypesOffline(): Promise<PagedResultDto<SpecimenTypeDto>> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');

  if (navigator.onLine) {
    try {
      const data = await specimenTypeService.getActive();
      // Cache each item
      for (const item of data.items) {
        await cacheEntity('SpecimenType', item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.items.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('SpecimenType');
        const cachedItems = cachedEntities
          .filter(e => !(e.id as string).startsWith('SpecimenType:WithIndicators:'))
          .map(e => e.data as SpecimenTypeDto);
        if (cachedItems.length > 0) {
          console.log(`API returned empty, using ${cachedItems.length} cached specimen types`);
          return { items: cachedItems, totalCount: cachedItems.length };
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getActive failed for SpecimenType, returning cached data:', error);
    }
  }

  // Return cached data - filter out items with special prefixes
  // Note: cache key format is 'SpecimenType:id' or 'SpecimenType:WithIndicators:id'
  const cachedEntities = await getCachedEntitiesByType('SpecimenType');
  const items = cachedEntities
    .filter(e => !(e.id as string).startsWith('SpecimenType:WithIndicators:'))
    .map(e => e.data as SpecimenTypeDto);
  console.log(`Returning ${items.length} cached specimen types`);
  return { items, totalCount: items.length };
}

/**
 * Get test methods with indicators (offline support)
 */
export async function getTestMethodsWithIndicatorsOffline(): Promise<TestMethodWithIndicatorsDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');

  if (navigator.onLine) {
    try {
      const data = await testMethodService.getWithIndicators();
      // Cache each item
      for (const item of data) {
        await cacheEntity('TestMethod', item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('TestMethod');
        if (cachedEntities.length > 0) {
          console.log(`API returned empty, using ${cachedEntities.length} cached test methods`);
          return cachedEntities.map(e => e.data as TestMethodWithIndicatorsDto);
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getWithIndicators failed for TestMethod, returning cached data:', error);
    }
  }

  // Return cached data
  const cachedEntities = await getCachedEntitiesByType('TestMethod');
  console.log(`Returning ${cachedEntities.length} cached test methods`);
  return cachedEntities.map(e => e.data as TestMethodWithIndicatorsDto);
}

/**
 * Get specimen types with indicators (offline support)
 */
export async function getSpecimenTypesWithIndicatorsOffline(): Promise<SpecimenTypeWithIndicatorsDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');
  const CACHE_KEY_PREFIX = 'WithIndicators:';

  if (navigator.onLine) {
    try {
      const data = await specimenTypeService.getWithIndicators();
      // Cache each item with a special key prefix
      for (const item of data) {
        await cacheEntity('SpecimenType', CACHE_KEY_PREFIX + item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('SpecimenType');
        const cachedItems = cachedEntities
          .filter(e => (e.id as string).startsWith('SpecimenType:' + CACHE_KEY_PREFIX))
          .map(e => e.data as SpecimenTypeWithIndicatorsDto);
        if (cachedItems.length > 0) {
          console.log(`API returned empty, using ${cachedItems.length} cached specimen types with indicators`);
          return cachedItems;
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getWithIndicators failed for SpecimenType, returning cached data:', error);
    }
  }

  // Return cached data
  const cachedEntities = await getCachedEntitiesByType('SpecimenType');
  const items = cachedEntities
    .filter(e => (e.id as string).startsWith('SpecimenType:' + CACHE_KEY_PREFIX))
    .map(e => e.data as SpecimenTypeWithIndicatorsDto);
  console.log(`Returning ${items.length} cached specimen types with indicators`);
  return items;
}

/**
 * Get active sample conditions (offline support)
 */
export async function getActiveSampleConditionsOffline(): Promise<SampleConditionDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');
  const CACHE_KEY_PREFIX = 'SampleCondition:';

  if (navigator.onLine) {
    try {
      const data = await sampleConditionService.getActive();
      // Cache each item with a prefix
      for (const item of data) {
        await cacheEntity('Testing', CACHE_KEY_PREFIX + item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('Testing');
        const cachedItems = cachedEntities
          .filter(e => (e.id as string).startsWith('Testing:' + CACHE_KEY_PREFIX))
          .map(e => e.data as SampleConditionDto);
        if (cachedItems.length > 0) {
          console.log(`API returned empty, using ${cachedItems.length} cached sample conditions`);
          return cachedItems;
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getActive failed for SampleCondition, returning cached data:', error);
    }
  }

  // Return cached data
  // Note: cache key format is 'Testing:SampleCondition:id'
  const cachedEntities = await getCachedEntitiesByType('Testing');
  const items = cachedEntities
    .filter(e => (e.id as string).startsWith('Testing:' + CACHE_KEY_PREFIX))
    .map(e => e.data as SampleConditionDto);
  console.log(`Returning ${items.length} cached sample conditions`);
  return items;
}

/**
 * Get active sample type categories (offline support)
 */
export async function getActiveSampleTypeCategoriesOffline(): Promise<SampleTypeCategoryDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');
  const CACHE_KEY_PREFIX = 'SampleTypeCategory:';

  if (navigator.onLine) {
    try {
      const data = await sampleTypeCategoryService.getActive();
      // Cache each item with a prefix
      for (const item of data) {
        await cacheEntity('Testing', CACHE_KEY_PREFIX + item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('Testing');
        const cachedItems = cachedEntities
          .filter(e => (e.id as string).startsWith('Testing:' + CACHE_KEY_PREFIX))
          .map(e => e.data as SampleTypeCategoryDto);
        if (cachedItems.length > 0) {
          console.log(`API returned empty, using ${cachedItems.length} cached sample type categories`);
          return cachedItems;
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getActive failed for SampleTypeCategory, returning cached data:', error);
    }
  }

  // Return cached data
  // Note: cache key format is 'Testing:SampleTypeCategory:id'
  const cachedEntities = await getCachedEntitiesByType('Testing');
  const items = cachedEntities
    .filter(e => (e.id as string).startsWith('Testing:' + CACHE_KEY_PREFIX))
    .map(e => e.data as SampleTypeCategoryDto);
  console.log(`Returning ${items.length} cached sample type categories`);
  return items;
}

/**
 * Get user lookup with offline support
 */
export async function getUserLookupOffline(): Promise<UserLookupDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');
  const CACHE_KEY_PREFIX = 'User:';

  if (navigator.onLine) {
    try {
      const data = await userService.getLookup();
      // Cache each item with a prefix
      for (const item of data) {
        await cacheEntity('Employee', CACHE_KEY_PREFIX + item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('Employee');
        const cachedItems = cachedEntities
          .filter(e => (e.id as string).startsWith('Employee:' + CACHE_KEY_PREFIX))
          .map(e => e.data as UserLookupDto);
        if (cachedItems.length > 0) {
          console.log(`API returned empty, using ${cachedItems.length} cached users`);
          return cachedItems;
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getLookup failed for User, returning cached data:', error);
    }
  }

  // Return cached data
  // Note: cache key format is 'Employee:User:id'
  const cachedEntities = await getCachedEntitiesByType('Employee');
  const items = cachedEntities
    .filter(e => (e.id as string).startsWith('Employee:' + CACHE_KEY_PREFIX))
    .map(e => e.data as UserLookupDto);
  console.log(`Returning ${items.length} cached users`);
  return items;
}

/**
 * Get active organizations with offline support
 */
export async function getActiveOrganizationsOffline(): Promise<OrganizationDto[]> {
  const { cacheEntity, getCachedEntitiesByType } = await import('./db');
  const CACHE_KEY_PREFIX = 'Organization:';

  if (navigator.onLine) {
    try {
      const data = await organizationService.getAllActive();
      // Cache each item with a prefix
      for (const item of data) {
        await cacheEntity('Subcontractor', CACHE_KEY_PREFIX + item.id, item, false);
      }
      // If API returns empty but we have cache, use cache instead
      if (data.length === 0) {
        const cachedEntities = await getCachedEntitiesByType('Subcontractor');
        const cachedItems = cachedEntities
          .filter(e => (e.id as string).startsWith('Subcontractor:' + CACHE_KEY_PREFIX))
          .map(e => e.data as OrganizationDto);
        if (cachedItems.length > 0) {
          console.log(`API returned empty, using ${cachedItems.length} cached organizations`);
          return cachedItems;
        }
      }
      return data;
    } catch (error) {
      console.warn('Online getAllActive failed for Organization, returning cached data:', error);
    }
  }

  // Return cached data
  // Note: cache key format is 'Subcontractor:Organization:id'
  const cachedEntities = await getCachedEntitiesByType('Subcontractor');
  const items = cachedEntities
    .filter(e => (e.id as string).startsWith('Subcontractor:' + CACHE_KEY_PREFIX))
    .map(e => e.data as OrganizationDto);
  console.log(`Returning ${items.length} cached organizations`);
  return items;
}

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
