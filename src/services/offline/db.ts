import { openDB, DBSchema, IDBPDatabase } from 'idb';

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

/**
 * Sync entity types - matches BE SyncEntityType enum
 */
export type SyncEntityType =
  | 'TestRequest'
  | 'Quotation'
  | 'Receipt'
  | 'NCR'
  | 'Specimen'
  | 'QualityManagement'
  | 'Testing'
  | 'Subcontractor'
  | 'Employee'
  | 'LaboratoryTask'
  | 'StandardIndicator'
  | 'TestMethod'
  | 'Laboratory'
  | 'SpecimenType'
  | 'TestResult'
  | 'IndicatorGroup'
  | 'File';

/**
 * Sync queue item status
 */
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

/**
 * Sync operation type
 */
export type SyncOperationType = 'create' | 'update' | 'delete';

/**
 * Sync queue item stored in IndexedDB
 */
export interface SyncQueueItem {
  clientId: string;
  serverId?: string;
  operationType: SyncOperationType;
  entityType: SyncEntityType;
  data: unknown;
  clientLastModified: Date;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generic cached entity for any entity type
 */
export interface CachedEntity {
  id: string;
  entityType: SyncEntityType;
  data: unknown;
  isOffline: boolean;
  cachedAt: Date;
}

/**
 * Offline test request cache (legacy - for backward compatibility)
 */
export interface CachedTestRequest {
  id: string;
  data: unknown;
  isOffline: boolean;
  cachedAt: Date;
}

/**
 * Sync metadata for tracking sync state
 */
export interface SyncMetadata {
  key: string;
  value: string | number | Date;
}

/**
 * Pending file upload stored in IndexedDB
 */
export interface PendingFileUpload {
  tempId: string;
  blob: Blob;
  fileName: string;
  fileSize: number;
  mimeType: string;
  localUrl: string; // Blob URL for preview
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  serverId?: string; // Server-assigned fileId after upload
  createdAt: Date;
  retryCount: number;
  lastError?: string;
}

/**
 * Cached document template for offline printing
 */
export interface CachedDocumentTemplate {
  templateName: string;
  fileName: string;
  blob: Blob;
  version: string;
  cachedAt: Date;
}

/**
 * IndexedDB schema definition
 */
interface OfflineDB extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-status': SyncStatus;
      'by-entityType': SyncEntityType;
      'by-createdAt': Date;
    };
  };
  testRequests: {
    key: string;
    value: CachedTestRequest;
    indexes: {
      'by-cachedAt': Date;
      'by-isOffline': number;
    };
  };
  entityCache: {
    key: string;
    value: CachedEntity;
    indexes: {
      'by-entityType': SyncEntityType;
      'by-cachedAt': Date;
      'by-isOffline': number;
    };
  };
  syncMetadata: {
    key: string;
    value: SyncMetadata;
  };
  pendingFileUploads: {
    key: string;
    value: PendingFileUpload;
    indexes: {
      'by-status': string;
      'by-createdAt': Date;
    };
  };
  documentTemplates: {
    key: string;
    value: CachedDocumentTemplate;
    indexes: {
      'by-cachedAt': Date;
    };
  };
}

const DB_NAME = 'lab-specimen-offline';
const DB_VERSION = 4;

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion) {
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncQueueStore = db.createObjectStore('syncQueue', {
          keyPath: 'clientId',
        });
        syncQueueStore.createIndex('by-status', 'status');
        syncQueueStore.createIndex('by-entityType', 'entityType');
        syncQueueStore.createIndex('by-createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('testRequests')) {
        const testRequestsStore = db.createObjectStore('testRequests', {
          keyPath: 'id',
        });
        testRequestsStore.createIndex('by-cachedAt', 'cachedAt');
        testRequestsStore.createIndex('by-isOffline', 'isOffline');
      }

      if (!db.objectStoreNames.contains('entityCache')) {
        const entityCacheStore = db.createObjectStore('entityCache', {
          keyPath: 'id',
        });
        entityCacheStore.createIndex('by-entityType', 'entityType');
        entityCacheStore.createIndex('by-cachedAt', 'cachedAt');
        entityCacheStore.createIndex('by-isOffline', 'isOffline');
      }

      if (!db.objectStoreNames.contains('syncMetadata')) {
        db.createObjectStore('syncMetadata', {
          keyPath: 'key',
        });
      }

      if (!db.objectStoreNames.contains('pendingFileUploads')) {
        const pendingUploadsStore = db.createObjectStore('pendingFileUploads', {
          keyPath: 'tempId',
        });
        pendingUploadsStore.createIndex('by-status', 'status');
        pendingUploadsStore.createIndex('by-createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('documentTemplates')) {
        const templateStore = db.createObjectStore('documentTemplates', {
          keyPath: 'templateName',
        });
        templateStore.createIndex('by-cachedAt', 'cachedAt');
      }
    },
  });

  return dbInstance;
}

export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}


// ============ Sync Queue Operations ============

export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'clientId' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = await getDB();
  const clientId = generateUUID();
  const now = new Date();

  const queueItem: SyncQueueItem = {
    ...item,
    clientId,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.add('syncQueue', queueItem);
  return clientId;
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-status', 'pending');
}

export async function getPendingSyncItemsByType(entityType: SyncEntityType): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const allPending = await db.getAllFromIndex('syncQueue', 'by-status', 'pending');
  return allPending.filter(item => item.entityType === entityType);
}

export async function getAllSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function getSyncItemsByType(entityType: SyncEntityType): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-entityType', entityType);
}

export async function updateSyncItemStatus(
  clientId: string,
  status: SyncStatus,
  serverId?: string,
  error?: string
): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', clientId);

  if (item) {
    item.status = status;
    item.updatedAt = new Date();

    if (serverId) {
      item.serverId = serverId;
    }

    if (error) {
      item.lastError = error;
      item.retryCount += 1;
    }

    await db.put('syncQueue', item);
  }
}

export async function updateSyncItemData(
  clientId: string,
  data: unknown
): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', clientId);

  if (item) {
    item.data = data;
    item.updatedAt = new Date();
    await db.put('syncQueue', item);
  }
}

export async function removeSyncItem(clientId: string): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', clientId);
}

export async function clearSyncedItems(): Promise<void> {
  const db = await getDB();
  const syncedItems = await db.getAllFromIndex('syncQueue', 'by-status', 'synced');

  const tx = db.transaction('syncQueue', 'readwrite');
  await Promise.all([
    ...syncedItems.map(item => tx.store.delete(item.clientId)),
    tx.done,
  ]);
}

export async function getPendingSyncCount(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex('syncQueue', 'by-status', 'pending');
}

export async function getPendingSyncCountByType(entityType: SyncEntityType): Promise<number> {
  const db = await getDB();
  const allPending = await db.getAllFromIndex('syncQueue', 'by-status', 'pending');
  return allPending.filter(item => item.entityType === entityType).length;
}


// ============ Generic Entity Cache Operations ============

function getEntityCacheKey(entityType: SyncEntityType, id: string): string {
  return entityType + ':' + id;
}

export async function cacheEntity(
  entityType: SyncEntityType,
  id: string,
  data: unknown,
  isOffline = false
): Promise<void> {
  const db = await getDB();
  const cacheKey = getEntityCacheKey(entityType, id);
  await db.put('entityCache', {
    id: cacheKey,
    entityType,
    data,
    isOffline,
    cachedAt: new Date(),
  });
}

export async function getCachedEntity(
  entityType: SyncEntityType,
  id: string
): Promise<CachedEntity | undefined> {
  const db = await getDB();
  const cacheKey = getEntityCacheKey(entityType, id);
  return db.get('entityCache', cacheKey);
}

export async function getCachedEntitiesByType(entityType: SyncEntityType): Promise<CachedEntity[]> {
  const db = await getDB();
  return db.getAllFromIndex('entityCache', 'by-entityType', entityType);
}

export async function getOfflineEntitiesByType(entityType: SyncEntityType): Promise<CachedEntity[]> {
  const db = await getDB();
  const allOfType = await db.getAllFromIndex('entityCache', 'by-entityType', entityType);
  return allOfType.filter(item => item.isOffline);
}

export async function removeCachedEntity(entityType: SyncEntityType, id: string): Promise<void> {
  const db = await getDB();
  const cacheKey = getEntityCacheKey(entityType, id);
  await db.delete('entityCache', cacheKey);
}

export async function clearCachedEntitiesByType(entityType: SyncEntityType): Promise<void> {
  const db = await getDB();
  const entities = await db.getAllFromIndex('entityCache', 'by-entityType', entityType);

  const tx = db.transaction('entityCache', 'readwrite');
  await Promise.all([
    ...entities.map(item => tx.store.delete(item.id)),
    tx.done,
  ]);
}

export async function clearOldEntityCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const db = await getDB();
  const cutoff = new Date(Date.now() - maxAgeMs);

  const allItems = await db.getAll('entityCache');
  const oldItems = allItems.filter(item => item.cachedAt < cutoff && !item.isOffline);

  const tx = db.transaction('entityCache', 'readwrite');
  await Promise.all([
    ...oldItems.map(item => tx.store.delete(item.id)),
    tx.done,
  ]);
}


// ============ Test Request Cache Operations (Legacy) ============

export async function cacheTestRequest(
  id: string,
  data: unknown,
  isOffline = false
): Promise<void> {
  const db = await getDB();
  await db.put('testRequests', {
    id,
    data,
    isOffline,
    cachedAt: new Date(),
  });
  await cacheEntity('TestRequest', id, data, isOffline);
}

export async function getCachedTestRequest(id: string): Promise<CachedTestRequest | undefined> {
  const db = await getDB();
  return db.get('testRequests', id);
}

export async function getOfflineTestRequests(): Promise<CachedTestRequest[]> {
  const db = await getDB();
  const all = await db.getAll('testRequests');
  return all.filter(item => item.isOffline);
}

export async function clearOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const db = await getDB();
  const cutoff = new Date(Date.now() - maxAgeMs);

  const allItems = await db.getAll('testRequests');
  const oldItems = allItems.filter(item => item.cachedAt < cutoff && !item.isOffline);

  const tx = db.transaction('testRequests', 'readwrite');
  await Promise.all([
    ...oldItems.map(item => tx.store.delete(item.id)),
    tx.done,
  ]);

  await clearOldEntityCache(maxAgeMs);
}

// ============ Sync Metadata Operations ============

export async function getLastSyncTimestampByType(entityType: SyncEntityType): Promise<Date | null> {
  const db = await getDB();
  const metadata = await db.get('syncMetadata', 'lastSyncTimestamp:' + entityType);
  return metadata ? new Date(metadata.value as string) : null;
}

export async function setLastSyncTimestampByType(entityType: SyncEntityType, timestamp: Date): Promise<void> {
  const db = await getDB();
  await db.put('syncMetadata', {
    key: 'lastSyncTimestamp:' + entityType,
    value: timestamp.toISOString(),
  });
}

export async function getLastSyncTimestamp(): Promise<Date | null> {
  const db = await getDB();
  const metadata = await db.get('syncMetadata', 'lastSyncTimestamp');
  return metadata ? new Date(metadata.value as string) : null;
}

export async function setLastSyncTimestamp(timestamp: Date): Promise<void> {
  const db = await getDB();
  await db.put('syncMetadata', {
    key: 'lastSyncTimestamp',
    value: timestamp.toISOString(),
  });
  await setLastSyncTimestampByType('TestRequest', timestamp);
}

export async function getDeviceId(): Promise<string> {
  const db = await getDB();
  let metadata = await db.get('syncMetadata', 'deviceId');

  if (!metadata) {
    const deviceId = generateUUID();
    await db.put('syncMetadata', {
      key: 'deviceId',
      value: deviceId,
    });
    return deviceId;
  }

  return metadata.value as string;
}

// ============ Pending File Upload Operations ============

export async function addPendingFileUpload(
  blob: Blob,
  fileName: string
): Promise<PendingFileUpload> {
  const db = await getDB();
  const tempId = `offline-file-${generateUUID()}`;
  const localUrl = URL.createObjectURL(blob);

  const pendingUpload: PendingFileUpload = {
    tempId,
    blob,
    fileName,
    fileSize: blob.size,
    mimeType: blob.type,
    localUrl,
    status: 'pending',
    createdAt: new Date(),
    retryCount: 0,
  };

  await db.add('pendingFileUploads', pendingUpload);
  return pendingUpload;
}

export async function getPendingFileUpload(tempId: string): Promise<PendingFileUpload | undefined> {
  const db = await getDB();
  return db.get('pendingFileUploads', tempId);
}

export async function getPendingFileUploads(): Promise<PendingFileUpload[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingFileUploads', 'by-status', 'pending');
}

export async function getAllPendingFileUploads(): Promise<PendingFileUpload[]> {
  const db = await getDB();
  return db.getAll('pendingFileUploads');
}

export async function updatePendingFileUploadStatus(
  tempId: string,
  status: PendingFileUpload['status'],
  serverId?: string,
  error?: string
): Promise<void> {
  const db = await getDB();
  const item = await db.get('pendingFileUploads', tempId);

  if (item) {
    item.status = status;
    if (serverId) {
      item.serverId = serverId;
    }
    if (error) {
      item.lastError = error;
      item.retryCount += 1;
    }
    await db.put('pendingFileUploads', item);
  }
}

export async function removePendingFileUpload(tempId: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('pendingFileUploads', tempId);
  if (item?.localUrl) {
    URL.revokeObjectURL(item.localUrl);
  }
  await db.delete('pendingFileUploads', tempId);
}

export async function clearUploadedFiles(): Promise<void> {
  const db = await getDB();
  const uploadedItems = await db.getAllFromIndex('pendingFileUploads', 'by-status', 'uploaded');

  const tx = db.transaction('pendingFileUploads', 'readwrite');
  await Promise.all([
    ...uploadedItems.map(item => {
      if (item.localUrl) {
        URL.revokeObjectURL(item.localUrl);
      }
      return tx.store.delete(item.tempId);
    }),
    tx.done,
  ]);
}

export async function getPendingFileUploadCount(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex('pendingFileUploads', 'by-status', 'pending');
}

export async function regenerateLocalUrl(tempId: string): Promise<string | null> {
  const db = await getDB();
  const item = await db.get('pendingFileUploads', tempId);
  if (item?.blob) {
    // Revoke old URL if exists
    if (item.localUrl) {
      URL.revokeObjectURL(item.localUrl);
    }
    // Create new URL
    const newUrl = URL.createObjectURL(item.blob);
    item.localUrl = newUrl;
    await db.put('pendingFileUploads', item);
    return newUrl;
  }
  return null;
}

// ============ Document Template Cache Operations ============

/**
 * Cache a document template for offline use
 */
export async function cacheDocumentTemplate(
  templateName: string,
  fileName: string,
  blob: Blob,
  version: string = ''
): Promise<void> {
  const db = await getDB();
  await db.put('documentTemplates', {
    templateName,
    fileName,
    blob,
    version,
    cachedAt: new Date(),
  });
}

/**
 * Get a cached document template by name
 */
export async function getCachedDocumentTemplate(
  templateName: string
): Promise<CachedDocumentTemplate | undefined> {
  const db = await getDB();
  return db.get('documentTemplates', templateName);
}

/**
 * Check if a document template is cached
 */
export async function hasDocumentTemplate(
  templateName: string
): Promise<boolean> {
  const db = await getDB();
  const template = await db.get('documentTemplates', templateName);
  return !!template;
}

/**
 * Get all cached document templates
 */
export async function getAllDocumentTemplates(): Promise<CachedDocumentTemplate[]> {
  const db = await getDB();
  return db.getAll('documentTemplates');
}

/**
 * Remove a cached document template
 */
export async function removeDocumentTemplate(templateName: string): Promise<void> {
  const db = await getDB();
  await db.delete('documentTemplates', templateName);
}

/**
 * Clear all cached document templates
 */
export async function clearDocumentTemplates(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('documentTemplates', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
