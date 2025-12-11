import axios from 'axios';
import { TestResultDto, CreateTestResultDto, UpdateTestResultDto } from '../types/testResult';

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

const API_URL = 'http://localhost:5002/api/app/test-result';

export const testResultService = {
  async getList(params?: { skipCount?: number; maxResultCount?: number; sorting?: string }): Promise<PagedResultDto<TestResultDto>> {
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  async get(id: string): Promise<TestResultDto> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  async create(data: CreateTestResultDto): Promise<TestResultDto> {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateTestResultDto): Promise<TestResultDto> {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  },
};
