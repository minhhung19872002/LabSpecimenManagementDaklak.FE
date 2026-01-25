import { useState, useEffect } from 'react';
import { laboratoryTaskService } from '../services/laboratoryTaskService';
import { STORAGE_KEYS } from '../constants';

// Cache key for localStorage (persists across reloads, unlike sessionStorage)
const SUPPORTER_CACHE_KEY = 'user_is_supporter';

/**
 * Hook to check if current user is a supporter for any incomplete task
 * Caches result in localStorage to avoid repeated API calls and persist across reloads
 * Handles offline mode by using cached value without making API calls
 */
export const useSupporterStatus = () => {
  const [isSupporter, setIsSupporter] = useState<boolean>(() => {
    // Initialize from cache immediately to avoid blank screen
    const cached = localStorage.getItem(SUPPORTER_CACHE_KEY);
    return cached === 'true';
  });
  const [loading, setLoading] = useState<boolean>(() => {
    // If we have a cached value, don't start in loading state
    return localStorage.getItem(SUPPORTER_CACHE_KEY) === null;
  });

  useEffect(() => {
    const checkSupporterStatus = async () => {
      // Check if user is logged in
      const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (!userInfo) {
        setIsSupporter(false);
        setLoading(false);
        return;
      }

      // Check cache first - use cached value and skip API if offline
      const cached = localStorage.getItem(SUPPORTER_CACHE_KEY);

      // If offline, use cached value immediately and don't make API call
      if (!navigator.onLine) {
        if (cached !== null) {
          setIsSupporter(cached === 'true');
        } else {
          // No cached value and offline - default to false
          setIsSupporter(false);
        }
        setLoading(false);
        return;
      }

      // If we have a cached value, use it immediately (already set in useState initializer)
      // Then refresh in background when online
      if (cached !== null) {
        setLoading(false);
      }

      try {
        // Call API to check supporter status (only when online)
        const result = await laboratoryTaskService.isCurrentUserSupporter();
        setIsSupporter(result);

        // Cache the result in localStorage (persists across reloads)
        localStorage.setItem(SUPPORTER_CACHE_KEY, result.toString());
      } catch (error) {
        console.error('Failed to check supporter status:', error);
        // On error, keep the cached value if available, otherwise default to false
        if (cached === null) {
          setIsSupporter(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSupporterStatus();
  }, []);

  // Function to refresh supporter status (call after login or when needed)
  const refreshSupporterStatus = async () => {
    // Skip refresh if offline
    if (!navigator.onLine) {
      return;
    }

    try {
      setLoading(true);
      localStorage.removeItem(SUPPORTER_CACHE_KEY);
      const result = await laboratoryTaskService.isCurrentUserSupporter();
      setIsSupporter(result);
      localStorage.setItem(SUPPORTER_CACHE_KEY, result.toString());
    } catch (error) {
      console.error('Failed to refresh supporter status:', error);
      setIsSupporter(false);
    } finally {
      setLoading(false);
    }
  };

  return { isSupporter, loading, refreshSupporterStatus };
};

// Clear supporter cache when user logs out
export const clearSupporterCache = () => {
  localStorage.removeItem(SUPPORTER_CACHE_KEY);
};
