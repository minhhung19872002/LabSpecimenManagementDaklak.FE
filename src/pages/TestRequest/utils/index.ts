import dayjs from "dayjs";
import { TestRequestDto, TestRequestStatus } from "../../../types/testRequest";
import { URGENT_DAYS_THRESHOLD } from "../constants";

export const isUrgentRow = (record: TestRequestDto): boolean => {
  if (!record.expectedCompletionDate) return false;
  if (record.status >= TestRequestStatus.Completed) return false;
  const daysRemaining = dayjs(record.expectedCompletionDate).diff(dayjs(), "day");
  return daysRemaining <= URGENT_DAYS_THRESHOLD;
};

export const formatDate = (date: string): string => {
  return dayjs(date).format("DD/MM/YYYY");
};

export const formatCurrency = (value: number): string => {
  return value ? `${value.toLocaleString("vi-VN")}đ` : "-";
};