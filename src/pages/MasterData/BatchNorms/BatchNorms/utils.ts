import type { ProductDto } from "../../../../services/productService";
import { ProductType } from "../../../../services/productService";

/** Số lượng tiêu hao: vi-VN, tối đa 4 số lẻ (BR-03) */
export const formatNormQuantity = (value?: number | null): string => {
  if (value == null) return "—";
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 4 });
};

/** Đơn vị tiêu hao của vật tư: đơn vị thể tích nếu có, không thì đơn vị cơ bản (giống BE) */
export const getNormUnitName = (product?: ProductDto | null): string | undefined =>
  product ? product.volumeUnitName || product.baseUnitName : undefined;

/**
 * Quy lượng tiêu hao về đơn vị kho: vd 50 ml với chai 500 ml → 0,1 chai.
 * Vật tư không khai thể tích → đơn vị tiêu hao chính là đơn vị kho.
 */
export const toStockUnitText = (product: ProductDto | undefined, quantity?: number | null): string => {
  if (!product || quantity == null) return "—";
  if (product.volumeUnitId && product.volumePerUnit && product.volumePerUnit > 0) {
    return `${formatNormQuantity(quantity / product.volumePerUnit)} ${product.baseUnitName ?? ""}`.trim();
  }
  return `${formatNormQuantity(quantity)} ${product.baseUnitName ?? ""}`.trim();
};

/** Thiết bị không phải vật tư tiêu hao */
export const isConsumableProduct = (product: ProductDto): boolean =>
  product.productType !== ProductType.Equipment;
