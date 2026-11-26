import { syncManager } from './syncManager';
import {
  SyncEntityType,
  SyncQueueItem,
  SyncOperationType,
  cacheEntity,
  getCachedEntity,
  getCachedEntitiesByType,
  removeCachedEntity,
  getPendingSyncCountByType,
  getSyncedServerId,
  getUnsyncedItemsByType,
} from './db';
import { isServerUnavailableStatus } from './serverAvailability';

export interface BaseCrudService<TDto, TCreateDto, TUpdateDto = TCreateDto, TListParams = Record<string, unknown>> {
  getList: (params: TListParams) => Promise<{ items: TDto[]; totalCount: number }>;
  get: (id: string) => Promise<TDto>;
  create: (data: TCreateDto) => Promise<TDto>;
  update: (id: string, data: TUpdateDto) => Promise<TDto>;
  delete: (id: string) => Promise<void>;
}

export type OfflineSyncStatus = 'pending' | 'syncing' | 'failed';

/** Gắn vào bản ghi có thay đổi offline chưa lên server, để trang hiện tag "Chờ đồng bộ" / "Lỗi đồng bộ" */
export interface OfflineSyncInfo {
  _isOffline?: boolean;
  /** Bản ghi tạo offline chưa có trên server (id là id tạm) → các thao tác gọi API theo id phải chờ đồng bộ */
  _isUnsyncedCreate?: boolean;
  syncStatus?: OfflineSyncStatus;
  syncError?: string;
}

export interface OfflineDeleteResult {
  /** true = chưa xoá trên server, lệnh xoá đang chờ đồng bộ */
  queued: boolean;
}

/** Kết quả create/update là bản lưu tạm trên máy (chưa lên server, sẽ đồng bộ khi có mạng) */
export const isQueuedOffline = (result: unknown): boolean =>
  Boolean((result as OfflineSyncInfo | null | undefined)?._isOffline);

export interface OfflineEnabledService<TDto, TCreateDto, TUpdateDto = TCreateDto, TListParams = Record<string, unknown>>
  extends Omit<BaseCrudService<TDto, TCreateDto, TUpdateDto, TListParams>, 'delete'> {
  delete: (id: string) => Promise<OfflineDeleteResult>;
  /** Như getList, thêm bản tạo offline chưa đồng bộ lên đầu trang 1 (dùng cho trang danh sách, không dùng cho dropdown chọn) */
  getListWithPending: (params: TListParams) => Promise<{ items: TDto[]; totalCount: number }>;
  isOnline: () => boolean;
  getPendingSyncCount: () => Promise<number>;
  forceSync: () => Promise<void>;
  getCachedList: () => Promise<TDto[]>;
  getCached: (id: string) => Promise<TDto | undefined>;
  /** Bản ghi tạo offline chưa lên server (id tạm = clientId trong syncQueue) */
  getUnsynced: (id: string) => Promise<TDto | undefined>;
  /** Id tạm của bản ghi tạo offline đã sync → id thật trên server (không phải id tạm thì trả lại nguyên id) */
  resolveId: (id: string) => Promise<string>;
}

export interface OfflineServiceOptions {
  cacheResponses?: boolean;
  autoSync?: boolean;
  getIdFromItem?: (item: unknown) => string;
  getIdFromCreateResponse?: (response: unknown) => string;
  /** Trường hiển thị tính thêm cho bản lưu tạm (vd: số mẫu, tổng tiền báo giá) - chỉ lưu cache, không gửi lên server */
  toOfflineRecord?: (data: unknown) => Record<string, unknown>;
  /** Bản tạo offline có khớp bộ lọc của danh sách không (mặc định: defaultMatchesListParams) */
  matchesListParams?: (item: unknown, params: unknown) => boolean;
}

const PAGING_PARAMS = new Set(['skipCount', 'maxResultCount', 'sorting']);
const TEXT_PARAMS = new Set(['search', 'filter', 'keyword']);

/**
 * Lọc bản tạo offline theo tham số danh sách: ô tìm kiếm so với mọi trường chữ,
 * tham số khác (status, isActive, departmentId...) so với trường cùng tên nếu bản ghi có trường đó
 */
export function defaultMatchesListParams(item: unknown, params: unknown): boolean {
  const record = (item ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries((params ?? {}) as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '' || PAGING_PARAMS.has(key)) continue;
    if (TEXT_PARAMS.has(key)) {
      const text = String(value).toLowerCase();
      const found = Object.values(record).some(v => typeof v === 'string' && v.toLowerCase().includes(text));
      if (!found) return false;
    } else if (key in record && record[key] !== value) {
      return false;
    }
  }
  return true;
}

const defaultOptions: OfflineServiceOptions = {
  cacheResponses: true,
  autoSync: true,
  getIdFromItem: (item: unknown) => (item as { id: string }).id,
  getIdFromCreateResponse: (response: unknown) => (response as { id: string }).id,
  matchesListParams: defaultMatchesListParams,
};


/**
 * Check if an error is a true network error (no response from server).
 * - Network error: error.response is undefined (DNS failure, connection refused, no internet)
 * - Server error: error.response exists with status code (400, 401, 500, etc.) — server is reachable
 */
export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    // Axios error with a server response = server is reachable, NOT a network error.
    // Ngoại lệ (OF-07): proxy trả 502/503 = backend không phản hồi → coi như mất mạng.
    const response = (error as any).response;
    return response == null || isServerUnavailableStatus(response.status);
  }
  // Non-axios errors or errors without response = treat as network error
  return true;
}

interface PendingChange {
  operationType: SyncOperationType;
  info: OfflineSyncInfo;
  item: SyncQueueItem;
}

const toSyncInfo = (item: SyncQueueItem): OfflineSyncInfo => ({
  _isOffline: true,
  _isUnsyncedCreate: item.operationType === 'create' || undefined,
  syncStatus: item.status as OfflineSyncStatus,
  syncError: item.lastError,
});

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

  const withSyncInfo = (record: TDto, info?: OfflineSyncInfo): TDto =>
    info ? ({ ...record, ...info } as TDto) : record;

  /** Thay đổi offline chưa lên server theo id bản ghi (tạo: id tạm, sửa/xoá: id server). Mục lỗi được ưu tiên hiển thị */
  const getPendingChanges = async (): Promise<Map<string, PendingChange>> => {
    const changes = new Map<string, PendingChange>();
    for (const item of await getUnsyncedItemsByType(entityType)) {
      const id = item.operationType === 'create' ? item.clientId : item.serverId;
      if (!id) continue;
      const prev = changes.get(id);
      if (prev?.info.syncStatus === 'failed') continue;
      changes.set(id, { operationType: item.operationType, info: toSyncInfo(item), item });
    }
    return changes;
  };

  const getSyncInfo = async (id: string): Promise<OfflineSyncInfo | undefined> =>
    (await getPendingChanges()).get(id)?.info;

  const buildOfflineRecord = (data: unknown, id: string): TDto =>
    ({ ...(data as object), ...opts.toOfflineRecord?.(data), id, _isOffline: true } as unknown as TDto);

  const getUnsynced = async (id: string): Promise<TDto | undefined> => {
    const item = await syncManager.getQueueItem(id);
    if (!item || item.entityType !== entityType || item.operationType !== 'create' || item.status === 'synced') {
      return undefined;
    }
    const cached = await getCachedEntity(entityType, id);
    return cached ? withSyncInfo(cached.data as TDto, toSyncInfo(item)) : undefined;
  };

  const resolveId = async (id: string): Promise<string> => (await getSyncedServerId(id)) ?? id;

  const getCachedList = async (): Promise<{ items: TDto[]; totalCount: number }> => {
    const changes = await getPendingChanges();
    const items = (await getCachedEntitiesByType(entityType)).map(e => {
      const record = e.data as TDto;
      return withSyncInfo(record, changes.get(opts.getIdFromItem!(record))?.info);
    });
    return { items, totalCount: items.length };
  };

  const fetchList = async (
    params: TListParams,
    includeUnsyncedCreates: boolean
  ): Promise<{ items: TDto[]; totalCount: number }> => {
    if (syncManager.getOnlineStatus()) {
      try {
        const result = await baseService.getList(params);
        if (opts.cacheResponses) {
          for (const item of result.items) {
            const id = opts.getIdFromItem!(item);
            await cacheEntity(entityType, id, item, false);
          }
        }

        const changes = await getPendingChanges();
        if (changes.size === 0) return result;

        // Bản ghi đang chờ xoá thì ẩn (offline cũng đã ẩn), xoá lỗi thì vẫn hiện kèm tag lỗi
        let hidden = 0;
        const items: TDto[] = [];
        for (const item of result.items) {
          const change = changes.get(opts.getIdFromItem!(item));
          if (change?.operationType === 'delete' && change.info.syncStatus !== 'failed') {
            hidden++;
            continue;
          }
          items.push(withSyncInfo(item, change?.info));
        }

        // Bản tạo offline chưa lên server không có trong API → hiện ở đầu trang 1
        const unsynced: TDto[] = [];
        if (includeUnsyncedCreates && !(params as { skipCount?: number } | undefined)?.skipCount) {
          const creates = [...changes.values()]
            .filter(c => c.operationType === 'create')
            .sort((a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime());
          for (const change of creates) {
            const cached = await getCachedEntity(entityType, change.item.clientId);
            if (cached && opts.matchesListParams!(cached.data, params)) {
              unsynced.push(withSyncInfo(cached.data as TDto, change.info));
            }
          }
        }

        return {
          items: [...unsynced, ...items],
          totalCount: result.totalCount - hidden + unsynced.length,
        };
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        console.warn('Network error in getList, returning cached data:', error);
      }
    }
    return getCachedList();
  };

  return {
    getList: (params: TListParams) => fetchList(params, false),

    getListWithPending: (params: TListParams) => fetchList(params, true),

    async get(id: string): Promise<TDto> {
      if (syncManager.getOnlineStatus()) {
        // Id tạm chưa lên server → gọi API sẽ 404, trả bản tạm; đã sync rồi → lấy theo id thật
        const unsynced = await getUnsynced(id);
        if (unsynced) return unsynced;
        id = await resolveId(id);
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
        return withSyncInfo(cached.data as TDto, await getSyncInfo(id));
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
      // Id tạm = clientId của item trong queue → sync xong tìm đúng bản tạm để thay, sửa/xoá offline gộp được vào item này
      const tempId = await syncManager.queueEntity(entityType, data, 'create');
      const tempRecord = buildOfflineRecord({ creationTime: new Date().toISOString(), ...data }, tempId);
      await cacheEntity(entityType, tempId, tempRecord, true);
      return tempRecord;
    },

    async update(id: string, data: TUpdateDto): Promise<TDto> {
      // Bản ghi tạo offline đang được gửi lên server → chờ lượt sync xong rồi mới sửa
      const queueItem = await syncManager.getQueueItem(id);
      if (queueItem?.operationType === 'create' && queueItem.status === 'syncing') {
        await syncManager.waitForIdle();
      }

      // Bản ghi tạo offline chưa lên server → gộp thay đổi vào item 'create' (id tạm không tồn tại trên server)
      if (await syncManager.mergeIntoPendingCreate(id, data)) {
        const cached = await getCachedEntity(entityType, id);
        const mergedRecord = buildOfflineRecord({ ...(cached?.data as object), ...data }, id);
        await cacheEntity(entityType, id, mergedRecord, true);
        return mergedRecord;
      }

      id = await resolveId(id);

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
      // Giữ các trường chỉ server trả về (mã, trạng thái...) để danh sách offline vẫn hiển thị đủ
      const cached = await getCachedEntity(entityType, id);
      const updatedRecord = buildOfflineRecord({ ...(cached?.data as object), ...data }, id);
      await cacheEntity(entityType, id, updatedRecord, true);
      return updatedRecord;
    },

    async delete(id: string): Promise<OfflineDeleteResult> {
      // Bản ghi tạo offline chưa lên server → chỉ cần bỏ khỏi hàng đợi, không gửi lệnh xoá id tạm
      if (await syncManager.discardPendingCreate(id)) return { queued: false };

      id = await resolveId(id);

      if (syncManager.getOnlineStatus()) {
        try {
          await baseService.delete(id);
          await removeCachedEntity(entityType, id);
          return { queued: false };
        } catch (error) {
          if (!isNetworkError(error)) throw error;
          console.warn('Network error in delete, queueing for sync:', error);
        }
      }
      await syncManager.queueEntity(entityType, { id }, 'delete', id);
      await removeCachedEntity(entityType, id);
      return { queued: true };
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
      return (await getCachedList()).items;
    },

    async getCached(id: string): Promise<TDto | undefined> {
      const cached = await getCachedEntity(entityType, id);
      return cached ? withSyncInfo(cached.data as TDto, await getSyncInfo(id)) : undefined;
    },

    getUnsynced,
    resolveId,
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
