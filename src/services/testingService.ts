import api from './api';
import {
  TestingDetailDto,
  GetTestingListInput,
  PagedTestingResult,
  SaveResultsInput,
  SubmitForApprovalInput,
  RejectionHistoryDto,
} from '../types/testing';

const BASE_URL = '/api/v1/testing';

// Helper to convert params for API (ABP Framework uses PascalCase)
const toApiParams = (params: GetTestingListInput) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.tab !== undefined) apiParams.Tab = params.tab;
  if (params.search) apiParams.Search = params.search;
  if (params.statuses && params.statuses.length > 0) {
    // ABP supports array params like Statuses[0]=0&Statuses[1]=1
    params.statuses.forEach((status, index) => {
      apiParams[`Statuses[${index}]`] = status;
    });
  }
  if (params.technicianIds && params.technicianIds.length > 0) {
    params.technicianIds.forEach((id, index) => {
      apiParams[`TechnicianIds[${index}]`] = id;
    });
  }
  if (params.laboratoryId) apiParams.LaboratoryId = params.laboratoryId;
  return apiParams;
};

export const testingService = {
  /**
   * Get filtered and paged list of testing tasks
   */
  getList: async (params: GetTestingListInput = {}): Promise<PagedTestingResult> => {
    const response = await api.get<PagedTestingResult>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  /**
   * Get testing task detail by LaboratoryTask ID
   */
  get: async (id: string): Promise<TestingDetailDto> => {
    const response = await api.get<TestingDetailDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Save results (draft) for indicators
   */
  saveResults: async (id: string, input: SaveResultsInput): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/save-results`, input);
  },

  /**
   * Submit indicators for approval
   */
  submitForApproval: async (id: string, input: SubmitForApprovalInput): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/submit-approval`, input);
  },

  /**
   * Get rejection history for an indicator
   */
  getRejectionHistory: async (indicatorId: string): Promise<RejectionHistoryDto[]> => {
    const response = await api.get<RejectionHistoryDto[]>(
      `${BASE_URL}/indicators/${indicatorId}/rejection-history`
    );
    return response.data;
  }
};

export default testingService;
