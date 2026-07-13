import api from "./api";

export enum SupplementaryTaskStatus {
  Pending = 0,
  Overdue = 1,
  Completed = 2,
  Cancelled = 3,
}

export enum SupplementaryTaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export interface SupplementaryTaskDto {
  id: string;
  title: string;
  description?: string;
  assignedToId: string;
  assignedToName: string;
  dueDate?: string;
  priority: SupplementaryTaskPriority;
  status: SupplementaryTaskStatus;
  imageUrls: string[];
  creationTime: string;
}

export interface SupplementaryTaskStatsDto {
  total: number;
  pending: number;
  overdue: number;
  completed: number;
  isDirector: boolean;
}

export interface CreateSupplementaryTaskDto {
  title: string;
  description?: string;
  assignedToId: string;
  dueDate?: string;
  priority: SupplementaryTaskPriority;
  imageUrls: string[];
}

export interface UpdateSupplementaryTaskDto {
  title: string;
  description?: string;
  assignedToId: string;
  dueDate?: string;
  priority: SupplementaryTaskPriority;
  status: SupplementaryTaskStatus;
  imageUrls: string[];
}

export interface GetSupplementaryTaskListInput {
  search?: string;
  status?: SupplementaryTaskStatus;
  priority?: SupplementaryTaskPriority;
  assignedToId?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

const BASE_URL = "/api/v1/supplementary-tasks";

export const supplementaryTaskService = {
  getList: async (params: GetSupplementaryTaskListInput): Promise<PagedResultDto<SupplementaryTaskDto>> => {
    const { data } = await api.get(BASE_URL, { params });
    return data;
  },

  getStats: async (): Promise<SupplementaryTaskStatsDto> => {
    const { data } = await api.get(`${BASE_URL}/stats`);
    return data;
  },

  create: async (input: CreateSupplementaryTaskDto): Promise<SupplementaryTaskDto> => {
    const { data } = await api.post(BASE_URL, input);
    return data;
  },

  update: async (id: string, input: UpdateSupplementaryTaskDto): Promise<SupplementaryTaskDto> => {
    const { data } = await api.put(`${BASE_URL}/${id}`, input);
    return data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/cancel`);
  },

  complete: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/complete`);
  },
};
