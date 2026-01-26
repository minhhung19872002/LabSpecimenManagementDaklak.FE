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
  conflictResolution?: 'ClientWins' | 'ServerWins' | 'Merged';
  serverData?: unknown;
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

type SyncEventType = 'syncStart' | 'syncComplete' | 'syncError' | 'statusChange' | 'pendingCountChange';
type SyncEventCallback = (data?: unknown) => void;


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


  async sync(): Promise<GenericSyncBatchResponseDto | null> {
    console.log('[SyncManager] sync() called, isOnline:', this.isOnline, 'isSyncing:', this.isSyncing);
    if (!this.isOnline || this.isSyncing) {
      return null;
    }

    this.isSyncing = true;
    let pendingItems: SyncQueueItem[] = [];

    try {
      // Step 1: Sync pending file uploads first
      const fileIdMappings = await this.syncPendingFileUploads();
      console.log('[SyncManager] File sync complete, mappings:', fileIdMappings);

      // Step 2: Get pending items and replace offline file IDs
      pendingItems = await getPendingSyncItems();
      console.log('[SyncManager] Pending items count:', pendingItems.length);

      if (pendingItems.length === 0) {
        this.isSyncing = false;
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
    } finally {
      this.isSyncing = false;
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
      } else {
        await updateSyncItemStatus(
          result.clientId,
          'failed',
          undefined,
          result.error || result.validationErrors?.join(', ')
        );
      }
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
    const db = await getDB();
    const failedItems = await db.getAllFromIndex('syncQueue', 'by-status', 'failed');

    for (const item of failedItems) {
      await removeSyncItem(item.clientId);
    }

    await this.notifyPendingCountChange();
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
