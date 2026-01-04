import { useState, useEffect, useCallback, useRef } from "react";
import { testRequestService } from "../services/testRequestService";
import { SampleReceiverPendingTaskDto, TestRequestStatus } from "../types/testRequest";
import { ROLES, STORAGE_KEYS } from "../constants";

// Storage key
const STORAGE_KEY = STORAGE_KEYS.WORK_REMINDER_LAST_SHOWN;

// Intervals in milliseconds
const PENDING_INTERVAL = 60 * 60 * 1000; // 1 hour
const RESULT_SENT_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Get elapsed time since last shown
 */
const getElapsedTime = (): number | null => {
  const lastShownStr = localStorage.getItem(STORAGE_KEY);
  if (!lastShownStr) return null;

  const lastShown = parseInt(lastShownStr, 10);
  return Date.now() - lastShown;
};

/**
 * Check if enough time has passed since last shown
 * Uses different intervals based on task types
 */
const shouldShowPopup = (hasPending: boolean, hasResultSent: boolean): boolean => {
  const elapsed = getElapsedTime();

  // Never shown before (first login) -> show
  if (elapsed === null) return true;

  // If has Pending tasks, show after 1h
  if (hasPending && elapsed >= PENDING_INTERVAL) return true;

  // If only has ResultSent tasks, show after 2h
  if (!hasPending && hasResultSent && elapsed >= RESULT_SENT_INTERVAL) return true;

  return false;
};

/**
 * Check if minimum time has passed (used before API call)
 * Uses the shortest interval (1h) to determine if we should fetch
 */
const shouldFetchTasks = (): boolean => {
  const elapsed = getElapsedTime();

  // Never shown before (first login) -> fetch
  if (elapsed === null) return true;

  // Use minimum interval (1h) to check if we should fetch
  if (elapsed >= PENDING_INTERVAL) return true;

  return false;
};

/**
 * Calculate remaining time until next popup should show
 */
const getRemainingTime = (hasPending: boolean, hasResultSent: boolean): number | null => {
  const elapsed = getElapsedTime();

  // Never shown before -> show immediately (return small delay)
  if (elapsed === null) return 100;

  const targetInterval = hasPending ? PENDING_INTERVAL : (hasResultSent ? RESULT_SENT_INTERVAL : null);
  if (!targetInterval) return null;

  const remaining = targetInterval - elapsed;
  return remaining > 0 ? remaining : 0;
};

/**
 * Check if user has SampleReceiver role
 */
const checkSampleReceiverRole = (): boolean => {
  try {
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userInfoStr) return false;

    const userInfo = JSON.parse(userInfoStr);
    const roles = userInfo.roles || [];
    return roles.includes(ROLES.SAMPLE_RECEIVER);
  } catch {
    return false;
  }
};

interface UseWorkReminderPopupResult {
  open: boolean;
  tasks: SampleReceiverPendingTaskDto[];
  closePopup: () => void;
}

/**
 * Hook để quản lý popup nhắc nhở công việc cho SampleReceiver
 *
 * Logic:
 * - Khi login: hiển thị popup ngay nếu có task
 * - Định kỳ:
 *   - Có task Pending (Chờ xử lý): hiển thị mỗi 1h (popup vẫn include cả ResultSent)
 *   - Chỉ có task ResultSent (Gửi khách hàng): hiển thị mỗi 2h
 *
 * Tên công việc:
 * - Pending → "Cần chuyển mẫu thử nghiệm"
 * - ResultSent → "Cần trả kết quả cho khách hàng"
 *
 * NOTE: Hook này có logic phức tạp hơn các reminder hooks khác
 * vì có 2 intervals khác nhau tùy vào loại task.
 */
export const useWorkReminderPopup = (): UseWorkReminderPopupResult => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<SampleReceiverPendingTaskDto[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

    if (!checkSampleReceiverRole()) {
      return;
    }

    // Fetch pending tasks
    const fetchTasks = async (): Promise<SampleReceiverPendingTaskDto[]> => {
      try {
        return await testRequestService.getSampleReceiverPendingTasks();
      } catch (error) {
        console.error("Error fetching sample receiver pending tasks:", error);
        return [];
      }
    };

    // Show popup and update last shown time
    const showPopup = (taskList: SampleReceiverPendingTaskDto[]) => {
      if (taskList.length > 0) {
        setTasks(taskList);
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    };

    // Schedule next check based on remaining time
    const scheduleNextCheck = (hasPending: boolean, hasResultSent: boolean) => {
      // Clear existing timeout
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }

      const remaining = getRemainingTime(hasPending, hasResultSent);
      if (remaining === null) return;

      // Schedule check after remaining time
      intervalRef.current = setTimeout(async () => {
        const newTasks = await fetchTasks();
        if (newTasks.length > 0) {
          const newHasPending = newTasks.some(t => t.status === TestRequestStatus.New);
          const newHasResultSent = newTasks.some(t => t.status === TestRequestStatus.ResultSent);

          if (shouldShowPopup(newHasPending, newHasResultSent)) {
            showPopup(newTasks);
          }

          // Schedule next check with full interval
          scheduleNextCheck(newHasPending, newHasResultSent);
        }
      }, remaining);
    };

    // Check and show popup (respects time intervals)
    const checkAndShowIfNeeded = async () => {
      // Lần đầu login (chưa có key) -> luôn gọi API
      const isFirstLogin = !localStorage.getItem(STORAGE_KEY);

      // Nếu không phải lần đầu, check thời gian TRƯỚC khi gọi API
      if (!isFirstLogin && !shouldFetchTasks()) {
        // Schedule với minimum interval vì chưa biết task types
        scheduleNextCheck(true, false);
        return;
      }

      // Gọi API lấy tasks
      const taskList = await fetchTasks();

      if (taskList.length === 0) {
        // Không có task -> set key để tránh gọi API liên tục, schedule với minimum interval
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        scheduleNextCheck(true, false);
        return;
      }

      const hasPending = taskList.some(t => t.status === TestRequestStatus.New);
      const hasResultSent = taskList.some(t => t.status === TestRequestStatus.ResultSent);

      // Check if should show based on elapsed time và task types
      if (shouldShowPopup(hasPending, hasResultSent)) {
        showPopup(taskList);
      }

      // Schedule next check based on remaining time (not full interval)
      scheduleNextCheck(hasPending, hasResultSent);
    };

    // Initial fetch and show (respects time intervals)
    checkAndShowIfNeeded();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []); // Empty dependency - chỉ chạy một lần khi mount

  return {
    open,
    tasks,
    closePopup,
  };
};

export default useWorkReminderPopup;