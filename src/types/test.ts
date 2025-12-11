export enum TestStatus {
  Pending = 0,
  Assigned = 1,
  InProgress = 2,
  Completed = 3,
  Reviewed = 4,
  Approved = 5
}

export interface TestDto {
  id: string;
  specimenId: string;
  code: string;
  name: string;
  method: string;
  standard: string;
  status: TestStatus;
  assigneeId?: string;
  assignmentDate?: string;
  startDate?: string;
  completionDate?: string;
  estimatedDuration?: number;
  notes?: string;
  specimenCode?: string;
  specimenName?: string;
  creationTime: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
}

export interface CreateTestDto {
  specimenId: string;
  name: string;
  method: string;
  standard: string;
  assigneeId?: string;
  estimatedDuration?: number;
  notes?: string;
}

export interface UpdateTestDto {
  name: string;
  method: string;
  standard: string;
  status: TestStatus;
  assigneeId?: string;
  assignmentDate?: string;
  startDate?: string;
  completionDate?: string;
  estimatedDuration?: number;
  notes?: string;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}
