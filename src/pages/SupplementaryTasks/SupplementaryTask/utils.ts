import dayjs from "dayjs";
import { SupplementaryTaskPriority, SupplementaryTaskStatus } from "../../../services/supplementaryTaskService";

export const STATUS_LABEL: Record<SupplementaryTaskStatus, string> = {
  [SupplementaryTaskStatus.Pending]: "Chờ xử lý",
  [SupplementaryTaskStatus.Overdue]: "Quá hạn",
  [SupplementaryTaskStatus.Completed]: "Hoàn thành",
  [SupplementaryTaskStatus.Cancelled]: "Đã hủy",
};

export const STATUS_COLOR: Record<SupplementaryTaskStatus, string> = {
  [SupplementaryTaskStatus.Pending]: "#1677ff",
  [SupplementaryTaskStatus.Overdue]: "#f5222d",
  [SupplementaryTaskStatus.Completed]: "#52c41a",
  [SupplementaryTaskStatus.Cancelled]: "#8c8c8c",
};

export const PRIORITY_LABEL: Record<SupplementaryTaskPriority, string> = {
  [SupplementaryTaskPriority.Low]: "Thấp",
  [SupplementaryTaskPriority.Medium]: "Trung bình",
  [SupplementaryTaskPriority.High]: "Cao",
  [SupplementaryTaskPriority.Urgent]: "Ưu tiên",
};

export const PRIORITY_COLOR: Record<SupplementaryTaskPriority, string> = {
  [SupplementaryTaskPriority.Low]: "#8c8c8c",
  [SupplementaryTaskPriority.Medium]: "#1677ff",
  [SupplementaryTaskPriority.High]: "#fa8c16",
  [SupplementaryTaskPriority.Urgent]: "#f5222d",
};

export const PRIORITY_OPTIONS = [
  { label: "Thấp", value: SupplementaryTaskPriority.Low },
  { label: "Trung bình", value: SupplementaryTaskPriority.Medium },
  { label: "Cao", value: SupplementaryTaskPriority.High },
  { label: "Ưu tiên", value: SupplementaryTaskPriority.Urgent },
];

export const STATUS_OPTIONS_EDIT = [
  { label: "Chờ xử lý", value: SupplementaryTaskStatus.Pending },
  { label: "Hoàn thành", value: SupplementaryTaskStatus.Completed },
];

export const TAB_STATUS_OPTIONS: Array<{
  key: string;
  label: string;
  status?: SupplementaryTaskStatus;
}> = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý", status: SupplementaryTaskStatus.Pending },
  { key: "overdue", label: "Quá hạn", status: SupplementaryTaskStatus.Overdue },
  { key: "completed", label: "Hoàn thành", status: SupplementaryTaskStatus.Completed },
];

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export const isOverdueDate = (dateStr?: string, status?: SupplementaryTaskStatus): boolean => {
  if (!dateStr) return false;
  if (status === SupplementaryTaskStatus.Completed || status === SupplementaryTaskStatus.Cancelled) return false;
  // isBefore(..., 'day') matches backend DueDate.Date < today.Date — tasks due today are NOT overdue
  return dayjs(dateStr).isBefore(dayjs(), "day");
};
