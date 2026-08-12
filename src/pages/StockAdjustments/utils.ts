import React from "react";

export interface StockUnitInfo {
  volumePerUnit?: number;
  packagingUnitName?: string;
  volumeUnitName?: string;
  unitName?: string;
  baseUnitName?: string;
}

export function formatStockPackaging(qty: number, info: StockUnitInfo): string {
  const storageUnit = info.packagingUnitName || "";
  const volumeUnit = info.volumeUnitName || "";
  if (info.volumePerUnit && info.volumePerUnit > 0 && volumeUnit) {
    const intPart = Math.floor(qty);
    const decPart = qty - intPart;
    if (decPart === 0) return `${qty.toLocaleString("vi-VN")} ${storageUnit}`.trim();
    const consumableAmount = Math.round(decPart * info.volumePerUnit);
    return `${intPart.toLocaleString("vi-VN")} ${storageUnit} - ${consumableAmount.toLocaleString("vi-VN")} ${volumeUnit}`.trim();
  }
  const unit = info.unitName || "";
  return `${qty.toLocaleString("vi-VN")} ${unit}`.trim();
}

export function formatConsumableQuantity(qty: number, info: StockUnitInfo): string {
  if (info.volumePerUnit && info.volumePerUnit > 0 && info.volumeUnitName) {
    const consumable = qty * info.volumePerUnit;
    return `${consumable.toLocaleString("vi-VN")} ${info.volumeUnitName}`;
  }
  const unit = info.baseUnitName || info.unitName || "";
  return `${qty.toLocaleString("vi-VN")} ${unit}`.trim();
}

export function formatConsumption(value: number | null | undefined, info: StockUnitInfo): string {
  if (value == null || value <= 0) return "-";
  const unit = info.volumeUnitName || info.baseUnitName || info.unitName || "";
  return `${value.toLocaleString("vi-VN")} ${unit}`.trim();
}

export function renderExpectedStock(
  expected: number,
  info: StockUnitInfo,
): React.ReactNode {
  const volumeUnit = info.volumeUnitName || "";
  const storageUnit = info.packagingUnitName || "";

  if (info.volumePerUnit && info.volumePerUnit > 0 && volumeUnit) {
    const volumeLine = `${expected.toLocaleString("vi-VN")} ${volumeUnit}`;
    if (expected < 0) {
      return React.createElement("div", { style: { color: "#ff4d4f" } },
        React.createElement("div", null, volumeLine),
      );
    }
    const expectedBase = expected / info.volumePerUnit;
    const intPart = Math.floor(expectedBase);
    const decPart = expectedBase - intPart;
    const packagingLine = decPart === 0
      ? `${expectedBase.toLocaleString("vi-VN")} ${storageUnit}`
      : `${intPart.toLocaleString("vi-VN")} ${storageUnit} - ${Math.round(decPart * info.volumePerUnit).toLocaleString("vi-VN")} ${volumeUnit}`;
    return React.createElement("div", null,
      React.createElement("div", null, packagingLine),
      React.createElement("div", { style: { fontSize: 12, color: "#888" } }, volumeLine),
    );
  }

  const unit = info.baseUnitName || info.unitName || "";
  return `${expected.toLocaleString("vi-VN")} ${unit}`.trim();
}
