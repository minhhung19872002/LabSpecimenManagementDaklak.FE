import api from './api';

export enum ApprovalProcessType {
  PurchaseOrder = 0,
}

export enum ApprovalScope {
  SystemWide = 0,
}

export enum ApprovalSnapshotStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export enum ApprovalStepStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface ApprovalProcessStepDto {
  id: string;
  stepOrder: number;
  approverId: string;
  approverName: string;
}

export interface ApprovalProcessDto {
  id: string;
  processType: ApprovalProcessType;
  scope: ApprovalScope;
  isActive: boolean;
  steps: ApprovalProcessStepDto[];
  creationTime: string;
  lastModificationTime?: string;
}

export interface CreateUpdateApprovalProcessStepDto {
  stepOrder: number;
  approverId: string;
  approverName: string;
}

export interface CreateUpdateApprovalProcessDto {
  processType: ApprovalProcessType;
  scope: ApprovalScope;
  steps: CreateUpdateApprovalProcessStepDto[];
}

export interface ApprovalSnapshotStepDto {
  id: string;
  stepOrder: number;
  approverId: string;
  approverName: string;
  status: ApprovalStepStatus;
  actionDate?: string;
  actorId?: string;
  actorName?: string;
  notes?: string;
}

export interface ApprovalSnapshotDto {
  id: string;
  referenceId: string;
  referenceType: string;
  referenceCode: string;
  processType: ApprovalProcessType;
  totalSteps: number;
  currentStepOrder: number;
  status: ApprovalSnapshotStatus;
  creationTime: string;
  steps: ApprovalSnapshotStepDto[];
}

const BASE_URL = '/api/v1/approval-processes';

const approvalProcessService = {
  getList: async (params?: { skipCount?: number; maxResultCount?: number }) => {
    const response = await api.get<{ items: ApprovalProcessDto[]; totalCount: number }>(BASE_URL, { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<ApprovalProcessDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateUpdateApprovalProcessDto) => {
    const response = await api.post<ApprovalProcessDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: CreateUpdateApprovalProcessDto) => {
    const response = await api.put<ApprovalProcessDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  toggleActive: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/toggle-active`);
  },

  getByProcessType: async (processType: ApprovalProcessType) => {
    const response = await api.get<ApprovalProcessDto | null>(`${BASE_URL}/by-type/${processType}`);
    return response.data;
  },

  getSnapshot: async (referenceId: string) => {
    const response = await api.get<ApprovalSnapshotDto | null>(`${BASE_URL}/snapshot/${referenceId}`);
    return response.data;
  },
};

export default approvalProcessService;
