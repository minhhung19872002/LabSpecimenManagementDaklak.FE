import { useState, useEffect, useCallback, useRef } from "react";
import { testRequestService } from "../services/testRequestService";
import { SampleReceiverPendingTaskDto, TestRequestStatus } from "../types/testRequest";
import { ROLES } from "../constants/roles";

// Storage keys
const LAST_SHOWN_TIME_KEY = "workReminderLastShownTime";

// Intervals in milliseconds
const PENDING_INTERVAL = 60 * 60 * 1000; // 1 hour
const RESULT_SENT_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Get elapsed time since last shown
 */
const getElapsedTime = (): number | null => {
  const lastShownStr = localStorage.getItem(LAST_SHOWN_TIME_KEY);
  if (!lastShownStr) return null;

  const lastShown = parseInt(lastShownStr, 10);
  return Date.now() - lastShown;
};

/**
 * Check if enough time has passed since last shown
 * Returns true if should show popup
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
 * Calculate remaining time until next popup should show
 */
const getRemainingTime = (hasPending: boolean, hasResultSent: boolean): number | null => {
  const elapsed = getElapsedTime();

  // Never shown before -> show immediately (return 0 or small delay)
  if (elapsed === null) return 100; // Small delay for initial render

  const targetInterval = hasPending ? PENDING_INTERVAL : (hasResultSent ? RESULT_SENT_INTERVAL : null);
  if (!targetInterval) return null;

  const remaining = targetInterval - elapsed;
  return remaining > 0 ? remaining : 0;
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
 */
export const useWorkReminderPopup = (): UseWorkReminderPopupResult => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<SampleReceiverPendingTaskDto[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSampleReceiver = useRef(false);

  // Check if current user has SampleReceiver role
  const checkSampleReceiverRole = useCallback((): boolean => {
    try {
      const userInfoStr = localStorage.getItem("user_info");
      if (!userInfoStr) return false;

      const userInfo = JSON.parse(userInfoStr);
      const roles = userInfo.roles || [];
      return roles.includes(ROLES.SAMPLE_RECEIVER);
    } catch {
      return false;
    }
  }, []);

  // Fetch pending tasks
  const fetchTasks = useCallback(async (): Promise<SampleReceiverPendingTaskDto[]> => {
    try {
      const result = await testRequestService.getSampleReceiverPendingTasks();
      return result;
    } catch (error) {
      console.error("Error fetching sample receiver pending tasks:", error);
      return [];
    }
  }, []);

  // Show popup and update last shown time
  const showPopup = useCallback((taskList: SampleReceiverPendingTaskDto[]) => {
    if (taskList.length > 0) {
      setTasks(taskList);
      setOpen(true);
      localStorage.setItem(LAST_SHOWN_TIME_KEY, Date.now().toString());
    }
  }, []);

  // Close popup
  const closePopup = useCallback(() => {
    setOpen(false);
  }, []);

  // Schedule next check based on remaining time
  const scheduleNextCheck = useCallback((hasPending: boolean, hasResultSent: boolean) => {
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
        const newHasPending = newTasks.some(t => t.status === TestRequestStatus.Pending);
        const newHasResultSent = newTasks.some(t => t.status === TestRequestStatus.ResultSent);

        if (shouldShowPopup(newHasPending, newHasResultSent)) {
          showPopup(newTasks);
        }

        // Schedule next check with full interval
        scheduleNextCheck(newHasPending, newHasResultSent);
      }
    }, remaining);
  }, [fetchTasks, showPopup]);

  // Check and show popup (respects time intervals)
  const checkAndShowIfNeeded = useCallback(async () => {
    const taskList = await fetchTasks();
    if (taskList.length === 0) return;

    const hasPending = taskList.some(t => t.status === TestRequestStatus.Pending);
    const hasResultSent = taskList.some(t => t.status === TestRequestStatus.ResultSent);

    // Check if should show based on elapsed time
    if (shouldShowPopup(hasPending, hasResultSent)) {
      showPopup(taskList);
    }

    // Schedule next check based on remaining time (not full interval)
    scheduleNextCheck(hasPending, hasResultSent);
  }, [fetchTasks, showPopup, scheduleNextCheck]);

  // Initial check on mount
  useEffect(() => {
    // Check role
    isSampleReceiver.current = checkSampleReceiverRole();

    if (!isSampleReceiver.current) {
      return;
    }

    // Initial fetch and show (respects time intervals)
    checkAndShowIfNeeded();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [checkSampleReceiverRole, checkAndShowIfNeeded]);

  return {
    open,
    tasks,
    closePopup,
  };
};

export default useWorkReminderPopup;
