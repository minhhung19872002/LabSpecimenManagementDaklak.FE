import { useState, useEffect, useCallback, useRef } from "react";
import { laboratoryTaskService } from "../services/laboratoryTaskService";
import { LabTechnicianPendingTaskDto } from "../types/laboratoryTask";
import { ROLES } from "../constants/roles";

// Storage keys
const LAST_SHOWN_TIME_KEY = "labTechnicianReminderLastShownTime";

// Intervals in milliseconds
const REMINDER_INTERVAL = 60 * 60 * 1000; // 1 hour

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
const shouldShowPopup = (): boolean => {
  const elapsed = getElapsedTime();

  // Never shown before (first login) -> show
  if (elapsed === null) return true;

  // Show after 1h
  if (elapsed >= REMINDER_INTERVAL) return true;

  return false;
};

/**
 * Calculate remaining time until next popup should show
 */
const getRemainingTime = (): number | null => {
  const elapsed = getElapsedTime();

  // Never shown before -> show immediately (return small delay)
  if (elapsed === null) return 100;

  const remaining = REMINDER_INTERVAL - elapsed;
  return remaining > 0 ? remaining : 0;
};

interface UseLabTechnicianReminderPopupResult {
  open: boolean;
  tasks: LabTechnicianPendingTaskDto[];
  closePopup: () => void;
}

/**
 * Hook để quản lý popup nhắc nhở công việc cho Lab Technician (KTV)
 *
 * Logic:
 * - Khi login: hiển thị popup ngay nếu có task
 * - Định kỳ: hiển thị mỗi 1h
 *
 * Tên công việc (theo priority):
 * - "Có kết quả cần thực hiện lại" (Rejected)
 * - "Có kết quả chỉ tiêu cần gửi" (Entered)
 * - "Có chỉ tiêu cần thực hiện" (Pending)
 */
export const useLabTechnicianReminderPopup = (): UseLabTechnicianReminderPopupResult => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<LabTechnicianPendingTaskDto[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLabTechnician = useRef(false);

  // Check if current user has LabTechnician role
  const checkLabTechnicianRole = useCallback((): boolean => {
    try {
      const userInfoStr = localStorage.getItem("user_info");
      if (!userInfoStr) return false;

      const userInfo = JSON.parse(userInfoStr);
      const roles = userInfo.roles || [];
      return roles.includes(ROLES.LAB_TECHNICIAN);
    } catch {
      return false;
    }
  }, []);

  // Fetch pending tasks
  const fetchTasks = useCallback(async (): Promise<LabTechnicianPendingTaskDto[]> => {
    try {
      const result = await laboratoryTaskService.getLabTechnicianPendingTasks();
      return result;
    } catch (error) {
      console.error("Error fetching lab technician pending tasks:", error);
      return [];
    }
  }, []);

  // Show popup and update last shown time
  const showPopup = useCallback((taskList: LabTechnicianPendingTaskDto[]) => {
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
  const scheduleNextCheck = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const remaining = getRemainingTime();
    if (remaining === null) return;

    // Schedule check after remaining time
    timeoutRef.current = setTimeout(async () => {
      const newTasks = await fetchTasks();
      if (newTasks.length > 0 && shouldShowPopup()) {
        showPopup(newTasks);
      }

      // Schedule next check with full interval
      scheduleNextCheck();
    }, remaining);
  }, [fetchTasks, showPopup]);

  // Check and show popup (respects time intervals)
  const checkAndShowIfNeeded = useCallback(async () => {
    const taskList = await fetchTasks();
    if (taskList.length === 0) {
      // Still schedule next check even if no tasks
      scheduleNextCheck();
      return;
    }

    // Check if should show based on elapsed time
    if (shouldShowPopup()) {
      showPopup(taskList);
    }

    // Schedule next check based on remaining time (not full interval)
    scheduleNextCheck();
  }, [fetchTasks, showPopup, scheduleNextCheck]);

  // Initial check on mount
  useEffect(() => {
    // Check role
    isLabTechnician.current = checkLabTechnicianRole();

    if (!isLabTechnician.current) {
      return;
    }

    // Initial fetch and show (respects time intervals)
    checkAndShowIfNeeded();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [checkLabTechnicianRole, checkAndShowIfNeeded]);

  return {
    open,
    tasks,
    closePopup,
  };
};

export default useLabTechnicianReminderPopup;
