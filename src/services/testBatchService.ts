import api from './api';
import {
  TestBatchListDto,
  TestBatchDto,
  GetTestBatchListInput,
  CreateTestBatchDto,
  SaveTestBatchResultsDto,
  ConfirmConsumptionDto,
  GetAvailableIndicatorsInput,
  AvailableIndicatorDto,
} from '../types/testBatch';

const BASE_URL = '/api/v1/test-batches';

const toApiParams = (params: Record<string, any>) => {
  const apiParams: Record<string, any> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const apiKey = key.charAt(0).toUpperCase() + key.slice(1);
      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          apiParams[`${apiKey}[${i}]`] = v;
        });
      } else {
        apiParams[apiKey] = value;
      }
    }
  });
  return apiParams;
};

const testBatchService = {
  getList: (params: GetTestBatchListInput) =>
    api.get<{ items: TestBatchListDto[]; totalCount: number }>(BASE_URL, {
      params: toApiParams(params),
    }),

  get: (id: string) => api.get<TestBatchDto>(`${BASE_URL}/${id}`),

  create: (data: CreateTestBatchDto) => api.post<TestBatchDto>(BASE_URL, data),

  delete: (id: string) => api.delete(`${BASE_URL}/${id}`),

  addItems: (id: string, laboratoryTaskIndicatorIds: string[]) =>
    api.post<TestBatchDto>(`${BASE_URL}/${id}/add-items`, {
      laboratoryTaskIndicatorIds,
    }),

  removeItems: (id: string, itemIds: string[]) =>
    api.post<TestBatchDto>(`${BASE_URL}/${id}/remove-items`, { itemIds }),

  saveResults: (id: string, data: SaveTestBatchResultsDto) =>
    api.post<TestBatchDto>(`${BASE_URL}/${id}/save-results`, data),

  submit: (id: string) =>
    api.post<TestBatchDto>(`${BASE_URL}/${id}/submit`),

  submitItems: (id: string, itemIds: string[]) =>
    api.post<TestBatchDto>(`${BASE_URL}/${id}/submit-items`, { itemIds }),

  calculateConsumption: (id: string) =>
    api.post<TestBatchDto>(`${BASE_URL}/${id}/calculate-consumption`),

  confirmConsumption: (id: string, data: ConfirmConsumptionDto) =>
    api.post<TestBatchDto>(`${BASE_URL}/${id}/confirm-consumption`, data),

  cancel: (id: string) =>
    api.post<TestBatchDto>(`${BASE_URL}/${id}/cancel`),

  getAvailableIndicators: (params: GetAvailableIndicatorsInput) =>
    api.get<{ items: AvailableIndicatorDto[]; totalCount: number }>(
      `${BASE_URL}/available-indicators`,
      { params: toApiParams(params) },
    ),
};

export default testBatchService;
