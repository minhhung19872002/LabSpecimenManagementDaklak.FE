import api from './api';
import {
  TestRequestDto,
  CreateTestRequestDto,
  UpdateTestRequestDto,
  PagedResultDto,
  PagedAndSortedResultRequestDto,
  TestRequestStatus
} from '../types/testRequest';

const BASE_URL = '/api/v1/test-requests';

// Extended params interface for search and filter
export interface TestRequestListParams extends PagedAndSortedResultRequestDto {
  search?: string;
  status?: TestRequestStatus;
  expectedCompletionDateFrom?: string;
  expectedCompletionDateTo?: string;
}

// Helper to convert params for API (ABP Framework uses SkipCount, MaxResultCount, Sorting)
const toApiParams = (params: TestRequestListParams) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.search) apiParams.Search = params.search;
  if (params.status !== undefined) apiParams.Status = params.status;
  if (params.expectedCompletionDateFrom) apiParams.ExpectedCompletionDateFrom = params.expectedCompletionDateFrom;
  if (params.expectedCompletionDateTo) apiParams.ExpectedCompletionDateTo = params.expectedCompletionDateTo;
  return apiParams;
};

export const testRequestService = {
  getList: async (params: TestRequestListParams): Promise<PagedResultDto<TestRequestDto>> => {
    const response = await api.get<PagedResultDto<TestRequestDto>>(BASE_URL, { params: toApiParams(params) });
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
  },

  // Result Form APIs
  generateResultForm: async (testRequestId: string, sampleId: string): Promise<{ fileName: string; sampleCode: string }> => {
    const response = await api.post<{ fileName: string; sampleCode: string }>('/api/v1/result-forms/generate', {
      testRequestId,
      sampleId
    });
    return response.data;
  },

  getResultFormEditorConfig: async (fileName: string): Promise<any> => {
    const response = await api.get(`/api/v1/result-forms/editor-config/${encodeURIComponent(fileName)}`);
    return response.data;
  },

  // BM01 Result Form APIs
  getSamplesForResultForm: async (testRequestId: string): Promise<SampleForSelectionDto[]> => {
    const response = await api.get<SampleForSelectionDto[]>(`/api/v1/result-forms/samples-for-selection/${testRequestId}`);
    return response.data;
  },

  generateBM01ResultForm: async (testRequestId: string, sampleId: string): Promise<{ fileName: string; sampleCode: string }> => {
    const response = await api.post<{ fileName: string; sampleCode: string }>('/api/v1/result-forms/generate-bm01', {
      testRequestId,
      sampleId
    });
    return response.data;
  }
};

// Sample selection DTO for BM01 result form
export interface SampleForSelectionDto {
  id: string;
  sampleCode: string;
  sampleName: string;
  testingStatus: string;
  canGenerateResult: boolean;
  requestedCompletionDate?: string;
}

export default testRequestService;
