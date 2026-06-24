import { api } from "./api";

export enum GoodsReceiptType {
  Goods = 0,
  Equipment = 1,
}

export const RECEIPT_TYPE_OPTIONS = [
  { value: GoodsReceiptType.Goods, label: "Phiếu nhập vật tư" },
  { value: GoodsReceiptType.Equipment, label: "Phiếu nhập thiết bị" },
];

export const ReceiptTypeLabels: Record<number, string> = {
  [GoodsReceiptType.Goods]: "Vật tư",
  [GoodsReceiptType.Equipment]: "Thiết bị",
};

export const ReceiptTypeColors: Record<number, string> = {
  [GoodsReceiptType.Goods]: "blue",
  [GoodsReceiptType.Equipment]: "purple",
};

export enum GoodsReceiptWarehouseStatus {
  NotImported = 0,
  Imported = 1,
}

export enum GoodsReceiptOrderStatus {
  PendingApproval = 0,
  Ordering = 1,
  WaitingReceipt = 2,
  Rejected = 3,
}

export enum GoodsReceiptPaymentStatus {
  Unpaid = 0,
  Paid = 1,
  PartiallyPaid = 2,
}

export enum PaymentMethod {
  Cash = 0,
  BankTransfer = 1,
}

export const WAREHOUSE_STATUS_OPTIONS = [
  { value: GoodsReceiptWarehouseStatus.NotImported, label: "Chưa nhập kho" },
  { value: GoodsReceiptWarehouseStatus.Imported, label: "Đã nhập kho" },
];


export const PAYMENT_STATUS_OPTIONS = [
  { value: GoodsReceiptPaymentStatus.Unpaid, label: "Chưa thanh toán" },
  { value: GoodsReceiptPaymentStatus.Paid, label: "Đã thanh toán" },
  { value: GoodsReceiptPaymentStatus.PartiallyPaid, label: "Thanh toán một phần" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.Cash, label: "Tiền mặt" },
  { value: PaymentMethod.BankTransfer, label: "Chuyển khoản" },
];

export const WarehouseStatusLabels: Record<number, string> = {
  [GoodsReceiptWarehouseStatus.NotImported]: "Chưa nhập kho",
  [GoodsReceiptWarehouseStatus.Imported]: "Đã nhập kho",
};

export const OrderStatusLabels: Record<number, string> = {
  [GoodsReceiptOrderStatus.PendingApproval]: "Chờ phê duyệt",
  [GoodsReceiptOrderStatus.Ordering]: "Đang đặt hàng",
  [GoodsReceiptOrderStatus.WaitingReceipt]: "Chờ nhận & Nghiệm thu",
  [GoodsReceiptOrderStatus.Rejected]: "Từ chối",
};

export const PaymentStatusLabels: Record<number, string> = {
  [GoodsReceiptPaymentStatus.Unpaid]: "Chưa thanh toán",
  [GoodsReceiptPaymentStatus.Paid]: "Đã thanh toán",
  [GoodsReceiptPaymentStatus.PartiallyPaid]: "Thanh toán một phần",
};

export const WarehouseStatusColors: Record<number, string> = {
  [GoodsReceiptWarehouseStatus.NotImported]: "orange",
  [GoodsReceiptWarehouseStatus.Imported]: "green",
};

export const OrderStatusColors: Record<number, string> = {
  [GoodsReceiptOrderStatus.PendingApproval]: "orange",
  [GoodsReceiptOrderStatus.Ordering]: "blue",
  [GoodsReceiptOrderStatus.WaitingReceipt]: "green",
  [GoodsReceiptOrderStatus.Rejected]: "red",
};

export const PaymentStatusColors: Record<number, string> = {
  [GoodsReceiptPaymentStatus.Unpaid]: "red",
  [GoodsReceiptPaymentStatus.Paid]: "green",
  [GoodsReceiptPaymentStatus.PartiallyPaid]: "orange",
};

export interface GoodsReceiptListDto {
  id: string;
  code: string;
  receiptType: GoodsReceiptType;
  supplierId?: string;
  supplierName?: string;
  supplierAddress?: string;
  documentDate?: string;
  warehouseStatus: GoodsReceiptWarehouseStatus;
  orderStatus: GoodsReceiptOrderStatus;
  paymentStatus: GoodsReceiptPaymentStatus;
  totalAmountAfterVat: number;
  expectedDeliveryDate?: string;
  creatorName?: string;
  notes?: string;
  creationTime: string;
}

export interface GoodsReceiptDto extends GoodsReceiptListDto {
  supplierAddress?: string;
  supplierPhone?: string;
  purchaserName?: string;
  deliveryNoteNumber?: string;
  preparedByName?: string;
  documentExpiryDate?: string;
  supplierRepresentativePhone?: string;
  expectedDeliveryDate?: string;
  purchaserId?: string;
  purchaserFullName?: string;
  vatPercent: number;
  totalAmountBeforeVat: number;
  totalVatAmount: number;
  totalPaid: number;
  items: GoodsReceiptItemDto[];
  payments: GoodsReceiptPaymentDto[];
}

export interface GoodsReceiptItemDto {
  id: string;
  goodsReceiptId: string;
  productId: string;
  productName: string;
  identificationCode?: string;
  unitId: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  amountBeforeVat: number;
  vatPercent: number;
  vatAmount: number;
  amountAfterVat: number;
  lotNumber?: string;
  lotExpiryDate?: string;
  isEquipment: boolean;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  manufacturerId?: string;
  supplierId?: string;
  supplierName?: string;
  receivedDate?: string;
  expiryDate?: string;
  warehouseId?: string;
  warehouseName?: string;
}

export interface GoodsReceiptPaymentDto {
  id: string;
  goodsReceiptId: string;
  paymentNumber: number;
  amount: number;
  remainingBeforePayment: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  phone?: string;
  representativeName?: string;
  notes?: string;
  creationTime: string;
}

export interface CreateUpdateGoodsReceiptDto {
  receiptType: GoodsReceiptType;
  supplierId?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  purchaserName?: string;
  deliveryNoteNumber?: string;
  documentDate?: string;
  documentExpiryDate?: string;
  supplierRepresentativePhone?: string;
  expectedDeliveryDate?: string;
  purchaserId?: string;
  vatPercent: number;
  notes?: string;
  items: CreateUpdateGoodsReceiptItemDto[];
}

export interface CreateUpdateGoodsReceiptItemDto {
  id?: string;
  productId?: string;
  productName?: string;
  unitId?: string;
  quantity: number;
  unitPrice: number;
  vatPercent: number;
  lotNumber?: string;
  lotExpiryDate?: string;
  isEquipment?: boolean;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  manufacturerName?: string;
  manufacturerId?: string;
  supplierId?: string;
  receivedDate?: string;
  expiryDate?: string;
  warehouseId?: string;
}

export interface GetGoodsReceiptListInput {
  page?: number;
  limit?: number;
  search?: string;
  sorting?: string;
  supplierId?: string;
  productId?: string;
  receiptType?: GoodsReceiptType;
  warehouseStatus?: GoodsReceiptWarehouseStatus;
  orderStatus?: GoodsReceiptOrderStatus;
  paymentStatus?: GoodsReceiptPaymentStatus;
  fromDate?: string;
  toDate?: string;
}

export interface RecentLotDto {
  lotNumber: string;
  lotExpiryDate?: string;
}

export interface CreateGoodsReceiptPaymentDto {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  phone?: string;
  representativeName?: string;
  notes?: string;
}

export interface GoodsReceiptStatisticsDto {
  pendingApproval: number;
  ordering: number;
  waitingReceipt: number;
  rejected: number;
}

export interface LatestSupplierInfoDto {
  supplierRepresentativePhone?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

const BASE_URL = "/api/v1/goods-receipts";

export const goodsReceiptService = {
  getList: async (params: GetGoodsReceiptListInput = {}): Promise<PagedResult<GoodsReceiptListDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.search) apiParams.Search = params.search;
    if (params.sorting) apiParams.Sorting = params.sorting;
    if (params.warehouseStatus !== undefined) apiParams.WarehouseStatus = params.warehouseStatus;
    if (params.orderStatus !== undefined) apiParams.OrderStatus = params.orderStatus;
    if (params.paymentStatus !== undefined) apiParams.PaymentStatus = params.paymentStatus;
    if (params.fromDate) apiParams.FromDate = params.fromDate;
    if (params.toDate) apiParams.ToDate = params.toDate;
    if (params.supplierId) apiParams.SupplierId = params.supplierId;
    if (params.productId) apiParams.ProductId = params.productId;
    if (params.receiptType !== undefined) apiParams.ReceiptType = params.receiptType;
    const response = await api.get<PagedResult<GoodsReceiptListDto>>(BASE_URL, { params: apiParams });
    return response.data;
  },

  get: async (id: string): Promise<GoodsReceiptDto> => {
    const response = await api.get<GoodsReceiptDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateGoodsReceiptDto): Promise<GoodsReceiptDto> => {
    const response = await api.post<GoodsReceiptDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateGoodsReceiptDto): Promise<GoodsReceiptDto> => {
    const response = await api.put<GoodsReceiptDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  batchDelete: async (ids: string[]): Promise<number> => {
    const response = await api.post<number>(`${BASE_URL}/batch-delete`, ids);
    return response.data;
  },

  approve: async (id: string): Promise<GoodsReceiptDto> => {
    const response = await api.post<GoodsReceiptDto>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  importToWarehouse: async (id: string): Promise<GoodsReceiptDto> => {
    const response = await api.post<GoodsReceiptDto>(`${BASE_URL}/${id}/import-to-warehouse`);
    return response.data;
  },

  addPayment: async (id: string, data: CreateGoodsReceiptPaymentDto): Promise<GoodsReceiptDto> => {
    const response = await api.post<GoodsReceiptDto>(`${BASE_URL}/${id}/payments`, data);
    return response.data;
  },

  reject: async (id: string, notes?: string): Promise<GoodsReceiptDto> => {
    const response = await api.post<GoodsReceiptDto>(`${BASE_URL}/${id}/reject`, { notes });
    return response.data;
  },

  getStatistics: async (): Promise<GoodsReceiptStatisticsDto> => {
    const response = await api.get<GoodsReceiptStatisticsDto>(`${BASE_URL}/statistics`);
    return response.data;
  },

  getLatestSupplierInfo: async (supplierId: string): Promise<LatestSupplierInfoDto> => {
    const response = await api.get<LatestSupplierInfoDto>(`${BASE_URL}/latest-supplier-info/${supplierId}`);
    return response.data;
  },

  getNextCode: async (): Promise<string> => {
    const response = await api.get<string>(`${BASE_URL}/next-code`);
    return response.data;
  },

  getNextEquipmentCode: async (): Promise<string> => {
    const response = await api.get<string>(`${BASE_URL}/next-equipment-code`);
    return response.data;
  },

  getRecentLots: async (productId: string): Promise<RecentLotDto[]> => {
    const response = await api.get<(RecentLotDto | string)[]>(`${BASE_URL}/recent-lots/${productId}`);
    const data = response.data || [];
    return data.map((item) =>
      typeof item === "string"
        ? { lotNumber: item, lotExpiryDate: undefined }
        : item
    );
  },
};
