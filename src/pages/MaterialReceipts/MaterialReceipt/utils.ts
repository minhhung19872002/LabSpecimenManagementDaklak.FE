import type { CentralWarehouseProductDto } from "../../../services/materialReceiptService";

export const formatExpiryDate = (date?: string | null): string => {
  if (!date) return "—";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatStockDisplay = (
  baseQty?: number,
  storageUnit?: string,
  consumableUnit?: string,
  volumePerUnit?: number,
): string => {
  if (baseQty == null) return "—";

  const formattedQty = baseQty.toLocaleString("vi-VN");
  if (!consumableUnit || !volumePerUnit || volumePerUnit <= 0) {
    return `${formattedQty} ${storageUnit || ""}`.trim();
  }

  const storageQty = Math.floor(baseQty);
  const fractionalQty = Math.max(0, baseQty - storageQty);
  const consumableQty = Math.round(fractionalQty * volumePerUnit);
  if (consumableQty === 0) {
    return `${storageQty.toLocaleString("vi-VN")} ${storageUnit || ""}`.trim();
  }
  return `${storageQty.toLocaleString("vi-VN")} ${storageUnit || ""} - ${consumableQty.toLocaleString("vi-VN")} ${consumableUnit}`.trim();
};

export interface MaterialReceiptLineItem {
  id?: string;
  key: string;
  productId: string;
  productName: string;
  identificationCode?: string;
  technicalSpec?: string;
  casNumber?: string;
  nearestExpiryDate?: string;
  productType?: number;
  unitId?: string;
  unitName?: string;
  quantity: number | null;
  skuId?: string;
  receivingWarehouseId?: string;
  receivingWarehouseName?: string;
  availableUnits: { unitId: string; unitName: string; isConsumable: boolean }[];
  centralStockBaseQty: number;
  storageUnitName?: string;
  consumableUnitName?: string;
  volumePerUnit?: number;
  skus: CentralWarehouseProductDto["skus"];
  currentStockBaseQty?: number;
  currentStockStorageUnitName?: string;
  currentStockConsumableUnitName?: string;
  currentStockVolumePerUnit?: number;
  currentStockLoading?: boolean;
}

export const resolveLineItemBaseQuantity = (
  item: MaterialReceiptLineItem,
  quantity: number,
): number => {
  const sku = item.skus.find((candidate) => candidate.skuId === item.skuId);
  const consumableUnitId = sku?.consumableUnitId ??
    item.availableUnits.find((unit) => unit.isConsumable)?.unitId;
  const volumePerUnit = sku?.volumePerUnit ?? item.volumePerUnit;

  if (item.unitId === consumableUnitId && volumePerUnit && volumePerUnit > 0) {
    return quantity / volumePerUnit;
  }

  return quantity;
};

export const buildLineItemFromProduct = (
  product: CentralWarehouseProductDto,
): MaterialReceiptLineItem => {
  const defaultUnit = product.availableUnits.find((u) => !u.isConsumable) ||
    product.availableUnits[0];
  const defaultSku = product.skus.find(
    (sku) =>
      sku.consumableUnitId === defaultUnit?.unitId ||
      sku.storageUnitId === defaultUnit?.unitId,
  );

  return {
    key: product.productId,
    productId: product.productId,
    productName: product.productName,
    identificationCode: product.identificationCode,
    technicalSpec: product.technicalSpec,
    casNumber: product.casNumber,
    nearestExpiryDate: product.nearestExpiryDate,
    productType: product.productType,
    unitId: defaultUnit?.unitId,
    unitName: defaultUnit?.unitName,
    skuId: defaultSku?.skuId,
    quantity: null,
    availableUnits: product.availableUnits,
    centralStockBaseQty: product.centralStockBaseQty,
    storageUnitName: product.storageUnitName,
    consumableUnitName: product.consumableUnitName,
    volumePerUnit: product.volumePerUnit,
    skus: product.skus,
  };
};
