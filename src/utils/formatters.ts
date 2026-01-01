import dayjs from "dayjs";

/**
 * Format date to DD/MM/YYYY format
 * @param date - Date string or null/undefined
 * @returns Formatted date string or "-" if no date
 */
export const formatDate = (date: string | null | undefined): string =>
  date ? dayjs(date).format("DD/MM/YYYY") : "-";

/**
 * Format date to DD/MM/YYYY HH:mm format
 * @param date - Date string or null/undefined
 * @returns Formatted datetime string or "-" if no date
 */
export const formatDateTime = (date: string | null | undefined): string =>
  date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-";

/**
 * Format currency value to Vietnamese VND format
 * @param value - Number value
 * @returns Formatted currency string with VND suffix
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

/**
 * Format number with thousands separator
 * @param value - Number value
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("vi-VN").format(value);
};