import { TestingStatus, TestingTabType } from "../../../types/testing";

export const STATUS_FILTER_OPTIONS = [
  { value: TestingStatus.Todo, label: "Cần làm" },
  { value: TestingStatus.InProgress, label: "Đang thí nghiệm" },
  { value: TestingStatus.Done, label: "Đã xong" },
];

export const TAB_ITEMS = [
  {
    key: String(TestingTabType.MyAssignments),
    label: "Phân công của tôi",
    icon: "user",
  },
  {
    key: String(TestingTabType.All),
    label: "Hiển thị tất cả",
    icon: "team",
  },
];

export const PAGINATION_CONFIG = {
  defaultPageSize: 50,
  pageSizeOptions: [20, 50, 100],
};

export const TABLE_SCROLL = { x: 1000 };
