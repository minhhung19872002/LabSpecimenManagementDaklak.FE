import { api } from "./api";

// Enums
export enum ProductType {
  Chemical = 0,
  Biological = 1,
  Supply = 2,
}

export const ProductTypeLabels: Record<ProductType, string> = {
  [ProductType.Chemical]: "Hóa chất",
  [ProductType.Biological]: "Sinh phẩm",
  [ProductType.Supply]: "Vật tư",
};

// DTOs
export interface ProductDto {
  id: string;
  code: string;
  name: string;
  productType: ProductType;
  baseUnitId: string;
  baseUnitName?: string;
  packagingSpec?: string;
  casNumber?: string;
  manufacturer?: string;
  origin?: string;
  concentration?: string;
  storageConditions?: string;
  categories?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  availableQuantity: number;
  isActive: boolean;
  isDraft: boolean;
  creationTime: string;
  attachments: ProductAttachmentDto[];
  unitConversions: ProductUnitConversionDto[];
}

export interface CreateUpdateProductDto {
  name: string;
  productType: ProductType;
  baseUnitId: string;
  packagingSpec?: string;
  casNumber?: string;
  manufacturer?: string;
  origin?: string;
  concentration?: string;
  storageConditions?: string;
  categories?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  isActive: boolean;
  isDraft: boolean;
  attachments?: CreateProductAttachmentDto[];
  unitConversions?: CreateUpdateProductUnitConversionDto[];
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
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

const BASE_URL = "/api/v1/products";

export const productService = {
  getList: async (params: ProductFilterDto = {}): Promise<PagedResult<ProductDto>> => {
    const apiParams: Record<string, any> = {};
    if (params.page) apiParams.Page = params.page;
    if (params.limit) apiParams.Limit = params.limit;
    if (params.search) apiParams.Search = params.search;
    if (params.productType !== undefined && params.productType !== null)
      apiParams.ProductType = params.productType;
    if (params.isDraft !== undefined && params.isDraft !== null)
      apiParams.IsDraft = params.isDraft;
    if (params.sorting) apiParams.Sorting = params.sorting;

    const response = await api.get<PagedResult<ProductDto>>(BASE_URL, {
      params: apiParams,
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
