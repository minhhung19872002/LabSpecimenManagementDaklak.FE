import api from './api';
import { PagedResultDto } from './api';

export interface AuditLogDto {
  id: string;
  applicationName?: string;
  userId?: string;
  userName?: string;
  tenantId?: string;
  tenantName?: string;
  executionTime: string;
  executionDuration: number;
  clientIpAddress?: string;
  clientName?: string;
  clientId?: string;
  correlationId?: string;
  browserInfo?: string;
  httpMethod?: string;
  url?: string;
  httpStatusCode?: number;
  comments?: string;
  actions?: AuditLogActionDto[];
  entityChanges?: EntityChangeDto[];
}

export interface AuditLogActionDto {
  id: string;
  serviceName?: string;
  methodName?: string;
  parameters?: string;
  executionTime: string;
  executionDuration: number;
}

export interface EntityChangeDto {
  id: string;
  auditLogId: string;
  changeTime: string;
  changeType?: string;
  entityTenantId?: string;
  entityId?: string;
  entityTypeFullName?: string;
  propertyChanges?: EntityPropertyChangeDto[];
}

export interface EntityPropertyChangeDto {
  id: string;
  entityChangeId: string;
  newValue?: string;
  originalValue?: string;
  propertyName?: string;
  propertyTypeFullName?: string;
}

export interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface AuditLogFilterParams {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  startTime?: string;
  endTime?: string;
  httpMethod?: string;
  url?: string;
  userId?: string;
  userName?: string;
  httpStatusCode?: number;
  hasException?: boolean;
}

const BASE_URL = '/api/v1/audit-logs';

// Helper to convert params for API (ABP Framework uses PascalCase)
const toApiParams = (params?: AuditLogFilterParams) => {
  if (!params) return {};
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.startTime) apiParams.StartTime = params.startTime;
  if (params.endTime) apiParams.EndTime = params.endTime;
  if (params.httpMethod) apiParams.HttpMethod = params.httpMethod;
  if (params.url) apiParams.Url = params.url;
  if (params.userId) apiParams.UserId = params.userId;
  if (params.userName) apiParams.UserName = params.userName;
  if (params.httpStatusCode !== undefined) apiParams.HttpStatusCode = params.httpStatusCode;
  if (params.hasException !== undefined) apiParams.HasException = params.hasException;
  return apiParams;
};

export const auditLogService = {
  getList: async (params?: AuditLogFilterParams): Promise<PagedResultDto<AuditLogDto>> => {
    const response = await api.get<PagedResultDto<AuditLogDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  get: async (id: string): Promise<AuditLogDto> => {
    const response = await api.get<AuditLogDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getByEntity: async (entityType: string, entityId: string): Promise<AuditLogDto[]> => {
    const response = await api.get<AuditLogDto[]>(`${BASE_URL}/by-entity/${entityType}/${entityId}`);
    return response.data;
  },

  getStatistics: async (): Promise<{
    total: number;
    today: number;
    gets: number;
    posts: number;
    puts: number;
    deletes: number;
  }> => {
    const response = await api.get<{
      total: number;
      today: number;
      gets: number;
      posts: number;
      puts: number;
      deletes: number;
    }>(`${BASE_URL}/statistics`);
    return response.data;
  },
};

export default auditLogService;
