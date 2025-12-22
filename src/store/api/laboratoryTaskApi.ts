import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth, toAbpParams } from '../baseQuery';
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  UpdateLaboratoryTaskDto,
  GetLaboratoryTaskListDto,
  PagedLaboratoryTaskResult,
  ListLaboratoryTaskResult,
  LaboratoryTaskIndicatorDto,
  AssignIndicatorInput,
  UpdateIndicatorResultInput,
  ApproveIndicatorInput,
  MethodLookupDto,
  UserLookupDto,
} from '../../types/laboratoryTask';

const BASE_URL = '/api/v1/laboratory-tasks';

export const laboratoryTaskApi = createApi({
  reducerPath: 'laboratoryTaskApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['LaboratoryTask', 'LaboratoryTaskIndicator', 'Methods', 'Technicians'],
  endpoints: (builder) => ({
    // Get filtered and paged list of laboratory tasks
    getLaboratoryTaskList: builder.query<PagedLaboratoryTaskResult, GetLaboratoryTaskListDto>({
      query: (params) => ({
        url: BASE_URL,
        params: toAbpParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'LaboratoryTask' as const, id })),
              { type: 'LaboratoryTask', id: 'LIST' },
            ]
          : [{ type: 'LaboratoryTask', id: 'LIST' }],
    }),

    // Get a single laboratory task by ID
    getLaboratoryTask: builder.query<LaboratoryTaskDto, string>({
      query: (id) => `${BASE_URL}/${id}`,
      providesTags: (_, __, id) => [{ type: 'LaboratoryTask', id }],
    }),

    // Update laboratory task (TestDate, Status, Notes)
    updateLaboratoryTask: builder.mutation<LaboratoryTaskDto, { id: string; data: UpdateLaboratoryTaskDto }>({
      query: ({ id, data }) => ({
        url: `${BASE_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'LaboratoryTask', id },
        { type: 'LaboratoryTask', id: 'LIST' },
      ],
    }),

    // Update laboratory task status (workflow)
    updateLaboratoryTaskStatus: builder.mutation<LaboratoryTaskDto, { id: string; newStatus: LaboratoryTaskStatus }>({
      query: ({ id, newStatus }) => ({
        url: `${BASE_URL}/${id}/status`,
        method: 'POST',
        body: newStatus,
        headers: { 'Content-Type': 'application/json' },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'LaboratoryTask', id },
        { type: 'LaboratoryTask', id: 'LIST' },
      ],
    }),

    // Set test date for laboratory task
    setTestDate: builder.mutation<LaboratoryTaskDto, { id: string; testDate: string }>({
      query: ({ id, testDate }) => ({
        url: `${BASE_URL}/${id}/test-date`,
        method: 'POST',
        body: JSON.stringify(testDate),
        headers: { 'Content-Type': 'application/json' },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'LaboratoryTask', id },
        { type: 'LaboratoryTask', id: 'LIST' },
      ],
    }),

    // Get tasks for current user
    getMyTasks: builder.query<ListLaboratoryTaskResult, void>({
      query: () => `${BASE_URL}/my-tasks`,
      providesTags: [{ type: 'LaboratoryTask', id: 'MY_TASKS' }],
    }),

    // Get tasks by laboratory ID
    getByLaboratory: builder.query<ListLaboratoryTaskResult, string>({
      query: (laboratoryId) => `${BASE_URL}/by-laboratory/${laboratoryId}`,
      providesTags: (_, __, laboratoryId) => [{ type: 'LaboratoryTask', id: `LAB_${laboratoryId}` }],
    }),

    // Delete laboratory task
    deleteLaboratoryTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `${BASE_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'LaboratoryTask', id: 'LIST' }],
    }),

    // ============= Phase 6 - Workflow Methods =============

    // Assign method and technician for sample indicators
    assignSampleIndicators: builder.mutation<
      LaboratoryTaskDto,
      { taskId: string; sampleId: string; assignments: AssignIndicatorInput[] }
    >({
      query: ({ taskId, sampleId, assignments }) => ({
        url: `${BASE_URL}/${taskId}/samples/${sampleId}/assign`,
        method: 'POST',
        body: assignments,
      }),
      invalidatesTags: (_, __, { taskId }) => [
        { type: 'LaboratoryTask', id: taskId },
        { type: 'LaboratoryTaskIndicator', id: 'LIST' },
      ],
    }),

    // Update indicator result
    updateIndicatorResult: builder.mutation<
      LaboratoryTaskIndicatorDto,
      { indicatorId: string; input: UpdateIndicatorResultInput }
    >({
      query: ({ indicatorId, input }) => ({
        url: `${BASE_URL}/indicators/${indicatorId}/result`,
        method: 'PUT',
        body: input,
      }),
      invalidatesTags: [
        { type: 'LaboratoryTaskIndicator', id: 'LIST' },
        { type: 'LaboratoryTask', id: 'LIST' },
      ],
    }),

    // Approve or reject indicator result
    approveIndicator: builder.mutation<
      LaboratoryTaskIndicatorDto,
      { indicatorId: string; input: ApproveIndicatorInput }
    >({
      query: ({ indicatorId, input }) => ({
        url: `${BASE_URL}/indicators/${indicatorId}/approve`,
        method: 'POST',
        body: input,
      }),
      invalidatesTags: [
        { type: 'LaboratoryTaskIndicator', id: 'LIST' },
        { type: 'LaboratoryTask', id: 'LIST' },
      ],
    }),

    // Send results
    sendResults: builder.mutation<LaboratoryTaskDto, string>({
      query: (taskId) => ({
        url: `${BASE_URL}/${taskId}/send-results`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, taskId) => [
        { type: 'LaboratoryTask', id: taskId },
        { type: 'LaboratoryTask', id: 'LIST' },
      ],
    }),

    // Get methods by indicator
    getMethodsByIndicator: builder.query<MethodLookupDto[], string>({
      query: (indicatorId) => ({
        url: `${BASE_URL}/methods-lookup`,
        params: { indicatorId },
      }),
      providesTags: (_, __, indicatorId) => [{ type: 'Methods', id: indicatorId }],
    }),

    // Get technicians by laboratory
    getTechniciansByLaboratory: builder.query<UserLookupDto[], string | undefined>({
      query: (laboratoryId) => ({
        url: `${BASE_URL}/technicians-lookup`,
        params: laboratoryId ? { laboratoryId } : {},
      }),
      providesTags: (_, __, laboratoryId) => [{ type: 'Technicians', id: laboratoryId || 'ALL' }],
    }),
  }),
});

// Export hooks
export const {
  useGetLaboratoryTaskListQuery,
  useLazyGetLaboratoryTaskListQuery,
  useGetLaboratoryTaskQuery,
  useLazyGetLaboratoryTaskQuery,
  useUpdateLaboratoryTaskMutation,
  useUpdateLaboratoryTaskStatusMutation,
  useSetTestDateMutation,
  useGetMyTasksQuery,
  useLazyGetMyTasksQuery,
  useGetByLaboratoryQuery,
  useLazyGetByLaboratoryQuery,
  useDeleteLaboratoryTaskMutation,
  // Phase 6 workflow hooks
  useAssignSampleIndicatorsMutation,
  useUpdateIndicatorResultMutation,
  useApproveIndicatorMutation,
  useSendResultsMutation,
  useGetMethodsByIndicatorQuery,
  useLazyGetMethodsByIndicatorQuery,
  useGetTechniciansByLaboratoryQuery,
  useLazyGetTechniciansByLaboratoryQuery,
} = laboratoryTaskApi;

export default laboratoryTaskApi;
