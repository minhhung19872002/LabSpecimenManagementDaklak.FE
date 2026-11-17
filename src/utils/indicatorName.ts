/**
 * Tên chỉ tiêu sửa riêng trên chứng từ (phiếu thử nghiệm / báo giá) — không đổi danh mục.
 * BE chỉ ghi khi user là admin (hoặc tên trùng tên đã sửa trên báo giá nguồn).
 */
export interface CustomIndicatorName {
  /** Tên thường (bỏ định dạng) */
  name: string;
  /** Tên có định dạng (HTML từ RichTextEditor) */
  formattedName: string;
}

/** Giới hạn tên thường — khớp cột IndicatorName của báo giá (varchar 256) */
export const CUSTOM_INDICATOR_NAME_MAX_LENGTH = 256;

/** Bỏ thẻ HTML, decode entity, gộp khoảng trắng (khớp IndicatorNameEditor.ToPlainText ở BE) */
export const toPlainIndicatorName = (html: string | null | undefined): string => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html.replace(/<[^>]+>/g, " "), "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
};

const plainOf = (name?: string | null, formattedName?: string | null): string =>
  (name || "").replace(/\s+/g, " ").trim() || toPlainIndicatorName(formattedName);

/** Dữ liệu cũ lưu tiếng Việt dạng tổ hợp (NFD), editor gửi NFC → chuẩn hóa trước khi so */
const nfc = (s?: string | null): string => (s || "").normalize("NFC").trim();

/** Hai tên chỉ tiêu (thường + định dạng) có giống nhau không — 1 bên thiếu định dạng thì chỉ so tên thường */
export const isSameIndicatorName = (
  a: { name?: string | null; formattedName?: string | null },
  b: { name?: string | null; formattedName?: string | null },
): boolean => {
  if (nfc(plainOf(a.name, a.formattedName)) !== nfc(plainOf(b.name, b.formattedName))) return false;
  const fa = nfc(a.formattedName);
  const fb = nfc(b.formattedName);
  return !fa || !fb || fa === fb;
};

/**
 * Tên đã lưu trên chứng từ khác tên danh mục → trả về tên sửa; giống (hoặc không có tên) → undefined.
 */
export const pickCustomIndicatorName = (
  saved: { name?: string | null; formattedName?: string | null },
  master: { name?: string | null; formattedName?: string | null } | undefined,
): CustomIndicatorName | undefined => {
  const name = plainOf(saved.name, saved.formattedName);
  if (!name || !master || isSameIndicatorName(saved, master)) return undefined;
  return { name, formattedName: saved.formattedName?.trim() || name };
};
