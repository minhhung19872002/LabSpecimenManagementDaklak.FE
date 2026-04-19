import { api } from "./api";

export interface SupplierDto {
  id: string;
  code: string;
  name: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoFileId?: string;
  logoUrl?: string;
  supplierGroup?: string;
  note?: string;
  totalPurchase: number;
  totalPurchaseAfterReturn: number;
  outstandingDebt: number;
  isActive: boolean;
  creationTime: string;
}

export interface CreateUpdateSupplierDto {
  code?: string;
  name: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoFileId?: string;
  supplierGroup?: string;
  note?: string;
  isActive: boolean;
}

export interface SupplierFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  supplierGroup?: string;
  sorting?: string;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

const BASE_URL = "/api/v1/suppliers-management";

export const supplierService = {
  getList: async (params: SupplierFilterDto = {}): Promise<PagedResult<SupplierDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.search) apiParams.Search = params.search;
    if (params.supplierGroup) apiParams.SupplierGroup = params.supplierGroup;
    if (params.sorting) apiParams.Sorting = params.sorting;
    const response = await api.get<PagedResult<SupplierDto>>(BASE_URL, { params: apiParams });
    return response.data;
  },

  get: async (id: string): Promise<SupplierDto> => {
    const response = await api.get<SupplierDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateSupplierDto): Promise<SupplierDto> => {
    const response = await api.post<SupplierDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateSupplierDto): Promise<SupplierDto> => {
    const response = await api.put<SupplierDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  batchDelete: async (ids: string[]): Promise<number> => {
    const response = await api.post<number>(`${BASE_URL}/batch-delete`, ids);
    return response.data;
  },

  toggleActive: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/toggle-active`);
  },

  getGroups: async (): Promise<string[]> => {
    const response = await api.get<string[]>(`${BASE_URL}/groups`);
    return response.data || [];
  },

  uploadLogo: async (file: File): Promise<{ fileId: string; fileName: string; url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.upload<{ fileId: string; fileName: string; fileSize: number; url: string }>(
      "/api/v1/files/upload",
      formData
    );
    return response.data;
  },
};
