import { api } from "./api";

// ===================== L2 — Dịch vụ & Bảng giá =====================

/** 1 dịch vụ = Phương pháp + Chỉ tiêu + Nền mẫu */
export interface ServiceCatalogItemDto {
  id: string;
  serviceCode?: string | null;
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  testMethodFormattedName?: string | null;
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  indicatorFormattedName?: string | null;
  parentIndicatorId?: string | null;
  indicatorGroupId?: string | null;
  indicatorGroupName?: string | null;
  /** Dịch vụ cấp 1. null = dịch vụ cũ "Chưa thuộc dịch vụ" */
  serviceGroupId?: string | null;
  serviceGroupCode?: string | null;
  serviceGroupName?: string | null;
  specimenTypeId?: string | null;
  specimenTypeCode?: string | null;
  specimenTypeName?: string | null;
  unit?: string | null;
  formattedUnit?: string | null;
  isActive: boolean;
  isSubcontract: boolean;
  /** Đơn vị nhận thầu (Nhà thầu phụ) khi là HĐ phụ — không bắt buộc */
  subcontractorId?: string | null;
  subcontractorName?: string | null;
  /** Giá đang áp dụng hôm nay. null = Chờ định giá */
  unitPrice: number | null;
  turnaroundDays?: number | null;
  /** Giá / TAT tại ngày đang xem. null = Chờ định giá */
  priceAtDate: number | null;
  turnaroundDaysAtDate?: number | null;
  effectiveDateAtDate?: string | null;
  upcomingPrice?: number | null;
  upcomingEffectiveDate?: string | null;
  versionCount: number;
}

export interface GetServiceCatalogParams {
  testMethodId?: string;
  indicatorGroupId?: string;
  keyword?: string;
  /** YYYY-MM-DD */
  priceDate?: string;
  isActive?: boolean;
}

export enum ServicePriceVersionStatus {
  Current = 0,
  Upcoming = 1,
  Replaced = 2,
}

export interface ServicePriceVersionDto {
  id: string;
  testMethodIndicatorId: string;
  unitPrice: number;
  turnaroundDays?: number | null;
  /** null = giá gốc */
  effectiveDate?: string | null;
  note?: string | null;
  status: ServicePriceVersionStatus;
  creationTime: string;
  creatorName?: string | null;
}

/** 1 ô của Phiếu khai báo dịch vụ = 1 dịch vụ (chỉ tiêu × nền mẫu) */
export interface BulkCreateServiceItemInput {
  indicatorId: string;
  /** null = Mọi nền mẫu */
  specimenTypeId: string | null;
  /** null = Chờ định giá */
  unitPrice: number | null;
  /** ĐVT (tiêu hao) — trống = theo đơn vị của phương pháp */
  unit: string | null;
  isSubcontract: boolean;
  /** Đơn vị nhận thầu — không bắt buộc (đang ẩn trên UI theo BA) */
  subcontractorId?: string | null;
}

/** Giá có hiệu lực ngay (hôm nay), không có TAT — sửa sau trên Ma trận giá */
export interface BulkCreateServicesInput {
  testMethodId: string;
  /** Dịch vụ có sẵn; bỏ trống thì gửi serviceGroupName để tạo mới */
  serviceGroupId?: string | null;
  serviceGroupName?: string | null;
  items: BulkCreateServiceItemInput[];
}

/** Dịch vụ cấp 1 (vd "Kiểm nghiệm thực phẩm") */
export interface ServiceGroupDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

/** Chuyển dịch vụ sang tên dịch vụ khác / đổi HĐ phụ (không đổi ĐVT, giá) */
export interface AssignServicesInput {
  serviceIds: string[];
  /** null = "Chưa thuộc dịch vụ" */
  serviceGroupId?: string | null;
  /** false = giữ nguyên nhóm */
  changeServiceGroup: boolean;
  /** null/undefined = giữ nguyên HĐ phụ */
  isSubcontract?: boolean | null;
}

export interface BulkCreateServicesResultDto {
  serviceGroupId?: string | null;
  createdCount: number;
  skippedCount: number;
}

export interface SetServicePriceInput {
  unitPrice: number;
  turnaroundDays?: number | null;
  effectiveDate?: string;
  note?: string;
}

export enum BulkPriceAdjustMode {
  Percent = 0,
  Amount = 1,
}

export interface BulkUpdatePriceInput {
  serviceIds: string[];
  mode: BulkPriceAdjustMode;
  increase: boolean;
  value: number;
  effectiveDate: string;
  turnaroundDays?: number | null;
}

export interface ImportServicePriceRowInput {
  line: number;
  serviceCode?: string;
  unitPrice?: number | null;
  turnaroundDays?: number | null;
  effectiveDate?: string | null;
}

export enum ImportServicePriceRowResult {
  Update = 0,
  Same = 1,
  Error = 2,
}

export interface ImportServicePriceRowDto {
  line: number;
  serviceCode?: string | null;
  serviceName?: string | null;
  oldPrice?: number | null;
  newPrice?: number | null;
  oldTurnaroundDays?: number | null;
  newTurnaroundDays?: number | null;
  effectiveDate?: string | null;
  result: ImportServicePriceRowResult;
  message?: string | null;
}

export interface ImportServicePricesResultDto {
  rows: ImportServicePriceRowDto[];
  updateCount: number;
  sameCount: number;
  errorCount: number;
  applied: boolean;
}

/** BE ApiResponseWrapperFilter làm phẳng ListResultDto thành mảng trần — chấp nhận cả 2 dạng */
function toList<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  return Array.isArray(data) ? data : data?.items ?? [];
}

const SERVICE_URL = "/api/v1/service-catalog";

export const serviceCatalogService = {
  getList: async (params: GetServiceCatalogParams = {}): Promise<ServiceCatalogItemDto[]> => {
    const response = await api.get<ServiceCatalogItemDto[] | { items: ServiceCatalogItemDto[] }>(SERVICE_URL, { params });
    return toList(response.data);
  },
  bulkCreate: async (input: BulkCreateServicesInput): Promise<BulkCreateServicesResultDto> => {
    const response = await api.post<BulkCreateServicesResultDto>(`${SERVICE_URL}/bulk-create`, input);
    return response.data;
  },
  getServiceGroups: async (): Promise<ServiceGroupDto[]> => {
    const response = await api.get<ServiceGroupDto[] | { items: ServiceGroupDto[] }>(`${SERVICE_URL}/service-groups`);
    return toList(response.data);
  },
  createServiceGroup: async (name: string): Promise<ServiceGroupDto> => {
    const response = await api.post<ServiceGroupDto>(`${SERVICE_URL}/service-groups`, { name });
    return response.data;
  },
  updateServiceGroup: async (id: string, name: string): Promise<ServiceGroupDto> => {
    const response = await api.put<ServiceGroupDto>(`${SERVICE_URL}/service-groups/${id}`, { name });
    return response.data;
  },
  /** Trả về số dòng chuyển về "Chưa thuộc dịch vụ" */
  deleteServiceGroup: async (id: string): Promise<number> => {
    const response = await api.delete<number>(`${SERVICE_URL}/service-groups/${id}`);
    return response.data;
  },
  /** Trả về số dòng thay đổi */
  assignServices: async (input: AssignServicesInput): Promise<number> => {
    const response = await api.post<number>(`${SERVICE_URL}/assign`, input);
    return response.data;
  },
  update: async (
    id: string,
    input: {
      unit?: string | null;
      formattedUnit?: string | null;
      isSubcontract: boolean;
      subcontractorId?: string | null;
    }
  ): Promise<ServiceCatalogItemDto> => {
    const response = await api.put<ServiceCatalogItemDto>(`${SERVICE_URL}/${id}`, input);
    return response.data;
  },
  getPriceVersions: async (id: string): Promise<ServicePriceVersionDto[]> => {
    const response = await api.get<ServicePriceVersionDto[] | { items: ServicePriceVersionDto[] }>(`${SERVICE_URL}/${id}/price-versions`);
    return toList(response.data);
  },
  setPrice: async (id: string, input: SetServicePriceInput): Promise<ServiceCatalogItemDto> => {
    const response = await api.post<ServiceCatalogItemDto>(`${SERVICE_URL}/${id}/prices`, input);
    return response.data;
  },
  deletePriceVersion: async (versionId: string): Promise<void> => {
    await api.delete(`${SERVICE_URL}/price-versions/${versionId}`);
  },
  bulkUpdatePrice: async (input: BulkUpdatePriceInput): Promise<{ updatedCount: number }> => {
    const response = await api.post<{ updatedCount: number }>(`${SERVICE_URL}/bulk-price`, input);
    return response.data;
  },
  importPrices: async (rows: ImportServicePriceRowInput[], dryRun: boolean): Promise<ImportServicePricesResultDto> => {
    const response = await api.post<ImportServicePricesResultDto>(`${SERVICE_URL}/import-prices`, { rows, dryRun });
    return response.data;
  },
  toggleActive: async (id: string): Promise<void> => {
    await api.post(`${SERVICE_URL}/${id}/toggle-active`);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${SERVICE_URL}/${id}`);
  },
  deleteMany: async (ids: string[]): Promise<number> => {
    const response = await api.post<number>(`${SERVICE_URL}/delete-many`, ids);
    return response.data;
  },
};

// ===================== L3 — Định mức tiêu hao theo mẻ =====================

export interface BatchNormMethodDto {
  testMethodId: string;
  code: string;
  name: string;
  formattedName?: string | null;
  isActive: boolean;
  serviceCount: number;
  normCount: number;
  hasCompleteNorm: boolean;
}

export interface MethodBatchNormDto {
  id: string;
  code: string;
  testMethodId: string;
  testMethodCode?: string | null;
  testMethodName?: string | null;
  productId?: string | null;
  productCode?: string | null;
  productName?: string | null;
  productFormattedName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  batchQuantity?: number | null;
  isActive: boolean;
  isComplete: boolean;
  /** Đã phát sinh tiêu hao → không xóa được */
  isUsed: boolean;
  creationTime: string;
  lastModificationTime?: string | null;
}

export interface CreateUpdateMethodBatchNormInput {
  testMethodId: string;
  productId?: string | null;
  batchQuantity?: number | null;
}

const NORM_URL = "/api/v1/batch-norms";

export const batchNormService = {
  getMethods: async (params: { keyword?: string; hasNorm?: boolean } = {}): Promise<BatchNormMethodDto[]> => {
    const response = await api.get<BatchNormMethodDto[] | { items: BatchNormMethodDto[] }>(`${NORM_URL}/methods`, { params });
    return toList(response.data);
  },
  getByMethod: async (testMethodId: string): Promise<MethodBatchNormDto[]> => {
    const response = await api.get<MethodBatchNormDto[] | { items: MethodBatchNormDto[] }>(`${NORM_URL}/by-method/${testMethodId}`);
    return toList(response.data);
  },
  create: async (input: CreateUpdateMethodBatchNormInput): Promise<MethodBatchNormDto> => {
    const response = await api.post<MethodBatchNormDto>(NORM_URL, input);
    return response.data;
  },
  update: async (id: string, input: CreateUpdateMethodBatchNormInput): Promise<MethodBatchNormDto> => {
    const response = await api.put<MethodBatchNormDto>(`${NORM_URL}/${id}`, input);
    return response.data;
  },
  toggleActive: async (id: string): Promise<MethodBatchNormDto> => {
    const response = await api.post<MethodBatchNormDto>(`${NORM_URL}/${id}/toggle-active`);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${NORM_URL}/${id}`);
  },
};

// ===================== L4 — Dự toán mẫu năm =====================

export interface ForecastNormLineDto {
  methodBatchNormId: string;
  productCode?: string | null;
  productName?: string | null;
  unitName?: string | null;
  batchQuantity: number;
  perSample?: number | null;
}

export interface YearlyForecastRowDto {
  testMethodIndicatorId: string;
  serviceCode?: string | null;
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  indicatorId: string;
  indicatorCode: string;
  indicatorName: string;
  indicatorFormattedName?: string | null;
  specimenTypeId?: string | null;
  specimenTypeName?: string | null;
  previousYearSamples?: number | null;
  estimatedSamples?: number | null;
  normLines: ForecastNormLineDto[];
}

export interface YearlyForecastListDto {
  year: number;
  /** Năm đã qua → chỉ xem */
  isLocked: boolean;
  /** Năm trước có dữ liệu → hiện nút Clone */
  canClone: boolean;
  totalCount: number;
  missingCount: number;
  items: YearlyForecastRowDto[];
}

export interface GetYearlyForecastsParams {
  year: number;
  testMethodId?: string;
  keyword?: string;
  onlyMissing?: boolean;
}

const FORECAST_URL = "/api/v1/yearly-forecasts";

export const yearlyForecastService = {
  getList: async (params: GetYearlyForecastsParams): Promise<YearlyForecastListDto> => {
    const response = await api.get<YearlyForecastListDto>(FORECAST_URL, { params });
    return response.data;
  },
  save: async (
    year: number,
    items: { testMethodIndicatorId: string; estimatedSamples: number | null }[]
  ): Promise<number> => {
    const response = await api.put<number>(FORECAST_URL, { year, items });
    return response.data;
  },
  clone: async (year: number): Promise<{ clonedCount: number }> => {
    const response = await api.post<{ clonedCount: number }>(`${FORECAST_URL}/clone`, { year });
    return response.data;
  },
};
