import { api as apiClient } from './api';
import { OrganizationDto, CreateUpdateOrganizationDto, GetOrganizationListDto } from '../types/organization';

const BASE_URL = '/api/app/organization';

export const organizationService = {
  getList: async (params: GetOrganizationListDto) => {
    const response = await apiClient.get(BASE_URL, { params });
    return response.data;
  },

  get: async (id: string): Promise<OrganizationDto> => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateOrganizationDto): Promise<OrganizationDto> => {
    const response = await apiClient.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateOrganizationDto): Promise<OrganizationDto> => {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  getAllActive: async (): Promise<OrganizationDto[]> => {
    const response = await apiClient.get(`${BASE_URL}/active-organizations`);
    return response.data;
  },
};
