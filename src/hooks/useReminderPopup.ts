import { useState, useEffect, useCallback, useRef } from "react";
import { ROLES, STORAGE_KEYS } from "../constants";

/**
 * Configuration for reminder popup hook
 */
export interface ReminderPopupConfig<T> {
  /** Key for storing last shown time in localStorage */
  storageKey: string;
  /** Role required to show reminder */
  requiredRole: string;
  /** Interval in milliseconds between reminders */
  interval: number;
  /** Function to fetch pending tasks */
  fetchTasks: () => Promise<T[]>;
  /** Error log message prefix */
  errorLogPrefix: string;
}

/**
 * Result type for reminder popup hook
 */
export interface ReminderPopupResult<T> {
  open: boolean;
  tasks: T[];
  closePopup: () => void;
}

/**
 * Get elapsed time since last shown
 */
const getElapsedTime = (storageKey: string): number | null => {
  const lastShownStr = localStorage.getItem(storageKey);
  if (!lastShownStr) return null;

  const lastShown = parseInt(lastShownStr, 10);
  return Date.now() - lastShown;
};

/**
 * Check if enough time has passed since last shown
 */
const shouldShowPopup = (storageKey: string, interval: number): boolean => {
  const elapsed = getElapsedTime(storageKey);

  // Never shown before (first login) -> show
  if (elapsed === null) return true;

  // Show after interval
  if (elapsed >= interval) return true;

  return false;
};

/**
 * Calculate remaining time until next popup should show
 */
const getRemainingTime = (storageKey: string, interval: number): number | null => {
  const elapsed = getElapsedTime(storageKey);

  // Never shown before -> show immediately (return small delay)
  if (elapsed === null) return 100;

  const remaining = interval - elapsed;
  return remaining > 0 ? remaining : 0;
};

/**
 * Check if user has required role
 */
const checkUserRole = (requiredRole: string): boolean => {
  try {
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userInfoStr) return false;

    const userInfo = JSON.parse(userInfoStr);
    const roles = userInfo.roles || [];
    return roles.includes(requiredRole);
  } catch {
    return false;
  }
};

/**
 * Generic hook factory để quản lý popup nhắc nhở công việc
 *
 * Logic:
 * - Khi login: hiển thị popup ngay nếu có task
 * - Định kỳ: hiển thị theo interval config
 */
export function useReminderPopup<T>(
  config: ReminderPopupConfig<T>
): ReminderPopupResult<T> {
  const { storageKey, requiredRole, interval, fetchTasks, errorLogPrefix } = config;

  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Close popup
  const closePopup = useCallback(() => {
    setOpen(false);
  }, []);

  // Initial check on mount - chỉ chạy một lần
  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Check role
    if (!checkUserRole(requiredRole)) {
      return;
    }

    // Fetch tasks wrapper
    const doFetchTasks = async (): Promise<T[]> => {
      try {
        return await fetchTasks();
      } catch (error) {
        console.error(`${errorLogPrefix}:`, error);
        return [];
      }
    };

    // Show popup and update last shown time
    const showPopup = (taskList: T[]) => {
      if (taskList.length > 0) {
        setTasks(taskList);
        setOpen(true);
        localStorage.setItem(storageKey, Date.now().toString());
      }
    };

    // Schedule next check based on remaining time
    const scheduleNextCheck = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const remaining = getRemainingTime(storageKey, interval);
      if (remaining === null) return;

      // Schedule check after remaining time
      timeoutRef.current = setTimeout(async () => {
        const newTasks = await doFetchTasks();
        if (newTasks.length > 0 && shouldShowPopup(storageKey, interval)) {
          showPopup(newTasks);
        }

        // Schedule next check with full interval
        scheduleNextCheck();
      }, remaining);
    };

    // Check and show popup (respects time intervals)
    const checkAndShowIfNeeded = async () => {
      // Lần đầu login (chưa có key) -> luôn gọi API
      const isFirstLogin = !localStorage.getItem(storageKey);

      // Nếu không phải lần đầu, check thời gian TRƯỚC khi gọi API
      if (!isFirstLogin && !shouldShowPopup(storageKey, interval)) {
        scheduleNextCheck();
        return;
      }

      // Gọi API lấy tasks
      const taskList = await doFetchTasks();

      if (taskList.length === 0) {
        // Không có task -> set key để tránh gọi API liên tục, schedule next check
        localStorage.setItem(storageKey, Date.now().toString());
        scheduleNextCheck();
        return;
      }

      // Có task -> hiển thị popup (showPopup sẽ set key)
      showPopup(taskList);

      // Schedule next check
      scheduleNextCheck();
    };

    // Initial fetch and show (respects time intervals)
    checkAndShowIfNeeded();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency - chỉ chạy một lần khi mount

  return {
    open,
    tasks,
    closePopup,
  };
}

// Re-export ROLES for convenience
export { ROLES };