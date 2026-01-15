import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '../services/offline/syncManager';

export interface NetworkStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

/**
 * Hook to track network status and pending sync items
 */
export function useNetworkStatus(): NetworkStatus & {
  sync: () => Promise<void>;
  retryFailed: () => Promise<void>;
} {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initialize sync manager
    syncManager.init();

    // Get initial pending count
    syncManager.getPendingCount().then(setPendingCount);

    // Listen for status changes
    const handleStatusChange = (data: unknown) => {
      const { isOnline: online } = data as { isOnline: boolean };
      setIsOnline(online);
    };

    const handlePendingCountChange = (count: unknown) => {
      setPendingCount(count as number);
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

  return {
    isOnline,
    pendingCount,
    isSyncing,
    sync,
    retryFailed,
  };
}

export default useNetworkStatus;
