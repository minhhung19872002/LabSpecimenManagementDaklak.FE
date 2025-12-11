import axios from 'axios';
import { SpecimenHistoryDto, CreateSpecimenHistoryDto, UpdateSpecimenHistoryDto } from '../types/specimenHistory';

const API_URL = 'http://localhost:5002/api/app/specimen-history';

interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export const specimenHistoryService = {
  getList: async (params: { skipCount?: number; maxResultCount?: number; sorting?: string }) => {
    const response = await axios.get<PagedResultDto<SpecimenHistoryDto>>(API_URL, { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axios.get<SpecimenHistoryDto>(`${API_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateSpecimenHistoryDto) => {
    const response = await axios.post<SpecimenHistoryDto>(API_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateSpecimenHistoryDto) => {
    const response = await axios.put<SpecimenHistoryDto>(`${API_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await axios.delete(`${API_URL}/${id}`);
  },
};
