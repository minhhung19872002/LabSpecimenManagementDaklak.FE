import { useReminderPopup, ReminderPopupResult, ROLES } from "./useReminderPopup";
import { qualityManagementService } from "../services/qualityManagementService";
import { QualityManagerPendingTaskDto } from "../types/qualityManagement";

// Storage key
const STORAGE_KEY = "qualityManagerReminderLastShownTime";

// Interval: 1 hour
const REMINDER_INTERVAL = 60 * 60 * 1000;

/**
 * Hook để quản lý popup nhắc nhở công việc cho Quality Manager (QLCL)
 *
 * Logic:
 * - Khi login: hiển thị popup ngay nếu có task
 * - Định kỳ: hiển thị mỗi 1h
 *
 * Tên công việc (theo priority):
 * - "Có kết quả cần phê duyệt" (PendingApproval)
 * - "Kết quả cần bàn giao cho bộ phận nhận/ trả mẫu" (Approved/PendingSignature)
 * - "Sắp tới ngày trả kết quả thử nghiệm" (deadline <= 5 ngày)
 */
export const useQualityManagerReminderPopup = (): ReminderPopupResult<QualityManagerPendingTaskDto> => {
  return useReminderPopup<QualityManagerPendingTaskDto>({
    storageKey: STORAGE_KEY,
    requiredRole: ROLES.QUALITY_MANAGER,
    interval: REMINDER_INTERVAL,
    fetchTasks: () => qualityManagementService.getQualityManagerPendingTasks(),
    errorLogPrefix: "Error fetching quality manager pending tasks",
  });
};

export default useQualityManagerReminderPopup;