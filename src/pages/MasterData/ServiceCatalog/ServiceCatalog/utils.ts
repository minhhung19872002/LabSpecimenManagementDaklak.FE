import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  BulkPriceAdjustMode,
  type ImportServicePriceRowInput,
  type ServiceCatalogItemDto,
} from "../../../../services/serviceCatalogService";

/** Cột "Mọi nền mẫu" (dịch vụ không gắn nền mẫu) */
export const ALL_SPECIMEN_KEY = "__all__";

export const specimenKeyOf = (specimenTypeId?: string | null): string => specimenTypeId || ALL_SPECIMEN_KEY;

export const formatPrice = (value?: number | null): string =>
  value == null ? "—" : new Intl.NumberFormat("vi-VN").format(value);

export const formatShortDate = (value?: string | null): string => (value ? dayjs(value).format("DD/MM/YYYY") : "—");

export const toApiDate = (value: dayjs.Dayjs): string => value.format("YYYY-MM-DD");

export interface SpecimenColumn {
  key: string;
  specimenTypeId: string | null;
  name: string;
}

/** 1 dòng ma trận = Phương pháp + Chỉ tiêu; ô = dịch vụ theo nền mẫu */
export interface ServiceMatrixRow {
  key: string;
  kind: "method" | "indicator";
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  indicatorId?: string;
  indicatorName?: string;
  indicatorFormattedName?: string | null;
  indicatorGroupName?: string | null;
  isSubIndicator?: boolean;
  cells: Record<string, ServiceCatalogItemDto>;
  /** Toàn bộ dịch vụ của dòng (dòng phương pháp = mọi dịch vụ con) */
  serviceIds: string[];
  children?: ServiceMatrixRow[];
}

/** Gom dịch vụ thành cây Phương pháp ▸ Chỉ tiêu, giữ thứ tự BE trả về */
export const buildServiceMatrix = (services: ServiceCatalogItemDto[]): ServiceMatrixRow[] => {
  const methods = new Map<string, ServiceMatrixRow>();
  const indicatorRows = new Map<string, ServiceMatrixRow>();

  for (const s of services) {
    let method = methods.get(s.testMethodId);
    if (!method) {
      method = {
        key: `m:${s.testMethodId}`,
        kind: "method",
        testMethodId: s.testMethodId,
        testMethodCode: s.testMethodCode,
        testMethodName: s.testMethodName,
        cells: {},
        serviceIds: [],
        children: [],
      };
      methods.set(s.testMethodId, method);
    }
    const rowKey = `i:${s.testMethodId}:${s.indicatorId}`;
    let row = indicatorRows.get(rowKey);
    if (!row) {
      row = {
        key: rowKey,
        kind: "indicator",
        testMethodId: s.testMethodId,
        testMethodCode: s.testMethodCode,
        testMethodName: s.testMethodName,
        indicatorId: s.indicatorId,
        indicatorName: s.indicatorName,
        indicatorFormattedName: s.indicatorFormattedName,
        indicatorGroupName: s.indicatorGroupName,
        isSubIndicator: !!s.parentIndicatorId,
        cells: {},
        serviceIds: [],
      };
      indicatorRows.set(rowKey, row);
      method.children!.push(row);
    }
    row.cells[specimenKeyOf(s.specimenTypeId)] = s;
    row.serviceIds.push(s.id);
    method.serviceIds.push(s.id);
  }
  return [...methods.values()];
};

/** Các cột nền mẫu đang có dịch vụ ("Mọi nền mẫu" đứng đầu) */
export const collectSpecimenColumns = (services: ServiceCatalogItemDto[]): SpecimenColumn[] => {
  const columns = new Map<string, SpecimenColumn>();
  for (const s of services) {
    const key = specimenKeyOf(s.specimenTypeId);
    if (!columns.has(key)) {
      columns.set(key, {
        key,
        specimenTypeId: s.specimenTypeId ?? null,
        name: s.specimenTypeName || "Mọi nền mẫu",
      });
    }
  }
  return [...columns.values()].sort((a, b) =>
    a.key === ALL_SPECIMEN_KEY ? -1 : b.key === ALL_SPECIMEN_KEY ? 1 : a.name.localeCompare(b.name, "vi")
  );
};

export const serviceDisplayName = (s: ServiceCatalogItemDto): string =>
  `${s.indicatorName} · ${s.specimenTypeName || "Mọi nền mẫu"} · ${s.testMethodName}`;

/** Giá gốc để tính hàng loạt tại ngày áp dụng (khớp BE: phiên bản có hiệu lực tại ngày đó) */
export const basisPriceAt = (s: ServiceCatalogItemDto, effectiveDate: string): number =>
  s.upcomingPrice != null && s.upcomingEffectiveDate && dayjs(s.upcomingEffectiveDate).format("YYYY-MM-DD") <= effectiveDate
    ? s.upcomingPrice
    : s.unitPrice;

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
  "TAT_Days",
  "Effective_Date",
] as const;

export const exportServicesToExcel = (services: ServiceCatalogItemDto[]): void => {
  const rows = services.map((s) => ({
    Service_ID: s.serviceCode ?? "",
    Parameter: s.indicatorName,
    Matrix: s.specimenTypeName || "Mọi nền mẫu",
    Method: s.testMethodName,
    Unit_Price: s.priceAtDate,
    TAT_Days: s.turnaroundDaysAtDate ?? s.turnaroundDays ?? "",
    Effective_Date: s.effectiveDateAtDate ? dayjs(s.effectiveDateAtDate).format("DD/MM/YYYY") : "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...EXCEL_COLUMNS] });
  ws["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 22 }, { wch: 40 }, { wch: 14 }, { wch: 10 }, { wch: 14 }];
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

const toDateString = (value: unknown): string | null => {
  if (value == null || value === "") return null;
  if (value instanceof Date) return dayjs(value).format("YYYY-MM-DD");
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return dayjs(new Date(parsed.y, parsed.m - 1, parsed.d)).format("YYYY-MM-DD");
  }
  const text = String(value).trim();
  const vn = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (vn) return dayjs(new Date(+vn[3], +vn[2] - 1, +vn[1])).format("YYYY-MM-DD");
  const d = dayjs(text);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
};

/** Đọc file Excel bảng giá → dòng gửi BE (dòng = số dòng Excel, tính cả header) */
export const parseImportFile = async (file: File): Promise<ImportServicePriceRowInput[]> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return raw
    .map((r, idx) => {
      const price = toNumber(r.Unit_Price);
      const tat = toNumber(r.TAT_Days);
      return {
        line: idx + 2,
        serviceCode: String(r.Service_ID ?? "").trim(),
        // NaN → null để BE báo lỗi "giá không hợp lệ"
        unitPrice: price == null || Number.isNaN(price) ? null : price,
        turnaroundDays: tat == null || Number.isNaN(tat) ? null : Math.round(tat),
        effectiveDate: toDateString(r.Effective_Date),
      };
    })
    .filter((r) => r.serviceCode || r.unitPrice != null);
};
