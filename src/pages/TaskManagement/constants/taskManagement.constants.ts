import { LaboratoryTaskStatus } from "../../../types/laboratoryTask";

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: String(LaboratoryTaskStatus.NotAssignedMethod), label: "Chưa gán phương pháp" },
  { value: String(LaboratoryTaskStatus.AssignedMethod), label: "Đã gán phương pháp" },
  { value: String(LaboratoryTaskStatus.Testing), label: "Đang thí nghiệm" },
  { value: String(LaboratoryTaskStatus.PendingApproval), label: "Chờ duyệt kết quả" },
  { value: String(LaboratoryTaskStatus.Approved), label: "Đã duyệt" },
  { value: String(LaboratoryTaskStatus.ResultSent), label: "Đã gửi kết quả" },
];

export const PAGINATION_CONFIG = {
  defaultPageSize: 50,
  pageSizeOptions: [20, 50, 100],
};

export const TABLE_SCROLL = { x: 1100 };

export const URGENT_DAYS_THRESHOLD = 5;
