import type { CSSProperties } from "react";
import { ProductType } from "../../../../services/productService";
import {
  ForecastQuantityMode,
  type BatchNormProductOptionDto,
  type ForecastComboDto,
  type ForecastConfigDto,
  type SaveForecastDetailItemInput,
} from "../../../../services/serviceCatalogService";
import { foldText, specimenKeyOf, type FoldState } from "../../ServiceCatalog/ServiceCatalog/utils";
import {
  comboCategoryKeyOf,
  comboCategoryNameOf,
  comboIndicatorNameOf,
  comboMethodNameOf,
  comboSpecimenNameOf,
  materialTypeName,
  productNameOf,
  type CategoryColor,
  type PickFilter,
  type PickTab,
} from "../../BatchNorms/BatchNormCreate/utils";

export type { FoldState, PickFilter, PickTab };

export const YEARLY_FORECAST_LIST_URL = "/master-data?tab=yearlyForecasts";
export const YEARLY_FORECAST_CREATE_PATH = "/master-data/yearly-forecasts/create";

/** Trạng thái truyền về L4 sau khi lưu phiếu */
export interface ForecastSavedState {
  forecastYear: number;
  savedToast: string;
}

export const isForecastSavedState = (state: unknown): state is ForecastSavedState =>
  typeof state === "object" &&
  state != null &&
  typeof (state as ForecastSavedState).forecastYear === "number" &&
  typeof (state as ForecastSavedState).savedToast === "string";

/** `edit` = mở phiếu sửa bộ đã có dự toán; `add` = phiếu tạo chọn sẵn bộ chưa có dự toán */
export const forecastCreateUrl = (year: number, target?: { edit?: string; add?: string }): string => {
  const params = new URLSearchParams({ year: String(year) });
  if (target?.edit) params.set("edit", target.edit);
  else if (target?.add) params.set("add", target.add);
  return `${YEARLY_FORECAST_CREATE_PATH}?${params.toString()}`;
};

const compareVi = (a: string, b: string): number => a.localeCompare(b, "vi", { sensitivity: "base" });

// ===================== Định dạng số (vi-VN) =====================

/** Làm tròn 2 chữ số, "." nghìn, "," thập phân */
export const fmt = (n: number): string =>
  (Math.round(n * 100) / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 });

/** Số rất nhỏ: giữ đủ chữ số có nghĩa đầu tiên (+1), tối đa 10 chữ số thập phân */
export const tiny = (x: number): string => {
  if (!(x > 0)) return "0";
  const digits = Math.max(0, Math.min(Math.ceil(-Math.log10(x)) + 1, 10));
  return x
    .toFixed(digits)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "")
    .replace(".", ",");
};

// ===================== Bộ & dự toán =====================

export const comboKeyOf = (c: Pick<ForecastComboDto, "specimenTypeId" | "indicatorId">): string =>
  `${specimenKeyOf(c.specimenTypeId)}|${c.indicatorId}`;

/** Đã có dự toán năm đang chọn */
export const hasSavedForecast = (c: ForecastComboDto): boolean => (c.forecast?.estimatedSamples ?? 0) > 0;

export const hasNorm = (c: ForecastComboDto): boolean => Boolean(c.existingNormCode);

/** "Nền › Chỉ tiêu › Phương pháp" */
export const comboPathOf = (c: ForecastComboDto): string =>
  `${comboSpecimenNameOf(c)} › ${comboIndicatorNameOf(c)} › ${comboMethodNameOf(c)}`;

export interface ExtraMaterialState {
  productId: string;
  unitId: string;
  quantity: number | null;
  mode: ForecastQuantityMode;
}

/** Cấu hình riêng của 1 bộ trên phiếu */
export interface ComboConfigState {
  samples: number | null;
  extraMaterials: ExtraMaterialState[];
  extraEquipmentIds: string[];
  hiddenMaterialIds: string[];
  hiddenEquipmentIds: string[];
}

export const EMPTY_CONFIG: ComboConfigState = {
  samples: null,
  extraMaterials: [],
  extraEquipmentIds: [],
  hiddenMaterialIds: [],
  hiddenEquipmentIds: [],
};

export const configFromSaved = (f?: ForecastConfigDto | null): ComboConfigState =>
  f
    ? {
        samples: f.estimatedSamples != null && f.estimatedSamples > 0 ? f.estimatedSamples : null,
        extraMaterials: (f.extraMaterials ?? []).map((m) => ({
          productId: m.productId,
          unitId: m.unitId,
          quantity: m.quantity ?? null,
          mode: m.mode ?? ForecastQuantityMode.PerSample,
        })),
        extraEquipmentIds: [...(f.extraEquipmentIds ?? [])],
        hiddenMaterialIds: [...(f.hiddenMaterialIds ?? [])],
        hiddenEquipmentIds: [...(f.hiddenEquipmentIds ?? [])],
      }
    : EMPTY_CONFIG;

/**
 * Nhóm áp dụng tiêu hao đã lưu chứa bộ `id`: bộ nguồn + mọi bộ đang áp dụng theo nó.
 * Phiếu sửa luôn mở trọn nhóm để không cắt rời nguồn khỏi các bộ áp dụng.
 */
export const savedLinkGroupOf = (id: string, comboById: ReadonlyMap<string, ForecastComboDto>): string[] => {
  const combo = comboById.get(id);
  if (!combo || !hasSavedForecast(combo)) return [id];
  const source = combo.forecast?.sourceTestMethodIndicatorId;
  const root = source && comboById.has(source) && hasSavedForecast(comboById.get(source)!) ? source : id;
  const members = [root];
  for (const c of comboById.values()) {
    if (c.testMethodIndicatorId !== root && hasSavedForecast(c) && c.forecast?.sourceTestMethodIndicatorId === root) {
      members.push(c.testMethodIndicatorId);
    }
  }
  return members;
};

export type LinkMap = Readonly<Record<string, string>>;

/** Nguồn đang có hiệu lực: khác chính nó, nguồn không áp dụng theo bộ khác, nguồn đang nằm trong phiếu */
export const linkOf = (id: string, links: LinkMap, inSheet: ReadonlySet<string>): string => {
  const src = links[id];
  if (!src || src === id || !inSheet.has(src)) return "";
  const srcOfSrc = links[src];
  if (srcOfSrc && srcOfSrc !== src && inSheet.has(srcOfSrc)) return "";
  return src;
};

/** Số bộ trong phiếu đang áp dụng tiêu hao theo `id` */
export const srcCountOf = (id: string, links: LinkMap, inSheet: ReadonlySet<string>): number => {
  let n = 0;
  for (const other of inSheet) if (other !== id && linkOf(other, links, inSheet) === id) n += 1;
  return n;
};

// ===================== Vật tư / thiết bị hiệu lực =====================

export interface MaterialRowView {
  productId: string;
  name: string;
  code: string;
  productType: ProductType;
  typeName: string;
  isExtra: boolean;
  /** Lượng (theo mode) */
  quantity: number | null;
  unitId: string | null;
  unitName: string;
  unitOptions: { value: string; label: string }[];
  mode: ForecastQuantityMode;
  totalText: string;
  hasTotal: boolean;
  avgText: string;
  packText: string;
}

export interface EquipmentRowView {
  productId: string;
  name: string;
  code: string;
  isExtra: boolean;
}

const unitNameOf = (p: BatchNormProductOptionDto | undefined, unitId?: string | null): string =>
  (unitId && p?.units.find((u) => u.id === unitId)?.name) || "";

/** Dòng vật tư của 1 bộ — lấy từ bộ nguồn `bk` (chính nó hoặc bộ đang áp dụng theo) */
export const buildMaterialRows = (
  bkCombo: ForecastComboDto,
  bkConfig: ComboConfigState,
  samples: number | null,
  materialById: ReadonlyMap<string, BatchNormProductOptionDto>
): MaterialRowView[] => {
  const n = samples ?? 0;
  const hidden = new Set(bkConfig.hiddenMaterialIds);
  const normIds = new Set(bkCombo.normMaterials.map((m) => m.productId));

  const toRow = (
    productId: string,
    quantity: number | null,
    unitId: string | null,
    fallbackUnitName: string,
    mode: ForecastQuantityMode,
    isExtra: boolean
  ): MaterialRowView => {
    const p = materialById.get(productId);
    const q = quantity ?? 0;
    const perYear = mode === ForecastQuantityMode.PerYear;
    const t = perYear ? q : n * q;
    const has = q > 0 && (perYear || n > 0);
    const unitName = unitNameOf(p, unitId) || fallbackUnitName;
    const vpu = p?.volumePerUnit ?? 0;
    // Quy cách: 1 ĐV cơ sở = vpu ĐV thể tích — chỉ quy đổi khi đang tính theo ĐV thể tích
    let packText = "";
    if (p && vpu > 0 && p.baseUnitName && p.volumeUnitName) {
      const spec = `${p.baseUnitName} - ${fmt(vpu)} ${p.volumeUnitName}`;
      packText = has && unitId && unitId === p.volumeUnitId ? `${fmt(Math.ceil(t / vpu))} ${spec}` : spec;
    }
    return {
      productId,
      name: p ? productNameOf(p) : "Vật tư đã ngừng sử dụng",
      code: p?.code ?? "",
      productType: p?.productType ?? ProductType.Supply,
      typeName: p ? materialTypeName(p.productType) : "—",
      isExtra,
      quantity,
      unitId,
      unitName,
      unitOptions: (p?.units ?? []).map((u) => ({ value: u.id, label: u.name })),
      mode,
      totalText: has ? `${fmt(t)} ${unitName}`.trim() : "—",
      hasTotal: has,
      avgText: q > 0 && n > 0 && !perYear ? `~ ${tiny(q / n)} ${unitName}`.trim() : "—",
      packText,
    };
  };

  const normRows = bkCombo.normMaterials
    .filter((m) => !hidden.has(m.productId))
    .map((m) => toRow(m.productId, m.quantity, m.unitId ?? null, m.unitName ?? "", ForecastQuantityMode.PerSample, false))
    .sort((a, b) => a.productType - b.productType || compareVi(a.name, b.name));
  const extraRows = bkConfig.extraMaterials
    .filter((m) => !normIds.has(m.productId))
    .map((m) => toRow(m.productId, m.quantity, m.unitId, "", m.mode, true));
  return [...normRows, ...extraRows];
};

export const buildEquipmentRows = (
  bkCombo: ForecastComboDto,
  bkConfig: ComboConfigState,
  equipmentById: ReadonlyMap<string, BatchNormProductOptionDto>
): EquipmentRowView[] => {
  const hidden = new Set(bkConfig.hiddenEquipmentIds);
  const normIds = new Set(bkCombo.normEquipmentIds);
  const toRow = (productId: string, isExtra: boolean): EquipmentRowView => {
    const p = equipmentById.get(productId);
    return { productId, name: p ? productNameOf(p) : "Thiết bị đã ngừng sử dụng", code: p?.code ?? "", isExtra };
  };
  return [
    ...bkCombo.normEquipmentIds
      .filter((id) => !hidden.has(id))
      .map((id) => toRow(id, false))
      .sort((a, b) => compareVi(a.name, b.name)),
    ...bkConfig.extraEquipmentIds.filter((id) => !normIds.has(id)).map((id) => toRow(id, true)),
  ];
};

/** Số mục đã bỏ khỏi dự toán (chỉ tính mục đúng là của định mức) */
export const hiddenCounts = (combo: ForecastComboDto, config: ComboConfigState): { materials: number; equipments: number } => {
  const normMaterials = new Set(combo.normMaterials.map((m) => m.productId));
  const normEquipments = new Set(combo.normEquipmentIds);
  return {
    materials: config.hiddenMaterialIds.filter((id) => normMaterials.has(id)).length,
    equipments: config.hiddenEquipmentIds.filter((id) => normEquipments.has(id)).length,
  };
};

/** Đơn vị mặc định khi bổ sung vật tư */
export const defaultUnitOf = (p: BatchNormProductOptionDto): string | null =>
  p.units.some((u) => u.id === p.defaultUnitId) ? p.defaultUnitId ?? null : p.units[0]?.id ?? null;

/** Dữ liệu gửi BE: bộ đang áp dụng tiêu hao không gửi cấu hình riêng */
export const toSaveItem = (
  combo: ForecastComboDto,
  config: ComboConfigState,
  source: string
): SaveForecastDetailItemInput => {
  if (source) {
    return {
      testMethodIndicatorId: combo.testMethodIndicatorId,
      estimatedSamples: config.samples,
      sourceTestMethodIndicatorId: source,
      extraMaterials: [],
      extraEquipmentIds: [],
      hiddenMaterialIds: [],
      hiddenEquipmentIds: [],
    };
  }
  const normMaterials = new Set(combo.normMaterials.map((m) => m.productId));
  const normEquipments = new Set(combo.normEquipmentIds);
  return {
    testMethodIndicatorId: combo.testMethodIndicatorId,
    estimatedSamples: config.samples,
    sourceTestMethodIndicatorId: null,
    extraMaterials: config.extraMaterials
      .filter((m) => !normMaterials.has(m.productId))
      .map((m) => ({ productId: m.productId, unitId: m.unitId, quantity: m.quantity, mode: m.mode })),
    extraEquipmentIds: config.extraEquipmentIds.filter((id) => !normEquipments.has(id)),
    hiddenMaterialIds: config.hiddenMaterialIds.filter((id) => normMaterials.has(id)),
    hiddenEquipmentIds: config.hiddenEquipmentIds.filter((id) => normEquipments.has(id)),
  };
};

// ===================== Cây bên trái: Nhóm nền mẫu › Nền mẫu › Chỉ tiêu =====================

const CATEGORY_PALETTE: readonly [string, string, string, string][] = [
  ["#fff7e6", "#873800", "#ffd591", "#d46b08"],
  ["#fff0f6", "#9e1068", "#ffadd2", "#eb2f96"],
  ["#fcffe6", "#5b7a00", "#d3f261", "#7cb305"],
  ["#e6f7ff", "#003a8c", "#91d5ff", "#1890ff"],
  ["#f9f0ff", "#391085", "#d3adf7", "#722ed1"],
  ["#e6fffb", "#00474f", "#87e8de", "#13c2c2"],
];

const colorAt = (index: number): CategoryColor => {
  const [bg, fg, border, dot] = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
  return { bg, fg, border, dot };
};

export interface IndicatorNodeView {
  key: string;
  name: string;
  methodCount: number;
  missingCount: number;
}

export interface SpecimenNodeView {
  key: string;
  name: string;
  indicators: IndicatorNodeView[];
}

export interface CategoryNodeView {
  foldKey: string;
  name: string;
  meta: string;
  color: CategoryColor;
  specimens: SpecimenNodeView[];
}

/** `chosen` đã sắp xếp theo sortCombos */
export const buildForecastTree = (
  chosen: readonly ForecastComboDto[],
  samplesOf: (id: string) => number | null
): CategoryNodeView[] => {
  const nodes: CategoryNodeView[] = [];
  const byCategory = new Map<string, CategoryNodeView>();
  const stats = new Map<string, { indicators: Set<string>; methods: Set<string> }>();
  for (const c of chosen) {
    const catKey = comboCategoryKeyOf(c);
    let cat = byCategory.get(catKey);
    if (!cat) {
      cat = { foldKey: `G:${catKey}`, name: comboCategoryNameOf(c), meta: "", color: colorAt(nodes.length), specimens: [] };
      byCategory.set(catKey, cat);
      stats.set(catKey, { indicators: new Set(), methods: new Set() });
      nodes.push(cat);
    }
    const specKey = specimenKeyOf(c.specimenTypeId);
    let spec = cat.specimens.find((s) => s.key === specKey);
    if (!spec) {
      spec = { key: specKey, name: comboSpecimenNameOf(c), indicators: [] };
      cat.specimens.push(spec);
    }
    const key = comboKeyOf(c);
    let ind = spec.indicators.find((i) => i.key === key);
    if (!ind) {
      ind = { key, name: comboIndicatorNameOf(c), methodCount: 0, missingCount: 0 };
      spec.indicators.push(ind);
    }
    ind.methodCount += 1;
    if (!(samplesOf(c.testMethodIndicatorId) ?? 0)) ind.missingCount += 1;
    const s = stats.get(catKey)!;
    s.indicators.add(c.indicatorId);
    s.methods.add(c.testMethodId);
  }
  for (const [key, cat] of byCategory) {
    const s = stats.get(key)!;
    cat.meta = `${cat.specimens.length} nền mẫu · ${s.indicators.size} chỉ tiêu · ${s.methods.size} phương pháp`;
  }
  return nodes;
};

export const isOpen = (fold: FoldState, key: string): boolean => !fold[key];

// ===================== Popup chọn bộ =====================

export const filterForecastPick = (combos: readonly ForecastComboDto[], f: PickFilter): ForecastComboDto[] => {
  const method = foldText(f.method.trim());
  return combos.filter(
    (c) =>
      (!f.categoryKey || comboCategoryKeyOf(c) === f.categoryKey) &&
      (!f.specimenKey || specimenKeyOf(c.specimenTypeId) === f.specimenKey) &&
      (!f.indicatorId || c.indicatorId === f.indicatorId) &&
      (!method || foldText(`${c.testMethodCode ?? ""} ${c.testMethodName ?? ""}`).includes(method)) &&
      (!f.onlyFree || !hasSavedForecast(c))
  );
};

/** `lockedIds`: bộ không chọn được (đã có dự toán — phiếu tạo mới) */
export const applyForecastPickTab = (
  combos: readonly ForecastComboDto[],
  tab: PickTab,
  selected: ReadonlySet<string>,
  isLocked: (c: ForecastComboDto) => boolean
): ForecastComboDto[] => {
  if (tab === "sel") return combos.filter((c) => selected.has(c.testMethodIndicatorId));
  if (tab === "free") return combos.filter((c) => !isLocked(c) && !selected.has(c.testMethodIndicatorId));
  return [...combos];
};

// ===================== Popup áp dụng tiêu hao =====================

export const comboSearchText = (c: ForecastComboDto): string =>
  foldText(
    [comboCategoryNameOf(c), comboSpecimenNameOf(c), comboIndicatorNameOf(c), c.indicatorCode, comboMethodNameOf(c), c.testMethodCode].join(
      " "
    )
  );

// ===================== Nhập Excel (số mẫu / năm) =====================

export const sameText = (a: unknown, b: unknown): boolean =>
  foldText(String(a ?? "").trim()) === foldText(String(b ?? "").trim());

/** Nút xóa dòng vật tư / thiết bị (ẩn mà vẫn giữ chỗ để cột thẳng hàng) */
export const delButtonStyle = (hidden: boolean): CSSProperties =>
  hidden
    ? { visibility: "hidden", width: 24, height: 24 }
    : {
        width: 24,
        height: 24,
        padding: 0,
        border: "1px solid #d9d9d9",
        borderRadius: 6,
        background: "#fff",
        color: "#cf1322",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      };
