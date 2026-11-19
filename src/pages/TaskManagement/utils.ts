import dayjs from "dayjs";
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
} from "../../types/laboratoryTask";
import { TestRequestStatus } from "../../types/testRequest";

/** Số ngày trước "Ngày YC xong" bắt đầu cảnh báo trễ (BA) */
export const DEADLINE_WARNING_DAYS = 7;

/**
 * Các trạng thái còn đang xử lý cần cảnh báo trễ hạn (BA):
 * Đánh giá thử nghiệm | Cần phân công công việc | Đang thử nghiệm | Chờ duyệt
 */
const DEADLINE_WARNING_STATUSES = new Set<LaboratoryTaskStatus>([
  LaboratoryTaskStatus.UnderEvaluation,
  LaboratoryTaskStatus.PartialAccepted, // label "Cần phân công công việc"
  LaboratoryTaskStatus.FullyAccepted, // label "Cần phân công công việc"
  LaboratoryTaskStatus.InProgress,
  LaboratoryTaskStatus.WaitingApproval,
]);

/**
 * Task sắp/đã trễ hạn: trạng thái thuộc 4 trạng thái BA và hôm nay cách "Ngày YC xong" ≤ 7 ngày
 * (tính theo ngày lịch, gồm cả đã quá hạn). Phiếu YC đã hủy không cảnh báo.
 */
export const isTaskNearDeadline = (
  record: Pick<LaboratoryTaskDto, "status" | "requestCompletionDate" | "testRequestStatus">,
): boolean => {
  if (!record.requestCompletionDate) return false;
  if (record.testRequestStatus === TestRequestStatus.Cancelled) return false;
  if (!DEADLINE_WARNING_STATUSES.has(record.status)) return false;

  const daysRemaining = dayjs(record.requestCompletionDate)
    .startOf("day")
    .diff(dayjs().startOf("day"), "day");
  return daysRemaining <= DEADLINE_WARNING_DAYS;
};
