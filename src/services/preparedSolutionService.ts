import { api } from "./api";

export enum PreparedSolutionStatus {
  Active = 0,
  NearlyEmpty = 1,
  NearingExpiry = 2,
  Expired = 3,
  Empty = 4,
  Processed = 5,
}

export interface PreparedSolutionIngredientDto {
  id: string;
  preparedSolutionBatchId: string;
  productType: number;
  productTypeName?: string;
  productId: string;
  productName: string;
  unitName?: string;
  quantityUsed: number;
  warehouseQuantitySnapshot: number;
  isEquipment: boolean;
}

export interface PreparedSolutionBatchDto {
  id: string;
  creationTime: string;
  lastModificationTime?: string;
  solutionProductId: string;
  solutionProductName: string;
  identificationCode?: string;
  concentration?: string;
  lotCode: string;
  preparationDate: string;
  expiryDate?: string;
  totalVolume: number;
  remainingVolume: number;
  volumeUnitId?: string;
  volumeUnitName?: string;
  storageWarehouseId?: string;
  storageWarehouseName?: string;
  sourceWarehouseId?: string;
  sourceWarehouseName?: string;
  storageConditions?: string;
  preparationMethod?: string;
  isProcessed: boolean;
  processingNote?: string;
  processedAt?: string;
  processingImageUrls: string[];
  preparedByUserId?: string;
  preparedByName?: string;
  computedStatus: PreparedSolutionStatus;
  /** Phiếu nhập kho ảo (PSB-xxx) sinh ra khi pha — chỉ có ở getById */
  preparedSolutionReceiptId?: string;
  preparedSolutionReceiptCode?: string;
  daysRemaining: number;
  ingredients: PreparedSolutionIngredientDto[];
}

export interface CreateIngredientDto {
  productType: number;
  productId: string;
  quantityUsed: number;
}

export interface CreateUpdatePreparedSolutionBatchDto {
  solutionProductId: string;
  lotCode: string;
  preparationDate: string;
  expiryDate?: string;
  totalVolume: number;
  storageWarehouseId?: string;
  sourceWarehouseId?: string;
  storageConditions?: string;
  preparationMethod?: string;
  ingredients: CreateIngredientDto[];
}

export interface ProcessPreparedSolutionDto {
  note?: string;
  imageUrls?: string[];
}

export interface GetPreparedSolutionBatchesInput {
  page?: number;
  limit?: number;
  sorting?: string;
  search?: string;
  status?: PreparedSolutionStatus;
  isHetOrHetHan?: boolean;
}

export interface PreparedSolutionWarehouseProductDto {
  productId: string;
  productName: string;
  productType: number;
  productTypeName?: string;
  unitName?: string;
  availableQuantity: number;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

const BASE_URL = "/api/v1/prepared-solution-batches";

export const preparedSolutionService = {
  getList: async (
    params: GetPreparedSolutionBatchesInput = {}
  ): Promise<PagedResult<PreparedSolutionBatchDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.sorting) apiParams.Sorting = params.sorting;
    if (params.search) apiParams.Search = params.search;
    if (params.status !== undefined) apiParams.Status = params.status;
    if (params.isHetOrHetHan !== undefined) apiParams.IsHetOrHetHan = params.isHetOrHetHan;
    const res = await api.get(BASE_URL, { params: apiParams });
    return res.data;
  },

  getById: async (id: string): Promise<PreparedSolutionBatchDto> => {
    const res = await api.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  create: async (
    data: CreateUpdatePreparedSolutionBatchDto
  ): Promise<PreparedSolutionBatchDto> => {
    const res = await api.post(BASE_URL, data);
    return res.data;
  },

  update: async (
    id: string,
    data: CreateUpdatePreparedSolutionBatchDto
  ): Promise<PreparedSolutionBatchDto> => {
    const res = await api.put(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  process: async (
    id: string,
    data: ProcessPreparedSolutionDto
  ): Promise<PreparedSolutionBatchDto> => {
    const res = await api.post(`${BASE_URL}/${id}/process`, data);
    return res.data;
  },

  getWarnings: async (): Promise<PreparedSolutionBatchDto[]> => {
    const res = await api.get(`${BASE_URL}/warnings`);
    return res.data;
  },

  getWarehouseProducts: async (
    warehouseId: string,
    productType?: number
  ): Promise<PreparedSolutionWarehouseProductDto[]> => {
    const params: Record<string, any> = { warehouseId };
    if (productType !== undefined) params.productType = productType;
    const res = await api.get(`${BASE_URL}/warehouse-products`, { params });
    return res.data;
  },
};
