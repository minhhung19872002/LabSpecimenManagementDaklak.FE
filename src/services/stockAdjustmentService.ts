import { api } from "./api";

export enum StockAdjustmentStatus {
  Draft = 0,
  Confirmed = 1,
}

export const STOCK_ADJUSTMENT_STATUS_OPTIONS = [
  { value: StockAdjustmentStatus.Draft, label: "Nháp" },
  { value: StockAdjustmentStatus.Confirmed, label: "Đã kiểm kê" },
];

export const StockAdjustmentStatusLabels: Record<number, string> = {
  [StockAdjustmentStatus.Draft]: "Nháp",
  [StockAdjustmentStatus.Confirmed]: "Đã kiểm kê",
};

export const StockAdjustmentStatusColors: Record<number, string> = {
  [StockAdjustmentStatus.Draft]: "default",
  [StockAdjustmentStatus.Confirmed]: "green",
};

export interface StockAdjustmentListDto {
  id: string;
  code: string;
  creatorName?: string;
  status: StockAdjustmentStatus;
  creationTime: string;
  inventoryDate: string;
  inventoryUserName?: string;
  /** Chỉ có khi lọc theo productId: thực tế − sổ sách của vật tư đó (đơn vị lưu kho) */
  adjustmentDiffBase?: number | null;
  adjustmentDiffVolume?: number | null;
  storageUnitName?: string | null;
  volumeUnitName?: string | null;
  /** Lượng điều chỉnh tách theo ĐV lưu kho của từng lô (vật tư nhiều SKU) */
  adjustmentDiffByUnit?: { quantity: number; unitName?: string | null }[] | null;
}

export interface StockAdjustmentItemDto {
  id: string;
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantityBefore: number;
  actualQuantity: number;
  adjustmentQuantity: number;
  warehouseId?: string;
  warehouseName?: string;
  actualUnitId?: string;
  actualUnitName?: string;
  reason?: string;
  expectedStock?: number;
  volumePerUnit?: number;
  packagingUnitName?: string;
  volumeUnitName?: string;
  productType?: number;
  baseUnitName?: string;
  consumableQuantityBefore?: number;
  lotNumber?: string;
  manufacturerName?: string;
}

export interface StockAdjustmentDto extends StockAdjustmentListDto {
  notes?: string;
  inventoryUserId?: string;
  items: StockAdjustmentItemDto[];
  /** Phiếu nháp: sổ sách / tồn dự kiến đã thay đổi kể từ lúc lưu nháp */
  stockChangedSinceSaved?: boolean;
}

export interface CreateUpdateStockAdjustmentDto {
  notes?: string;
  inventoryDate?: string;
  items: CreateUpdateStockAdjustmentItemDto[];
}

export interface CreateUpdateStockAdjustmentItemDto {
  productId: string;
  actualQuantity: number;
  warehouseId?: string;
  actualUnitId?: string;
  reason?: string;
  expectedStock?: number;
  lotNumber?: string;
  manufacturerName?: string;
}

export interface ConfirmPreviewItemDto {
  productId: string;
  productName: string;
  unitName: string;
  snapshotQuantity: number;
  currentQuantity: number;
  actualQuantity: number;
  hasChanged: boolean;
}

export interface ConfirmPreviewDto {
  hasChanges: boolean;
  items: ConfirmPreviewItemDto[];
}

export interface WarehouseProductLotDto {
  productId: string;
  productName: string;
  productType: number;
  lotNumber: string | null;
  manufacturerName: string | null;
  remainingBaseQuantity: number;
  volumePerUnit: number | null;
  volumeUnitName: string | null;
  packagingUnitName: string | null;
  baseUnitName: string | null;
  volumeUnitId: string | null;
  baseUnitId: string | null;
  consumableQuantity: number;
  theoreticalConsumption: number;
}

export interface WarehouseWithLotsDto {
  warehouseId: string;
  warehouseName: string;
  lots: WarehouseProductLotDto[];
}

export interface GetStockAdjustmentListInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: StockAdjustmentStatus;
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  productId?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

const BASE_URL = "/api/v1/stock-adjustments";

export const stockAdjustmentService = {
  getList: async (params: GetStockAdjustmentListInput = {}): Promise<PagedResult<StockAdjustmentListDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.search) apiParams.Search = params.search;
    if (params.status !== undefined) apiParams.Status = params.status;
    if (params.fromDate) apiParams.FromDate = params.fromDate;
    if (params.toDate) apiParams.ToDate = params.toDate;
    if (params.warehouseId) apiParams.WarehouseId = params.warehouseId;
    if (params.productId) apiParams.ProductId = params.productId;
    const response = await api.get<PagedResult<StockAdjustmentListDto>>(BASE_URL, { params: apiParams });
    return response.data;
  },

  get: async (id: string): Promise<StockAdjustmentDto> => {
    const response = await api.get<StockAdjustmentDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateStockAdjustmentDto): Promise<StockAdjustmentDto> => {
    const response = await api.post<StockAdjustmentDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateStockAdjustmentDto): Promise<StockAdjustmentDto> => {
    const response = await api.put<StockAdjustmentDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  confirm: async (id: string): Promise<StockAdjustmentDto> => {
    const response = await api.post<StockAdjustmentDto>(`${BASE_URL}/${id}/confirm`);
    return response.data;
  },

  getConfirmPreview: async (id: string): Promise<ConfirmPreviewDto> => {
    const response = await api.get<ConfirmPreviewDto>(`${BASE_URL}/${id}/confirm-preview`);
    return response.data;
  },

  getWarehouseProductLots: async (warehouseId: string): Promise<WarehouseProductLotDto[]> => {
    const response = await api.get<WarehouseProductLotDto[]>(`${BASE_URL}/warehouse-product-lots/${warehouseId}`);
    return response.data;
  },

  getWarehouseWithChildrenLots: async (warehouseId: string): Promise<WarehouseWithLotsDto[]> => {
    const response = await api.get<WarehouseWithLotsDto[]>(`${BASE_URL}/warehouse-with-children-lots/${warehouseId}`);
    return response.data;
  },
};
