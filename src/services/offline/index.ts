export * from './db';
export { syncManager, default as SyncManager } from './syncManager';
export type {
  GenericSyncItemDto,
  GenericSyncBatchRequestDto,
  GenericSyncResultDto,
  GenericSyncBatchResponseDto,
  SyncTestRequestDto,
  SyncBatchRequestDto,
  SyncResultDto,
  SyncBatchResponseDto,
} from './syncManager';

export {
  createOfflineService,
  wrapServiceWithOffline,
  default as createOfflineServiceDefault,
} from './createOfflineService';
export type {
  BaseCrudService,
  OfflineEnabledService,
  OfflineServiceOptions,
} from './createOfflineService';

// Export all offline-enabled services
export {
  offlineQuotationService,
  offlineNCRService,
  offlineSpecimenService,
  offlineSubcontractorService,
  offlineEmployeeService,
  offlineLaboratoryTaskService,
  offlineSpecimenTypeService,
  offlineTestMethodService,
  offlineLaboratoryService,
  offlineStandardService,
  offlineDepartmentService,
  offlineCustomerService,
  offlineStorageLocationService,
  offlineIndicatorGroupService,
  offlineIndicatorService,
  // Offline-aware getActive methods
  getActiveIndicatorGroupsOffline,
  getActiveIndicatorsOffline,
  getActiveStorageLocationsOffline,
  getActiveLaboratoriesOffline,
  getActiveSpecimenTypesOffline,
  getTestMethodsWithIndicatorsOffline,
  getSpecimenTypesWithIndicatorsOffline,
  getActiveSampleConditionsOffline,
  getActiveSampleTypeCategoriesOffline,
  // Utility functions
  initializeOfflineServices,
  getTotalPendingSyncCount,
  forceSyncAll,
  isOnline,
  onStatusChange,
} from './offlineServices';

// Export prefetch service
export {
  prefetchMasterData,
  forcePrefetch,
  hasPrefetchedData,
  getLastPrefetchTime,
} from './prefetchService';
