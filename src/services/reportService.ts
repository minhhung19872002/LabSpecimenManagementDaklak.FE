import api from './api';
import {
  ReportDto,
  CreateReportDto,
  UpdateReportDto,
  PagedResultDto,
  PagedAndSortedResultRequestDto
} from '../types/report';

const BASE_URL = '/api/app/report';

export const reportService = {
  getList: async (params: PagedAndSortedResultRequestDto): Promise<PagedResultDto<ReportDto>> => {
    const response = await api.get<PagedResultDto<ReportDto>>(BASE_URL, { params });
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

  // Generate QR code for the report
  generateQRCode: async (id: string): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/generate-qr-code`);
    return response.data;
  },

  // Approve the report
  approve: async (id: string): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/approve`);
    return response.data;
  },

  // Send report via email
  sendReport: async (id: string): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/send`);
    return response.data;
  },

  // Cancel the report
  cancel: async (id: string): Promise<ReportDto> => {
    const response = await api.post<ReportDto>(`${BASE_URL}/${id}/cancel`);
    return response.data;
  },

  // Export report as PDF
  exportToPdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/${id}/export-pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get reports by Test Request ID
  getByTestRequestId: async (
    testRequestId: string,
    params: PagedAndSortedResultRequestDto
  ): Promise<PagedResultDto<ReportDto>> => {
    const response = await api.get<PagedResultDto<ReportDto>>(
      `${BASE_URL}/by-test-request/${testRequestId}`,
      { params }
    );
    return response.data;
  }
};

export default reportService;
