import { syncManager } from './syncManager';
import {
  SyncEntityType,
  cacheEntity,
  getCachedEntity,
  getCachedEntitiesByType,
  removeCachedEntity,
  getPendingSyncCountByType,
} from './db';

// UUID generator - tries crypto.randomUUID() first, falls back to crypto.getRandomValues()
function generateUUID(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

export interface BaseCrudService<TDto, TCreateDto, TUpdateDto = TCreateDto, TListParams = Record<string, unknown>> {
  getList: (params: TListParams) => Promise<{ items: TDto[]; totalCount: number }>;
  get: (id: string) => Promise<TDto>;
  create: (data: TCreateDto) => Promise<TDto>;
  update: (id: string, data: TUpdateDto) => Promise<TDto>;
  delete: (id: string) => Promise<void>;
}

export interface OfflineEnabledService<TDto, TCreateDto, TUpdateDto = TCreateDto, TListParams = Record<string, unknown>>
  extends BaseCrudService<TDto, TCreateDto, TUpdateDto, TListParams> {
  isOnline: () => boolean;
  getPendingSyncCount: () => Promise<number>;
  forceSync: () => Promise<void>;
  getCachedList: () => Promise<TDto[]>;
  getCached: (id: string) => Promise<TDto | undefined>;
}

export interface OfflineServiceOptions {
  cacheResponses?: boolean;
  autoSync?: boolean;
  getIdFromItem?: (item: unknown) => string;
  getIdFromCreateResponse?: (response: unknown) => string;
}

const defaultOptions: OfflineServiceOptions = {
  cacheResponses: true,
  autoSync: true,
  getIdFromItem: (item: unknown) => (item as { id: string }).id,
  getIdFromCreateResponse: (response: unknown) => (response as { id: string }).id,
};


/**
 * Check if an error is a true network error (no response from server).
 * - Network error: error.response is undefined (DNS failure, connection refused, no internet)
 * - Server error: error.response exists with status code (400, 401, 500, etc.) — server is reachable
 */
export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    // Axios error with a server response = server is reachable, NOT a network error
    return (error as any).response == null;
  }
  // Non-axios errors or errors without response = treat as network error
  return true;
}

export function createOfflineService<
  TDto,
  TCreateDto,
  TUpdateDto = TCreateDto,
  TListParams = Record<string, unknown>
>(
  entityType: SyncEntityType,
  baseService: BaseCrudService<TDto, TCreateDto, TUpdateDto, TListParams>,
  options: OfflineServiceOptions = {}
): OfflineEnabledService<TDto, TCreateDto, TUpdateDto, TListParams> {
  const opts = { ...defaultOptions, ...options };

  return {
    async getList(params: TListParams): Promise<{ items: TDto[]; totalCount: number }> {
      if (syncManager.getOnlineStatus()) {
        try {
          const result = await baseService.getList(params);
          if (opts.cacheResponses) {
            for (const item of result.items) {
              const id = opts.getIdFromItem!(item);
              await cacheEntity(entityType, id, item, false);
            }
          }
          return result;
        } catch (error) {
          if (!isNetworkError(error)) throw error;
          console.warn('Network error in getList, returning cached data:', error);
        }
      }
      const cachedEntities = await getCachedEntitiesByType(entityType);
      const items = cachedEntities.map(e => e.data as TDto);
      return { items, totalCount: items.length };
    },

    async get(id: string): Promise<TDto> {
      if (syncManager.getOnlineStatus()) {
        try {
          const result = await baseService.get(id);
          if (opts.cacheResponses) {
            await cacheEntity(entityType, id, result, false);
          }
          return result;
        } catch (error) {
          if (!isNetworkError(error)) throw error;
          console.warn('Network error in get, returning cached data:', error);
        }
      }
      const cached = await getCachedEntity(entityType, id);
      if (cached) {
        return cached.data as TDto;
      }
      throw new Error('Item not found in cache and currently offline');
    },

    async create(data: TCreateDto): Promise<TDto> {
      if (syncManager.getOnlineStatus()) {
        try {
          const result = await baseService.create(data);
          if (opts.cacheResponses) {
            const id = opts.getIdFromCreateResponse!(result);
            await cacheEntity(entityType, id, result, false);
          }
          return result;
        } catch (error) {
          if (!isNetworkError(error)) throw error;
          console.warn('Network error in create, queueing for sync:', error);
        }
      }
      const tempId = generateUUID();
      await syncManager.queueEntity(entityType, data, 'create');
      const tempRecord = { ...data, id: tempId, _isOffline: true } as unknown as TDto;
      await cacheEntity(entityType, tempId, tempRecord, true);
      return tempRecord;
    },

    async update(id: string, data: TUpdateDto): Promise<TDto> {
      if (syncManager.getOnlineStatus()) {
        try {
          const result = await baseService.update(id, data);
          if (opts.cacheResponses) {
            await cacheEntity(entityType, id, result, false);
          }
          return result;
        } catch (error) {
          if (!isNetworkError(error)) throw error;
          console.warn('Network error in update, queueing for sync:', error);
        }
      }
      await syncManager.queueEntity(entityType, data, 'update', id);
      const updatedRecord = { ...data, id, _isOffline: true } as unknown as TDto;
      await cacheEntity(entityType, id, updatedRecord, true);
      return updatedRecord;
    },

    async delete(id: string): Promise<void> {
      if (syncManager.getOnlineStatus()) {
        try {
          await baseService.delete(id);
          await removeCachedEntity(entityType, id);
          return;
        } catch (error) {
          if (!isNetworkError(error)) throw error;
          console.warn('Network error in delete, queueing for sync:', error);
        }
      }
      await syncManager.queueEntity(entityType, { id }, 'delete', id);
      await removeCachedEntity(entityType, id);
    },

    isOnline(): boolean {
      return syncManager.getOnlineStatus();
    },

    async getPendingSyncCount(): Promise<number> {
      return getPendingSyncCountByType(entityType);
    },

    async forceSync(): Promise<void> {
      await syncManager.sync();
    },

    async getCachedList(): Promise<TDto[]> {
      const cachedEntities = await getCachedEntitiesByType(entityType);
      return cachedEntities.map(e => e.data as TDto);
    },

    async getCached(id: string): Promise<TDto | undefined> {
      const cached = await getCachedEntity(entityType, id);
      return cached?.data as TDto | undefined;
    },
  };
}


export function wrapServiceWithOffline<
  TService extends BaseCrudService<TDto, TCreateDto, TUpdateDto, TListParams>,
  TDto,
  TCreateDto,
  TUpdateDto = TCreateDto,
  TListParams = Record<string, unknown>
>(
  entityType: SyncEntityType,
  service: TService,
  options: OfflineServiceOptions = {}
): TService & OfflineEnabledService<TDto, TCreateDto, TUpdateDto, TListParams> {
  const offlineService = createOfflineService<TDto, TCreateDto, TUpdateDto, TListParams>(
    entityType,
    service,
    options
  );
  return {
    ...service,
    ...offlineService,
  };
}

export default createOfflineService;
