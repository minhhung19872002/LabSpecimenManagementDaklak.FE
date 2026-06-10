import { api } from "./api";

export interface ManufacturerDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreateManufacturerDto {
  name: string;
  code?: string;
  isActive?: boolean;
}

const BASE_URL = "/api/v1/manufacturers";

export const manufacturerService = {
  getActive: async (): Promise<ManufacturerDto[]> => {
    const response = await api.get<{ items: ManufacturerDto[] }>(`${BASE_URL}/active`);
    return response.data.items ?? [];
  },

  create: async (data: CreateManufacturerDto): Promise<ManufacturerDto> => {
    const response = await api.post<ManufacturerDto>(BASE_URL, data);
    return response.data;
  },
};
