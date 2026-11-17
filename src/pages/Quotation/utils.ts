import type { QuotationPdfIndicatorDto } from "../../services/quotationService";

const htmlToPlainText = (html: string): string =>
  new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";

/**
 * Tên chỉ tiêu khi xuất PDF/gửi email báo giá: dùng formattedName SNAPSHOT lưu lúc lập báo giá
 * (BE trả về snapshot, fallback master nếu thiếu) — giống màn hình chi tiết. Sửa/xóa master data
 * sau đó không làm đổi tên trên báo giá đã lập. Đơn giá vẫn giữ theo báo giá (caller tự truyền unitPrice).
 *
 * Gửi cả tên plain: BE chỉ dùng formattedName khi có thẻ HTML, còn lại in indicatorName.
 */
export const getPdfIndicatorNames = (indicator: {
  indicatorName: string;
  indicatorFormattedName?: string | null;
}): Pick<QuotationPdfIndicatorDto, "indicatorName" | "indicatorFormattedName"> => {
  const formattedName = indicator.indicatorFormattedName?.trim();
  if (!formattedName) {
    return { indicatorName: indicator.indicatorName };
  }
  return {
    indicatorName: htmlToPlainText(formattedName).trim() || indicator.indicatorName,
    indicatorFormattedName: formattedName,
  };
};

/**
 * Tên file PDF báo giá riêng cho mỗi lần tải: BaoGia_<số báo giá>_<yyyyMMdd_HHmmss>.pdf.
 * Tên cố định "BaoGia.pdf" khiến điện thoại/một số trình duyệt mở lại file cũ đã tải trước đó.
 */
export const buildQuotationPdfFileName = (quotationNumber?: string | null, now: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const safeNumber = quotationNumber?.trim().replace(/[\\/:*?"<>|\s]+/g, "_");
  return safeNumber ? `BaoGia_${safeNumber}_${timestamp}.pdf` : `BaoGia_${timestamp}.pdf`;
};

/** Thời gian giữ object URL sau khi bấm tải — revoke ngay có thể làm hỏng lượt tải trên Safari/mobile */
const OBJECT_URL_REVOKE_DELAY_MS = 60_000;

export const downloadPdfFromObjectUrl = (objectUrl: string, fileName: string): void => {
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), OBJECT_URL_REVOKE_DELAY_MS);
};
