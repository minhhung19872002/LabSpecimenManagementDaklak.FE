import api from './api';
import {
  TestRequestDto,
  CreateTestRequestDto,
  UpdateTestRequestDto,
  PagedResultDto,
  PagedAndSortedResultRequestDto
} from '../types/testRequest';

const BASE_URL = '/api/app/test-request';

export const testRequestService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<TestRequestDto>> => {
    const response = await api.get<PagedResultDto<TestRequestDto>>(BASE_URL, { params });
    return response.data;
  },

  get: async (id: string): Promise<TestRequestDto> => {
    const response = await api.get<TestRequestDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateTestRequestDto): Promise<TestRequestDto> => {
    const response = await api.post<TestRequestDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateTestRequestDto): Promise<TestRequestDto> => {
    const response = await api.put<TestRequestDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  }
};

export default testRequestService;
