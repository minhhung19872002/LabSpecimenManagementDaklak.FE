import { api } from './api';

export interface ReportDto {
  id: string;
  reportNumber: string;
  title: string;
  testRequestId: string;
  testRequestNumber?: string;
  customerId?: string;
  customerName: string;
  specimenIds?: string;
  testIds?: string;
  specimenCodes?: string[];
  testCount?: number;
  status: ReportStatus;
  reportDate: string;
  issuedDate?: string;
  preparedById?: string;
  preparedByName?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedDate?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedDate?: string;
  qrCode?: string;
  pdfPath?: string;
  isEmailSent: boolean;
  emailSentDate?: string;
  notes?: string;
  creationTime: string;
  lastModificationTime?: string;
}

export enum ReportStatus {
  Draft = 0,
  PendingReview = 1,
  Reviewed = 2,
  Approved = 3,
  Issued = 4,
  Rejected = 5,
}

export interface CreateReportDto {
  title: string;
  testRequestId: string;
  customerId?: string;
  customerName: string;
  specimenIds?: string;
  testIds?: string;
  notes?: string;
}

export interface UpdateReportDto {
  title: string;
  customerId?: string;
  customerName: string;
  specimenIds?: string;
  testIds?: string;
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

const BASE_URL = '/api/v1/reports';

// Helper to convert params for API (ABP Framework uses SkipCount, MaxResultCount, Sorting)
const toApiParams = (params: PagedAndSortedResultRequestDto) => {
  const apiParams: Record<string, any> = {};
  if (params.skipCount !== undefined) apiParams.SkipCount = params.skipCount;
  if (params.maxResultCount !== undefined) apiParams.MaxResultCount = params.maxResultCount;
  if (params.sorting) apiParams.Sorting = params.sorting;
  return apiParams;
};

export interface ReviewReportDto {
  comments?: string;
}

export interface ApproveReportDto {
  comments?: string;
}

export interface RejectReportDto {
  reason: string;
}

export interface SendEmailDto {
  email: string;
}

export interface VerifyReportDto {
  isValid: boolean;
  reportNumber: string;
  title: string;
  customerName: string;
  status: ReportStatus;
  issuedDate?: string;
  message: string;
}

export const reportService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<ReportDto>> => {
    const response = await api.get<PagedResultDto<ReportDto>>(BASE_URL, { params: toApiParams(params) });
    return response.data;
  },

  get: async (id: string): Promise<ReportDto> => {
    const response = await api.get<ReportDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateReportDto): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: UpdateReportDto): Promise<ReportDto> => {
    const response = await api.put<ReportDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  submitForReview: async (id: string): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/submit`);
    return response.data;
  },

  review: async (id: string, data: ReviewReportDto = {}): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/review`, data);
    return response.data;
  },

  approve: async (id: string, data: ApproveReportDto = {}): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/approve`, data);
    return response.data;
  },

  reject: async (id: string, data: RejectReportDto): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/reject`, data);
    return response.data;
  },

  issue: async (id: string): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/issue`);
    return response.data;
  },

  generatePdf: async (id: string): Promise<{ pdfPath: string }> => {
    const response = await api.post<{ pdfPath: string }>(`${BASE_URL}/${id}/generate-pdf`);
    return response.data;
  },

  sendEmail: async (id: string, data: SendEmailDto): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/send-email`, data);
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/${id}/download`);
    return response.data;
  },

  /**
   * Export report as PDF file
   */
  exportPdf: async (id: string): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/${id}/pdf`);
    return response.data;
  },

  /**
   * Verify report by report number (public API for QR code verification)
   */
  verifyReport: async (reportNumber: string): Promise<VerifyReportDto> => {
    const response = await api.get<VerifyReportDto>(`${BASE_URL}/verify/${reportNumber}`);
    return response.data;
  },

  getByTestRequest: async (testRequestId: string): Promise<ReportDto[]> => {
    const response = await api.get<ReportDto[]>(`${BASE_URL}/by-test-request/${testRequestId}`);
    return response.data;
  },
};

export default reportService;
