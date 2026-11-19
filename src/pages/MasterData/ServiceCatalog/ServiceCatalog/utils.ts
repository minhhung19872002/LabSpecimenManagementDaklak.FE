import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  BulkPriceAdjustMode,
  type ImportServicePriceRowInput,
  type ServiceCatalogItemDto,
} from "../../../../services/serviceCatalogService";

/** Cột "Mọi nền mẫu" (dịch vụ không gắn nền mẫu) */
export const ALL_SPECIMEN_KEY = "__all__";

/** Chip lọc nhóm nền mẫu "Tất cả" */
export const ALL_CATEGORY = "__all__";

const NO_GROUP_KEY = "__none__";
const NO_GROUP_NAME = "Chưa phân nhóm";
const NO_CATEGORY_NAME = "Khác";

export const specimenKeyOf = (specimenTypeId?: string | null): string => specimenTypeId || ALL_SPECIMEN_KEY;

export const formatPrice = (value?: number | null): string =>
  value == null ? "—" : new Intl.NumberFormat("vi-VN").format(value);

/** Dịch vụ chưa nhập giá (UnitPrice null) */
export const PENDING_PRICE_LABEL = "Chờ định giá";

export const formatShortDate = (value?: string | null): string => (value ? dayjs(value).format("DD/MM/YYYY") : "—");

export const toApiDate = (value: dayjs.Dayjs): string => value.format("YYYY-MM-DD");

export type ServiceCatalogTab = "grid" | "list";

export interface ServiceRule {
  code: string;
  text: string;
}

/** Quy tắc áp dụng (theo BA TIHE_1611) */
export const SERVICE_RULES: ServiceRule[] = [
  { code: "Unique", text: "[Chỉ tiêu + Nền mẫu + Phương pháp] — mỗi tổ hợp chỉ có 1 dịch vụ." },
  { code: "5.1", text: "Tạo hàng loạt: 1 Phương pháp → chọn nhiều Chỉ tiêu × Nền mẫu → 1 Giá chung (để trống = Chờ định giá) → hệ thống nhân ma trận." },
  { code: "5.2", text: "Ma trận giá: dòng = Chỉ tiêu + Phương pháp, cột = Nền mẫu, ô = Giá; nhấp đúp sửa, Enter tự lưu." },
  { code: "5.3", text: "Cập nhật giá hàng loạt theo % hoặc số tiền, áp dụng ngay → sinh version giá (giữ lịch sử)." },
  { code: "5.4", text: "Xuất bảng giá ra .xlsx, nhập ngược lại; hệ thống kiểm tra Mã dịch vụ rồi cập nhật." },
  { code: "BR-06", text: "Không xóa cứng khi đã phát sinh giao dịch — ngừng sử dụng thay vì xóa. Phiếu / báo giá cũ giữ giá đã lưu." },
];

export interface SpecimenColumn {
  key: string;
  specimenTypeId: string | null;
  name: string;
  /** Nhóm nền mẫu (loại mẫu) — dùng cho chip "Cột nền mẫu" */
  categoryName: string;
}

/**
 * Ma trận giá (theo mock): nhóm chỉ tiêu ▸ dòng Chỉ tiêu + Phương pháp; ô = dịch vụ theo nền mẫu.
 */
export interface ServiceMatrixRow {
  key: string;
  kind: "group" | "row";
  groupName: string;
  /** Số dòng chỉ tiêu trong nhóm (dòng nhóm) */
  rowCount?: number;
  testMethodId?: string;
  testMethodCode?: string;
  testMethodName?: string;
  testMethodFormattedName?: string | null;
  indicatorId?: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorFormattedName?: string | null;
  isSubIndicator?: boolean;
  cells: Record<string, ServiceCatalogItemDto>;
  /** Toàn bộ dịch vụ của dòng (dòng nhóm = mọi dịch vụ con) */
  serviceIds: string[];
  children?: ServiceMatrixRow[];
  // ---- Chỉ có ở dòng nhóm của danh sách phẳng (buildMatrixPageRows) ----
  /** Key gốc của nhóm (dòng "tiếp" ở trang sau có key riêng nhưng cùng groupKey) */
  groupKey?: string;
  /** Key mọi dòng chỉ tiêu trong nhóm (kể cả khi nhóm đang thu gọn) */
  rowKeys?: string[];
  expanded?: boolean;
  /** Dòng tiêu đề lặp lại khi nhóm bị cắt sang trang sau */
  continued?: boolean;
}

/** Ma trận phân trang theo DÒNG (không theo nhóm) để máy yếu không phải vẽ hết một lúc */
export const MATRIX_PAGE_SIZE_OPTIONS = [20, 30, 50, 100];
export const DEFAULT_MATRIX_PAGE_SIZE = 30;

/**
 * Trải cây Nhóm ▸ Dòng thành danh sách phẳng để Table phân trang theo số dòng.
 * Trang bắt đầu giữa nhóm → chèn dòng tiêu đề "(tiếp)" để mỗi trang đều thấy tên nhóm;
 * mỗi trang đúng `pageSize` phần tử nên phân trang của Table khớp với cách chia ở đây.
 */
export const buildMatrixPageRows = (
  groups: ServiceMatrixRow[],
  expandedKeys: ReadonlySet<string>,
  pageSize: number
): ServiceMatrixRow[] => {
  const out: ServiceMatrixRow[] = [];
  for (const g of groups) {
    const children = g.children ?? [];
    const expanded = expandedKeys.has(g.key);
    const rowKeys = children.map((c) => c.key);
    const header = (key: string, continued: boolean): ServiceMatrixRow => ({
      ...g,
      key,
      children: undefined,
      groupKey: g.key,
      rowKeys,
      expanded,
      continued,
    });
    out.push(header(g.key, false));
    if (!expanded) continue;
    for (const child of children) {
      if (out.length % pageSize === 0) out.push(header(`${g.key}#${out.length / pageSize}`, true));
      out.push(child);
    }
  }
  return out;
};

export const isMatrixRowKey = (key: string | number | bigint): boolean => String(key).startsWith("r:");

const compareVi = (a?: string | null, b?: string | null) => (a ?? "").localeCompare(b ?? "", "vi");

/** Gom dịch vụ thành cây Nhóm chỉ tiêu ▸ (Chỉ tiêu + Phương pháp) */
export const buildServiceMatrix = (services: ServiceCatalogItemDto[]): ServiceMatrixRow[] => {
  const groups = new Map<string, ServiceMatrixRow>();
  const rows = new Map<string, ServiceMatrixRow>();

  for (const s of services) {
    const groupKey = s.indicatorGroupId || NO_GROUP_KEY;
    let group = groups.get(groupKey);
    if (!group) {
      group = {
        key: `g:${groupKey}`,
        kind: "group",
        groupName: s.indicatorGroupName || NO_GROUP_NAME,
        cells: {},
        serviceIds: [],
        children: [],
      };
      groups.set(groupKey, group);
    }
    const rowKey = `r:${s.indicatorId}:${s.testMethodId}`;
    let row = rows.get(rowKey);
    if (!row) {
      row = {
        key: rowKey,
        kind: "row",
        groupName: group.groupName,
        testMethodId: s.testMethodId,
        testMethodCode: s.testMethodCode,
        testMethodName: s.testMethodName,
        testMethodFormattedName: s.testMethodFormattedName,
        indicatorId: s.indicatorId,
        indicatorCode: s.indicatorCode,
        indicatorName: s.indicatorName,
        indicatorFormattedName: s.indicatorFormattedName,
        isSubIndicator: !!s.parentIndicatorId,
        cells: {},
        serviceIds: [],
      };
      rows.set(rowKey, row);
      group.children!.push(row);
    }
    row.cells[specimenKeyOf(s.specimenTypeId)] = s;
    row.serviceIds.push(s.id);
    group.serviceIds.push(s.id);
  }

  const result = [...groups.values()];
  for (const g of result) {
    g.children!.sort(
      (a, b) => compareVi(a.indicatorName, b.indicatorName) || compareVi(a.testMethodName, b.testMethodName)
    );
    g.rowCount = g.children!.length;
  }
  return result.sort((a, b) =>
    a.key === `g:${NO_GROUP_KEY}` ? 1 : b.key === `g:${NO_GROUP_KEY}` ? -1 : compareVi(a.groupName, b.groupName)
  );
};

/** Các cột nền mẫu đang có dịch vụ ("Mọi nền mẫu" đứng đầu) */
export const collectSpecimenColumns = (
  services: ServiceCatalogItemDto[],
  categoryBySpecimenId: Map<string, string>
): SpecimenColumn[] => {
  const columns = new Map<string, SpecimenColumn>();
  for (const s of services) {
    const key = specimenKeyOf(s.specimenTypeId);
    if (!columns.has(key)) {
      columns.set(key, {
        key,
        specimenTypeId: s.specimenTypeId ?? null,
        name: s.specimenTypeName || "Mọi nền mẫu",
        categoryName: s.specimenTypeId ? categoryBySpecimenId.get(s.specimenTypeId) || NO_CATEGORY_NAME : "",
      });
    }
  }
  return [...columns.values()].sort((a, b) =>
    a.key === ALL_SPECIMEN_KEY
      ? -1
      : b.key === ALL_SPECIMEN_KEY
        ? 1
        : compareVi(a.categoryName, b.categoryName) || compareVi(a.name, b.name)
  );
};

/** Nhóm nền mẫu có trong các cột (cho chip lọc) */
export const collectSpecimenCategories = (columns: SpecimenColumn[]): string[] =>
  [...new Set(columns.map((c) => c.categoryName).filter(Boolean))];

/** Cột hiển thị theo chip nhóm nền mẫu ("Mọi nền mẫu" luôn hiện) */
export const filterSpecimenColumns = (columns: SpecimenColumn[], category: string): SpecimenColumn[] =>
  category === ALL_CATEGORY ? columns : columns.filter((c) => c.key === ALL_SPECIMEN_KEY || c.categoryName === category);

export const serviceDisplayName = (s: ServiceCatalogItemDto): string =>
  `${s.indicatorName} · ${s.specimenTypeName || "Mọi nền mẫu"} · ${s.testMethodName}`;

/**
 * Giá gốc để tính hàng loạt tại ngày áp dụng (khớp BE: phiên bản có hiệu lực tại ngày đó).
 * null = Chờ định giá → BE bỏ qua dịch vụ này.
 */
export const basisPriceAt = (s: ServiceCatalogItemDto, effectiveDate: string): number | null =>
  s.upcomingPrice != null && s.upcomingEffectiveDate && dayjs(s.upcomingEffectiveDate).format("YYYY-MM-DD") <= effectiveDate
    ? s.upcomingPrice
    : (s.unitPrice ?? null);

/** Giống BE ComputeAdjustedPrice: làm tròn 0 số lẻ (AwayFromZero), không âm */
export const computeAdjustedPrice = (
  oldPrice: number,
  mode: BulkPriceAdjustMode,
  increase: boolean,
  value: number
): number => {
  const delta = mode === BulkPriceAdjustMode.Percent ? (oldPrice * value) / 100 : value;
  const next = increase ? oldPrice + delta : oldPrice - delta;
  const rounded = Math.sign(next) * Math.round(Math.abs(next));
  return Math.max(0, rounded);
};

// ===================== Excel =====================

export const EXCEL_COLUMNS = [
  "Service_ID",
  "Parameter",
  "Matrix",
  "Method",
  "Unit_Price",
] as const;

export const exportServicesToExcel = (services: ServiceCatalogItemDto[]): void => {
  const rows = services.map((s) => ({
    Service_ID: s.serviceCode ?? "",
    Parameter: s.indicatorName,
    Matrix: s.specimenTypeName || "Mọi nền mẫu",
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
