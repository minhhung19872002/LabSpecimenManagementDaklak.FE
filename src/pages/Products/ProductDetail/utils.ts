import dayjs from "dayjs";
import { ProductLotStockDto } from "../../../services/productService";

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
  if (!volumePerUnit || volumePerUnit <= 0 || !volumeUnitName) {
    const unit = packagingUnitName || "";
    return `${baseQty.toLocaleString("vi-VN")} ${unit}`.trim();
  }
  const totalVolume = baseQty * volumePerUnit;
  const intPart = Math.floor(baseQty);
  const decPart = baseQty - intPart;
  if (decPart === 0) {
    return `${intPart.toLocaleString("vi-VN")} ${packagingUnitName || ""} - ${totalVolume.toLocaleString("vi-VN")} ${volumeUnitName}`.trim();
  }
  const remainingVol = Math.round(decPart * volumePerUnit);
  return `${intPart.toLocaleString("vi-VN")} ${packagingUnitName || ""} - ${remainingVol.toLocaleString("vi-VN")} ${volumeUnitName}`.trim();
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
