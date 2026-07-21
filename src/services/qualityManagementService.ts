import { api } from './api';
import {
  QualityManagementTaskDto,
  QualityManagementIndicatorDto,
  QualityIndicatorStatusHistoryDto,
  QualityManagementStatisticsDto,
  GetQualityManagementListInput,
  PagedQualityManagementResult,
  StandardLookupDto,
  StandardIndicatorInfoDto,
  TaskHistoryResponseDto,
  QualityManagerPendingTaskDto,
  BulkApproveIndicatorsResultDto,
  BulkRejectIndicatorsResultDto,
  ConfirmHandoverInput,
  GetSampleAssignmentLogInput,
  PagedSampleAssignmentLogResult,
  QLCLSampleAssignmentLogStatisticsDto,
} from '../types/qualityManagement';

const BASE_URL = '/api/v1/quality-management';

export const qualityManagementService = {
  // List & Detail
  getList: async (params: GetQualityManagementListInput): Promise<PagedQualityManagementResult> => {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      SkipCount: params.skipCount,
      MaxResultCount: params.maxResultCount,
      Sorting: params.sorting,
      Search: params.search,
      Status: params.status !== undefined ? params.status : undefined,
      TaskType: params.taskType !== undefined ? params.taskType : undefined,
      FromDate: params.fromDate,
      ToDate: params.toDate,
      IsOverdue: params.isOverdue,
      RequestCompletionDateFrom: params.requestCompletionDateFrom,
      RequestCompletionDateTo: params.requestCompletionDateTo,
      DateFilterField: params.dateFilterField,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });

    // Handle array params (LaboratoryIds)
    const arrayParams: Record<string, string[]> = {};
    if (params.laboratoryIds?.length) {
      arrayParams.LaboratoryIds = params.laboratoryIds;
    }

    const response = await api.get<PagedQualityManagementResult>(BASE_URL, {
      params: { ...queryParams, ...arrayParams },
      paramsSerializer: {
        indexes: null,
      },
    });
    return response.data;
  },

  get: async (id: string): Promise<QualityManagementTaskDto> => {
    const response = await api.get<QualityManagementTaskDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getFullDetail: async (id: string): Promise<QualityManagementTaskDto> => {
    try {
      const response = await api.get<QualityManagementTaskDto>(`${BASE_URL}/${id}/full-detail`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        const fallback = await api.get<QualityManagementTaskDto>(`${BASE_URL}/${id}`);
        return fallback.data;
      }
      throw error;
    }
  },

  getStatistics: async (): Promise<QualityManagementStatisticsDto> => {
    const response = await api.get<QualityManagementStatisticsDto>(`${BASE_URL}/statistics`);
    return response.data;
  },

  // Indicator Actions
  approveIndicator: async (indicatorId: string): Promise<QualityManagementIndicatorDto> => {
    const response = await api.post<QualityManagementIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/approve`
    );
    return response.data;
  },

  rejectIndicator: async (indicatorId: string, reason: string): Promise<QualityManagementIndicatorDto> => {
    const response = await api.post<QualityManagementIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/reject`,
      { reason }
    );
    return response.data;
  },

  bulkApproveIndicators: async (indicatorIds: string[]): Promise<BulkApproveIndicatorsResultDto> => {
    const response = await api.post<BulkApproveIndicatorsResultDto>(
      `${BASE_URL}/indicators/bulk-approve`,
      { indicatorIds }
    );
    return response.data;
  },

  bulkRejectIndicators: async (indicatorIds: string[], reason: string): Promise<BulkRejectIndicatorsResultDto> => {
    const response = await api.post<BulkRejectIndicatorsResultDto>(
      `${BASE_URL}/indicators/bulk-reject`,
      { indicatorIds, reason }
    );
    return response.data;
  },

  updateIndicatorStandard: async (indicatorId: string, standardId?: string): Promise<QualityManagementIndicatorDto> => {
    const response = await api.put<QualityManagementIndicatorDto>(
      `${BASE_URL}/indicators/${indicatorId}/standard`,
      { standardId }
    );
    return response.data;
  },

  getIndicatorHistory: async (indicatorId: string): Promise<QualityIndicatorStatusHistoryDto[]> => {
    const response = await api.get<QualityIndicatorStatusHistoryDto[]>(
      `${BASE_URL}/indicators/${indicatorId}/history`
    );
    return response.data;
  },

  getTaskHistory: async (taskId: string): Promise<TaskHistoryResponseDto> => {
    const response = await api.get<TaskHistoryResponseDto>(
      `${BASE_URL}/${taskId}/history`
    );
    return response.data;
  },

  // Task Actions
  printSingleResult: async (taskId: string, indicatorId: string, note?: string, templateName?: string, vicePresidentId?: string): Promise<{ fileName: string }> => {
    const response = await api.post<{ fileName: string }>(`${BASE_URL}/${taskId}/print-single`, { indicatorId, note, templateName, vicePresidentId });
    return response.data;
  },

  printMixedResult: async (taskId: string, indicatorIds: string[], note?: string, templateName?: string, vicePresidentId?: string): Promise<{ fileName: string }> => {
    const response = await api.post<{ fileName: string }>(`${BASE_URL}/${taskId}/print-mixed`, { indicatorIds, note, templateName, vicePresidentId });
    return response.data;
  },

  // Batch print multiple indicators with multiple templates
  printMultiSingleResult: async (
    taskId: string,
    indicatorIds: string[],
    templateNames: string[],
    note?: string,
    vicePresidentId?: string
  ): Promise<{ results: Array<{ fileName: string; laboratoryId: string; laboratoryName: string; templateName: string }> }> => {
    const response = await api.post<{ results: Array<{ fileName: string; laboratoryId: string; laboratoryName: string; templateName: string }> }>(
      `${BASE_URL}/${taskId}/print-multi-single`,
      { indicatorIds, templateNames, note, vicePresidentId }
    );
    return response.data;
  },

  printMixedPerSampleResult: async (
    taskId: string,
    indicatorIds: string[],
    templateName?: string,
    note?: string,
    vicePresidentId?: string
  ): Promise<{ results: Array<{ fileName: string; sampleCode: string; templateName: string }> }> => {
    const response = await api.post<{ results: Array<{ fileName: string; sampleCode: string; templateName: string }> }>(
      `${BASE_URL}/${taskId}/print-mixed-per-sample`,
      { indicatorIds, note, templateName, vicePresidentId }
    );
    return response.data;
  },

  getMixedTemplates: async (): Promise<TemplateDto[]> => {
    const response = await api.get<TemplateDto[]>('/api/v1/result-forms/mixed-templates');
    return response.data;
  },

  /**
   * @deprecated Sử dụng confirmHandover thay thế
   */
  sendResult: async (taskId: string): Promise<void> => {
    await api.post(`${BASE_URL}/${taskId}/send-result`);
  },

  /**
   * Xác nhận đã giao kết quả cho BPGN
   * Cập nhật task status thành HandedOver
   * Khi tất cả quality tasks đã HandedOver → TestRequest chuyển sang ReportPublished
   */
  confirmHandover: async (taskId: string, input?: ConfirmHandoverInput): Promise<void> => {
    await api.post(`${BASE_URL}/${taskId}/confirm-handover`, input || {});
  },

  // Lookup
  getStandardsLookup: async (): Promise<StandardLookupDto[]> => {
    const response = await api.get<StandardLookupDto[]>(`${BASE_URL}/standards-lookup`);
    return response.data;
  },

  getStandardIndicatorInfo: async (
    standardId: string,
    indicatorId: string,
    methodId: string
  ): Promise<StandardIndicatorInfoDto | null> => {
    const response = await api.get<StandardIndicatorInfoDto | null>(
      `${BASE_URL}/standard-indicator`,
      { params: { standardId, indicatorId, methodId } }
    );
    return response.data;
  },

  // Change Approval
  approveChanges: async (taskId: string): Promise<void> => {
    await api.post(`${BASE_URL}/${taskId}/approve-changes`);
  },

  rejectChanges: async (taskId: string, reason: string): Promise<void> => {
    await api.post(`${BASE_URL}/${taskId}/reject-changes`, { reason });
  },

  // Work Reminder
  getQualityManagerPendingTasks: async (): Promise<QualityManagerPendingTaskDto[]> => {
    const response = await api.get<QualityManagerPendingTaskDto[]>(
      `${BASE_URL}/quality-manager-pending-tasks`
    );
    return response.data;
  },

  // Templates
  getTemplates: async (): Promise<TemplateDto[]> => {
    const response = await api.get<TemplateDto[]>('/api/v1/result-forms/templates');
    return response.data;
  },

  // Sample Assignment Log
  getSampleAssignmentLog: async (params: GetSampleAssignmentLogInput): Promise<PagedSampleAssignmentLogResult> => {
    const queryParams: Record<string, string | number | undefined> = {
      SkipCount: params.skipCount,
      MaxResultCount: params.maxResultCount,
      Sorting: params.sorting,
      Search: params.search,
      TestRequestStatus: params.testRequestStatus !== undefined ? params.testRequestStatus : undefined,
      FromDate: params.fromDate,
      ToDate: params.toDate,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });

    // Handle array params (QlclDisplayStatuses, LaboratoryIds)
    const arrayParams: Record<string, (number | string)[]> = {};
    if (params.qlclDisplayStatuses?.length) {
      arrayParams.QlclDisplayStatuses = params.qlclDisplayStatuses;
    }
    if (params.laboratoryIds?.length) {
      arrayParams.LaboratoryIds = params.laboratoryIds;
    }

    const response = await api.get<PagedSampleAssignmentLogResult>(`${BASE_URL}/sample-assignment-log`, {
      params: { ...queryParams, ...arrayParams },
      paramsSerializer: {
        indexes: null, // ABP expects repeated param format
      },
    });
    return response.data;
  },

  getSampleAssignmentLogStatistics: async (): Promise<QLCLSampleAssignmentLogStatisticsDto> => {
    const response = await api.get<QLCLSampleAssignmentLogStatisticsDto>(`${BASE_URL}/sample-assignment-log/statistics`);
    return response.data;
  },
};

export interface TemplateDto {
  name: string;
  displayName: string;
  fileName: string;
}

export default qualityManagementService;
