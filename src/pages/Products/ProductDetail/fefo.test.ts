import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import type { ProductLotStockDto } from "../../../services/productService";
import {
  compareLotsFefo,
  getUsableLotsFefo,
  isLotInUse,
  getNextFefoLot,
} from "./utils";

const daysFromNow = (d: number) => dayjs().add(d, "day").toISOString();

const makeLot = (overrides: Partial<ProductLotStockDto> = {}): ProductLotStockDto => ({
  lotNumber: "LOT",
  lotExpiryDate: daysFromNow(200),
  receivedBaseQuantity: 10,
  consumedBaseQuantity: 0,
  remainingBaseQuantity: 10,
  theoreticalConsumption: 0,
  openingBaseQuantity: 10,
  ...overrides,
});

// Lô A hết hạn sớm hơn lô B (theo ví dụ BA)
const lotA = (o: Partial<ProductLotStockDto> = {}) =>
  makeLot({ lotNumber: "A", lotExpiryDate: daysFromNow(100), ...o });
const lotB = (o: Partial<ProductLotStockDto> = {}) =>
  makeLot({ lotNumber: "B", lotExpiryDate: daysFromNow(200), ...o });
const lotC = (o: Partial<ProductLotStockDto> = {}) =>
  makeLot({ lotNumber: "C", lotExpiryDate: daysFromNow(300), ...o });

describe("compareLotsFefo", () => {
  it("HSD sớm hơn xếp trước", () => {
    expect([lotB(), lotA()].sort(compareLotsFefo).map((l) => l.lotNumber)).toEqual(["A", "B"]);
  });

  it("trùng HSD thì lô nhập trước xếp trước", () => {
    const same = daysFromNow(100);
    const older = makeLot({ lotNumber: "OLD", lotExpiryDate: same, firstImportDate: "2026-01-01T00:00:00Z" });
    const newer = makeLot({ lotNumber: "NEW", lotExpiryDate: same, firstImportDate: "2026-03-01T00:00:00Z" });
    expect([newer, older].sort(compareLotsFefo).map((l) => l.lotNumber)).toEqual(["OLD", "NEW"]);
  });

  it("lô không có HSD xếp cuối", () => {
    const noExp = makeLot({ lotNumber: "NOEXP", lotExpiryDate: undefined });
    expect([noExp, lotA()].sort(compareLotsFefo).map((l) => l.lotNumber)).toEqual(["A", "NOEXP"]);
  });
});

describe("getUsableLotsFefo", () => {
  it("bỏ lô hết tồn và lô hết hạn, giữ lô sắp hết hạn", () => {
    const lots = [
      makeLot({ lotNumber: "EMPTY", remainingBaseQuantity: 0 }),
      makeLot({ lotNumber: "EXPIRED", lotExpiryDate: daysFromNow(-5) }),
      makeLot({ lotNumber: "NEAR", lotExpiryDate: daysFromNow(10) }),
      lotB(),
    ];
    expect(getUsableLotsFefo(lots).map((l) => l.lotNumber)).toEqual(["NEAR", "B"]);
  });
});

describe("isLotInUse", () => {
  it("chưa tiêu hao -> chưa dùng", () => {
    expect(isLotInUse(makeLot())).toBe(false);
  });
  it("có tiêu hao thực tế -> đang dùng", () => {
    expect(isLotInUse(makeLot({ consumedBaseQuantity: 1, remainingBaseQuantity: 9 }))).toBe(true);
  });
  it("có tiêu hao lý thuyết trong kỳ -> đang dùng", () => {
    expect(isLotInUse(makeLot({ theoreticalConsumption: 0.5 }))).toBe(true);
  });
});

describe("getNextFefoLot (quy tắc BA)", () => {
  it("chưa dùng lô nào -> lô tiếp theo là lô có HSD gần nhất (A)", () => {
    expect(getNextFefoLot([lotB(), lotA()])?.lotNumber).toBe("A");
  });

  it("đang dùng lô A -> lô tiếp theo là lô B", () => {
    const lots = [lotA({ consumedBaseQuantity: 3, remainingBaseQuantity: 7 }), lotB()];
    expect(getNextFefoLot(lots)?.lotNumber).toBe("B");
  });

  it("dùng hết lô A, đang dùng lô B -> không hiển thị", () => {
    const lots = [
      lotA({ consumedBaseQuantity: 10, remainingBaseQuantity: 0 }),
      lotB({ consumedBaseQuantity: 2, remainingBaseQuantity: 8 }),
    ];
    expect(getNextFefoLot(lots)).toBeNull();
  });

  it("đang dùng lô B (HSD xa), lô A (HSD gần) chưa dùng -> lô tiếp theo là B", () => {
    const lots = [lotA(), lotB({ consumedBaseQuantity: 2, remainingBaseQuantity: 8 })];
    expect(getNextFefoLot(lots)?.lotNumber).toBe("B");
  });

  it("chỉ có 1 lô còn tồn -> không hiển thị", () => {
    expect(getNextFefoLot([lotA()])).toBeNull();
    expect(getNextFefoLot([lotA({ consumedBaseQuantity: 1, remainingBaseQuantity: 9 })])).toBeNull();
  });

  it("3 lô, đang dùng A -> lô tiếp theo là B (không nhảy sang C)", () => {
    const lots = [lotC(), lotA({ theoreticalConsumption: 1 }), lotB()];
    expect(getNextFefoLot(lots)?.lotNumber).toBe("B");
  });

  it("3 lô, đang dùng B -> lô tiếp theo vẫn là B (FEFO thứ 2)", () => {
    const lots = [lotC(), lotA(), lotB({ theoreticalConsumption: 1 })];
    expect(getNextFefoLot(lots)?.lotNumber).toBe("B");
  });

  it("đang dùng lô HSD xa, nhập lô HSD gần hơn -> lô tiếp theo là lô HSD xa (case BA)", () => {
    const lotOld = makeLot({ lotNumber: "OLD", lotExpiryDate: daysFromNow(200), consumedBaseQuantity: 3, remainingBaseQuantity: 7 });
    const lotNew = makeLot({ lotNumber: "NEW", lotExpiryDate: daysFromNow(100) });
    expect(getNextFefoLot([lotOld, lotNew])?.lotNumber).toBe("OLD");
  });

  it("không có lô nào còn tồn -> null", () => {
    expect(getNextFefoLot([])).toBeNull();
    expect(getNextFefoLot([makeLot({ remainingBaseQuantity: 0 })])).toBeNull();
  });

  it("lô hết hạn không được tính là lô tiếp theo", () => {
    const lots = [makeLot({ lotNumber: "EXP", lotExpiryDate: daysFromNow(-1) }), lotA(), lotB()];
    expect(getNextFefoLot(lots)?.lotNumber).toBe("A");
  });
});
