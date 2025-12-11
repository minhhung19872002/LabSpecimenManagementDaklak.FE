import axios from 'axios';
import { TestDto, CreateTestDto, UpdateTestDto, PagedResultDto } from '../types/test';

const API_URL = 'http://localhost:5002/api/app/test';

export const testService = {
  async getList(params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestDto>> {
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  async get(id: string): Promise<TestDto> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  async create(data: CreateTestDto): Promise<TestDto> {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateTestDto): Promise<TestDto> {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  }
};
