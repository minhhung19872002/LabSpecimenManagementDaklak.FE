export interface ReportDto {
  id: string;
  reportNumber: string;
  reportDate: string;
  testRequestId: string;
  qrCode?: string;
  status: ReportStatus;
  approvedById?: string | null;
  approvedDate?: string | null;
  sentDate?: string | null;
  recipientEmail?: string;
  recipientName?: string;
  standards?: string;
  conclusion?: string;
  notes?: string;
  testResultIds: string[];
  // Audit fields from ABP Framework
  isDeleted?: boolean;
  deleterId?: string | null;
  deletionTime?: string | null;
  lastModificationTime?: string | null;
  lastModifierId?: string | null;
  creationTime?: string;
  creatorId?: string | null;
}

export interface CreateReportDto {
  testRequestId: string;
  reportDate: string;
  recipientEmail?: string;
  recipientName?: string;
  standards?: string;
  conclusion?: string;
  notes?: string;
  testResultIds: string[];
}

export interface UpdateReportDto {
  reportDate: string;
  recipientEmail?: string;
  recipientName?: string;
  standards?: string;
  conclusion?: string;
  notes?: string;
  testResultIds: string[];
}

export enum ReportStatus {
  Draft = 0,
  Approved = 1,
  Sent = 2,
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
