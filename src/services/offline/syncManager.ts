import { api } from '../api';
import {
  getDB,
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItemStatus,
  updateSyncItemData,
  removeSyncItem,
  clearSyncedItems,
  getPendingSyncCount,
  setLastSyncTimestampByType,
  getDeviceId,
  SyncQueueItem,
  SyncOperationType,
  SyncEntityType,
  getPendingFileUploads,
  updatePendingFileUploadStatus,
  clearUploadedFiles,
  cacheEntity,
  removeCachedEntity,
  cacheTestRequest,
  removeCachedTestRequest,
  setSyncedIdMapping,
} from './db';

export interface GenericSyncItemDto {
  clientId: string;
  serverId?: string;
  operationType: 'Create' | 'Update' | 'Delete';
  entityType: SyncEntityType;
  clientLastModified: string;
  data: unknown;
}

export interface GenericSyncBatchRequestDto {
  items: GenericSyncItemDto[];
  deviceId: string;
  syncTimestamp: string;
}

export interface GenericSyncResultDto {
  success: boolean;
  clientId: string;
  serverId?: string;
  entityType: SyncEntityType;
  error?: string;
  validationErrors?: string[];
  // BE serialize enum dạng số: 0 = ClientWins, 1 = ServerWins, 2 = Merged
  conflictResolution?: 'ClientWins' | 'ServerWins' | 'Merged' | 0 | 1 | 2;
  serverData?: unknown;
}

/** Payload của event 'itemSynced' */
export interface SyncedItemEvent {
  clientId: string;
  serverId?: string;
  entityType: SyncEntityType;
  operationType: SyncOperationType;
  /** true khi server có bản mới hơn → thay đổi offline bị bỏ qua */
  serverWins: boolean;
  serverData?: unknown;
}

/** Payload của event 'itemFailed' */
export interface FailedItemEvent {
  clientId: string;
  entityType: SyncEntityType;
  operationType: SyncOperationType;
  error: string;
}

export interface GenericSyncBatchResponseDto {
  results: GenericSyncResultDto[];
  successCount: number;
  failedCount: number;
  conflictCount: number;
  serverTimestamp: string;
  syncedByType: Record<string, number>;
}

export interface SyncTestRequestDto {
  clientId: string;
  serverId?: string;
  operationType: 'Create' | 'Update' | 'Delete';
  clientLastModified: string;
  data: unknown;
}

export interface SyncBatchRequestDto {
  testRequests: SyncTestRequestDto[];
  deviceId: string;
  syncTimestamp: string;
  lastSyncTimestamp?: string;
}

export interface SyncResultDto {
  success: boolean;
  clientId: string;
  serverId?: string;
  error?: string;
  validationErrors?: string[];
  conflictResolution?: 'ClientWins' | 'ServerWins' | 'Merged';
  serverData?: unknown;
}

export interface SyncBatchResponseDto {
  results: SyncResultDto[];
  successCount: number;
  failedCount: number;
  conflictCount: number;
  serverTimestamp: string;
  serverChanges?: unknown[];
}

type SyncEventType =
  | 'syncStart'
  | 'syncComplete'
  | 'syncError'
  | 'statusChange'
  | 'pendingCountChange'
  | 'itemSynced'
  | 'itemFailed'
  | 'itemsDiscarded';
type SyncEventCallback = (data?: unknown) => void;

const SYNC_LOCK_NAME = 'lab-specimen-offline-sync';
// Không có Web Locks: item 'syncing' quá thời gian này mới coi là kẹt (tab khác có thể đang sync)
const STUCK_SYNCING_TIMEOUT_MS = 5 * 60 * 1000;


class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: number | null = null;
  private eventListeners: Map<SyncEventType, Set<SyncEventCallback>> = new Map();
  private isInitialized: boolean = false;

  // Store bound handlers as class properties so they can be removed properly
  private boundHandleOnline = this.handleOnline.bind(this);
  private boundHandleOffline = this.handleOffline.bind(this);

  constructor() {
    window.addEventListener('online', this.boundHandleOnline);
    window.addEventListener('offline', this.boundHandleOffline);
    this.isOnline = navigator.onLine;
  }

  async init(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.log('[SyncManager] Already initialized, skipping');
      return;
    }

    console.log('[SyncManager] Initializing, online status:', this.isOnline);
    this.isInitialized = true;
    await getDB();
    if (this.isOnline) {
      this.startPeriodicSync();
    }
    this.notifyPendingCountChange();
  }

  on(event: SyncEventType, callback: SyncEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: SyncEventType, callback: SyncEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: SyncEventType, data?: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  private async notifyPendingCountChange(): Promise<void> {
    const count = await getPendingSyncCount();
    this.emit('pendingCountChange', count);
  }

  private async handleOnline(): Promise<void> {
    console.log('[SyncManager] Online event triggered');
    this.isOnline = true;
    this.emit('statusChange', { isOnline: true });
    this.startPeriodicSync();
    await this.sync();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.emit('statusChange', { isOnline: false });
    this.stopPeriodicSync();
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) return;
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, 30000);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  getSyncingStatus(): boolean {
    return this.isSyncing;
  }

  async queueEntity(
    entityType: SyncEntityType,
    data: unknown,
    operationType: SyncOperationType = 'create',
    serverId?: string
  ): Promise<string> {
    const clientId = await addToSyncQueue({
      serverId,
      operationType,
      entityType,
      data,
      clientLastModified: new Date(),
    });

    await this.notifyPendingCountChange();

    if (this.isOnline) {
      this.sync();
    }

    return clientId;
  }

  async queueTestRequest(
    data: unknown,
    operationType: SyncOperationType = 'create',
    serverId?: string
  ): Promise<string> {
    return this.queueEntity('TestRequest', data, operationType, serverId);
  }

  /**
   * Sửa 1 bản ghi tạo offline (chưa lên server): gộp data mới vào item 'create' trong queue
   * thay vì queue thêm 'update' với id tạm (BE sẽ báo not found).
   * Trả về false nếu không có item create phù hợp (hoặc đang sync dở).
   */
  async mergeIntoPendingCreate(clientId: string, data: unknown): Promise<boolean> {
    const db = await getDB();
    const item = await db.get('syncQueue', clientId);
    if (!item || item.operationType !== 'create' || item.status === 'synced' || item.status === 'syncing') {
      return false;
    }

    // Giữ các trường chỉ có ở bản tạo (vd: quotationId) - dữ liệu sửa là UpdateTestRequestDto
    item.data = { ...(item.data as object), ...(data as object) };
    item.status = 'pending';
    item.lastError = undefined;
    item.clientLastModified = new Date();
    item.updatedAt = new Date();
    await db.put('syncQueue', item);

    await this.notifyPendingCountChange();
    if (this.isOnline) {
      this.sync();
    }
    return true;
  }

  async getQueueItem(clientId: string): Promise<SyncQueueItem | undefined> {
    const db = await getDB();
    return db.get('syncQueue', clientId);
  }

  async getFailedItems(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    return db.getAllFromIndex('syncQueue', 'by-status', 'failed');
  }


  async sync(): Promise<GenericSyncBatchResponseDto | null> {
    console.log('[SyncManager] sync() called, isOnline:', this.isOnline, 'isSyncing:', this.isSyncing);
    if (!this.isOnline || this.isSyncing) {
      return null;
    }

    this.isSyncing = true;
    try {
      // Nhiều tab (hoặc nhiều instance sau HMR) dùng chung IndexedDB → chỉ cho 1 lượt sync chạy tại 1 thời điểm,
      // nếu không cùng 1 item bị gửi lên server nhiều lần cùng lúc (đã gặp: 1 phiếu offline tạo ra 2 phiếu trùng)
      if (navigator.locks) {
        return await navigator.locks.request(SYNC_LOCK_NAME, () => this.runSync(true));
      }
      return await this.runSync(false);
    } finally {
      this.isSyncing = false;
    }
  }

  /** Chờ lượt sync đang chạy (ở bất kỳ tab nào) xong - dùng trước khi reload trang để không cắt ngang request sync */
  async waitForIdle(): Promise<void> {
    if (navigator.locks) {
      await navigator.locks.request(SYNC_LOCK_NAME, () => undefined);
      return;
    }
    while (this.isSyncing) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  private async runSync(holdsLock: boolean): Promise<GenericSyncBatchResponseDto | null> {
    let pendingItems: SyncQueueItem[] = [];

    try {
      // Đang giữ khóa sync → item 'syncing' còn sót là của lượt sync bị ngắt (đóng tab giữa chừng) → trả lại pending.
      // Không có Web Locks (http, trình duyệt cũ) thì tab khác có thể đang sync → chỉ trả lại item kẹt quá lâu.
      // Nếu server đã tạo rồi thì BE nhận ra ClientId cũ và trả lại bản ghi đó, không tạo trùng.
      await this.requeueStuckSyncingItems(holdsLock ? 0 : STUCK_SYNCING_TIMEOUT_MS);

      // Step 1: Sync pending file uploads first
      const fileIdMappings = await this.syncPendingFileUploads();
      console.log('[SyncManager] File sync complete, mappings:', fileIdMappings);

      // Step 2: Get pending items and replace offline file IDs
      pendingItems = await getPendingSyncItems();
      console.log('[SyncManager] Pending items count:', pendingItems.length);

      if (pendingItems.length === 0) {
        return null;
      }

      // Replace offline file IDs in pending items if we have mappings
      if (Object.keys(fileIdMappings).length > 0) {
        for (const item of pendingItems) {
          const updatedData = this.replaceOfflineFileIds(item.data, fileIdMappings);
          if (updatedData !== item.data) {
            await updateSyncItemData(item.clientId, updatedData);
            item.data = updatedData;
          }
        }
      }

      this.emit('syncStart', { itemCount: pendingItems.length });

      for (const item of pendingItems) {
        await updateSyncItemStatus(item.clientId, 'syncing');
      }

      const deviceId = await getDeviceId();

      const syncRequest: GenericSyncBatchRequestDto = {
        items: pendingItems.map(item => this.mapToGenericSyncDto(item)),
        deviceId,
        syncTimestamp: new Date().toISOString(),
      };

      const response = await api.post<GenericSyncBatchResponseDto>('/api/v1/sync/batch', syncRequest);
      const result = response.data;

      console.log('[SyncManager] Sync response:', JSON.stringify(result, null, 2));
      await this.processGenericResults(result.results, pendingItems);

      const syncedTypes = new Set(pendingItems.map(item => item.entityType));
      for (const entityType of syncedTypes) {
        await setLastSyncTimestampByType(entityType, new Date(result.serverTimestamp));
      }

      await clearSyncedItems();
      await this.notifyPendingCountChange();

      this.emit('syncComplete', result);

      return result;
    } catch (error) {
      console.error('Sync failed:', error);

      for (const item of pendingItems) {
        await updateSyncItemStatus(
          item.clientId,
          'pending',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      this.emit('syncError', error);
      return null;
    }
  }

  private async requeueStuckSyncingItems(minAgeMs: number): Promise<void> {
    const db = await getDB();
    const stuck = await db.getAllFromIndex('syncQueue', 'by-status', 'syncing');
    const now = Date.now();
    for (const item of stuck) {
      if (now - new Date(item.updatedAt).getTime() >= minAgeMs) {
        await updateSyncItemStatus(item.clientId, 'pending');
      }
    }
  }

  private mapToGenericSyncDto(item: SyncQueueItem): GenericSyncItemDto {
    const operationMap: Record<SyncOperationType, 'Create' | 'Update' | 'Delete'> = {
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
    };

    return {
      clientId: item.clientId,
      serverId: item.serverId,
      operationType: operationMap[item.operationType],
      entityType: item.entityType,
      clientLastModified: item.clientLastModified.toISOString(),
      data: item.data,
    };
  }

  private async processGenericResults(
    results: GenericSyncResultDto[],
    pendingItems: SyncQueueItem[]
  ): Promise<void> {
    for (const result of results) {
      const item = pendingItems.find(p => p.clientId === result.clientId);
      if (!item) continue;

      if (result.success) {
        await updateSyncItemStatus(
          result.clientId,
          'synced',
          result.serverId ?? undefined
        );

        const serverId = result.serverId ?? item.serverId;
        await this.replaceOfflineCache(item, serverId, result.serverData);

        this.emit('itemSynced', {
          clientId: item.clientId,
          serverId,
          entityType: item.entityType,
          operationType: item.operationType,
          serverWins: result.conflictResolution === 'ServerWins' || result.conflictResolution === 1,
          serverData: result.serverData,
        } satisfies SyncedItemEvent);
      } else {
        const error = [result.error, ...(result.validationErrors ?? [])]
          .filter(Boolean)
          .join('; ') || 'Lỗi không xác định';

        await updateSyncItemStatus(result.clientId, 'failed', undefined, error);

        this.emit('itemFailed', {
          clientId: item.clientId,
          entityType: item.entityType,
          operationType: item.operationType,
          error,
        } satisfies FailedItemEvent);
      }
    }

    // Item không có kết quả trả về → trả lại pending, tránh kẹt ở trạng thái 'syncing'
    const answered = new Set(results.map(r => r.clientId));
    for (const item of pendingItems) {
      if (!answered.has(item.clientId)) {
        await updateSyncItemStatus(item.clientId, 'pending');
      }
    }
  }

  /**
   * Sau khi sync thành công: bỏ bản cache tạm (id = clientId, isOffline) và cache bản từ server,
   * để danh sách/chi tiết offline không bị trùng hoặc giữ mãi bản tạm.
   */
  private async replaceOfflineCache(
    item: SyncQueueItem,
    serverId: string | undefined,
    serverData: unknown
  ): Promise<void> {
    try {
      if (item.operationType === 'create') {
        if (item.entityType === 'TestRequest') {
          await removeCachedTestRequest(item.clientId);
        } else {
          await removeCachedEntity(item.entityType, item.clientId);
        }
        // BE dùng ClientId làm Id (TestRequest) → không cần map
        if (serverId && serverId !== item.clientId) {
          await setSyncedIdMapping(item.clientId, serverId);
        }
      }

      if (item.operationType === 'delete' || !serverId || !serverData) return;

      if (item.entityType === 'TestRequest') {
        await cacheTestRequest(serverId, serverData, false);
      } else {
        await cacheEntity(item.entityType, serverId, serverData, false);
      }
    } catch (error) {
      console.error('[SyncManager] Failed to update cache after sync:', error);
    }
  }

  async getPendingCount(): Promise<number> {
    return getPendingSyncCount();
  }

  async retryFailed(): Promise<void> {
    const db = await getDB();
    const failedItems = await db.getAllFromIndex('syncQueue', 'by-status', 'failed');

    for (const item of failedItems) {
      if (item.retryCount < 3) {
        await updateSyncItemStatus(item.clientId, 'pending');
      }
    }

    await this.notifyPendingCountChange();

    if (this.isOnline) {
      await this.sync();
    }
  }

  async clearQueue(): Promise<void> {
    const db = await getDB();
    const allItems = await db.getAll('syncQueue');

    for (const item of allItems) {
      await removeSyncItem(item.clientId);
    }

    await this.notifyPendingCountChange();
  }

  /**
   * Sync pending file uploads to server
   * Returns a mapping of tempId -> serverId for successfully uploaded files
   */
  private async syncPendingFileUploads(): Promise<Record<string, string>> {
    const mappings: Record<string, string> = {};

    try {
      const pendingFiles = await getPendingFileUploads();
      console.log('[SyncManager] Pending files to sync:', pendingFiles.length);

      if (pendingFiles.length === 0) {
        return mappings;
      }

      for (const fileItem of pendingFiles) {
        try {
          await updatePendingFileUploadStatus(fileItem.tempId, 'uploading');

          // Convert blob to File for upload
          const file = new File([fileItem.blob], fileItem.fileName, { type: fileItem.mimeType });

          // Upload the file
          const formData = new FormData();
          formData.append('file', file);
          const response = await api.upload<{ fileId: string; fileName: string; fileSize: number; url: string }>(
            '/api/v1/files/upload',
            formData
          );

          const serverId = response.data.fileId;
          mappings[fileItem.tempId] = serverId;

          await updatePendingFileUploadStatus(fileItem.tempId, 'uploaded', serverId);
          console.log(`[SyncManager] File uploaded: ${fileItem.tempId} -> ${serverId}`);
        } catch (error: any) {
          console.error(`[SyncManager] Failed to upload file ${fileItem.tempId}:`, error);
          await updatePendingFileUploadStatus(
            fileItem.tempId,
            fileItem.retryCount >= 2 ? 'failed' : 'pending',
            undefined,
            error.message
          );
        }
      }

      // Clean up successfully uploaded files
      await clearUploadedFiles();
    } catch (error) {
      console.error('[SyncManager] Error in syncPendingFileUploads:', error);
    }

    return mappings;
  }

  /**
   * Recursively replace offline file IDs in data with server IDs
   */
  private replaceOfflineFileIds(data: unknown, mappings: Record<string, string>): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      // Check if this string is an offline file ID
      if (data.startsWith('offline-file-') && mappings[data]) {
        return mappings[data];
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.replaceOfflineFileIds(item, mappings));
    }

    if (typeof data === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        result[key] = this.replaceOfflineFileIds(value, mappings);
      }
      return result;
    }

    return data;
  }

  /**
   * Clear all permanently failed items (retryCount >= 3)
   */
  async clearFailedItems(): Promise<void> {
    const failedItems = await this.getFailedItems();
    await this.discardItems(failedItems);
  }

  /**
   * Bỏ 1 mục đồng bộ lỗi (vd: 1 phiếu tạo offline không muốn giữ nữa)
   */
  async discardFailedItem(clientId: string): Promise<void> {
    const item = await this.getQueueItem(clientId);
    if (!item || item.status !== 'failed') return;
    await this.discardItems([item]);
  }

  /**
   * Xóa khỏi hàng đợi + xóa bản cache tạm của dữ liệu tạo offline (id = clientId),
   * nếu không danh sách offline vẫn hiện bản tạm dù mục đồng bộ đã bị xóa
   */
  private async discardItems(items: SyncQueueItem[]): Promise<void> {
    for (const item of items) {
      await removeSyncItem(item.clientId);
      if (item.operationType === 'create') {
        if (item.entityType === 'TestRequest') {
          await removeCachedTestRequest(item.clientId);
        } else {
          await removeCachedEntity(item.entityType, item.clientId);
        }
      }
    }

    await this.notifyPendingCountChange();
    if (items.length > 0) {
      this.emit('itemsDiscarded', items.map(item => item.clientId));
    }
  }

  /**
   * Reset retry count for all failed items so they can be retried again
   */
  async resetFailedItems(): Promise<void> {
    const db = await getDB();
    const failedItems = await db.getAllFromIndex('syncQueue', 'by-status', 'failed');

    for (const item of failedItems) {
      item.retryCount = 0;
      item.status = 'pending';
      item.updatedAt = new Date();
      await db.put('syncQueue', item);
    }

    await this.notifyPendingCountChange();

    if (this.isOnline) {
      await this.sync();
    }
  }

  /**
   * Get count of failed items
   */
  async getFailedCount(): Promise<number> {
    const db = await getDB();
    return db.countFromIndex('syncQueue', 'by-status', 'failed');
  }

  destroy(): void {
    this.stopPeriodicSync();
    window.removeEventListener('online', this.boundHandleOnline);
    window.removeEventListener('offline', this.boundHandleOffline);
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}

export const syncManager = new SyncManager();
export default syncManager;
