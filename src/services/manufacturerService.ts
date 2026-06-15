import { api, PagedResultDto } from "./api";

export interface ManufacturerDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  creationTime?: string;
}

export interface CreateUpdateManufacturerDto {
  name: string;
  description?: string;
  isActive: boolean;
}

const BASE_URL = "/api/v1/manufacturers";

export const manufacturerService = {
  getList: async (params?: {
    skipCount?: number;
    maxResultCount?: number;
    sorting?: string;
  }): Promise<PagedResultDto<ManufacturerDto>> => {
    const apiParams: Record<string, any> = {};
    if (params) {
      const limit = params.maxResultCount || 10;
      const skipCount = params.skipCount || 0;
      const page = Math.floor(skipCount / limit) + 1;
      apiParams.Page = page;
      apiParams.Limit = limit;
      if (params.sorting) apiParams.Sorting = params.sorting;
    }
    const response = await api.get<PagedResultDto<ManufacturerDto>>(BASE_URL, {
      params: apiParams,
    });
    return response.data;
  },

  get: async (id: string): Promise<ManufacturerDto> => {
    const response = await api.get<ManufacturerDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getActive: async (): Promise<ManufacturerDto[]> => {
    const response = await api.get<{ items: ManufacturerDto[] } | ManufacturerDto[]>(
      `${BASE_URL}/active`
    );
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as { items: ManufacturerDto[] }).items;
  },

  create: async (data: CreateUpdateManufacturerDto): Promise<ManufacturerDto> => {
    const response = await api.post<ManufacturerDto>(BASE_URL, data);
    return response.data;
  },

  update: async (
    id: string,
    data: CreateUpdateManufacturerDto
  ): Promise<ManufacturerDto> => {
    const response = await api.put<ManufacturerDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  getNextCode: async (): Promise<string> => {
    const response = await api.get<string>(`${BASE_URL}/next-code`);
    return response.data;
  },

  toggleActive: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/toggle-active`);
  },

  batchDelete: async (ids: string[]): Promise<number> => {
    const response = await api.post<number>(`${BASE_URL}/batch-delete`, { ids });
    return response.data;
  },

  batchToggleActive: async (ids: string[], isActive: boolean): Promise<number> => {
    const response = await api.post<number>(`${BASE_URL}/batch-toggle-active`, {
      ids,
      isActive,
    });
    return response.data;
  },
};
