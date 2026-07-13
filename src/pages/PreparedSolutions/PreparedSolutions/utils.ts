import { PreparedSolutionStatus } from "../../../services/preparedSolutionService";

export const STATUS_LABEL: Record<PreparedSolutionStatus, string> = {
  [PreparedSolutionStatus.Active]: "Còn dùng",
  [PreparedSolutionStatus.NearlyEmpty]: "Sắp hết",
  [PreparedSolutionStatus.NearingExpiry]: "Sắp hết hạn",
  [PreparedSolutionStatus.Expired]: "Hết hạn",
  [PreparedSolutionStatus.Empty]: "Hết",
  [PreparedSolutionStatus.Processed]: "Đã xử lý",
};

export const STATUS_COLOR: Record<PreparedSolutionStatus, string> = {
  [PreparedSolutionStatus.Active]: "#52c41a",
  [PreparedSolutionStatus.NearlyEmpty]: "#fa8c16",
  [PreparedSolutionStatus.NearingExpiry]: "#faad14",
  [PreparedSolutionStatus.Expired]: "#f5222d",
  [PreparedSolutionStatus.Empty]: "#1677ff",
  [PreparedSolutionStatus.Processed]: "#8c8c8c",
};


export const TAB_STATUSES: Array<{
  key: string;
  label: string;
  status?: PreparedSolutionStatus;
  isHetOrHetHan?: boolean;
}> = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Còn dùng", status: PreparedSolutionStatus.Active },
  { key: "nearlyEmpty", label: "Sắp hết", status: PreparedSolutionStatus.NearlyEmpty },
  { key: "nearingExpiry", label: "Sắp hết hạn", status: PreparedSolutionStatus.NearingExpiry },
  { key: "hetOrHetHan", label: "Hết / Hết hạn", isHetOrHetHan: true },
  { key: "processed", label: "Đã xử lý", status: PreparedSolutionStatus.Processed },
];

export const formatVolume = (value: number, unitName?: string): string => {
  const rounded = Math.ceil(value * 1e8) / 1e8;
  const formatted = rounded % 1 === 0 ? rounded.toLocaleString("vi-VN") : rounded.toString();
  return unitName ? `${formatted} ${unitName}` : formatted;
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
