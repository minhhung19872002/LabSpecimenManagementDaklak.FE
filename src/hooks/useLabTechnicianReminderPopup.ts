import { useReminderPopup, ReminderPopupResult, ROLES } from "./useReminderPopup";
import { laboratoryTaskService } from "../services/laboratoryTaskService";
import { LabTechnicianPendingTaskDto } from "../types/laboratoryTask";

// Storage key
const STORAGE_KEY = "labTechnicianReminderLastShownTime";

// Interval: 1 hour
const REMINDER_INTERVAL = 60 * 60 * 1000;

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
export const useLabTechnicianReminderPopup = (): ReminderPopupResult<LabTechnicianPendingTaskDto> => {
  return useReminderPopup<LabTechnicianPendingTaskDto>({
    storageKey: STORAGE_KEY,
    requiredRole: ROLES.LAB_TECHNICIAN,
    interval: REMINDER_INTERVAL,
    fetchTasks: () => laboratoryTaskService.getLabTechnicianPendingTasks(),
    errorLogPrefix: "Error fetching lab technician pending tasks",
  });
};

export default useLabTechnicianReminderPopup;