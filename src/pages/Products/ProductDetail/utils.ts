import dayjs from "dayjs";
import { ProductLotStockDto } from "../../../services/productService";
import { QUANTITY_FORMAT } from "../../../utils/formatters";

export type LotStatus = "ok" | "near" | "expired" | "empty";

export function getLotStatus(lot: ProductLotStockDto, nearExpiryDays = 30): LotStatus {
  if (lot.remainingBaseQuantity <= 0) return "empty";
  if (!lot.lotExpiryDate) return "ok";
  const now = dayjs();
  const expiry = dayjs(lot.lotExpiryDate);
  if (expiry.isBefore(now, "day")) return "expired";
  if (expiry.diff(now, "day") <= nearExpiryDays) return "near";
  return "ok";
}

export function getLotCountdownText(lotExpiryDate?: string): string {
  if (!lotExpiryDate) return "";
  const now = dayjs().startOf("day");
  const expiry = dayjs(lotExpiryDate).startOf("day");
  const diff = expiry.diff(now, "day");
  if (diff > 0) return `còn ${diff} ngày`;
  if (diff === 0) return "hết hạn hôm nay";
  return `quá hạn ${Math.abs(diff)} ngày`;
}

export function formatLotBaseQty(
  baseQty: number,
  packagingUnitName?: string,
  volumePerUnit?: number,
  volumeUnitName?: string,
): string {
  const unit = packagingUnitName || "";
  const fmt = (n: number) => n.toLocaleString("vi-VN", QUANTITY_FORMAT);
  if (!Number.isFinite(baseQty)) {
    return `0 ${unit}`.trim();
  }
  if (!volumePerUnit || volumePerUnit <= 0 || !volumeUnitName) {
    return `${fmt(baseQty)} ${unit}`.trim();
  }
  // Chuẩn hoá sai số float (20.9999999999 → 21) trước khi tách phần nguyên/lẻ.
  const sign = baseQty < 0 ? "-" : "";
  const absQty = Math.round(Math.abs(baseQty) * 1e6) / 1e6;
  const intPart = Math.floor(absQty);
  const decPart = absQty - intPart;
  // Thể tích của bình lẻ, làm tròn 2 chữ số thập phân.
  const remainingVol = Math.round(decPart * volumePerUnit * 100) / 100;

  // Số chẵn (hoặc phần lẻ quá nhỏ không hiển thị được) → chỉ hiện số bình: "20 Bình".
  if (remainingVol === 0) {
    return `${sign}${fmt(intPart)} ${unit}`.trim();
  }
  // Chưa đủ 1 bình → chỉ hiện thể tích: "5 Lít".
  if (intPart === 0) {
    return `${sign}${fmt(remainingVol)} ${volumeUnitName}`;
  }
  // Số lẻ → "20 Bình - 5 Lít": số phía sau là thể tích còn lại của bình lẻ.
  return `${sign}${fmt(intPart)} ${unit} - ${fmt(remainingVol)} ${volumeUnitName}`.trim();
}

export function getLotVolumeQty(lot: ProductLotStockDto): number {
  if (lot.volumePerUnit && lot.volumePerUnit > 0) {
    return lot.remainingBaseQuantity * lot.volumePerUnit;
  }
  return lot.remainingBaseQuantity;
}

export function getLotVolumeUnit(lot: ProductLotStockDto): string {
  return lot.volumeUnitName || lot.packagingUnitName || lot.baseUnitName || "";
}

// "Đã dùng 0,0000017% · còn 99,9999983%": tiêu hao rất nhỏ so với tồn (0,0008 g / 50.000 g)
// mà làm tròn 2 số lẻ thì luôn ra 0% → lấy đủ số lẻ để thấy 2 chữ số có nghĩa.
export function formatLotUsagePercent(usedPct: number): { used: string; remain: string } {
  const digits = usedPct > 0 && usedPct < 0.01
    ? Math.min(20, Math.ceil(-Math.log10(usedPct)) + 1)
    : 2;
  const fmt = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: digits });
  return { used: fmt(usedPct), remain: fmt(100 - usedPct) };
}

export const LOT_STATUS_CONFIG: Record<LotStatus, { label: string; color: string; bg: string; border: string }> = {
  ok: { label: "Còn hạn", color: "#389E0D", bg: "#F6FFED", border: "#b7eb8f" },
  near: { label: "Sắp hết hạn", color: "#D46B08", bg: "#FFFBE6", border: "#ffe58f" },
  expired: { label: "Đã hết hạn", color: "#CF1322", bg: "#FFF1F0", border: "#ffa39e" },
  empty: { label: "Hết tồn", color: "rgba(0,0,0,0.45)", bg: "#fafafa", border: "#d9d9d9" },
};

export const LOT_BAR_COLORS: Record<LotStatus, string> = {
  ok: "#52c41a",
  near: "#faad14",
  expired: "#ff4d4f",
  empty: "#d9d9d9",
};

const toTime = (iso?: string): number =>
  iso ? new Date(iso).getTime() : Number.MAX_SAFE_INTEGER;

/**
 * FEFO comparator: lô có HSD sớm nhất trước (không có HSD xếp cuối);
 * trùng HSD thì lô nhập kho trước xếp trước (theo yêu cầu BA).
 */
export const compareLotsFefo = (a: ProductLotStockDto, b: ProductLotStockDto): number => {
  const expiryDiff = toTime(a.lotExpiryDate) - toTime(b.lotExpiryDate);
  if (expiryDiff !== 0) return expiryDiff;
  return toTime(a.firstImportDate) - toTime(b.firstImportDate);
};

/** Danh sách lô còn dùng được (còn hạn / sắp hết hạn), sắp theo FEFO */
export const getUsableLotsFefo = (lots: ProductLotStockDto[]): ProductLotStockDto[] =>
  lots
    .filter((l) => {
      const st = getLotStatus(l);
      return st === "ok" || st === "near";
    })
    .sort(compareLotsFefo);

/** Lô đã bắt đầu được sử dụng (có tiêu hao) */
export const isLotInUse = (lot: ProductLotStockDto): boolean =>
  (lot.consumedBaseQuantity ?? 0) > 0 || (lot.theoreticalConsumption ?? 0) > 0;

/**
 * "Lô tiếp theo" theo FEFO (quy tắc BA):
 * - Chưa dùng lô nào  -> lô có HSD gần nhất (lô sẽ dùng đầu tiên).
 * - Có lô đang dùng   -> lô thứ 2 trong FEFO order (lô dùng sau khi lô đầu hết).
 * - Chỉ có 1 lô còn tồn -> không có (null).
 */
export const getNextFefoLot = (lots: ProductLotStockDto[]): ProductLotStockDto | null => {
  const fefo = getUsableLotsFefo(lots);
  if (fefo.length < 2) return null;
  const anyInUse = fefo.some(isLotInUse);
  if (!anyInUse) return fefo[0];
  return fefo[1];
};
