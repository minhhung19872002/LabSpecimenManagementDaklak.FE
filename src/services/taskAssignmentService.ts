import api from './api';

export interface TaskAssignmentDto {
  id: string;
  taskNumber: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToId: string;
  assignedById: string;
  department: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  dueDate: string;
  startedAt?: string;
  completedAt?: string;
  progress: number;
  notes?: string;
  creationTime: string;
  lastModificationTime?: string;
}

export enum TaskType {
  Daily = 0,
  Weekly = 1,
  Monthly = 2,
  Adhoc = 3,
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export enum TaskStatus {
  Pending = 0,
  Accepted = 1,
  InProgress = 2,
  Completed = 3,
  Rejected = 4,
  Cancelled = 5,
}

export interface CreateTaskAssignmentDto {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  assignedToId: string;
  department: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  dueDate: string;
  notes?: string;
}

export interface UpdateTaskAssignmentDto {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToId: string;
  department: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityCode?: string;
  dueDate: string;
  progress: number;
  notes?: string;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface PagedAndSortedResultRequestDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface GetTaskAssignmentListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  status?: TaskStatus;
  department?: string;
  priority?: TaskPriority;
  type?: TaskType;
  assignedToId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

const BASE_URL = '/api/v1/task-assignments';

// Helper to convert params for API (ABP Framework uses PascalCase)
const toApiParams = (params: GetTaskAssignmentListInput) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  if (params.filter) apiParams.Filter = params.filter;
  if (params.status !== undefined) apiParams.Status = params.status;
  if (params.department) apiParams.Department = params.department;
  if (params.priority !== undefined) apiParams.Priority = params.priority;
  if (params.type !== undefined) apiParams.Type = params.type;
  if (params.assignedToId) apiParams.AssignedToId = params.assignedToId;
  if (params.dueDateFrom) apiParams.DueDateFrom = params.dueDateFrom;
  if (params.dueDateTo) apiParams.DueDateTo = params.dueDateTo;
  return apiParams;
};

export interface RejectTaskDto {
  reason?: string;
}

export interface CompleteTaskDto {
  notes?: string;
}

export interface UpdateProgressDto {
  progress: number;
}

export const taskAssignmentService = {
  getList: async (params: GetTaskAssignmentListInput = {}): Promise<PagedResultDto<TaskAssignmentDto>> => {
    const response = await api.get<PagedResultDto<TaskAssignmentDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  get: async (id: string): Promise<TaskAssignmentDto> => {
    const response = await api.get<TaskAssignmentDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskAssignmentDto): Promise<TaskAssignmentDto> => {
    const response = await api.post<TaskAssignmentDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateTaskAssignmentDto): Promise<TaskAssignmentDto> => {
    const response = await api.put<TaskAssignmentDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  accept: async (id: string): Promise<TaskAssignmentDto> => {
    const response = await api.post<TaskAssignmentDto>(`${BASE_URL}/${id}/accept`);
    return response.data;
  },

  reject: async (id: string, data: RejectTaskDto = {}): Promise<TaskAssignmentDto> => {
    const response = await api.post<TaskAssignmentDto>(`${BASE_URL}/${id}/reject`, data);
    return response.data;
  },

  start: async (id: string): Promise<TaskAssignmentDto> => {
    const response = await api.post<TaskAssignmentDto>(`${BASE_URL}/${id}/start`);
    return response.data;
  },

  complete: async (id: string, data: CompleteTaskDto = {}): Promise<TaskAssignmentDto> => {
    const response = await api.post<TaskAssignmentDto>(`${BASE_URL}/${id}/complete`, data);
    return response.data;
  },

  updateProgress: async (id: string, data: UpdateProgressDto): Promise<TaskAssignmentDto> => {
    const response = await api.post<TaskAssignmentDto>(`${BASE_URL}/${id}/progress`, data);
    return response.data;
  },

  getByAssignee: async (assigneeId: string): Promise<TaskAssignmentDto[]> => {
    const response = await api.get<TaskAssignmentDto[]>(`${BASE_URL}/by-assignee/${assigneeId}`);
    return response.data;
  },

  getMyTasks: async (): Promise<TaskAssignmentDto[]> => {
    const response = await api.get<TaskAssignmentDto[]>(`${BASE_URL}/my-tasks`);
    return response.data;
  },
};

export default taskAssignmentService;
