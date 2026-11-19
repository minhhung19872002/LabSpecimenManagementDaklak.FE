import * as XLSX from "xlsx";
import dayjs from "dayjs";
import type { ProductDto } from "../../../../services/productService";
import { ProductType } from "../../../../services/productService";
import type { BatchNormCandidateDto, ServiceBatchNormDto } from "../../../../services/serviceCatalogService";
import {
  ALL_SPECIMEN_KEY,
  ALL_SPECIMEN_NAME,
  foldText,
  initialsOf,
  specimenKeyOf,
  type FilterOption,
  type FoldState,
} from "../../ServiceCatalog/ServiceCatalog/utils";

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

// ===================== Danh sách L3: Nhóm nền mẫu → Nền mẫu → Chỉ tiêu × Phương pháp =====================

export type { FoldState };

/** Số phương pháp hiện sẵn cho mỗi chỉ tiêu, còn lại ẩn sau "Xem thêm" */
export const NORM_PREVIEW_LIMIT = 3;

export type NormStatusFilter = "all" | "on" | "off";

/** Nền mẫu có nhưng chưa gắn nhóm nền mẫu */
export const NO_CATEGORY_KEY = "__nocat__";
export const NO_CATEGORY_NAME = "Chưa phân nhóm nền mẫu";

/** Thẻ cấp 1: nhóm nền mẫu; dịch vụ áp dụng mọi nền mẫu có thẻ riêng (đứng cuối) */
export const categoryKeyOf = (n: ServiceBatchNormDto): string =>
  n.specimenTypeId == null ? ALL_SPECIMEN_KEY : n.sampleTypeCategoryId || NO_CATEGORY_KEY;

const categoryNameOf = (n: ServiceBatchNormDto): string =>
  n.specimenTypeId == null ? ALL_SPECIMEN_NAME : n.sampleTypeCategoryName || NO_CATEGORY_NAME;

const specimenNameOf = (n: ServiceBatchNormDto): string => n.specimenTypeName || ALL_SPECIMEN_NAME;

export const methodNameOf = (n: { testMethodName?: string | null; testMethodCode?: string | null }): string =>
  n.testMethodName || n.testMethodCode || "—";

/** Khóa 1 chỉ tiêu trên 1 nền mẫu (cũng là khóa "Xem thêm" và khóa ứng viên PP chưa thêm) */
export const indicatorBlockKeyOf = (specimenTypeId: string | null | undefined, indicatorId: string): string =>
  `${specimenKeyOf(specimenTypeId)}|${indicatorId}`;

const compareVi = (a?: string | null, b?: string | null) => (a ?? "").localeCompare(b ?? "", "vi");

export const isNormPending = (n: ServiceBatchNormDto): boolean => n.materialCount === 0;

export interface NormFilter {
  keyword: string;
  categoryKey?: string;
  specimenKey?: string;
  testMethodId?: string;
}

/** Lọc trừ trạng thái (để đếm số trên các nút Tất cả / Đang / Ngừng sử dụng) */
export const filterNorms = (norms: readonly ServiceBatchNormDto[], f: NormFilter): ServiceBatchNormDto[] => {
  const kw = foldText(f.keyword.trim());
  return norms.filter((n) => {
    if (f.categoryKey && categoryKeyOf(n) !== f.categoryKey) return false;
    if (f.specimenKey && specimenKeyOf(n.specimenTypeId) !== f.specimenKey) return false;
    if (f.testMethodId && n.testMethodId !== f.testMethodId) return false;
    if (!kw) return true;
    const text = [
      categoryNameOf(n),
      specimenNameOf(n),
      n.indicatorName,
      n.indicatorCode,
      n.testMethodName,
      n.testMethodCode,
      n.serviceCode,
      n.serviceGroupName,
    ].join(" ");
    return foldText(text).includes(kw);
  });
};

export const applyStatusFilter = (norms: ServiceBatchNormDto[], status: NormStatusFilter): ServiceBatchNormDto[] =>
  status === "all" ? norms : norms.filter((n) => n.isActive === (status === "on"));

const countBy = <T,>(items: readonly T[], keyOf: (item: T) => string): Map<string, number> => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyOf(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
};

/** Thứ tự thẻ: theo tên nhóm; "Chưa phân nhóm" rồi "Mọi nền mẫu" đứng cuối */
const categoryRank = (key: string) => (key === ALL_SPECIMEN_KEY ? 2 : key === NO_CATEGORY_KEY ? 1 : 0);

const compareCategory = (a: { key: string; name: string }, b: { key: string; name: string }) =>
  categoryRank(a.key) - categoryRank(b.key) || compareVi(a.name, b.name);

export const buildCategoryOptions = (norms: readonly ServiceBatchNormDto[]): FilterOption[] => {
  const counts = countBy(norms, categoryKeyOf);
  const names = new Map(norms.map((n) => [categoryKeyOf(n), categoryNameOf(n)]));
  return [...names.entries()]
    .map(([key, name]) => ({ key, name }))
    .sort(compareCategory)
    .map((c) => ({ value: c.key, label: `${c.name} (${counts.get(c.key) ?? 0})` }));
};

/** Nền mẫu thuộc nhóm đang lọc (bỏ trống nhóm = mọi nền mẫu) */
export const buildSpecimenFilterOptions = (norms: readonly ServiceBatchNormDto[], categoryKey?: string): FilterOption[] => {
  const scoped = categoryKey ? norms.filter((n) => categoryKeyOf(n) === categoryKey) : norms;
  const counts = countBy(scoped, (n) => specimenKeyOf(n.specimenTypeId));
  const first = new Map<string, ServiceBatchNormDto>();
  scoped.forEach((n) => {
    const key = specimenKeyOf(n.specimenTypeId);
    if (!first.has(key)) first.set(key, n);
  });
  return [...first.entries()]
    .sort(([ka, a], [kb, b]) => compareSpecimen(ka, a, kb, b))
    .map(([key, n]) => ({ value: key, label: `${specimenNameOf(n)} (${counts.get(key) ?? 0})` }));
};

export const buildNormMethodOptions = (norms: readonly ServiceBatchNormDto[]): FilterOption[] => {
  const counts = countBy(norms, (n) => n.testMethodId);
  const names = new Map(norms.map((n) => [n.testMethodId, methodNameOf(n)]));
  return [...names.entries()]
    .sort(([, a], [, b]) => compareVi(a, b))
    .map(([id, name]) => ({ value: id, label: `${name} (${counts.get(id) ?? 0})` }));
};

function compareSpecimen(ka: string, a: ServiceBatchNormDto, kb: string, b: ServiceBatchNormDto): number {
  if (ka === kb) return 0;
  if (ka === ALL_SPECIMEN_KEY) return 1;
  if (kb === ALL_SPECIMEN_KEY) return -1;
  return a.specimenTypeSortOrder - b.specimenTypeSortOrder || compareVi(a.specimenTypeName, b.specimenTypeName);
}

/** PP đã khai báo trong dịch vụ nhưng chưa thêm vào định mức, theo khóa nền mẫu|chỉ tiêu */
export const groupCandidates = (
  candidates: readonly BatchNormCandidateDto[]
): ReadonlyMap<string, BatchNormCandidateDto[]> => {
  const map = new Map<string, BatchNormCandidateDto[]>();
  candidates.forEach((c) => {
    const key = indicatorBlockKeyOf(c.specimenTypeId, c.indicatorId);
    const list = map.get(key);
    if (list) list.push(c);
    else map.set(key, [c]);
  });
  return map;
};

export interface NormIndicatorBlock {
  /** nền mẫu|chỉ tiêu */
  key: string;
  indicatorId: string;
  indicatorName: string;
  indicatorFormattedName?: string | null;
  /** Đang dùng lên trước, rồi theo tên PP */
  norms: ServiceBatchNormDto[];
  candidateCount: number;
}

export interface NormSpecimenBlock {
  foldKey: string;
  specimenKey: string;
  specimenTypeId: string | null;
  name: string;
  isAll: boolean;
  indicatorCount: number;
  methodCount: number;
  offCount: number;
  missingCount: number;
  indicators: NormIndicatorBlock[];
}

export interface NormGroupCard {
  foldKey: string;
  key: string;
  name: string;
  initials: string;
  specimenCount: number;
  indicatorCount: number;
  methodCount: number;
  normCount: number;
  onCount: number;
  offCount: number;
  specimens: NormSpecimenBlock[];
}

const compareNormRow = (a: ServiceBatchNormDto, b: ServiceBatchNormDto) =>
  Number(b.isActive) - Number(a.isActive) || compareVi(methodNameOf(a), methodNameOf(b));

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

const buildIndicatorBlocks = (
  rows: ServiceBatchNormDto[],
  candidatesByKey: ReadonlyMap<string, BatchNormCandidateDto[]>
): NormIndicatorBlock[] =>
  [...groupBy(rows, (n) => n.indicatorId).values()]
    .map((list) => {
      const first = list[0];
      const key = indicatorBlockKeyOf(first.specimenTypeId, first.indicatorId);
      return {
        key,
        indicatorId: first.indicatorId,
        indicatorName: first.indicatorName || first.indicatorCode || "—",
        indicatorFormattedName: first.indicatorFormattedName,
        norms: [...list].sort(compareNormRow),
        candidateCount: candidatesByKey.get(key)?.length ?? 0,
      };
    })
    .sort((a, b) => compareVi(a.indicatorName, b.indicatorName));

/** Dựng cây hiển thị từ danh sách định mức đã lọc */
export const buildNormGroups = (
  norms: readonly ServiceBatchNormDto[],
  candidatesByKey: ReadonlyMap<string, BatchNormCandidateDto[]>
): NormGroupCard[] =>
  [...groupBy(norms, categoryKeyOf).entries()]
    .map(([key, list]) => ({ key, name: categoryNameOf(list[0]), list }))
    .sort(compareCategory)
    .map(({ key, name, list }) => {
      const specimens = [...groupBy(list, (n) => specimenKeyOf(n.specimenTypeId)).entries()]
        .sort(([ka, a], [kb, b]) => compareSpecimen(ka, a[0], kb, b[0]))
        .map(([specimenKey, rows]): NormSpecimenBlock => {
          const indicators = buildIndicatorBlocks(rows, candidatesByKey);
          return {
            foldKey: `N:${specimenKey}`,
            specimenKey,
            specimenTypeId: rows[0].specimenTypeId ?? null,
            name: specimenNameOf(rows[0]),
            isAll: specimenKey === ALL_SPECIMEN_KEY,
            indicatorCount: indicators.length,
            methodCount: new Set(rows.map((n) => n.testMethodId)).size,
            offCount: rows.filter((n) => !n.isActive).length,
            missingCount: indicators.reduce((sum, b) => sum + b.candidateCount, 0),
            indicators,
          };
        });
      const onCount = list.filter((n) => n.isActive).length;
      return {
        foldKey: `G:${key}`,
        key,
        name,
        initials: initialsOf(name),
        specimenCount: specimens.length,
        indicatorCount: new Set(list.map((n) => n.indicatorId)).size,
        methodCount: new Set(list.map((n) => n.testMethodId)).size,
        normCount: list.length,
        onCount,
        offCount: list.length - onCount,
        specimens,
      };
    });

/** Mặc định mở hết ("Mở tất cả") hoặc đang lọc; người dùng gập/mở từng cấp thì nhớ theo khóa */
export const isFoldOpen = (fold: FoldState, key: string, allOpen: boolean, filtered: boolean): boolean =>
  fold[key] ?? (allOpen || filtered);

/** "Xem thêm": tự mở khi từ khóa khớp một phương pháp đang bị ẩn */
export const isBlockExpanded = (more: FoldState, block: NormIndicatorBlock, keyword: string): boolean => {
  const manual = more[block.key];
  if (manual != null) return manual;
  const kw = foldText(keyword.trim());
  if (!kw || block.norms.length <= NORM_PREVIEW_LIMIT) return false;
  return block.norms
    .slice(NORM_PREVIEW_LIMIT)
    .some((n) => foldText(`${n.testMethodName ?? ""} ${n.testMethodCode ?? ""}`).includes(kw));
};

// ===================== Thêm phương pháp =====================

export type AddMethodTab = "free" | "has" | "all";

/** Chỉ tiêu trên nền mẫu đang thêm phương pháp */
export interface AddMethodTarget {
  key: string;
  specimenTypeId: string | null;
  specimenName: string;
  categoryName: string;
  indicatorId: string;
  indicatorName: string;
}

export interface AddMethodOption {
  testMethodIndicatorId: string;
  methodName: string;
  serviceGroupName: string;
  /** Đã có trong định mức → chỉ hiển thị, không chọn được */
  has: boolean;
}

export const buildAddMethodOptions = (
  target: AddMethodTarget,
  norms: readonly ServiceBatchNormDto[],
  candidatesByKey: ReadonlyMap<string, BatchNormCandidateDto[]>
): AddMethodOption[] => {
  const existing = norms
    .filter((n) => indicatorBlockKeyOf(n.specimenTypeId, n.indicatorId) === target.key)
    .map((n) => ({
      testMethodIndicatorId: n.testMethodIndicatorId,
      methodName: methodNameOf(n),
      serviceGroupName: n.serviceGroupName || "—",
      has: true,
    }));
  const free = (candidatesByKey.get(target.key) ?? []).map((c) => ({
    testMethodIndicatorId: c.testMethodIndicatorId,
    methodName: methodNameOf(c),
    serviceGroupName: c.serviceGroupName || "—",
    has: false,
  }));
  return [...free, ...existing];
};

export const filterAddMethodOptions = (
  options: readonly AddMethodOption[],
  keyword: string
): AddMethodOption[] => {
  const kw = foldText(keyword.trim());
  return kw ? options.filter((o) => foldText(`${o.methodName} ${o.serviceGroupName}`).includes(kw)) : [...options];
};

export const applyAddMethodTab = (options: readonly AddMethodOption[], tab: AddMethodTab): AddMethodOption[] =>
  options
    .filter((o) => (tab === "all" ? true : tab === "has" ? o.has : !o.has))
    .sort((a, b) => Number(a.has) - Number(b.has) || compareVi(a.methodName, b.methodName));

// ===================== Xuất Excel =====================

const EXPORT_COLUMNS = [
  "Nhóm nền mẫu",
  "Nền mẫu",
  "Chỉ tiêu",
  "Phương pháp",
  "Mã dịch vụ",
  "Dịch vụ",
  "Số vật tư",
  "Số thiết bị",
  "Trạng thái sử dụng",
] as const;

/** Xuất đúng thứ tự đang hiển thị */
export const exportNormsToExcel = (cards: readonly NormGroupCard[]): void => {
  const rows = cards.flatMap((card) =>
    card.specimens.flatMap((s) =>
      s.indicators.flatMap((b) =>
        b.norms.map((n) => ({
          "Nhóm nền mẫu": card.name,
          "Nền mẫu": s.name,
          "Chỉ tiêu": b.indicatorName,
          "Phương pháp": methodNameOf(n),
          "Mã dịch vụ": n.serviceCode ?? "",
          "Dịch vụ": n.serviceGroupName ?? "",
          "Số vật tư": n.materialCount,
          "Số thiết bị": n.equipmentCount,
          "Trạng thái sử dụng": n.isActive ? "Đang sử dụng" : "Ngừng sử dụng",
        }))
      )
    )
  );
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...EXPORT_COLUMNS] });
  ws["!cols"] = [{ wch: 24 }, { wch: 30 }, { wch: 36 }, { wch: 36 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DinhMuc");
  XLSX.writeFile(wb, `dinh-muc-theo-me_${dayjs().format("YYYY-MM-DD")}.xlsx`);
};
