export interface TestRequestDto {
  id: string;
  requestNumber: string;
  requestDate: string;
  customerName: string;
  customerInfo?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  status: TestRequestStatus;
  expectedCompletionDate?: string;
  subcontractor?: string;
  // Audit fields from ABP Framework
  isDeleted?: boolean;
  deleterId?: string | null;
  deletionTime?: string | null;
  lastModificationTime?: string | null;
  lastModifierId?: string | null;
  creationTime?: string;
  creatorId?: string | null;
}

export interface CreateTestRequestDto {
  requestDate: string;
  customerName: string;
  customerInfo?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  expectedCompletionDate?: string;
  subcontractor?: string;
}

export interface UpdateTestRequestDto {
  requestDate: string;
  customerName: string;
  customerInfo?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  status: TestRequestStatus;
  expectedCompletionDate?: string;
  subcontractor?: string;
}

export enum TestRequestStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3
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
