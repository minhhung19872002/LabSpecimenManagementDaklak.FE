import { useState, useEffect } from 'react';
import { laboratoryTaskService } from '../services/laboratoryTaskService';
import { STORAGE_KEYS } from '../constants';

/**
 * Hook to check if current user is a supporter for any incomplete task
 * Caches result in sessionStorage to avoid repeated API calls
 */
export const useSupporterStatus = () => {
  const [isSupporter, setIsSupporter] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSupporterStatus = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem('user_is_supporter');
        if (cached !== null) {
          setIsSupporter(cached === 'true');
          setLoading(false);
          return;
        }

        // Check if user is logged in
        const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        if (!userInfo) {
          setIsSupporter(false);
          setLoading(false);
          return;
        }

        // Call API to check supporter status
        const result = await laboratoryTaskService.isCurrentUserSupporter();
        setIsSupporter(result);

        // Cache the result in sessionStorage (expires on browser close)
        sessionStorage.setItem('user_is_supporter', result.toString());
      } catch (error) {
        console.error('Failed to check supporter status:', error);
        setIsSupporter(false);
      } finally {
        setLoading(false);
      }
    };

    checkSupporterStatus();
  }, []);

  // Function to refresh supporter status (call after login or when needed)
  const refreshSupporterStatus = async () => {
    try {
      setLoading(true);
      sessionStorage.removeItem('user_is_supporter');
      const result = await laboratoryTaskService.isCurrentUserSupporter();
      setIsSupporter(result);
      sessionStorage.setItem('user_is_supporter', result.toString());
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
  sessionStorage.removeItem('user_is_supporter');
};
