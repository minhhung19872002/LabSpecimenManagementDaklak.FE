import type { QuotationPdfIndicatorDto } from "../../services/quotationService";

const htmlToPlainText = (html: string): string =>
  new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";

/**
 * Tên chỉ tiêu khi xuất PDF/gửi email báo giá: lấy theo master data (formattedName đọc từ
 * danh mục mỗi lần load) giống màn hình, KHÔNG dùng tên snapshot lưu lúc lập báo giá.
 * Đơn giá vẫn giữ theo báo giá (caller tự truyền unitPrice).
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
