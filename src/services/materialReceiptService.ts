import { api } from "./api";
import type { PagedResultDto } from "./masterDataService";

export enum MaterialReceiptStatus {
  Draft = 0,
  Confirmed = 1,
}

export const MaterialReceiptStatusLabels: Record<number, string> = {
  [MaterialReceiptStatus.Draft]: "Nháp",
  [MaterialReceiptStatus.Confirmed]: "Đã nhận",
};

export const MaterialReceiptStatusColors: Record<number, string> = {
  [MaterialReceiptStatus.Draft]: "orange",
  [MaterialReceiptStatus.Confirmed]: "green",
};

export interface GetMaterialReceiptListInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  status?: MaterialReceiptStatus;
  fromDate?: string;
  toDate?: string;
}

export interface MaterialReceiptListDto {
  id: string;
  code: string;
  receiverName: string;
  receiptDate: string;
  status: MaterialReceiptStatus;
  itemCount: number;
  creationTime: string;
  creatorName?: string;
}

export interface MaterialReceiptStatisticsDto {
  draftCount: number;
  receivedCount: number;
}

export interface MaterialReceiptDto {
  id: string;
  code: string;
  receiverName: string;
  receiverId?: string;
  receiptDate: string;
  status: MaterialReceiptStatus;
  notes?: string;
  creationTime: string;
  creatorName?: string;
  items: MaterialReceiptItemDto[];
}

export interface MaterialReceiptItemDto {
  id: string;
  productId: string;
  productName: string;
  unitId?: string;
  unitName?: string;
  quantity: number;
  baseQuantity: number;
  skuId?: string;
  receivingWarehouseId: string;
  receivingWarehouseName: string;
  identificationCode?: string;
  technicalSpec?: string;
  casNumber?: string;
  nearestExpiryDate?: string;
  productType?: number;
  availableUnits: ProductUnitOptionDto[];
}

export interface CreateUpdateMaterialReceiptDto {
  code: string;
  receiptDate: string;
  notes?: string;
  items: CreateUpdateMaterialReceiptItemDto[];
}

export interface CreateUpdateMaterialReceiptItemDto {
  id?: string;
  productId: string;
  unitId?: string;
  quantity: number;
  skuId?: string;
  receivingWarehouseId: string;
}

export interface CentralWarehouseProductDto {
  productId: string;
  productName: string;
  formattedName?: string;
  identificationCode?: string;
  technicalSpec?: string;
  casNumber?: string;
  productType: number;
  centralStockBaseQty: number;
  nearestExpiryDate?: string;
  storageUnitName?: string;
  consumableUnitName?: string;
  volumePerUnit?: number;
  availableUnits: ProductUnitOptionDto[];
  skus: CentralWarehouseProductSkuDto[];
}

export interface ProductUnitOptionDto {
  unitId: string;
  unitName: string;
  isConsumable: boolean;
}

export interface CentralWarehouseProductSkuDto {
  skuId: string;
  storageUnitId?: string;
  storageUnitName?: string;
  consumableUnitId?: string;
  consumableUnitName?: string;
  volumePerUnit?: number;
  packagingQuantity?: number;
}

export interface ReceivingWarehouseStockDto {
  productId: string;
  warehouseId: string;
  availableBaseQuantity: number;
  storageUnitName?: string;
  consumableUnitName?: string;
  volumePerUnit?: number;
}

const BASE_URL = "/api/v1/material-receipts";

export const materialReceiptService = {
  getList: async (params: GetMaterialReceiptListInput): Promise<PagedResultDto<MaterialReceiptListDto>> => {
    const response = await api.get<PagedResultDto<MaterialReceiptListDto>>(BASE_URL, { params });
    return response.data;
  },

  getStatistics: async (): Promise<MaterialReceiptStatisticsDto> => {
    const response = await api.get<MaterialReceiptStatisticsDto>(`${BASE_URL}/statistics`);
    return response.data;
  },

  get: async (id: string): Promise<MaterialReceiptDto> => {
    const response = await api.get<MaterialReceiptDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateMaterialReceiptDto): Promise<MaterialReceiptDto> => {
    const response = await api.post<MaterialReceiptDto>(BASE_URL, data);
    return response.data;
  },

  createAndConfirm: async (data: CreateUpdateMaterialReceiptDto): Promise<MaterialReceiptDto> => {
    const response = await api.post<MaterialReceiptDto>(`${BASE_URL}/create-and-confirm`, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateMaterialReceiptDto): Promise<MaterialReceiptDto> => {
    const response = await api.put<MaterialReceiptDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  confirm: async (id: string): Promise<MaterialReceiptDto> => {
    const response = await api.post<MaterialReceiptDto>(`${BASE_URL}/${id}/confirm`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  getNextCode: async (): Promise<string> => {
    const response = await api.get<string>(`${BASE_URL}/next-code`);
    return response.data;
  },

  getCentralWarehouseProducts: async (search?: string, productType?: number): Promise<CentralWarehouseProductDto[]> => {
    const response = await api.get<CentralWarehouseProductDto[]>(`${BASE_URL}/central-products`, {
      params: { search, productType },
    });
    return response.data;
  },

  getReceivingWarehouseStock: async (
    productId: string,
    warehouseId: string,
  ): Promise<ReceivingWarehouseStockDto> => {
    const response = await api.get<ReceivingWarehouseStockDto>(
      `${BASE_URL}/warehouse-stock`,
      { params: { productId, warehouseId } },
    );
    return response.data;
  },
};
