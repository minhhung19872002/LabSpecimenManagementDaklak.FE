import type React from "react";
import { ProductType, ProductTypeLabels } from "../../../../services/productService";
import type {
  BatchNormComboDto,
  BatchNormProductOptionDto,
  BatchNormServiceGroupOptionDto,
} from "../../../../services/serviceCatalogService";
import {
  ALL_SPECIMEN_KEY,
  ALL_SPECIMEN_NAME,
  foldText,
  specimenKeyOf,
  type FilterOption,
  type FoldState,
} from "../../ServiceCatalog/ServiceCatalog/utils";
import { NO_CATEGORY_NAME, methodNameOf } from "../BatchNorms/utils";

export type { FilterOption, FoldState };

export const BATCH_NORM_LIST_URL = "/master-data?tab=batchNorms";
export const BATCH_NORM_CREATE_PATH = "/master-data/batch-norms/create";
export const SERVICE_DECLARE_URL = "/master-data/services/declare";

/** Trạng thái truyền về L3 sau khi tạo xong */
export interface BatchNormCreatedState {
  createdToast: string;
  createdIds: string[];
}

const compareVi = (a: string, b: string): number => a.localeCompare(b, "vi", { sensitivity: "base" });

// ===================== Mã định mức =====================

/** Mã thứ `offset` tính từ mã kế tiếp: DM-2026-0005 + 2 → DM-2026-0007 */
export const codeAt = (nextCode: string, offset: number): string => {
  const match = /^(.*?)(\d+)$/.exec(nextCode);
  if (!match) return nextCode;
  const [, prefix, digits] = match;
  return prefix + String(Number(digits) + offset).padStart(digits.length, "0");
};

export const codeRangeText = (nextCode: string, count: number): string => {
  if (count <= 0 || !nextCode) return "—";
  if (count === 1) return codeAt(nextCode, 0);
  return `${codeAt(nextCode, 0)} → ${codeAt(nextCode, count - 1)}`;
};

// ===================== Tên dịch vụ =====================

export const UNGROUPED_KEY = "__ungrouped__";

export const serviceGroupKeyOf = (g: Pick<BatchNormServiceGroupOptionDto, "id">): string => g.id || UNGROUPED_KEY;

export const buildServiceGroupOptions = (groups: readonly BatchNormServiceGroupOptionDto[]): FilterOption[] =>
  groups.map((g) => ({
    value: serviceGroupKeyOf(g),
    label: g.freeCount > 0 ? `${g.name} · ${g.freeCount} chưa có định mức` : g.name,
  }));

// ===================== Bộ Nền mẫu × Chỉ tiêu × Phương pháp =====================

export const comboCategoryKeyOf = (c: BatchNormComboDto): string =>
  c.specimenTypeId == null ? ALL_SPECIMEN_KEY : c.sampleTypeCategoryId || "__nocat__";

export const comboCategoryNameOf = (c: BatchNormComboDto): string =>
  c.specimenTypeId == null ? ALL_SPECIMEN_NAME : c.sampleTypeCategoryName || NO_CATEGORY_NAME;

export const comboSpecimenNameOf = (c: BatchNormComboDto): string => c.specimenTypeName || ALL_SPECIMEN_NAME;

export const comboIndicatorNameOf = (c: BatchNormComboDto): string => c.indicatorName || c.indicatorCode || "—";

export const comboMethodNameOf = (c: BatchNormComboDto): string => methodNameOf(c);

/** Nhóm "Mọi nền mẫu" luôn đứng cuối, còn lại theo tên */
const compareCategory = (a: BatchNormComboDto, b: BatchNormComboDto): number => {
  const aAll = a.specimenTypeId == null;
  const bAll = b.specimenTypeId == null;
  if (aAll !== bAll) return aAll ? 1 : -1;
  return compareVi(comboCategoryNameOf(a), comboCategoryNameOf(b));
};

export const sortCombos = (combos: readonly BatchNormComboDto[]): BatchNormComboDto[] =>
  [...combos].sort(
    (a, b) =>
      compareCategory(a, b) ||
      a.specimenTypeSortOrder - b.specimenTypeSortOrder ||
      compareVi(comboSpecimenNameOf(a), comboSpecimenNameOf(b)) ||
      compareVi(comboIndicatorNameOf(a), comboIndicatorNameOf(b)) ||
      compareVi(comboMethodNameOf(a), comboMethodNameOf(b))
  );

/** Màu theo nhóm nền mẫu: [nền nhạt, chữ đậm, viền, màu chấm] */
const CATEGORY_PALETTE: readonly [string, string, string, string][] = [
  ["#fff7e6", "#873800", "#ffd591", "#d46b08"],
  ["#fff0f6", "#9e1068", "#ffadd2", "#eb2f96"],
  ["#fcffe6", "#5b7a00", "#d3f261", "#7cb305"],
  ["#e6f7ff", "#003a8c", "#91d5ff", "#1890ff"],
  ["#f9f0ff", "#391085", "#d3adf7", "#722ed1"],
  ["#e6fffb", "#00474f", "#87e8de", "#13c2c2"],
];

export interface CategoryColor {
  bg: string;
  fg: string;
  border: string;
  dot: string;
}

const colorAt = (index: number): CategoryColor => {
  const [bg, fg, border, dot] = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
  return { bg, fg, border, dot };
};

export interface SelectedComboRow {
  testMethodIndicatorId: string;
  indicatorName: string;
  methodName: string;
  code: string;
}

export interface SelectedSpecimenNode {
  foldKey: string;
  name: string;
  rows: SelectedComboRow[];
}

export interface SelectedCategoryNode {
  foldKey: string;
  name: string;
  meta: string;
  count: number;
  color: CategoryColor;
  specimens: SelectedSpecimenNode[];
}

/**
 * Cây bộ đã chọn: Nhóm nền mẫu › Nền mẫu › (Chỉ tiêu + PP). `chosen` đã sắp xếp → mã định mức
 * gán theo đúng thứ tự hiển thị (giống thứ tự BE tạo).
 */
export const buildSelectedTree = (chosen: readonly BatchNormComboDto[], nextCode: string): SelectedCategoryNode[] => {
  const nodes: SelectedCategoryNode[] = [];
  const byCategory = new Map<string, SelectedCategoryNode>();
  const indicatorSets = new Map<string, Set<string>>();
  chosen.forEach((c, index) => {
    const catKey = comboCategoryKeyOf(c);
    let cat = byCategory.get(catKey);
    if (!cat) {
      cat = {
        foldKey: `G:${catKey}`,
        name: comboCategoryNameOf(c),
        meta: "",
        count: 0,
        color: colorAt(nodes.length),
        specimens: [],
      };
      byCategory.set(catKey, cat);
      indicatorSets.set(catKey, new Set());
      nodes.push(cat);
    }
    const specKey = `N:${catKey}|${specimenKeyOf(c.specimenTypeId)}`;
    let spec = cat.specimens.find((s) => s.foldKey === specKey);
    if (!spec) {
      spec = { foldKey: specKey, name: comboSpecimenNameOf(c), rows: [] };
      cat.specimens.push(spec);
    }
    spec.rows.push({
      testMethodIndicatorId: c.testMethodIndicatorId,
      indicatorName: comboIndicatorNameOf(c),
      methodName: comboMethodNameOf(c),
      code: codeAt(nextCode, index),
    });
    cat.count += 1;
    indicatorSets.get(catKey)?.add(c.indicatorId);
  });
  for (const [key, cat] of byCategory) {
    cat.meta = `${cat.specimens.length} nền mẫu · ${indicatorSets.get(key)?.size ?? 0} chỉ tiêu`;
  }
  return nodes;
};

/** Mặc định mở; fold[key] = true nghĩa là đã thu gọn */
export const isSelOpen = (fold: FoldState, key: string): boolean => !fold[key];

// ===================== Popup chọn bộ =====================

export type PickTab = "all" | "free" | "sel";

export interface PickFilter {
  categoryKey?: string;
  specimenKey?: string;
  indicatorId?: string;
  method: string;
  onlyFree: boolean;
}

export const EMPTY_PICK_FILTER: PickFilter = { method: "", onlyFree: false };

export const hasPickFilter = (f: PickFilter): boolean =>
  Boolean(f.categoryKey || f.specimenKey || f.indicatorId || f.method.trim());

export const filterPickBase = (combos: readonly BatchNormComboDto[], f: PickFilter): BatchNormComboDto[] => {
  const method = foldText(f.method.trim());
  return combos.filter(
    (c) =>
      (!f.categoryKey || comboCategoryKeyOf(c) === f.categoryKey) &&
      (!f.specimenKey || specimenKeyOf(c.specimenTypeId) === f.specimenKey) &&
      (!f.indicatorId || c.indicatorId === f.indicatorId) &&
      (!method || foldText(`${c.testMethodCode ?? ""} ${c.testMethodName ?? ""}`).includes(method)) &&
      (!f.onlyFree || !c.existingNormCode)
  );
};

const countOptions = (
  combos: readonly BatchNormComboDto[],
  keyOf: (c: BatchNormComboDto) => string,
  nameOf: (c: BatchNormComboDto) => string
): FilterOption[] => {
  const map = new Map<string, { name: string; count: number }>();
  for (const c of combos) {
    const key = keyOf(c);
    const item = map.get(key);
    if (item) item.count += 1;
    else map.set(key, { name: nameOf(c), count: 1 });
  }
  return [...map.entries()]
    .sort((a, b) => compareVi(a[1].name, b[1].name))
    .map(([value, { name, count }]) => ({ value, label: `${name} (${count})` }));
};

export interface PickFilterOptions {
  categories: FilterOption[];
  specimens: FilterOption[];
  indicators: FilterOption[];
}

/** Lọc phân cấp: nhóm → nền mẫu → chỉ tiêu, mỗi lựa chọn kèm số bộ */
export const buildPickFilterOptions = (combos: readonly BatchNormComboDto[], f: PickFilter): PickFilterOptions => {
  const inCategory = combos.filter((c) => !f.categoryKey || comboCategoryKeyOf(c) === f.categoryKey);
  const inSpecimen = inCategory.filter((c) => !f.specimenKey || specimenKeyOf(c.specimenTypeId) === f.specimenKey);
  return {
    categories: countOptions(combos, comboCategoryKeyOf, comboCategoryNameOf),
    specimens: countOptions(inCategory, (c) => specimenKeyOf(c.specimenTypeId), comboSpecimenNameOf),
    indicators: countOptions(inSpecimen, (c) => c.indicatorId, comboIndicatorNameOf),
  };
};

export const applyPickTab = (
  combos: readonly BatchNormComboDto[],
  tab: PickTab,
  selected: ReadonlySet<string>
): BatchNormComboDto[] => {
  if (tab === "sel") return combos.filter((c) => selected.has(c.testMethodIndicatorId));
  if (tab === "free") return combos.filter((c) => !c.existingNormCode && !selected.has(c.testMethodIndicatorId));
  return [...combos];
};

// ===================== Vật tư & thiết bị =====================

/** Thứ tự loại vật tư như mock */
export const MATERIAL_TYPES: readonly ProductType[] = [
  ProductType.Chemical,
  ProductType.Biological,
  ProductType.Supply,
  ProductType.Solvent,
  ProductType.Standard,
  ProductType.PreparedSolution,
];

const TYPE_COLORS: Partial<Record<ProductType, [string, string, string]>> = {
  [ProductType.Equipment]: ["#e6fffb", "#006d75", "#87e8de"],
  [ProductType.Chemical]: ["#fff1f0", "#a8071a", "#ffa39e"],
  [ProductType.Biological]: ["#f9f0ff", "#531dab", "#d3adf7"],
  [ProductType.Supply]: ["#f0f5ff", "#1d39c4", "#adc6ff"],
  [ProductType.Solvent]: ["#fffbe6", "#ad4e00", "#ffd591"],
  [ProductType.Standard]: ["#f6ffed", "#237804", "#b7eb8f"],
  [ProductType.PreparedSolution]: ["#fff0f6", "#9e1068", "#ffadd2"],
};

export const typeTagStyle = (type: ProductType): React.CSSProperties => {
  const [bg, fg, border] = TYPE_COLORS[type] ?? ["#fafafa", "#595959", "#d9d9d9"];
  return {
    display: "inline-block",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: 12,
    lineHeight: "18px",
    padding: "0 6px",
    borderRadius: 4,
    whiteSpace: "nowrap",
    background: bg,
    color: fg,
    border: `1px solid ${border}`,
  };
};

export const materialTypeName = (type: ProductType): string => ProductTypeLabels[type] ?? "Khác";

/** Loại thiết bị: luôn là thiết bị phòng Lab (BA) */
export const equipmentTypeName = (): string => ProductTypeLabels[ProductType.Equipment];

export const productNameOf = (p: Pick<BatchNormProductOptionDto, "name" | "code">): string => p.name?.trim() || p.code;

export interface PickedMaterial {
  productId: string;
  quantity: number | null;
  unitId: string | null;
}

export interface PickedEquipment {
  productId: string;
  capacity: number | null;
  capacityUnit: string;
}

export const isPositive = (value: number | null | undefined): boolean => value != null && value > 0;

export const isMaterialMissing = (m: PickedMaterial): boolean => !isPositive(m.quantity) || !m.unitId;

export const isEquipmentMissing = (e: PickedEquipment): boolean => !isPositive(e.capacity) || !e.capacityUnit;

/** Lọc danh sách gợi ý trong ô "Thêm vật tư/thiết bị…" */
export const filterProductOptions = (
  products: readonly BatchNormProductOptionDto[],
  pickedIds: ReadonlySet<string>,
  query: string,
  typeFilter: ProductType | null,
  extraText: (p: BatchNormProductOptionDto) => string
): BatchNormProductOptionDto[] => {
  const q = foldText(query.trim());
  return products.filter(
    (p) =>
      !pickedIds.has(p.id) &&
      (typeFilter == null || p.productType === typeFilter) &&
      (!q || foldText(`${p.code} ${p.name} ${extraText(p)}`).includes(q))
  );
};

export const uniqueCount = <T,>(items: readonly T[], keyOf: (item: T) => string): number =>
  new Set(items.map(keyOf)).size;

export const uniqueNames = <T,>(items: readonly T[], keyOf: (item: T) => string): string[] => [
  ...new Set(items.map(keyOf)),
];
