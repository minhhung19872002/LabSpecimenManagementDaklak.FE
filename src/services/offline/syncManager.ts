import { api } from '../api';
import {
  getDB,
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
  clearSyncedItems,
  getPendingSyncCount,
  setLastSyncTimestampByType,
  getDeviceId,
  SyncQueueItem,
  SyncOperationType,
  SyncEntityType,
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

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    this.isOnline = navigator.onLine;
  }

  async init(): Promise<void> {
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
    if (!this.isOnline || this.isSyncing) {
      return null;
    }

    const pendingItems = await getPendingSyncItems();
    if (pendingItems.length === 0) {
      return null;
    }

    this.isSyncing = true;
    this.emit('syncStart', { itemCount: pendingItems.length });

    try {
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

  destroy(): void {
    this.stopPeriodicSync();
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.eventListeners.clear();
  }
}

export const syncManager = new SyncManager();
export default syncManager;
