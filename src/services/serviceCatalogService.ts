import { api } from "./api";
import type { ProductType } from "./productService";

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

/** Định mức của 1 dịch vụ (Nền mẫu × Chỉ tiêu × PP) */
export interface ServiceBatchNormDto {
  id: string;
  /** Mã định mức DM-{năm}-{0001} */
  code: string;
  testMethodIndicatorId: string;
  serviceCode?: string | null;
  serviceGroupName?: string | null;
  testMethodId: string;
  testMethodCode?: string | null;
  testMethodName?: string | null;
  testMethodFormattedName?: string | null;
  indicatorId: string;
  indicatorCode?: string | null;
  indicatorName?: string | null;
  indicatorFormattedName?: string | null;
  specimenTypeId?: string | null;
  specimenTypeName?: string | null;
  specimenTypeSortOrder: number;
  sampleTypeCategoryId?: string | null;
  sampleTypeCategoryName?: string | null;
  isActive: boolean;
  materialCount: number;
  equipmentCount: number;
  /** Đã phát sinh tiêu hao → không xóa được */
  isUsed: boolean;
  creationTime: string;
}

/** Dịch vụ (PP) có thể thêm vào 1 cặp nền mẫu × chỉ tiêu đã có định mức */
export interface BatchNormCandidateDto {
  testMethodIndicatorId: string;
  serviceCode?: string | null;
  serviceGroupName?: string | null;
  testMethodId: string;
  testMethodCode?: string | null;
  testMethodName?: string | null;
  indicatorId: string;
  specimenTypeId?: string | null;
}

export interface BatchNormOverviewDto {
  norms: ServiceBatchNormDto[];
  candidates: BatchNormCandidateDto[];
}

export interface MethodBatchNormDto {
  id: string;
  code: string;
  serviceBatchNormId?: string | null;
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
  testMethodIndicatorId: string;
  productId?: string | null;
  batchQuantity?: number | null;
}

// ---- Phiếu khai báo định mức theo mẻ ----

/** Tên dịch vụ (NDV) để chọn bộ áp dụng; id null = dịch vụ chưa đặt tên */
export interface BatchNormServiceGroupOptionDto {
  id?: string | null;
  code?: string | null;
  name: string;
  totalCount: number;
  /** Số bộ chưa có định mức */
  freeCount: number;
}

/** 1 bộ Nền mẫu × Chỉ tiêu × Phương pháp trong tên dịch vụ */
export interface BatchNormComboDto {
  testMethodIndicatorId: string;
  serviceCode?: string | null;
  sampleTypeCategoryId?: string | null;
  sampleTypeCategoryName?: string | null;
  specimenTypeId?: string | null;
  specimenTypeName?: string | null;
  specimenTypeSortOrder: number;
  indicatorId: string;
  indicatorCode?: string | null;
  indicatorName?: string | null;
  indicatorFormattedName?: string | null;
  testMethodId: string;
  testMethodCode?: string | null;
  testMethodName?: string | null;
  /** Đã có định mức → không chọn được */
  existingNormCode?: string | null;
}

export interface BatchNormUnitOptionDto {
  id: string;
  name: string;
}

/** Vật tư / thiết bị từ Danh mục vật tư thiết bị */
export interface BatchNormProductOptionDto {
  id: string;
  code: string;
  name: string;
  formattedName?: string | null;
  productType: ProductType;
  categories?: string | null;
  /** Đơn vị tiêu hao hợp lệ (ĐV thể tích, ĐV cơ sở, ĐV quy đổi) */
  units: BatchNormUnitOptionDto[];
  defaultUnitId?: string | null;
  /** Quy cách đóng gói: 1 ĐV cơ sở = VolumePerUnit ĐV thể tích (null = chưa khai báo) */
  volumePerUnit?: number | null;
  volumeUnitId?: string | null;
  volumeUnitName?: string | null;
  baseUnitName?: string | null;
}

export interface BatchNormCreateOptionsDto {
  serviceGroups: BatchNormServiceGroupOptionDto[];
  combos: BatchNormComboDto[];
  nextCode: string;
  materials: BatchNormProductOptionDto[];
  equipments: BatchNormProductOptionDto[];
  capacityUnits: string[];
}

export interface BulkCreateBatchNormsInput {
  testMethodIndicatorIds: string[];
  materials: { productId: string; quantity: number; unitId: string }[];
  equipments: { productId: string; capacity: number; capacityUnit: string }[];
}

export interface ServiceBatchNormEquipmentDto {
  id: string;
  productId: string;
  productCode?: string | null;
  productName?: string | null;
  productFormattedName?: string | null;
  capacity: number;
  capacityUnit: string;
}

const NORM_URL = "/api/v1/batch-norms";

export const batchNormService = {
  getOverview: async (): Promise<BatchNormOverviewDto> => {
    const response = await api.get<BatchNormOverviewDto>(`${NORM_URL}/overview`);
    return {
      norms: response.data?.norms ?? [],
      candidates: response.data?.candidates ?? [],
    };
  },
  addServices: async (testMethodIndicatorIds: string[]): Promise<ServiceBatchNormDto[]> => {
    const response = await api.post<ServiceBatchNormDto[] | { items: ServiceBatchNormDto[] }>(`${NORM_URL}/services`, {
      testMethodIndicatorIds,
    });
    return toList(response.data);
  },
  toggleServiceActive: async (id: string): Promise<ServiceBatchNormDto> => {
    const response = await api.post<ServiceBatchNormDto>(`${NORM_URL}/services/${id}/toggle-active`);
    return response.data;
  },
  deleteService: async (id: string): Promise<void> => {
    await api.delete(`${NORM_URL}/services/${id}`);
  },
  restoreService: async (id: string): Promise<ServiceBatchNormDto> => {
    const response = await api.post<ServiceBatchNormDto>(`${NORM_URL}/services/${id}/restore`);
    return response.data;
  },
  getByService: async (testMethodIndicatorId: string): Promise<MethodBatchNormDto[]> => {
    const response = await api.get<MethodBatchNormDto[] | { items: MethodBatchNormDto[] }>(
      `${NORM_URL}/by-service/${testMethodIndicatorId}`
    );
    return toList(response.data);
  },
  getEquipments: async (testMethodIndicatorId: string): Promise<ServiceBatchNormEquipmentDto[]> => {
    const response = await api.get<ServiceBatchNormEquipmentDto[] | { items: ServiceBatchNormEquipmentDto[] }>(
      `${NORM_URL}/by-service/${testMethodIndicatorId}/equipments`
    );
    return toList(response.data);
  },
  /** serviceGroupId = null + ungrouped = true → bộ chưa đặt tên dịch vụ */
  getCreateOptions: async (params: { serviceGroupId?: string | null; ungrouped?: boolean } = {}): Promise<BatchNormCreateOptionsDto> => {
    const response = await api.get<BatchNormCreateOptionsDto>(`${NORM_URL}/create-options`, {
      params: {
        serviceGroupId: params.serviceGroupId || undefined,
        ungrouped: params.ungrouped || undefined,
      },
    });
    const d = response.data;
    return {
      serviceGroups: d?.serviceGroups ?? [],
      combos: d?.combos ?? [],
      nextCode: d?.nextCode ?? "",
      materials: d?.materials ?? [],
      equipments: d?.equipments ?? [],
      capacityUnits: d?.capacityUnits ?? [],
    };
  },
  bulkCreate: async (input: BulkCreateBatchNormsInput): Promise<ServiceBatchNormDto[]> => {
    const response = await api.post<ServiceBatchNormDto[] | { items: ServiceBatchNormDto[] }>(
      `${NORM_URL}/bulk-create`,
      input
    );
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
  specimenTypeSortOrder: number;
  /** Nhóm nền mẫu (thẻ cấp 1 trên L4) */
  sampleTypeCategoryId?: string | null;
  sampleTypeCategoryName?: string | null;
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
  /** Tổng số mẫu dự toán năm trước — KPI "So với năm trước" */
  previousYearTotal: number;
  items: YearlyForecastRowDto[];
}

export interface GetYearlyForecastsParams {
  year: number;
  testMethodId?: string;
  keyword?: string;
  onlyMissing?: boolean;
}

// ---------- Phiếu tạo / sửa dự toán ----------

export enum ForecastQuantityMode {
  PerSample = 0,
  PerYear = 1,
}

/** 1 vật tư trong định mức theo mẻ của bộ (lượng cho 1 mẫu) */
export interface ForecastNormMaterialDto {
  productId: string;
  unitId?: string | null;
  unitName?: string | null;
  quantity: number;
}

export interface ForecastExtraMaterialDto {
  productId: string;
  unitId: string;
  /** null = chưa nhập */
  quantity?: number | null;
  mode: ForecastQuantityMode;
}

export interface ForecastConfigDto {
  estimatedSamples?: number | null;
  /** Áp dụng tiêu hao theo bộ này */
  sourceTestMethodIndicatorId?: string | null;
  extraMaterials: ForecastExtraMaterialDto[];
  extraEquipmentIds: string[];
  hiddenMaterialIds: string[];
  hiddenEquipmentIds: string[];
}

export interface ForecastComboDto extends BatchNormComboDto {
  normMaterials: ForecastNormMaterialDto[];
  normEquipmentIds: string[];
  /** Dự toán năm đang chọn (null = chưa từng lưu) */
  forecast?: ForecastConfigDto | null;
}

export interface ForecastCreateOptionsDto {
  year: number;
  combos: ForecastComboDto[];
  materials: BatchNormProductOptionDto[];
  equipments: BatchNormProductOptionDto[];
}

export interface SaveForecastDetailItemInput extends ForecastConfigDto {
  testMethodIndicatorId: string;
}

export interface SaveForecastDetailsResultDto {
  count: number;
  totalSamples: number;
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
  getCreateOptions: async (year: number): Promise<ForecastCreateOptionsDto> => {
    const response = await api.get<ForecastCreateOptionsDto>(`${FORECAST_URL}/create-options`, { params: { year } });
    const d = response.data;
    return {
      year: d?.year ?? year,
      combos: (d?.combos ?? []).map((c) => ({
        ...c,
        normMaterials: c.normMaterials ?? [],
        normEquipmentIds: c.normEquipmentIds ?? [],
      })),
      materials: d?.materials ?? [],
      equipments: d?.equipments ?? [],
    };
  },
  /** Phiếu tạo mới — chặn bộ đã có dự toán năm này */
  createDetails: async (year: number, items: SaveForecastDetailItemInput[]): Promise<SaveForecastDetailsResultDto> => {
    const response = await api.post<SaveForecastDetailsResultDto>(`${FORECAST_URL}/details`, { year, items });
    return response.data;
  },
  /** Phiếu sửa */
  updateDetails: async (year: number, items: SaveForecastDetailItemInput[]): Promise<SaveForecastDetailsResultDto> => {
    const response = await api.put<SaveForecastDetailsResultDto>(`${FORECAST_URL}/details`, { year, items });
    return response.data;
  },
  /** Nhập Excel: chỉ cập nhật số mẫu / năm */
  importSamples: async (
    year: number,
    items: { testMethodIndicatorId: string; estimatedSamples: number | null }[]
  ): Promise<number> => {
    const response = await api.put<number>(`${FORECAST_URL}/import`, { year, items });
    return response.data;
  },
};
