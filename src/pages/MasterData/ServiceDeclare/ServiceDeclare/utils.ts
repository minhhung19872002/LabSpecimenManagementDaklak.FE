import type React from "react";
import type { IndicatorDto, IndicatorGroupDto, SpecimenTypeDto } from "../../../../services/masterDataService";
import type { ServiceCatalogItemDto } from "../../../../services/serviceCatalogService";
import { ALL_SPECIMEN_KEY, specimenKeyOf } from "../../ServiceCatalog/ServiceCatalog/utils";

/** Trang Dịch vụ & Bảng giá (tab services của Ngân hàng dữ liệu) */
export const SERVICE_CATALOG_URL = "/master-data?tab=services";
export const SERVICE_DECLARE_PATH = "/master-data/services/declare";

const ALL_SPECIMEN_PARAM = "all";
const NO_GROUP_ID = "__none__";
const NO_GROUP_NAME = "Chưa phân nhóm";
const NO_CATEGORY_NAME = "Khác";

export interface ServiceDeclarePrefill {
  /** Dịch vụ cấp 1 (nút "+ Thêm" trên thẻ dịch vụ của L2) */
  serviceGroupId?: string;
  testMethodId?: string;
  indicatorId?: string;
  /** null = Mọi nền mẫu */
  specimenTypeId?: string | null;
}

/** Link mở Phiếu khai báo có điền sẵn (nút "Tạo dịch vụ hàng loạt" / nhấp đúp ô trống ma trận) */
export const buildServiceDeclareUrl = (prefill?: ServiceDeclarePrefill | null): string => {
  const params = new URLSearchParams();
  if (prefill?.serviceGroupId) params.set("service", prefill.serviceGroupId);
  if (prefill?.testMethodId) params.set("method", prefill.testMethodId);
  if (prefill?.indicatorId) params.set("indicator", prefill.indicatorId);
  if (prefill && prefill.specimenTypeId !== undefined) {
    params.set("specimen", prefill.specimenTypeId ?? ALL_SPECIMEN_PARAM);
  }
  const qs = params.toString();
  return qs ? `${SERVICE_DECLARE_PATH}?${qs}` : SERVICE_DECLARE_PATH;
};

export const parseServiceDeclarePrefill = (params: URLSearchParams): ServiceDeclarePrefill => {
  const specimen = params.get("specimen");
  return {
    serviceGroupId: params.get("service") ?? undefined,
    testMethodId: params.get("method") ?? undefined,
    indicatorId: params.get("indicator") ?? undefined,
    specimenTypeId: specimen == null ? undefined : specimen === ALL_SPECIMEN_PARAM ? null : specimen,
  };
};

/** Bỏ dấu tiếng Việt + chữ thường — tìm kiếm không phân biệt dấu */
export const normalizeSearch = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");

/** Khóa 1 ô = chỉ tiêu × nền mẫu */
export const cellKeyOf = (indicatorId: string, specimenTypeId: string | null): string =>
  `${indicatorId}|${specimenKeyOf(specimenTypeId)}`;

/** 1 cột nền mẫu của phiếu (hoặc "Mọi nền mẫu") */
export interface DeclareColumn {
  key: string;
  specimenTypeId: string | null;
  name: string;
}

export const ALL_SPECIMEN_COLUMN: DeclareColumn = { key: ALL_SPECIMEN_KEY, specimenTypeId: null, name: "Mọi nền mẫu" };

export interface IndicatorTreeGroup {
  id: string;
  name: string;
  /** Chỉ tiêu đang hoạt động của nhóm (thứ tự master) */
  indicators: IndicatorDto[];
}

/** Cây chỉ tiêu: mọi chỉ tiêu đang hoạt động, gom theo danh mục Nhóm chỉ tiêu */
export const buildIndicatorTree = (indicators: IndicatorDto[], groups: IndicatorGroupDto[]): IndicatorTreeGroup[] => {
  const byGroup = new Map<string, IndicatorDto[]>();
  for (const ind of indicators) {
    if (!ind.isActive) continue;
    const gid = ind.indicatorGroupId || NO_GROUP_ID;
    const list = byGroup.get(gid);
    if (list) list.push(ind);
    else byGroup.set(gid, [ind]);
  }
  const tree: IndicatorTreeGroup[] = groups
    .filter((g) => byGroup.has(g.id))
    .map((g) => ({ id: g.id, name: g.name, indicators: byGroup.get(g.id) ?? [] }));
  const known = new Set(tree.map((g) => g.id));
  // Nhóm đã ngừng / không có trong danh mục → vẫn cho chọn chỉ tiêu, gom vào "Chưa phân nhóm"
  const orphans = [...byGroup.entries()].filter(([gid]) => !known.has(gid)).flatMap(([, list]) => list);
  if (orphans.length > 0) tree.push({ id: NO_GROUP_ID, name: NO_GROUP_NAME, indicators: orphans });
  return tree;
};

export interface SpecimenCategoryGroup {
  name: string;
  items: SpecimenTypeDto[];
}

export const groupSpecimensByCategory = (specimens: SpecimenTypeDto[], query: string): SpecimenCategoryGroup[] => {
  const q = normalizeSearch(query.trim());
  const groups = new Map<string, SpecimenTypeDto[]>();
  for (const s of specimens) {
    const cat = s.sampleTypeCategoryName || NO_CATEGORY_NAME;
    if (q && !normalizeSearch(`${s.name} ${cat}`).includes(q)) continue;
    const list = groups.get(cat);
    if (list) list.push(s);
    else groups.set(cat, [s]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "vi"))
    .map(([name, items]) => ({ name, items }));
};

/** Dịch vụ đã có (chỉ tiêu × nền mẫu của phương pháp) → dòng "Đã có dịch vụ · bỏ qua" */
export interface ExistingServiceInfo {
  /** null = Chờ định giá */
  price: number | null;
  unit: string | null;
  isSubcontract: boolean;
}

/** Dịch vụ đã có của phương pháp: khóa ô → giá / ĐVT / HĐ phụ */
export const buildExistingServiceMap = (services: ServiceCatalogItemDto[]): Map<string, ExistingServiceInfo> =>
  new Map(
    services.map((s) => [
      cellKeyOf(s.indicatorId, s.specimenTypeId ?? null),
      { price: s.priceAtDate ?? null, unit: s.unit ?? null, isSubcontract: s.isSubcontract },
    ])
  );

/** Gợi ý ① Tên dịch vụ: lọc không dấu, khớp đúng tên lên đầu */
export const filterServiceGroups = <T extends { name: string }>(groups: T[], query: string): { items: T[]; exact?: T } => {
  const q = normalizeSearch(query.trim());
  if (!q) return { items: groups };
  // Khớp đúng: so chữ thường (giữ dấu) — giống BE dùng lại dịch vụ trùng tên
  const lower = query.trim().toLowerCase();
  const exact = groups.find((g) => g.name.trim().toLowerCase() === lower);
  const items = groups.filter((g) => normalizeSearch(g.name).includes(q));
  return { items: exact ? [exact, ...items.filter((g) => g !== exact)] : items, exact };
};

/** ĐVT tối đa trên phiếu (theo mẫu BA) */
export const UNIT_MAX_LENGTH = 30;

export type QuickFillScope = "empty" | "all";

/** Ô số bước ①②③④: xong = xanh lá, đang làm = xanh dương, chưa tới = xám */
export const stepBadgeStyle = (done: boolean, active: boolean): React.CSSProperties => ({
  flex: "none",
  width: 22,
  height: 22,
  borderRadius: 11,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 500,
  ...(done
    ? { background: "#389e0d", color: "#fff" }
    : active
      ? { background: "#096dd9", color: "#fff", boxShadow: "0 0 0 3px #bae0ff" }
      : { background: "#f0f2f5", color: "#595959", border: "1px solid #d9d9d9" }),
});

export const PILL_STYLE: React.CSSProperties = {
  fontSize: 13,
  lineHeight: "22px",
  padding: "0 10px",
  borderRadius: 11,
  border: "1px solid",
  whiteSpace: "nowrap",
};
