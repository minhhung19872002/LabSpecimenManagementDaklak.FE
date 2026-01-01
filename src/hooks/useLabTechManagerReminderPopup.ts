import { useReminderPopup, ReminderPopupResult, ROLES } from "./useReminderPopup";
import { laboratoryTaskService } from "../services/laboratoryTaskService";
import { LabTechManagerPendingTaskDto } from "../types/laboratoryTask";

// Storage key
const STORAGE_KEY = "labTechManagerReminderLastShownTime";

// Interval: 1 hour
const REMINDER_INTERVAL = 60 * 60 * 1000;

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
export const useLabTechManagerReminderPopup = (): ReminderPopupResult<LabTechManagerPendingTaskDto> => {
  return useReminderPopup<LabTechManagerPendingTaskDto>({
    storageKey: STORAGE_KEY,
    requiredRole: ROLES.LAB_TECHNICAL_MANAGER,
    interval: REMINDER_INTERVAL,
    fetchTasks: () => laboratoryTaskService.getLabTechManagerPendingTasks(),
    errorLogPrefix: "Error fetching lab tech manager pending tasks",
  });
};

export default useLabTechManagerReminderPopup;