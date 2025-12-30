import { useState, useEffect, useCallback, useRef } from "react";
import { laboratoryTaskService } from "../services/laboratoryTaskService";
import { LabTechManagerPendingTaskDto } from "../types/laboratoryTask";
import { ROLES } from "../constants/roles";

// Storage keys
const LAST_SHOWN_TIME_KEY = "labTechManagerReminderLastShownTime";

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

interface UseLabTechManagerReminderPopupResult {
  open: boolean;
  tasks: LabTechManagerPendingTaskDto[];
  closePopup: () => void;
}

/**
 * Hook để quản lý popup nhắc nhở công việc cho Lab Technical Manager (QLKT)
 *
 * Logic:
 * - Khi login: hiển thị popup ngay nếu có task
 * - Định kỳ: hiển thị mỗi 1h
 *
 * Tên công việc (theo priority):
 * - "Cần duyệt kết quả" (PendingApproval)
 * - "Cần phân công công việc" (NotAssigned)
 * - "Sắp tới ngày trả kết quả thử nghiệm" (deadline <= 5 ngày)
 */
export const useLabTechManagerReminderPopup = (): UseLabTechManagerReminderPopupResult => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<LabTechManagerPendingTaskDto[]>([]);
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

    // Check if current user has LabTechnicalManager role
    const checkLabTechManagerRole = (): boolean => {
      try {
        const userInfoStr = localStorage.getItem("user_info");
        if (!userInfoStr) return false;

        const userInfo = JSON.parse(userInfoStr);
        const roles = userInfo.roles || [];
        return roles.includes(ROLES.LAB_TECHNICAL_MANAGER);
      } catch {
        return false;
      }
    };

    if (!checkLabTechManagerRole()) {
      return;
    }

    // Fetch pending tasks
    const fetchTasks = async (): Promise<LabTechManagerPendingTaskDto[]> => {
      try {
        const result = await laboratoryTaskService.getLabTechManagerPendingTasks();
        return result;
      } catch (error) {
        console.error("Error fetching lab tech manager pending tasks:", error);
        return [];
      }
    };

    // Show popup and update last shown time
    const showPopup = (taskList: LabTechManagerPendingTaskDto[]) => {
      if (taskList.length > 0) {
        setTasks(taskList);
        setOpen(true);
        localStorage.setItem(LAST_SHOWN_TIME_KEY, Date.now().toString());
      }
    };

    // Schedule next check based on remaining time
    const scheduleNextCheck = () => {
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
    };

    // Check and show popup (respects time intervals)
    const checkAndShowIfNeeded = async () => {
      // Lần đầu login (chưa có key) -> luôn gọi API
      const isFirstLogin = !localStorage.getItem(LAST_SHOWN_TIME_KEY);

      // Nếu không phải lần đầu, check thời gian TRƯỚC khi gọi API
      if (!isFirstLogin && !shouldShowPopup()) {
        scheduleNextCheck();
        return;
      }

      // Gọi API lấy tasks
      const taskList = await fetchTasks();

      if (taskList.length === 0) {
        // Không có task -> set key để tránh gọi API liên tục, schedule next check
        localStorage.setItem(LAST_SHOWN_TIME_KEY, Date.now().toString());
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
};

export default useLabTechManagerReminderPopup;
