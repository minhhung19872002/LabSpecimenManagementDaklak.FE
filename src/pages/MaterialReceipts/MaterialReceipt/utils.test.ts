import { describe, it, expect } from "vitest";
import {
  isQuantityExceedingCentralStock,
  type MaterialReceiptLineItem,
} from "./utils";

const makeItem = (
  overrides: Partial<MaterialReceiptLineItem> = {},
): MaterialReceiptLineItem => ({
  key: "k1",
  productId: "p1",
  productName: "Test",
  quantity: null,
  centralStockBaseQty: 0,
  availableUnits: [],
  skus: [],
  ...overrides,
});

describe("isQuantityExceedingCentralStock", () => {
  it("returns false when quantity <= 0", () => {
    const item = makeItem({ centralStockBaseQty: 10 });
    expect(isQuantityExceedingCentralStock(item, 0)).toBe(false);
    expect(isQuantityExceedingCentralStock(item, -1)).toBe(false);
  });

  describe("same unit (no SKU / no volumePerUnit)", () => {
    it("returns false when qty <= stock", () => {
      const item = makeItem({ centralStockBaseQty: 5 });
      expect(isQuantityExceedingCentralStock(item, 5)).toBe(false);
      expect(isQuantityExceedingCentralStock(item, 3)).toBe(false);
    });

    it("returns true when qty > stock", () => {
      const item = makeItem({ centralStockBaseQty: 5 });
      expect(isQuantityExceedingCentralStock(item, 6)).toBe(true);
    });
  });

  describe("same unit, same volumePerUnit", () => {
    it("returns false when qty <= stock (both convert equally)", () => {
      const item = makeItem({
        centralStockBaseQty: 3,
        volumePerUnit: 500,
        unitId: "u-chai",
        skuId: "sku1",
        skus: [
          {
            skuId: "sku1",
            storageUnitId: "u-chai",
            volumePerUnit: 500,
          },
        ],
      });
      // 3 × 500 = 1500ml requested, 3 × 500 = 1500ml stock
      expect(isQuantityExceedingCentralStock(item, 3)).toBe(false);
    });

    it("returns true when qty > stock", () => {
      const item = makeItem({
        centralStockBaseQty: 3,
        volumePerUnit: 500,
        unitId: "u-chai",
        skuId: "sku1",
        skus: [
          {
            skuId: "sku1",
            storageUnitId: "u-chai",
            volumePerUnit: 500,
          },
        ],
      });
      // 4 × 500 = 2000ml > 3 × 500 = 1500ml
      expect(isQuantityExceedingCentralStock(item, 4)).toBe(true);
    });
  });

  describe("different units with different volumePerUnit", () => {
    // Stock: 1 Chai (product volumePerUnit=500 → 500ml)
    // User selects: Can (sku volumePerUnit=5000 → 5000ml per Can)

    const item = makeItem({
      centralStockBaseQty: 1,
      volumePerUnit: 500, // product default: 1 Chai = 500ml
      unitId: "u-can",
      skuId: "sku-can",
      skus: [
        {
          skuId: "sku-can",
          storageUnitId: "u-can",
          volumePerUnit: 5000, // 1 Can = 5000ml
        },
      ],
    });

    it("returns true: 1 Can (5000ml) > 1 Chai (500ml)", () => {
      expect(isQuantityExceedingCentralStock(item, 1)).toBe(true);
    });

    it("returns true: 2 Can (10000ml) > 1 Chai (500ml)", () => {
      expect(isQuantityExceedingCentralStock(item, 2)).toBe(true);
    });
  });

  describe("different units — smaller unit selected, should NOT exceed", () => {
    // Stock: 10 Chai (product volumePerUnit=500 → 5000ml)
    // User selects: Lọ (sku volumePerUnit=100 → 100ml per Lọ)

    const item = makeItem({
      centralStockBaseQty: 10,
      volumePerUnit: 500, // 1 Chai = 500ml
      unitId: "u-lo",
      skuId: "sku-lo",
      skus: [
        {
          skuId: "sku-lo",
          storageUnitId: "u-lo",
          volumePerUnit: 100, // 1 Lọ = 100ml
        },
      ],
    });

    it("returns false: 2 Lọ (200ml) < 10 Chai (5000ml)", () => {
      expect(isQuantityExceedingCentralStock(item, 2)).toBe(false);
    });

    it("returns false: 50 Lọ (5000ml) = 10 Chai (5000ml)", () => {
      expect(isQuantityExceedingCentralStock(item, 50)).toBe(false);
    });

    it("returns true: 51 Lọ (5100ml) > 10 Chai (5000ml)", () => {
      expect(isQuantityExceedingCentralStock(item, 51)).toBe(true);
    });
  });

  describe("fallback: no volumePerUnit → raw comparison", () => {
    it("no volumePerUnit at all → raw", () => {
      const item = makeItem({
        centralStockBaseQty: 5,
        unitId: "u1",
        skuId: "sku1",
        skus: [{ skuId: "sku1", storageUnitId: "u1" }],
      });
      expect(isQuantityExceedingCentralStock(item, 5)).toBe(false);
      expect(isQuantityExceedingCentralStock(item, 6)).toBe(true);
    });

    it("only product volumePerUnit, no sku volumePerUnit → both use product VPU", () => {
      const item = makeItem({
        centralStockBaseQty: 5,
        volumePerUnit: 500,
        unitId: "u1",
        skuId: "sku1",
        skus: [{ skuId: "sku1", storageUnitId: "u1" }],
      });
      // selectedVPU falls back to item.volumePerUnit = 500
      // 5 × 500 = 2500 vs 5 × 500 = 2500 → not exceeded
      expect(isQuantityExceedingCentralStock(item, 5)).toBe(false);
      expect(isQuantityExceedingCentralStock(item, 6)).toBe(true);
    });

    it("stock volumePerUnit=0 → raw fallback", () => {
      const item = makeItem({
        centralStockBaseQty: 5,
        volumePerUnit: 0,
        unitId: "u1",
        skuId: "sku1",
        skus: [{ skuId: "sku1", storageUnitId: "u1", volumePerUnit: 100 }],
      });
      expect(isQuantityExceedingCentralStock(item, 5)).toBe(false);
      expect(isQuantityExceedingCentralStock(item, 6)).toBe(true);
    });
  });

  describe("no matching SKU → uses product volumePerUnit for both sides", () => {
    const item = makeItem({
      centralStockBaseQty: 3,
      volumePerUnit: 500,
      unitId: "u-unknown",
      skuId: "sku-missing",
      skus: [],
    });

    it("returns false when qty <= stock", () => {
      expect(isQuantityExceedingCentralStock(item, 3)).toBe(false);
    });

    it("returns true when qty > stock", () => {
      expect(isQuantityExceedingCentralStock(item, 4)).toBe(true);
    });
  });
});
