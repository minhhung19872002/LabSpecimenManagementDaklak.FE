import { TestRequestStatus, TestRequestStatusLabels } from "../../../types/testRequest";

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [50, 100, 150];
export const URGENT_DAYS_THRESHOLD = 5;

export const TABLE_SCROLL_X = 1600;

export const MESSAGES = {
  deleteSuccess: "Xóa yêu cầu thành công!",
  deleteError: "Không thể xóa yêu cầu. Vui lòng thử lại.",
  downloadTemplateSuccess: "Tải template thành công!",
  downloadTemplateError: "Không thể tải template. Vui lòng thử lại.",
};

export const STATUS_OPTIONS = [
  { value: "all" as const, label: "Tất cả trạng thái" },
  { value: TestRequestStatus.New, label: TestRequestStatusLabels[TestRequestStatus.New] },
  { value: TestRequestStatus.Pending, label: TestRequestStatusLabels[TestRequestStatus.Pending] },
  { value: TestRequestStatus.InProgress, label: TestRequestStatusLabels[TestRequestStatus.InProgress] },
  { value: TestRequestStatus.TestingCompleted, label: TestRequestStatusLabels[TestRequestStatus.TestingCompleted] },
  { value: TestRequestStatus.PendingApproval, label: TestRequestStatusLabels[TestRequestStatus.PendingApproval] },
  { value: TestRequestStatus.Approved, label: TestRequestStatusLabels[TestRequestStatus.Approved] },
  { value: TestRequestStatus.ResultSent, label: TestRequestStatusLabels[TestRequestStatus.ResultSent] },
  { value: TestRequestStatus.Completed, label: TestRequestStatusLabels[TestRequestStatus.Completed] },
];

export * from "./form";
export * from "./detail";