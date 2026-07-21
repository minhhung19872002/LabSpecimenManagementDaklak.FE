import { api } from "./api";

export enum EquipmentStatus {
  InStock = 0,
  InUse = 1,
  UnderMaintenance = 2,
  Broken = 3,
  Disposed = 4,
}

export const EQUIPMENT_STATUS_OPTIONS = [
  { value: EquipmentStatus.InStock, label: "Trong kho" },
  { value: EquipmentStatus.InUse, label: "Đang sử dụng" },
  { value: EquipmentStatus.UnderMaintenance, label: "Đang bảo trì" },
  { value: EquipmentStatus.Broken, label: "Hỏng" },
  { value: EquipmentStatus.Disposed, label: "Thanh lý" },
];

export const EquipmentStatusLabels: Record<number, string> = {
  [EquipmentStatus.InStock]: "Trong kho",
  [EquipmentStatus.InUse]: "Đang sử dụng",
  [EquipmentStatus.UnderMaintenance]: "Đang bảo trì",
  [EquipmentStatus.Broken]: "Hỏng",
  [EquipmentStatus.Disposed]: "Thanh lý",
};

export const EquipmentStatusColors: Record<number, string> = {
  [EquipmentStatus.InStock]: "green",
  [EquipmentStatus.InUse]: "blue",
  [EquipmentStatus.UnderMaintenance]: "orange",
  [EquipmentStatus.Broken]: "red",
  [EquipmentStatus.Disposed]: "default",
};

export const ALLOWED_STATUS_TRANSITIONS: Record<EquipmentStatus, EquipmentStatus[]> = {
  [EquipmentStatus.InStock]: [EquipmentStatus.InUse, EquipmentStatus.UnderMaintenance, EquipmentStatus.Broken],
  [EquipmentStatus.InUse]: [EquipmentStatus.InStock, EquipmentStatus.UnderMaintenance, EquipmentStatus.Broken],
  [EquipmentStatus.UnderMaintenance]: [EquipmentStatus.InStock, EquipmentStatus.Broken],
  [EquipmentStatus.Broken]: [EquipmentStatus.Disposed],
  [EquipmentStatus.Disposed]: [],
};

export interface EquipmentListDto {
  id: string;
  code: string;
  name: string;
  serialNumber: string;
  status: EquipmentStatus;
  model?: string;
  manufacturer?: string;
  origin?: string;
  supplierName?: string;
  goodsReceiptCode?: string;
  warrantyExpiryDate?: string;
  usageCount: number;
  maintenanceCount: number;
  assetCode?: string;
  price: number;
  depreciationPeriod?: number;
  powerConsumption?: number;
  operatingHoursPerYear?: number;
  averageSamplesPerYear?: number;
  maintenanceCostRatio?: number;
  calibrationCostPerYear?: number;
  creatorName?: string;
  creationTime: string;
  attachments?: EquipmentAttachmentDto[];
}

export interface EquipmentAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  url: string;
  creationTime: string;
}

export interface CreateEquipmentAttachmentDto {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
}

export interface EquipmentDto extends EquipmentListDto {
  goodsReceiptId?: string;
  supplierId?: string;
  unitId?: string;
  unitName?: string;
  lotNumber?: string;
  lotExpiryDate?: string;
  notes?: string;
  location?: string;
  importDate?: string;
  attachments: EquipmentAttachmentDto[];
}

export interface EquipmentCostConfigDto {
  id: string;
  equipmentId: string;
  effectiveFrom: string;
  effectiveTo: string;
  operatingHoursPerYear?: number;
  averageSamplesPerYear?: number;
  maintenanceCostRatio?: number;
  calibrationCostPerYear?: number;
  description?: string;
  changeLog?: string;
  creationTime: string;
  creatorName?: string;
}

export interface CreateEquipmentCostConfigDto {
  effectiveFrom: string;
  effectiveTo: string;
  operatingHoursPerYear?: number;
  averageSamplesPerYear?: number;
  maintenanceCostRatio?: number;
  calibrationCostPerYear?: number;
}

export interface CreateUpdateEquipmentDto {
  name: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  origin?: string;
  warrantyExpiryDate?: string;
  unitId?: string;
  price: number;
  notes?: string;
  assetCode?: string;
  depreciationPeriod?: number;
  location?: string;
  powerConsumption?: number;
  operatingHoursPerYear?: number;
  averageSamplesPerYear?: number;
  maintenanceCostRatio?: number;
  calibrationCostPerYear?: number;
  attachments?: CreateEquipmentAttachmentDto[];
}

export interface UpdateEquipmentStatusDto {
  status: EquipmentStatus;
  notes?: string;
}

export interface GetEquipmentListInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: EquipmentStatus;
  supplierId?: string;
  fromDate?: string;
  toDate?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

const BASE_URL = "/api/v1/equipments";

export const equipmentService = {
  getList: async (params: GetEquipmentListInput = {}): Promise<PagedResult<EquipmentListDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.search) apiParams.Search = params.search;
    if (params.status !== undefined) apiParams.Status = params.status;
    if (params.supplierId) apiParams.SupplierId = params.supplierId;
    if (params.fromDate) apiParams.FromDate = params.fromDate;
    if (params.toDate) apiParams.ToDate = params.toDate;
    const response = await api.get<PagedResult<EquipmentListDto>>(BASE_URL, { params: apiParams });
    return response.data;
  },

  get: async (id: string): Promise<EquipmentDto> => {
    const response = await api.get<EquipmentDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateEquipmentDto): Promise<EquipmentDto> => {
    const response = await api.post<EquipmentDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateEquipmentDto): Promise<EquipmentDto> => {
    const response = await api.put<EquipmentDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, data: UpdateEquipmentStatusDto): Promise<EquipmentDto> => {
    const response = await api.post<EquipmentDto>(`${BASE_URL}/${id}/update-status`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  deleteAttachment: async (equipmentId: string, attachmentId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${equipmentId}/attachments/${attachmentId}`);
  },

  uploadFile: async (file: File): Promise<{ fileId: string; fileName: string; fileSize: number; url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.upload<{ fileId: string; fileName: string; fileSize: number; url: string }>(
      "/api/v1/files/upload",
      formData
    );
    return response.data;
  },

  getCostConfigs: async (equipmentId: string): Promise<EquipmentCostConfigDto[]> => {
    const response = await api.get<EquipmentCostConfigDto[]>(`${BASE_URL}/${equipmentId}/cost-configs`);
    return response.data;
  },

  getActiveCostConfig: async (equipmentId: string): Promise<EquipmentCostConfigDto | null> => {
    const response = await api.get<EquipmentCostConfigDto | null>(`${BASE_URL}/${equipmentId}/cost-configs/active`);
    return response.data;
  },

  saveCostConfig: async (equipmentId: string, data: CreateEquipmentCostConfigDto): Promise<EquipmentCostConfigDto> => {
    const response = await api.post<EquipmentCostConfigDto>(`${BASE_URL}/${equipmentId}/cost-configs`, data);
    return response.data;
  },
};
