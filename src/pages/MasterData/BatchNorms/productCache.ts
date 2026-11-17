import { productService, type ProductDto } from "../../../services/productService";
import { isConsumableProduct } from "./BatchNorms/utils";

let cache: Promise<ProductDto[]> | null = null;

/** Danh sách vật tư tiêu hao (trừ thiết bị) — tải 1 lần, dùng chung cho màn L3 và popup thiết lập */
export const loadConsumableProducts = (force = false): Promise<ProductDto[]> => {
  if (!cache || force) {
    cache = productService
      .getActive()
      .then((items) => items.filter(isConsumableProduct))
      .catch((error) => {
        cache = null;
        throw error;
      });
  }
  return cache;
};
