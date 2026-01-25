import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '../services/offline/syncManager';

export interface NetworkStatus {
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
}

/**
 * Hook to track network status and pending sync items
 */
export function useNetworkStatus(): NetworkStatus & {
  sync: () => Promise<void>;
  retryFailed: () => Promise<void>;
  clearFailed: () => Promise<void>;
  resetFailed: () => Promise<void>;
} {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initialize sync manager (safe to call multiple times due to guard)
    syncManager.init();

    // Get initial counts
    syncManager.getPendingCount().then(setPendingCount);
    syncManager.getFailedCount().then(setFailedCount);

    // Listen for status changes
    const handleStatusChange = (data: unknown) => {
      const { isOnline: online } = data as { isOnline: boolean };
      setIsOnline(online);
    };

    const handlePendingCountChange = (count: unknown) => {
      setPendingCount(count as number);
      // Also refresh failed count when pending count changes
      syncManager.getFailedCount().then(setFailedCount);
    };

    const handleSyncStart = () => {
      setIsSyncing(true);
    };

    const handleSyncComplete = () => {
      setIsSyncing(false);
    };

    const handleSyncError = () => {
      setIsSyncing(false);
    };

    // Subscribe to events
    syncManager.on('statusChange', handleStatusChange);
    syncManager.on('pendingCountChange', handlePendingCountChange);
    syncManager.on('syncStart', handleSyncStart);
    syncManager.on('syncComplete', handleSyncComplete);
    syncManager.on('syncError', handleSyncError);

    // Also listen for native online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      // Unsubscribe from events
      syncManager.off('statusChange', handleStatusChange);
      syncManager.off('pendingCountChange', handlePendingCountChange);
      syncManager.off('syncStart', handleSyncStart);
      syncManager.off('syncComplete', handleSyncComplete);
      syncManager.off('syncError', handleSyncError);

      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = useCallback(async () => {
    await syncManager.sync();
  }, []);

  const retryFailed = useCallback(async () => {
    await syncManager.retryFailed();
  }, []);

  const clearFailed = useCallback(async () => {
    await syncManager.clearFailedItems();
    setFailedCount(0);
  }, []);

  const resetFailed = useCallback(async () => {
    await syncManager.resetFailedItems();
    const count = await syncManager.getFailedCount();
    setFailedCount(count);
  }, []);

  return {
    isOnline,
    pendingCount,
    failedCount,
    isSyncing,
    sync,
    retryFailed,
    clearFailed,
    resetFailed,
  };
}

export default useNetworkStatus;
