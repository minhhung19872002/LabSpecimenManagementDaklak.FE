import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import { PagedResultDto } from '../../services/api';

const BASE_URL = '/api/v1/audit-logs';

export interface AuditLogActionDto {
  id: string;
  serviceName?: string;
  methodName?: string;
  parameters?: string;
  executionTime: string;
  executionDuration: number;
}

export interface EntityPropertyChangeDto {
  id: string;
  entityChangeId: string;
  newValue?: string;
  originalValue?: string;
  propertyName?: string;
  propertyTypeFullName?: string;
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

export interface AuditLogStatistics {
  total: number;
  today: number;
  gets: number;
  posts: number;
  puts: number;
  deletes: number;
}

export const auditLogApi = createApi({
  reducerPath: 'auditLogApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AuditLog'],
  endpoints: (builder) => ({
    getAuditLogList: builder.query<PagedResultDto<AuditLogDto>, AuditLogFilterParams>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),

    getAuditLog: builder.query<AuditLogDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'AuditLog', id }],
    }),

    getAuditLogsByEntity: builder.query<AuditLogDto[], { entityType: string; entityId: string }>({
      query: ({ entityType, entityId }) => `${BASE_URL}/by-entity/${entityType}/${entityId}`,
      providesTags: (_, __, { entityType, entityId }) => [
        { type: 'AuditLog', id: `ENTITY_${entityType}_${entityId}` },
      ],
    }),

    getAuditLogStatistics: builder.query<AuditLogStatistics, void>({
      query: () => `${BASE_URL}/statistics`,
      providesTags: [{ type: 'AuditLog', id: 'STATISTICS' }],
    }),
  }),
});

export const {
  useGetAuditLogListQuery,
  useLazyGetAuditLogListQuery,
  useGetAuditLogQuery,
  useLazyGetAuditLogQuery,
  useGetAuditLogsByEntityQuery,
  useLazyGetAuditLogsByEntityQuery,
  useGetAuditLogStatisticsQuery,
} = auditLogApi;

export default auditLogApi;
