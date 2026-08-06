import { api } from "./api";

// Enums
export enum ProductType {
  Chemical = 0,
  Biological = 1,
  Supply = 2,
  Standard = 3,
  Solvent = 4,
  Equipment = 5,
  PreparedSolution = 6,
}

export enum StandardCertificationType {
  CertifiedReference = 0,
  Regular = 1,
  Working = 2,
}

export const STANDARD_CERTIFICATION_OPTIONS = [
  { value: StandardCertificationType.CertifiedReference, label: "Chuẩn chứng nhận" },
  { value: StandardCertificationType.Regular, label: "Chuẩn thường" },
  { value: StandardCertificationType.Working, label: "Chuẩn làm việc" },
];

export const ProductTypeLabels: Record<ProductType, string> = {
  [ProductType.Chemical]: "Hóa chất",
  [ProductType.Biological]: "Sinh phẩm",
  [ProductType.Supply]: "Vật tư tiêu hao",
  [ProductType.Standard]: "Chất chuẩn",
  [ProductType.Solvent]: "Dung môi",
  [ProductType.Equipment]: "Thiết bị phòng Lab",
  [ProductType.PreparedSolution]: "Dung dịch pha",
};

// DTOs
export interface ProductDto {
  id: string;
  code: string;
  name: string;
  formattedName?: string;
  identificationCode?: string;
  productType: ProductType;
  baseUnitId: string;
  baseUnitName?: string;
  packagingQuantity?: number;
  packagingUnitId?: string;
  packagingUnitName?: string;
  volumePerUnit?: number;
  volumeUnitId?: string;
  volumeUnitName?: string;
  packagingSpec?: string;
  casNumber?: string;
  manufacturer?: string;
  origin?: string;
  concentration?: string;
  formattedConcentration?: string;
  formattedOrigin?: string;
  ghsCode?: string;
  standardCertificationType?: number | null;
  formattedChemicalFormula?: string | null;
  certifiedValue?: string | null;
  formattedCertifiedValue?: string | null;
  measurementUncertainty?: string | null;
  formattedMeasurementUncertainty?: string | null;
  standardLink?: string | null;
  analysisGrade?: string | null;
  formattedPackagingSpec?: string | null;
  materialComposition?: string | null;
  formattedMaterialComposition?: string | null;
  isReusable?: boolean | null;
  maxReuseCount?: number | null;
  isSterile?: boolean | null;
  usagePurpose?: string | null;
  shelfLifeDays?: number | null;
  baseProductId?: string | null;
  storageConditions?: string;
  formattedStorageConditions?: string;
  categories?: string;
  chemicalFormula?: string;
  minStockLevel?: number;
  equipmentModel?: string | null;
  manufactureYear?: number | null;
  powerConsumption?: number | null;
  mainTechnicalSpecs?: string | null;
  installationLocation?: string | null;
  availableQuantity: number;
  storageAvailableQuantity: number;
  consumableImportedQuantity: number;
  isActive: boolean;
  isDraft: boolean;
  skuCount: number;
  warehouseName?: string;
  stockWarehouseId?: string;
  earliestReceivedDate?: string;
  earliestLotNumber?: string;
  earliestLotExpiryDate?: string;
  earliestLotNotes?: string;
  totalConsumedQuantity: number;
  storageTotalConsumedQuantity: number;
  creationTime: string;
  attachments: ProductAttachmentDto[];
  unitConversions: ProductUnitConversionDto[];
  skus: ProductSkuDto[];
}

export interface ProductSkuDto {
  id: string;
  manufacturerId: string;
  manufacturerCode?: string;
  manufacturerName?: string;
  baseUnitId?: string;
  baseUnitName?: string;
  packagingQuantity?: number;
  packagingUnitId?: string;
  packagingUnitName?: string;
  volumePerUnit?: number;
  volumeUnitId?: string;
  volumeUnitName?: string;
  creationTime: string;
}

export interface CreateUpdateProductSkuDto {
  id?: string;
  manufacturerId: string;
  baseUnitId?: string | null;
  packagingQuantity?: number | null;
  packagingUnitId?: string | null;
  volumePerUnit?: number | null;
  volumeUnitId?: string | null;
}

export interface CreateUpdateProductDto {
  name?: string;
  formattedName?: string;
  identificationCode?: string;
  productType: ProductType;
  baseUnitId?: string | null;
  packagingQuantity?: number | null;
  packagingUnitId?: string | null;
  volumePerUnit?: number | null;
  volumeUnitId?: string | null;
  packagingSpec?: string;
  casNumber?: string;
  manufacturer?: string;
  origin?: string;
  concentration?: string;
  formattedConcentration?: string;
  formattedOrigin?: string;
  ghsCode?: string;
  standardCertificationType?: number | null;
  formattedChemicalFormula?: string | null;
  certifiedValue?: string | null;
  formattedCertifiedValue?: string | null;
  measurementUncertainty?: string | null;
  formattedMeasurementUncertainty?: string | null;
  standardLink?: string | null;
  analysisGrade?: string | null;
  formattedPackagingSpec?: string | null;
  materialComposition?: string | null;
  formattedMaterialComposition?: string | null;
  isReusable?: boolean | null;
  maxReuseCount?: number | null;
  isSterile?: boolean | null;
  usagePurpose?: string | null;
  shelfLifeDays?: number | null;
  baseProductId?: string | null;
  storageConditions?: string;
  formattedStorageConditions?: string;
  categories?: string;
  chemicalFormula?: string;
  minStockLevel?: number | null;
  equipmentModel?: string | null;
  manufactureYear?: number | null;
  powerConsumption?: number | null;
  mainTechnicalSpecs?: string | null;
  installationLocation?: string | null;
  isActive: boolean;
  isDraft: boolean;
  attachments?: CreateProductAttachmentDto[];
  unitConversions?: CreateUpdateProductUnitConversionDto[];
  skus?: CreateUpdateProductSkuDto[];
}

export interface ProductAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  url: string;
  creationTime: string;
}

export interface CreateProductAttachmentDto {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
}

export interface ProductUnitConversionDto {
  id: string;
  quantity: number;
  baseUnitId: string;
  baseUnitName?: string;
  convertedQuantity: number;
  convertedUnitId: string;
  convertedUnitName?: string;
}

export interface CreateUpdateProductUnitConversionDto {
  id?: string;
  quantity: number;
  baseUnitId: string;
  convertedQuantity: number;
  convertedUnitId: string;
}

export interface ProductFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  productType?: ProductType;
  isDraft?: boolean;
  sorting?: string;
  warehouseId?: string;
}

export interface ProductSourceDto {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  productName: string;
  unitName: string;
  totalImported: number;
  availableQuantity: number;
  latestUnitPrice?: number;
}

export interface GetProductSourcesInput {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ProductDetailDto {
  id: string;
  name: string;
  formattedName?: string;
  identificationCode?: string;
  casNumber?: string;
  storageConditions?: string;
  formattedStorageConditions?: string;
  mainTechnicalSpecs?: string;
  productType: ProductType;
  warehouseAvailableQuantity: number;
  baseUnitName?: string;
  packagingUnitName?: string;
  packagingQuantity?: number;
  consumableImportedQuantity: number;
  volumePerUnit?: number;
  volumeUnitName?: string;
}

export interface ProductImportHistoryDto {
  warehouseImportReceiptId: string;
  receiptCode: string;
  actualImportDate?: string;
  supplierName?: string;
  orderedQuantity: number;
  purchaseUnitName?: string;
  actualReceivedQuantity: number;
  unitName?: string;
  manufacturerName?: string;
  lotNumber?: string;
  lotExpiryDate?: string;
  totalAmount?: number;
  qualityDocumentFileId?: string;
  qualityDocumentFileName?: string;
  qualityDocumentFilePath?: string;
  deliveryDocumentFiles?: { fileId: string; fileName: string }[];
}

export interface GetProductImportHistoryInput {
  page?: number;
  limit?: number;
  sorting?: string;
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
}

export interface ProductUsageLogItemDto {
  sampleCode: string;
  sampleName: string;
  sampleMatrix?: string;
  indicatorName: string;
  testMethodName: string;
  technicianName?: string;
  result?: string;
  resultSubmissionDate?: string;
  consumableStockBefore?: number;
  consumableStockUnitName?: string;
  consumptionAmount?: number;
  consumptionUnitName?: string;
}

export interface GetProductUsageLogParams {
  dateFrom?: string;
  dateTo?: string;
  skipCount?: number;
  maxResultCount?: number;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

const BASE_URL = "/api/v1/products";

export const productService = {
  getList: async (params: ProductFilterDto = {}, signal?: AbortSignal): Promise<PagedResult<ProductDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.search) apiParams.Search = params.search;
    if (params.productType !== undefined && params.productType !== null)
      apiParams.ProductType = params.productType;
    if (params.isDraft !== undefined && params.isDraft !== null)
      apiParams.IsDraft = params.isDraft;
    if (params.sorting) apiParams.Sorting = params.sorting;
    if (params.warehouseId) apiParams.WarehouseId = params.warehouseId;

    const response = await api.get<PagedResult<ProductDto>>(BASE_URL, {
      params: apiParams,
      signal,
    });
    return response.data;
  },

  get: async (id: string): Promise<ProductDto> => {
    const response = await api.get<ProductDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateProductDto): Promise<ProductDto> => {
    const response = await api.post<ProductDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateProductDto): Promise<ProductDto> => {
    const response = await api.put<ProductDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  toggleActive: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/toggle-active`);
  },

  getActive: async (): Promise<ProductDto[]> => {
    const response = await api.get<{ items: ProductDto[] } | ProductDto[]>(
      `${BASE_URL}/active`
    );
    if (Array.isArray(response.data)) return response.data;
    return response.data?.items || [];
  },

  deleteAttachment: async (productId: string, attachmentId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${productId}/attachments/${attachmentId}`);
  },

  deleteSku: async (productId: string, skuId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${productId}/skus/${skuId}`);
  },

  getDetail: async (id: string, warehouseId?: string): Promise<ProductDetailDto> => {
    const params: Record<string, any> = {};
    if (warehouseId) params.WarehouseId = warehouseId;
    const response = await api.get<ProductDetailDto>(`${BASE_URL}/${id}/detail`, { params });
    return response.data;
  },

  getImportHistory: async (id: string, params: GetProductImportHistoryInput = {}): Promise<PagedResult<ProductImportHistoryDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.sorting) apiParams.Sorting = params.sorting;
    if (params.fromDate) apiParams.FromDate = params.fromDate;
    if (params.toDate) apiParams.ToDate = params.toDate;
    if (params.warehouseId) apiParams.WarehouseId = params.warehouseId;
    const response = await api.get<PagedResult<ProductImportHistoryDto>>(`${BASE_URL}/${id}/import-history`, { params: apiParams });
    return response.data;
  },

  getProductSources: async (productId: string, params: GetProductSourcesInput = {}): Promise<PagedResult<ProductSourceDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.search) apiParams.Search = params.search;
    const response = await api.get<PagedResult<ProductSourceDto>>(`${BASE_URL}/${productId}/sources`, { params: apiParams });
    return response.data;
  },

  getUsageLog: async (
    id: string,
    params: GetProductUsageLogParams = {}
  ): Promise<PagedResult<ProductUsageLogItemDto>> => {
    const response = await api.get<PagedResult<ProductUsageLogItemDto>>(
      `${BASE_URL}/${id}/usage-log`,
      { params }
    );
    return response.data;
  },

  // File upload via existing file API
  uploadFile: async (file: File): Promise<{ fileId: string; fileName: string; fileSize: number; url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.upload<{ fileId: string; fileName: string; fileSize: number; url: string }>(
      "/api/v1/files/upload",
      formData
    );
    return response.data;
  },
};
