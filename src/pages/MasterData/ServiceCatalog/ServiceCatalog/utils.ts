import dayjs from "dayjs";
import * as XLSX from "xlsx";
import type { ImportServicePriceRowInput, ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";

/** Nền mẫu "Mọi nền mẫu" (dịch vụ không gắn nền mẫu) */
export const ALL_SPECIMEN_KEY = "__all__";
export const ALL_SPECIMEN_NAME = "Mọi nền mẫu";

const NO_GROUP_KEY = "__none__";
const NO_GROUP_NAME = "Chưa phân nhóm";

export const specimenKeyOf = (specimenTypeId?: string | null): string => specimenTypeId || ALL_SPECIMEN_KEY;

export const formatPrice = (value?: number | null): string =>
  value == null ? "—" : new Intl.NumberFormat("vi-VN").format(value);

/** Dịch vụ chưa nhập giá (UnitPrice null) */
export const PENDING_PRICE_LABEL = "Chờ định giá";

export const formatShortDate = (value?: string | null): string => (value ? dayjs(value).format("DD/MM/YYYY") : "—");

export const serviceDisplayName = (s: ServiceCatalogItemDto): string =>
  `${s.indicatorName} · ${s.specimenTypeName || ALL_SPECIMEN_NAME} · ${s.testMethodName}`;

const compareVi = (a?: string | null, b?: string | null) => (a ?? "").localeCompare(b ?? "", "vi");

/** "Mọi nền mẫu" luôn đứng đầu */
const compareSpecimenKey = (a: string, b: string) =>
  a === b ? 0 : a === ALL_SPECIMEN_KEY ? -1 : b === ALL_SPECIMEN_KEY ? 1 : 0;

// ===================== Danh sách Dịch vụ → Nền mẫu → Chỉ tiêu =====================

/** "Mở đến": cấp sâu nhất được mở mặc định */
export type ServiceOpenLevel = "service" | "specimen" | "indicator";

/** Lọc nhanh */
export type ServiceQuickFilter = "all" | "pending" | "subcontract";

/** Giá sửa chưa lưu: serviceId → giá mới */
export type PriceEdits = ReadonlyMap<string, number>;

/** Giá đang hiển thị (ưu tiên giá vừa sửa chưa lưu) */
export const effectivePriceOf = (s: ServiceCatalogItemDto, edits: PriceEdits): number | null =>
  edits.get(s.id) ?? s.priceAtDate ?? null;

/**
 * Chờ định giá = dịch vụ đang dùng mà chưa có giá.
 * BA (19/11): "Mọi nền mẫu" chỉ là 1 nền mẫu bình thường (khai báo giá chọn "Mọi nền mẫu" thì dịch vụ rơi vào đó),
 * KHÔNG kế thừa giá sang nền mẫu khác.
 */
export const isPendingPrice = (s: ServiceCatalogItemDto, edits: PriceEdits): boolean =>
  s.isActive && effectivePriceOf(s, edits) == null;

export const hasSubcontract = (s: ServiceCatalogItemDto): boolean => s.isSubcontract;

/** So khớp không dấu: "dinh duong" khớp "dinh dưỡng" */
export const foldText = (value?: string | null): string =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

export interface ServiceBaseFilter {
  keyword: string;
  testMethodId?: string;
  specimenKey?: string;
}

/** Lọc theo ô tìm + phương pháp + nền mẫu (chưa áp lọc nhanh — để đếm số trên nút lọc nhanh) */
export const filterServices = (services: ServiceCatalogItemDto[], f: ServiceBaseFilter): ServiceCatalogItemDto[] => {
  const kw = foldText(f.keyword.trim());
  return services.filter(
    (s) =>
      (!f.testMethodId || s.testMethodId === f.testMethodId) &&
      (!f.specimenKey || specimenKeyOf(s.specimenTypeId) === f.specimenKey) &&
      (!kw ||
        foldText(
          [
            s.indicatorName,
            s.specimenTypeName || ALL_SPECIMEN_NAME,
            s.serviceCode,
            s.indicatorGroupName,
            s.testMethodName,
            s.subcontractorName,
          ].join(" ")
        ).includes(kw))
  );
};

export const applyQuickFilter = (
  services: ServiceCatalogItemDto[],
  quick: ServiceQuickFilter,
  edits: PriceEdits
): ServiceCatalogItemDto[] => {
  if (quick === "pending") return services.filter((s) => isPendingPrice(s, edits));
  if (quick === "subcontract") return services.filter(hasSubcontract);
  return services;
};

export interface FilterOption {
  value: string;
  label: string;
}

const buildCountOptions = (
  services: ServiceCatalogItemDto[],
  keyOf: (s: ServiceCatalogItemDto) => string,
  labelOf: (s: ServiceCatalogItemDto) => string,
  compareKey: (a: string, b: string) => number = () => 0
): FilterOption[] => {
  const map = new Map<string, { label: string; count: number }>();
  for (const s of services) {
    const key = keyOf(s);
    const cur = map.get(key);
    if (cur) cur.count += 1;
    else map.set(key, { label: labelOf(s), count: 1 });
  }
  return [...map.entries()]
    .sort((a, b) => compareKey(a[0], b[0]) || compareVi(a[1].label, b[1].label))
    .map(([value, v]) => ({ value, label: `${v.label} (${v.count})` }));
};

/** Lựa chọn lọc phương pháp: "Tên (số dịch vụ)" */
export const buildMethodOptions = (services: ServiceCatalogItemDto[]): FilterOption[] =>
  buildCountOptions(services, (s) => s.testMethodId, (s) => s.testMethodName);

/** Lựa chọn lọc nền mẫu ("Mọi nền mẫu" đứng đầu) */
export const buildSpecimenOptions = (services: ServiceCatalogItemDto[]): FilterOption[] =>
  buildCountOptions(
    services,
    (s) => specimenKeyOf(s.specimenTypeId),
    (s) => s.specimenTypeName || ALL_SPECIMEN_NAME,
    compareSpecimenKey
  );

export interface ServiceSpecimenBlock {
  /** Khoá gập/mở: "N:<nhóm>|<nền mẫu>" */
  foldKey: string;
  specimenKey: string;
  specimenTypeId: string | null;
  name: string;
  isAll: boolean;
  services: ServiceCatalogItemDto[];
  pendingCount: number;
}

/** 1 thẻ "Dịch vụ" = 1 Nhóm chỉ tiêu (BA: tên dịch vụ chính là nhóm chỉ tiêu cũ) */
export interface ServiceGroupCard {
  /** Khoá gập/mở: "S:<nhóm>" */
  foldKey: string;
  groupId: string | null;
  name: string;
  initials: string;
  specimenCount: number;
  indicatorCount: number;
  methodCount: number;
  pendingCount: number;
  subcontractCount: number;
  priceRangeText: string;
  specimens: ServiceSpecimenBlock[];
}

const NO_GROUP_FOLD_KEY = `S:${NO_GROUP_KEY}`;

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const formatPriceRange = (prices: number[]): string => {
  if (prices.length === 0) return "Chưa có giá";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${formatPrice(min)} đ` : `${formatPrice(min)} – ${formatPrice(max)} đ`;
};

const buildSpecimenBlocks = (groupKey: string, items: ServiceCatalogItemDto[], edits: PriceEdits) => {
  const blocks = new Map<string, ServiceSpecimenBlock>();
  for (const s of items) {
    const specimenKey = specimenKeyOf(s.specimenTypeId);
    let b = blocks.get(specimenKey);
    if (!b) {
      b = {
        foldKey: `N:${groupKey}|${specimenKey}`,
        specimenKey,
        specimenTypeId: s.specimenTypeId ?? null,
        name: s.specimenTypeName || ALL_SPECIMEN_NAME,
        isAll: specimenKey === ALL_SPECIMEN_KEY,
        services: [],
        pendingCount: 0,
      };
      blocks.set(specimenKey, b);
    }
    b.services.push(s);
    if (isPendingPrice(s, edits)) b.pendingCount += 1;
  }
  const result = [...blocks.values()].sort(
    (a, b) => compareSpecimenKey(a.specimenKey, b.specimenKey) || compareVi(a.name, b.name)
  );
  for (const b of result) {
    b.services.sort(
      (x, y) => compareVi(x.indicatorName, y.indicatorName) || compareVi(x.testMethodName, y.testMethodName)
    );
  }
  return result;
};

/** Gom dịch vụ: Dịch vụ (nhóm chỉ tiêu) ▸ Nền mẫu ▸ Chỉ tiêu (mỗi dòng 1 phương pháp) */
export const buildServiceGroups = (services: ServiceCatalogItemDto[], edits: PriceEdits): ServiceGroupCard[] => {
  const groups = new Map<string, { id: string | null; name: string; items: ServiceCatalogItemDto[] }>();
  for (const s of services) {
    const key = s.indicatorGroupId || NO_GROUP_KEY;
    let g = groups.get(key);
    if (!g) {
      g = { id: s.indicatorGroupId ?? null, name: s.indicatorGroupName || NO_GROUP_NAME, items: [] };
      groups.set(key, g);
    }
    g.items.push(s);
  }

  const cards: ServiceGroupCard[] = [];
  for (const [groupKey, g] of groups) {
    const specimens = buildSpecimenBlocks(groupKey, g.items, edits);
    const prices = g.items.map((s) => effectivePriceOf(s, edits)).filter((p): p is number => p != null && p > 0);
    cards.push({
      foldKey: `S:${groupKey}`,
      groupId: g.id,
      name: g.name,
      initials: initialsOf(g.name),
      specimenCount: specimens.length,
      indicatorCount: new Set(g.items.map((s) => s.indicatorId)).size,
      methodCount: new Set(g.items.map((s) => s.testMethodId)).size,
      pendingCount: specimens.reduce((n, b) => n + b.pendingCount, 0),
      subcontractCount: g.items.filter(hasSubcontract).length,
      priceRangeText: formatPriceRange(prices),
      specimens,
    });
  }
  return cards.sort((a, b) =>
    a.foldKey === NO_GROUP_FOLD_KEY ? 1 : b.foldKey === NO_GROUP_FOLD_KEY ? -1 : compareVi(a.name, b.name)
  );
};

export type FoldState = Readonly<Record<string, boolean>>;

/** Thẻ dịch vụ mở? Người dùng đã bấm thì theo đó, chưa thì theo "Mở đến" */
export const isServiceOpen = (fold: FoldState, key: string, level: ServiceOpenLevel): boolean =>
  fold[key] ?? level !== "service";

/** Khối nền mẫu mở? */
export const isSpecimenOpen = (fold: FoldState, key: string, level: ServiceOpenLevel): boolean =>
  fold[key] ?? level === "indicator";

// ===================== Excel =====================

export const EXCEL_COLUMNS = ["Service_ID", "Parameter", "Matrix", "Method", "Unit_Price"] as const;

export const exportServicesToExcel = (services: ServiceCatalogItemDto[]): void => {
  const rows = services.map((s) => ({
    Service_ID: s.serviceCode ?? "",
    Parameter: s.indicatorName,
    Matrix: s.specimenTypeName || ALL_SPECIMEN_NAME,
    Method: s.testMethodName,
    Unit_Price: s.priceAtDate ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...EXCEL_COLUMNS] });
  ws["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 22 }, { wch: 40 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BangGia");
  XLSX.writeFile(wb, `bang-gia-dich-vu_${dayjs().format("YYYY-MM-DD")}.xlsx`);
};

const toNumber = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  // Chuỗi kiểu vi-VN "1.250.000" / "1.250.000,5"
  const text = String(value).trim().replace(/\s|đ|VND/gi, "");
  const normalized = /,\d{1,2}$/.test(text) ? text.replace(/\./g, "").replace(",", ".") : text.replace(/[.,]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Đọc file Excel bảng giá → dòng gửi BE (dòng = số dòng Excel, tính cả header).
 * Chỉ đọc giá: không gửi TAT / ngày → BE giữ TAT cũ, áp dụng từ hôm nay.
 */
export const parseImportFile = async (file: File): Promise<ImportServicePriceRowInput[]> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return raw
    .map((r, idx) => {
      const price = toNumber(r.Unit_Price);
      return {
        line: idx + 2,
        serviceCode: String(r.Service_ID ?? "").trim(),
        // NaN → null để BE báo lỗi "giá không hợp lệ"
        unitPrice: price == null || Number.isNaN(price) ? null : price,
      };
    })
    .filter((r) => r.serviceCode || r.unitPrice != null);
};
