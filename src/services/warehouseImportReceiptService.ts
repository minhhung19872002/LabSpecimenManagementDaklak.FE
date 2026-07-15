import { api } from "./api";
import type { PagedResultDto } from "./masterDataService";

export interface DeliveryDocumentFileDto {
  fileId: string;
  fileName: string;
  fileSize?: number | null;
}

export enum WarehouseImportReceiptDisplayStatusFilter {
  All = 0,
  InProgress = 1,
  Completed = 2,
  Defective = 3,
}

export const WarehouseImportReceiptDisplayStatusFilterLabels: Record<number, string> = {
  [WarehouseImportReceiptDisplayStatusFilter.All]: "Tất cả trạng thái",
  [WarehouseImportReceiptDisplayStatusFilter.InProgress]: "Đang thực hiện",
  [WarehouseImportReceiptDisplayStatusFilter.Completed]: "Hoàn thành",
  [WarehouseImportReceiptDisplayStatusFilter.Defective]: "Hàng lỗi",
};

export interface GetWarehouseImportReceiptListInput {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  displayStatus?: WarehouseImportReceiptDisplayStatusFilter;
  fromDate?: string;
  toDate?: string;
}

export interface WarehouseImportReceiptStatisticsDto {
  totalReceipts: number;
  defectiveLots: number;
}

export enum WarehouseImportReceiptStatus {
  InProgress = 0,
  Completed = 1,
}

export enum WarehouseImportLineStatus {
  Checked = 0,
  Defective = 1,
}

export const WarehouseImportReceiptStatusLabels: Record<number, string> = {
  [WarehouseImportReceiptStatus.InProgress]: "Đang thực hiện",
  [WarehouseImportReceiptStatus.Completed]: "Hoàn thành",
};

export const WarehouseImportReceiptStatusColors: Record<number, string> = {
  [WarehouseImportReceiptStatus.InProgress]: "orange",
  [WarehouseImportReceiptStatus.Completed]: "green",
};

export const WarehouseImportLineStatusOptions = [
  { value: WarehouseImportLineStatus.Checked, label: "Đã kiểm tra" },
  { value: WarehouseImportLineStatus.Defective, label: "Hàng lỗi" },
];

export const WarehouseImportLineStatusLabels: Record<number, string> = {
  [WarehouseImportLineStatus.Checked]: "Đã kiểm tra",
  [WarehouseImportLineStatus.Defective]: "Hàng lỗi",
};

export const WarehouseImportLineStatusColors: Record<number, string> = {
  [WarehouseImportLineStatus.Checked]: "green",
  [WarehouseImportLineStatus.Defective]: "red",
};

export interface WarehouseImportReceiptListDto {
  id: string;
  code: string;
  goodsReceiptId: string;
  goodsReceiptCode: string;
  actualImportDate: string;
  warehouseKeeperName?: string;
  warehouseName?: string;
  supplierName?: string;
  contactPersonName?: string;
  status: WarehouseImportReceiptStatus;
  hasDefectiveItem: boolean;
  creatorName?: string;
  creationTime: string;
}

export interface WarehouseImportReceiptDto {
  id: string;
  code: string;
  goodsReceiptId: string;
  goodsReceiptCode: string;
  actualImportDate: string;
  warehouseKeeperId?: string;
  warehouseKeeperName?: string;
  warehouseId?: string;
  warehouseName?: string;
  deliveryDocumentFileId?: string;
  deliveryDocumentFileName?: string;
  deliveryDocumentFilePath?: string;
  deliveryDocumentFileSize?: number;
  deliveryDocumentFiles?: DeliveryDocumentFileDto[];
  notes?: string;
  status: WarehouseImportReceiptStatus;
  hasDefectiveItem: boolean;
  supplierName?: string;
  contactPersonName?: string;
  creatorName?: string;
  creationTime: string;
  items: WarehouseImportReceiptItemDto[];
}

export interface WarehouseImportReceiptItemDto {
  id: string;
  warehouseImportReceiptId: string;
  goodsReceiptItemId: string;
  productId: string;
  productName: string;
  orderedQuantity: number;
  actualReceivedQuantity: number;
  unitId?: string;
  unitName?: string;
  lotNumber?: string;
  lotExpiryDate?: string;
  status: WarehouseImportLineStatus;
  qualityDocumentFileId?: string;
  qualityDocumentFileName?: string;
  qualityDocumentFilePath?: string;
  qualityDocumentFileSize?: number;
  notes?: string;
}

export interface CreateUpdateWarehouseImportReceiptDto {
  goodsReceiptId: string;
  actualImportDate: string;
  warehouseKeeperId?: string;
  warehouseKeeperName?: string;
  warehouseId?: string;
  deliveryDocumentFiles: DeliveryDocumentFileDto[];
  notes?: string;
  items: CreateUpdateWarehouseImportReceiptItemDto[];
}

export interface CreateUpdateWarehouseImportReceiptItemDto {
  id?: string;
  goodsReceiptItemId: string;
  actualReceivedQuantity: number;
  lotNumber?: string;
  lotExpiryDate?: string;
  status: WarehouseImportLineStatus;
  qualityDocumentFileId?: string;
  qualityDocumentFileName?: string;
  qualityDocumentFilePath?: string;
  qualityDocumentFileSize?: number;
  notes?: string;
}

export interface EligibleGoodsReceiptForImportDto {
  id: string;
  code: string;
  supplierName?: string;
  expectedDeliveryDate?: string;
}

export interface PreviousReceivedLotDto {
  lotNumber?: string;
  lotExpiryDate?: string;
  actualReceivedQuantity: number;
  status: WarehouseImportLineStatus;
  qualityDocumentFileId?: string;
  qualityDocumentFileName?: string;
  qualityDocumentFileSize?: number;
}

export interface GoodsReceiptItemForImportDto {
  goodsReceiptItemId: string;
  productId: string;
  productName: string;
  unitId?: string;
  unitName?: string;
  orderedQuantity: number;
  alreadyReceivedQuantity: number;
  remainingOrderableQuantity: number;
  /** Đơn vị lưu kho, chỉ có giá trị khi khác đơn vị mua hàng (unitId/unitName). */
  baseUnitName?: string;
  baseOrderedQuantity?: number;
  /** Các dòng đã nhập ở những phiếu nhập kho Hoàn thành trước đó, hiển thị read-only. */
  previousLots: PreviousReceivedLotDto[];
}

export interface DefectiveHistoryItemDto {
  receiptId: string;
  receiptCode: string;
  productCode?: string;
  productName: string;
  actualReceivedQuantity: number;
  notes?: string;
  creatorName?: string;
  receiptCreationTime: string;
}

const BASE_URL = "/api/v1/warehouse-import-receipts";

export const warehouseImportReceiptService = {
  getList: async (
    params: GetWarehouseImportReceiptListInput = {}
  ): Promise<PagedResultDto<WarehouseImportReceiptListDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
    if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
    if (params.sorting) apiParams.Sorting = params.sorting;
    if (params.search) apiParams.Search = params.search;
    if (params.displayStatus !== undefined) apiParams.DisplayStatus = params.displayStatus;
    if (params.fromDate) apiParams.FromDate = params.fromDate;
    if (params.toDate) apiParams.ToDate = params.toDate;
    const response = await api.get<PagedResultDto<WarehouseImportReceiptListDto>>(BASE_URL, {
      params: apiParams,
    });
    return response.data;
  },

  getStatistics: async (fromDate?: string, toDate?: string): Promise<WarehouseImportReceiptStatisticsDto> => {
    const response = await api.get<WarehouseImportReceiptStatisticsDto>(`${BASE_URL}/statistics`, {
      params: { fromDate, toDate },
    });
    return response.data;
  },

  get: async (id: string): Promise<WarehouseImportReceiptDto> => {
    const response = await api.get<WarehouseImportReceiptDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateWarehouseImportReceiptDto): Promise<WarehouseImportReceiptDto> => {
    const response = await api.post<WarehouseImportReceiptDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateWarehouseImportReceiptDto): Promise<WarehouseImportReceiptDto> => {
    const response = await api.put<WarehouseImportReceiptDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  confirm: async (id: string): Promise<WarehouseImportReceiptDto> => {
    const response = await api.post<WarehouseImportReceiptDto>(`${BASE_URL}/${id}/confirm`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  getNextCode: async (): Promise<string> => {
    const response = await api.get<string>(`${BASE_URL}/next-code`);
    return response.data;
  },

  getEligibleGoodsReceipts: async (): Promise<EligibleGoodsReceiptForImportDto[]> => {
    const response = await api.get<EligibleGoodsReceiptForImportDto[]>(`${BASE_URL}/eligible-goods-receipts`);
    return response.data;
  },

  getImportableItems: async (goodsReceiptId: string): Promise<GoodsReceiptItemForImportDto[]> => {
    const response = await api.get<GoodsReceiptItemForImportDto[]>(
      `${BASE_URL}/importable-items/${goodsReceiptId}`
    );
    return response.data;
  },

  getDefectiveHistory: async (goodsReceiptId: string): Promise<DefectiveHistoryItemDto[]> => {
    const response = await api.get<DefectiveHistoryItemDto[]>(
      `${BASE_URL}/defective-history/${goodsReceiptId}`
    );
    return response.data;
  },
};
