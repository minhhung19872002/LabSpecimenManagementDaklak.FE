import * as XLSX from "xlsx";
import dayjs from "dayjs";
import type { YearlyForecastRowDto } from "../../../../services/serviceCatalogService";
import {
  ALL_SPECIMEN_KEY,
  ALL_SPECIMEN_NAME,
  foldText,
  specimenKeyOf,
  type FilterOption,
  type FoldState,
} from "../../ServiceCatalog/ServiceCatalog/utils";

export type { FilterOption, FoldState };

/** BR-01 + BR-03: lượng ghi nhận / mẫu = Tiêu hao / mẫu (L3) ÷ số mẫu dự toán, làm tròn 4 chữ số */
export const computePerSample = (batchQuantity: number, estimatedSamples?: number | null): number | null => {
  if (!estimatedSamples || estimatedSamples <= 0) return null;
  return Math.round((batchQuantity / estimatedSamples) * 10000) / 10000;
};

export const formatSamples = (value?: number | null): string =>
  value == null ? "—" : value.toLocaleString("vi-VN");

export const formatPerSample = (value?: number | null): string =>
  value == null ? "—" : value.toLocaleString("vi-VN", { maximumFractionDigits: 4 });

/** Tab năm: T-1 (khóa), T, T+1 */
export const getForecastYears = (currentYear: number): number[] => [currentYear - 1, currentYear, currentYear + 1];

// ===================== Danh sách L4: Nhóm nền mẫu → Nền mẫu → Chỉ tiêu × Phương pháp =====================

/** Số phương pháp hiện sẵn cho mỗi chỉ tiêu, còn lại ẩn sau "Xem thêm" */
export const FORECAST_PREVIEW_LIMIT = 3;

/** Đã có dự toán (mặc định) / dịch vụ có định mức nhưng chưa có dự toán năm này */
export type ForecastScope = "has" | "missing";

export const NO_CATEGORY_KEY = "__nocat__";
export const NO_CATEGORY_NAME = "Chưa phân nhóm nền mẫu";

/** Màu thẻ nhóm nền mẫu: nền nhạt · chữ · viền · chấm nền mẫu — xoay vòng theo thứ tự nhóm */
export interface GroupPalette {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const PALETTES: GroupPalette[] = [
  { bg: "#FFF7E6", text: "#873800", border: "#FFD591", dot: "#D46B08" },
  { bg: "#F6FFED", text: "#135200", border: "#B7EB8F", dot: "#52C41A" },
  { bg: "#FFF0F6", text: "#9E1068", border: "#FFADD2", dot: "#EB2F96" },
  { bg: "#F9F0FF", text: "#391085", border: "#D3ADF7", dot: "#722ED1" },
  { bg: "#E6F7FF", text: "#003A8C", border: "#91D5FF", dot: "#1890FF" },
];

export const samplesOf = (r: YearlyForecastRowDto): number =>
  r.estimatedSamples != null && r.estimatedSamples > 0 ? r.estimatedSamples : 0;

export const hasForecast = (r: YearlyForecastRowDto): boolean => samplesOf(r) > 0;

export const categoryKeyOf = (r: YearlyForecastRowDto): string =>
  r.specimenTypeId == null ? ALL_SPECIMEN_KEY : r.sampleTypeCategoryId || NO_CATEGORY_KEY;

export const categoryNameOf = (r: YearlyForecastRowDto): string =>
  r.specimenTypeId == null ? ALL_SPECIMEN_NAME : r.sampleTypeCategoryName || NO_CATEGORY_NAME;

export const specimenNameOf = (r: YearlyForecastRowDto): string => r.specimenTypeName || ALL_SPECIMEN_NAME;

export const methodNameOf = (r: YearlyForecastRowDto): string => r.testMethodName || r.testMethodCode || "—";

export const indicatorNameOf = (r: YearlyForecastRowDto): string => r.indicatorName || r.indicatorCode || "—";

/** Khóa 1 chỉ tiêu trên 1 nền mẫu (cũng là khóa "Xem thêm") */
export const indicatorBlockKeyOf = (r: YearlyForecastRowDto): string =>
  `${specimenKeyOf(r.specimenTypeId)}|${r.indicatorId}`;

const compareVi = (a?: string | null, b?: string | null) => (a ?? "").localeCompare(b ?? "", "vi");

/** "So với năm trước": ▲/▼ x% — null khi năm trước không có số */
export const percentChange = (current: number, previous?: number | null): number | null =>
  previous != null && previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

export type TrendKind = "new" | "up" | "down" | "flat";

export interface Trend {
  kind: TrendKind;
  text: string;
}

export const trendOf = (pct: number | null): Trend => {
  if (pct == null) return { kind: "new", text: "mới" };
  if (pct > 0) return { kind: "up", text: `▲ ${pct}%` };
  if (pct < 0) return { kind: "down", text: `▼ ${Math.abs(pct)}%` };
  return { kind: "flat", text: "0%" };
};

export interface ForecastFilter {
  keyword: string;
  categoryKey?: string;
  specimenKey?: string;
  testMethodId?: string;
}

/** Lọc trừ phạm vi (để đếm số trên nút Đã có / Chưa có dự toán) */
export const filterForecasts = (rows: readonly YearlyForecastRowDto[], f: ForecastFilter): YearlyForecastRowDto[] => {
  const kw = foldText(f.keyword.trim());
  return rows.filter((r) => {
    if (f.categoryKey && categoryKeyOf(r) !== f.categoryKey) return false;
    if (f.specimenKey && specimenKeyOf(r.specimenTypeId) !== f.specimenKey) return false;
    if (f.testMethodId && r.testMethodId !== f.testMethodId) return false;
    if (!kw) return true;
    const text = [
      categoryNameOf(r),
      specimenNameOf(r),
      r.indicatorName,
      r.indicatorCode,
      r.testMethodName,
      r.testMethodCode,
      r.serviceCode,
    ].join(" ");
    return foldText(text).includes(kw);
  });
};

export const applyScope = (rows: readonly YearlyForecastRowDto[], scope: ForecastScope): YearlyForecastRowDto[] =>
  rows.filter((r) => hasForecast(r) === (scope === "has"));

const countBy = <T,>(items: readonly T[], keyOf: (item: T) => string): Map<string, number> => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyOf(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
};

const groupBy = <T,>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyOf(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  });
  return map;
};

/** Thứ tự thẻ: theo tên nhóm; "Chưa phân nhóm" rồi "Mọi nền mẫu" đứng cuối */
const categoryRank = (key: string) => (key === ALL_SPECIMEN_KEY ? 2 : key === NO_CATEGORY_KEY ? 1 : 0);

const compareCategory = (a: { key: string; name: string }, b: { key: string; name: string }) =>
  categoryRank(a.key) - categoryRank(b.key) || compareVi(a.name, b.name);

function compareSpecimen(ka: string, a: YearlyForecastRowDto, kb: string, b: YearlyForecastRowDto): number {
  if (ka === kb) return 0;
  if (ka === ALL_SPECIMEN_KEY) return 1;
  if (kb === ALL_SPECIMEN_KEY) return -1;
  return a.specimenTypeSortOrder - b.specimenTypeSortOrder || compareVi(a.specimenTypeName, b.specimenTypeName);
}

/** Màu theo thứ tự nhóm trên toàn bộ năm → lọc không làm đổi màu thẻ */
export const buildPaletteMap = (rows: readonly YearlyForecastRowDto[]): ReadonlyMap<string, GroupPalette> => {
  const names = new Map(rows.map((r) => [categoryKeyOf(r), categoryNameOf(r)]));
  const sorted = [...names.entries()].map(([key, name]) => ({ key, name })).sort(compareCategory);
  return new Map(sorted.map((c, i) => [c.key, PALETTES[i % PALETTES.length]]));
};

export const buildCategoryOptions = (rows: readonly YearlyForecastRowDto[]): FilterOption[] => {
  const counts = countBy(rows, categoryKeyOf);
  const names = new Map(rows.map((r) => [categoryKeyOf(r), categoryNameOf(r)]));
  return [...names.entries()]
    .map(([key, name]) => ({ key, name }))
    .sort(compareCategory)
    .map((c) => ({ value: c.key, label: `${c.name} (${counts.get(c.key) ?? 0})` }));
};

/** Nền mẫu thuộc nhóm đang lọc (bỏ trống nhóm = mọi nền mẫu) */
export const buildSpecimenOptions = (rows: readonly YearlyForecastRowDto[], categoryKey?: string): FilterOption[] => {
  const scoped = categoryKey ? rows.filter((r) => categoryKeyOf(r) === categoryKey) : rows;
  const counts = countBy(scoped, (r) => specimenKeyOf(r.specimenTypeId));
  const first = new Map<string, YearlyForecastRowDto>();
  scoped.forEach((r) => {
    const key = specimenKeyOf(r.specimenTypeId);
    if (!first.has(key)) first.set(key, r);
  });
  return [...first.entries()]
    .sort(([ka, a], [kb, b]) => compareSpecimen(ka, a, kb, b))
    .map(([key, r]) => ({ value: key, label: `${specimenNameOf(r)} (${counts.get(key) ?? 0})` }));
};

export const buildMethodOptions = (rows: readonly YearlyForecastRowDto[]): FilterOption[] => {
  const counts = countBy(rows, (r) => r.testMethodId);
  const names = new Map(rows.map((r) => [r.testMethodId, methodNameOf(r)]));
  return [...names.entries()]
    .sort(([, a], [, b]) => compareVi(a, b))
    .map(([id, name]) => ({ value: id, label: `${name} (${counts.get(id) ?? 0})` }));
};

export interface ForecastIndicatorBlock {
  /** nền mẫu|chỉ tiêu */
  key: string;
  indicatorId: string;
  indicatorName: string;
  indicatorFormattedName?: string | null;
  /** Số mẫu lớn trước, rồi theo tên PP */
  rows: YearlyForecastRowDto[];
  total: number;
}

export interface ForecastSpecimenBlock {
  foldKey: string;
  name: string;
  indicatorCount: number;
  rowCount: number;
  total: number;
  indicators: ForecastIndicatorBlock[];
}

export interface ForecastGroupCard {
  foldKey: string;
  key: string;
  name: string;
  palette: GroupPalette;
  specimenCount: number;
  indicatorCount: number;
  rowCount: number;
  total: number;
  specimens: ForecastSpecimenBlock[];
}

const sumSamples = (rows: readonly YearlyForecastRowDto[]) => rows.reduce((sum, r) => sum + samplesOf(r), 0);

const compareRow = (a: YearlyForecastRowDto, b: YearlyForecastRowDto) =>
  samplesOf(b) - samplesOf(a) || compareVi(methodNameOf(a), methodNameOf(b));

const buildIndicatorBlocks = (rows: YearlyForecastRowDto[]): ForecastIndicatorBlock[] =>
  [...groupBy(rows, (r) => r.indicatorId).values()]
    .map((list) => {
      const first = list[0];
      return {
        key: indicatorBlockKeyOf(first),
        indicatorId: first.indicatorId,
        indicatorName: indicatorNameOf(first),
        indicatorFormattedName: first.indicatorFormattedName,
        rows: [...list].sort(compareRow),
        total: sumSamples(list),
      };
    })
    .sort((a, b) => compareVi(a.indicatorName, b.indicatorName));

/** Dựng cây hiển thị từ danh sách dòng đã lọc */
export const buildForecastGroups = (
  rows: readonly YearlyForecastRowDto[],
  palettes: ReadonlyMap<string, GroupPalette>
): ForecastGroupCard[] =>
  [...groupBy(rows, categoryKeyOf).entries()]
    .map(([key, list]) => ({ key, name: categoryNameOf(list[0]), list }))
    .sort(compareCategory)
    .map(({ key, name, list }) => {
      const specimens = [...groupBy(list, (r) => specimenKeyOf(r.specimenTypeId)).entries()]
        .sort(([ka, a], [kb, b]) => compareSpecimen(ka, a[0], kb, b[0]))
        .map(([specimenKey, specimenRows]): ForecastSpecimenBlock => {
          const indicators = buildIndicatorBlocks(specimenRows);
          return {
            foldKey: `N:${specimenKey}`,
            name: specimenNameOf(specimenRows[0]),
            indicatorCount: indicators.length,
            rowCount: specimenRows.length,
            total: sumSamples(specimenRows),
            indicators,
          };
        });
      return {
        foldKey: `G:${key}`,
        key,
        name,
        palette: palettes.get(key) ?? PALETTES[0],
        specimenCount: specimens.length,
        indicatorCount: new Set(list.map((r) => r.indicatorId)).size,
        rowCount: list.length,
        total: sumSamples(list),
        specimens,
      };
    });

/** Mặc định mở hết ("Mở tất cả") hoặc đang lọc; người dùng gập/mở từng cấp thì nhớ theo khóa */
export const isFoldOpen = (fold: FoldState, key: string, allOpen: boolean, filtered: boolean): boolean =>
  fold[key] ?? (allOpen || filtered);

/** "Xem thêm": đang tìm từ khóa / lọc phương pháp thì luôn hiện đủ (nút ẩn), còn lại nhớ theo khóa */
export const isBlockExpanded = (more: FoldState, key: string, showAll: boolean): boolean =>
  showAll || (more[key] ?? false);

export interface ForecastKpis {
  total: number;
  /** % so với tổng năm trước; null = năm trước chưa có dự toán */
  change: number | null;
  specimenCount: number;
  rowCount: number;
}

/** KPI cả năm (không theo bộ lọc) */
export const computeKpis = (rows: readonly YearlyForecastRowDto[], previousYearTotal: number): ForecastKpis => {
  const inYear = rows.filter(hasForecast);
  const total = sumSamples(inYear);
  return {
    total,
    change: percentChange(total, previousYearTotal),
    specimenCount: new Set(inYear.map((r) => specimenKeyOf(r.specimenTypeId))).size,
    rowCount: inYear.length,
  };
};

// ===================== Xuất Excel =====================

/** Xuất đúng thứ tự đang hiển thị */
export const exportForecastsToExcel = (cards: readonly ForecastGroupCard[], year: number): void => {
  const current = `Số mẫu năm ${year}`;
  const previous = `Số mẫu năm ${year - 1}`;
  const columns = ["Nhóm nền mẫu", "Nền mẫu", "Chỉ tiêu", "Phương pháp", "Mã dịch vụ", current, previous, "So với năm trước"];
  const rows = cards.flatMap((card) =>
    card.specimens.flatMap((s) =>
      s.indicators.flatMap((b) =>
        b.rows.map((r) => {
          const value = samplesOf(r);
          return {
            "Nhóm nền mẫu": card.name,
            "Nền mẫu": s.name,
            "Chỉ tiêu": b.indicatorName,
            "Phương pháp": methodNameOf(r),
            "Mã dịch vụ": r.serviceCode ?? "",
            [current]: value > 0 ? value : "",
            [previous]: r.previousYearSamples ?? "",
            "So với năm trước": value > 0 ? trendOf(percentChange(value, r.previousYearSamples)).text : "",
          };
        })
      )
    )
  );
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns });
  ws["!cols"] = [{ wch: 24 }, { wch: 30 }, { wch: 36 }, { wch: 36 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `DuToan${year}`);
  XLSX.writeFile(wb, `du-toan-mau-nam-${year}_${dayjs().format("YYYY-MM-DD")}.xlsx`);
};

// ===================== Nhập Excel (chỉ số mẫu năm) =====================

export type ImportLineStatus = "changed" | "same" | "skip" | "error";

export interface ImportLineView {
  /** Số dòng trong file (tính cả dòng tiêu đề) */
  line: number;
  testMethodIndicatorId: string | null;
  specimenName: string;
  indicatorName: string;
  methodName: string;
  serviceCode: string;
  oldSamples: number;
  newSamples: number | null;
  status: ImportLineStatus;
  note: string;
}

export interface ImportPreview {
  lines: ImportLineView[];
  /** Lỗi cả file (thiếu cột…) — có thì không nhập */
  fileError: string | null;
  counts: Record<ImportLineStatus, number>;
}

const cellText = (v: unknown): string => (v == null ? "" : String(v).trim());

/** "1.234" / "1 234" / 1234 → 1234; số lẻ, âm, chữ → NaN */
const parseSamples = (v: unknown): number => {
  if (typeof v === "number") return v;
  const s = cellText(v).replace(/[\s.]/g, "").replace(",", ".");
  return s && /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
};

const nameKey = (specimen: string, indicator: string, method: string): string =>
  [specimen, indicator, method].map((x) => foldText(x)).join("|");

/**
 * Đọc sheet theo đúng cột của file Xuất Excel: khớp dịch vụ theo "Mã dịch vụ", không có mã thì theo
 * Nền mẫu + Chỉ tiêu + Phương pháp. Ô số mẫu trống = bỏ qua; nhập Excel không xóa dự toán.
 */
export const parseForecastImport = (
  sheet: readonly Record<string, unknown>[],
  rows: readonly YearlyForecastRowDto[],
  year: number
): ImportPreview => {
  const column = `Số mẫu năm ${year}`;
  const counts: Record<ImportLineStatus, number> = { changed: 0, same: 0, skip: 0, error: 0 };
  if (!sheet.length) return { lines: [], fileError: "File không có dòng dữ liệu nào", counts };
  if (!sheet.some((r) => column in r)) {
    return { lines: [], fileError: `File không có cột “${column}” — hãy dùng file mẫu của năm ${year}`, counts };
  }

  const byCode = new Map<string, YearlyForecastRowDto[]>();
  const byName = new Map<string, YearlyForecastRowDto[]>();
  for (const r of rows) {
    const code = foldText(r.serviceCode);
    if (code) byCode.set(code, [...(byCode.get(code) ?? []), r]);
    const key = nameKey(specimenNameOf(r), indicatorNameOf(r), methodNameOf(r));
    byName.set(key, [...(byName.get(key) ?? []), r]);
  }

  const seen = new Map<string, number>();
  const lines = sheet.map((raw, index): ImportLineView => {
    const line = index + 2;
    const specimenName = cellText(raw["Nền mẫu"]);
    const indicatorName = cellText(raw["Chỉ tiêu"]);
    const methodName = cellText(raw["Phương pháp"]);
    const serviceCode = cellText(raw["Mã dịch vụ"]);
    const base = { line, specimenName, indicatorName, methodName, serviceCode };
    const fail = (note: string, found?: YearlyForecastRowDto): ImportLineView => ({
      ...base,
      testMethodIndicatorId: found?.testMethodIndicatorId ?? null,
      oldSamples: found ? samplesOf(found) : 0,
      newSamples: null,
      status: "error",
      note,
    });

    const rawSamples = raw[column];
    const empty = cellText(rawSamples) === "";
    const candidates = serviceCode
      ? byCode.get(foldText(serviceCode)) ?? []
      : byName.get(nameKey(specimenName, indicatorName, methodName)) ?? [];
    if (candidates.length === 0) {
      if (empty) return { ...fail(""), status: "skip", note: "Không có số mẫu" };
      return fail(serviceCode ? `Không tìm thấy mã dịch vụ ${serviceCode}` : "Không tìm thấy Nền mẫu · Chỉ tiêu · Phương pháp");
    }
    if (candidates.length > 1) return fail("Khớp nhiều dịch vụ — hãy điền Mã dịch vụ");
    const found = candidates[0];
    const view = { ...base, specimenName: specimenNameOf(found), indicatorName: indicatorNameOf(found), methodName: methodNameOf(found) };
    const oldSamples = samplesOf(found);
    if (empty) {
      return { ...view, testMethodIndicatorId: found.testMethodIndicatorId, oldSamples, newSamples: null, status: "skip", note: "Ô số mẫu trống — giữ nguyên" };
    }
    const n = parseSamples(rawSamples);
    if (!Number.isInteger(n) || n <= 0) {
      return { ...fail("Số mẫu phải là số nguyên > 0", found), ...view };
    }
    const dup = seen.get(found.testMethodIndicatorId);
    if (dup) return { ...fail(`Trùng dịch vụ với dòng ${dup}`, found), ...view };
    seen.set(found.testMethodIndicatorId, line);
    return {
      ...view,
      testMethodIndicatorId: found.testMethodIndicatorId,
      oldSamples,
      newSamples: n,
      status: n === oldSamples ? "same" : "changed",
      note: n === oldSamples ? "Không đổi" : oldSamples > 0 ? "Cập nhật" : "Tạo mới",
    };
  });
  for (const l of lines) counts[l.status] += 1;
  return { lines, fileError: null, counts };
};
