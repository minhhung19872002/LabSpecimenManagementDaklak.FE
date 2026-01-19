import { api } from './api';

const BASE_URL = '/api/v1/import';

// ==================== DTOs ====================

export interface ImportResultDto {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: ImportErrorDto[];
  message: string;
}

export interface ImportErrorDto {
  row: number;
  column: string;
  field: string;
  errorMessage: string;
  value?: string;
}

export interface PreviewResultDto {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportErrorDto[];
  validData: any[];
}

// ==================== Import Validation ====================

export interface ImportRowError {
  rowNumber: number;
  columnName?: string;
  errorMessage: string;
  value?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportRowError[];
}

// ==================== Organization + TestRequest Import ====================

export interface OrganizationTestRequestPreviewItem {
  rowNumber: number;
  // Organization info
  organizationName: string;
  isNewOrganization: boolean;
  existingOrganizationId?: string;
  contactPerson: string;
  phone?: string;
  address: string;
  province: string;
  provinceCode?: string;
  ward: string;
  wardCode?: string;
  taxCode: string;
  // TestRequest info
  contractNumber?: string;
  isNewTestRequest: boolean;
  existingTestRequestId?: string;
  sampleName?: string;
  sampleCode?: string;
  sampleStatus?: string;
  // Indicators
  indicatorNames: string[];
  indicatorIds: string[];
  invalidIndicators: string[];
  // Validation
  isValid: boolean;
  errors: string[];
}

export interface OrganizationTestRequestImportPreviewDto {
  validationResult: ImportValidationResult;
  items: OrganizationTestRequestPreviewItem[];
  // Summary
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newOrganizations: number;
  updateOrganizations: number;
  totalTestRequests: number;
  newTestRequests: number;
  updateTestRequests: number;
  totalIndicators: number;
  // Error file
  errorFileBase64?: string;
  errorFileName?: string;
}

// ==================== Test Requests ====================

export const importService = {
  /**
   * Preview test requests from Excel file (validate without importing)
   */
  previewTestRequests: async (file: File): Promise<PreviewResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<PreviewResultDto>(`${BASE_URL}/test-requests/preview`, formData);
    return response.data;
  },

  /**
   * Import test requests from Excel file
   */
  importTestRequests: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/test-requests`, formData);
    return response.data;
  },

  /**
   * Download import template for test requests
   */
  downloadTestRequestsTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/test-requests/template`);
    return response.data;
  },

  // ==================== Specimens ====================

  /**
   * Preview specimens from Excel file (validate without importing)
   */
  previewSpecimens: async (file: File): Promise<PreviewResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<PreviewResultDto>(`${BASE_URL}/specimens/preview`, formData);
    return response.data;
  },

  /**
   * Import specimens from Excel file
   */
  importSpecimens: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/specimens`, formData);
    return response.data;
  },

  /**
   * Download import template for specimens
   */
  downloadSpecimensTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/specimens/template`);
    return response.data;
  },

  // ==================== Customers ====================

  /**
   * Preview customers from Excel file (validate without importing)
   */
  previewCustomers: async (file: File): Promise<PreviewResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<PreviewResultDto>(`${BASE_URL}/customers/preview`, formData);
    return response.data;
  },

  /**
   * Import customers from Excel file
   */
  importCustomers: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/customers`, formData);
    return response.data;
  },

  /**
   * Download import template for customers
   */
  downloadCustomersTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/customers/template`);
    return response.data;
  },

  // ==================== Test Methods ====================

  /**
   * Preview test methods from Excel file (validate without importing)
   */
  previewTestMethods: async (file: File): Promise<PreviewResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<PreviewResultDto>(`${BASE_URL}/test-methods/preview`, formData);
    return response.data;
  },

  /**
   * Import test methods from Excel file
   */
  importTestMethods: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/test-methods`, formData);
    return response.data;
  },

  /**
   * Download import template for test methods
   */
  downloadTestMethodsTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/test-methods/template`);
    return response.data;
  },

  // ==================== Organization + TestRequest (Legacy Data) ====================

  /**
   * Preview Organization + TestRequest import (validate without importing)
   */
  previewOrganizationTestRequests: async (file: File): Promise<OrganizationTestRequestImportPreviewDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<OrganizationTestRequestImportPreviewDto>(`${BASE_URL}/organization-test-requests/preview`, formData);
    return response.data;
  },

  /**
   * Import Organization + TestRequest from Excel file
   */
  importOrganizationTestRequests: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/organization-test-requests`, formData);
    return response.data;
  },

  /**
   * Download import template for Organization + TestRequest
   */
  downloadOrganizationTestRequestTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/organization-test-requests/template`);
    return response.data;
  },
};

// ==================== Helper Functions ====================

/**
 * Helper function to download blob as file
 */
export const downloadBlobAsFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default importService;
