import api from './api';
import {
  SpecimenDto,
  CreateSpecimenDto,
  UpdateSpecimenDto,
  PagedResultDto,
  PagedAndSortedResultRequestDto
} from '../types/specimen';

const BASE_URL = '/api/app/specimen';

export const specimenService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<SpecimenDto>> => {
    const response = await api.get<PagedResultDto<SpecimenDto>>(BASE_URL, { params });
    return response.data;
  },

  get: async (id: string): Promise<SpecimenDto> => {
    const response = await api.get<SpecimenDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateSpecimenDto): Promise<SpecimenDto> => {
    const response = await api.post<SpecimenDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateSpecimenDto): Promise<SpecimenDto> => {
    const response = await api.put<SpecimenDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  }
};

export default specimenService;
