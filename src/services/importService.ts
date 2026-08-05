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

// ==================== Location Code Override (FE-resolved) ====================

export interface LocationCodeOverride {
  rowNumber: number;
  provinceCode?: string | null;
  wardCode?: string | null;
}

// ==================== Organization Import (CS/DN) ====================

export interface OrganizationTestRequestPreviewItem {
  rowNumber: number;
  // Organization info
  organizationName: string;
  isNewOrganization: boolean;
  existingOrganizationId?: string;
  contactPerson: string;
  phone?: string;
  secondaryPhone?: string;
  address: string;
  province: string;
  provinceCode?: string;
  ward: string;
  wardCode?: string;
  taxCode: string;
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
  // Error file
  errorFileBase64?: string;
  errorFileName?: string;
}

// ==================== Specimen for TestRequest Import ====================

export interface SpecimenIndicatorImportItem {
  rowNumber: number;
  indicatorName: string;
  indicatorId?: string;
  testMethodId?: string;
  testMethodName?: string;
  specimenTypeId?: string; // Specimen type ID (resolved from master data)
  isValid: boolean;
  errorMessage?: string;
}

export interface SpecimenImportPreviewItem {
  sampleName: string;
  specimenTypeName?: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  statusText?: string;
  indicators: SpecimenIndicatorImportItem[];
  isValid: boolean;
  errors: string[];
}

export interface SpecimenForTestRequestImportPreviewDto {
  validationResult: ImportValidationResult;
  specimens: SpecimenImportPreviewItem[];
  // Summary
  totalRows: number;
  totalSpecimens: number;
  validSpecimens: number;
  totalIndicators: number;
  // Error file
  errorFileBase64?: string;
  errorFileName?: string;
}

// ==================== IndicatorGroup + Indicator Import ====================

export interface IndicatorGroupImportPreviewItem {
  rowNumber: number;
  // IndicatorGroup info
  indicatorGroupName: string;
  isNewIndicatorGroup: boolean;
  existingIndicatorGroupId?: string;
  // Department info
  departmentName?: string;
  departmentId?: string;
  isDepartmentInvalid: boolean;
  // Indicator info
  indicatorName: string;
  formattedIndicatorName?: string;
  isNewIndicator: boolean;
  existingIndicatorId?: string;
  // Sub-Indicator info
  subIndicatorName?: string;
  formattedSubIndicatorName?: string;
  isNewSubIndicator: boolean;
  existingSubIndicatorId?: string;
  hasSubIndicator: boolean;
  // Specimen/TestMethod info
  specimenTypeName: string;
  specimenTypeId?: string;
  isSpecimenTypeInvalid: boolean;
  testMethodName: string;
  testMethodId?: string;
  isTestMethodInvalid: boolean;
  unit?: string;
  unitPrice: number;
  isNewMethodLink: boolean;
  isSubcontract: boolean;
  // Validation
  isValid: boolean;
  errors: string[];
}

export interface IndicatorGroupImportPreviewDto {
  validationResult: ImportValidationResult;
  items: IndicatorGroupImportPreviewItem[];
  // Summary
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newIndicatorGroups: number;
  updateIndicatorGroups: number;
  newIndicators: number;
  updateIndicators: number;
  newSubIndicators: number;
  updateSubIndicators: number;
  newMethodLinks: number;
  updateMethodLinks: number;
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

  /**
   * Download import template for specimens in TestRequestForm
   * Template columns: Tên mẫu, Loại mẫu, Địa chỉ lấy mẫu, Lượng mẫu, Tình trạng mẫu, Chỉ tiêu kiểm nghiệm
   */
  downloadSpecimensForTestRequestTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/specimens-for-test-request/template`);
    return response.data;
  },

  /**
   * Preview specimens for TestRequest from Excel file (validate without importing)
   * Groups rows by SampleName, validates Indicators exist
   */
  previewSpecimensForTestRequest: async (file: File): Promise<SpecimenForTestRequestImportPreviewDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<SpecimenForTestRequestImportPreviewDto>(`${BASE_URL}/specimens-for-test-request/preview`, formData);
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

  // ==================== Warehouse Import ====================

  downloadWarehouseTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/warehouses/template`);
    return response.data;
  },

  previewWarehouses: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<any>(`${BASE_URL}/warehouses/preview`, formData);
    return response.data;
  },

  importWarehouses: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/warehouses`, formData);
    return response.data;
  },

  // ==================== Manufacturer Import ====================

  downloadManufacturerTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/manufacturers/template`);
    return response.data;
  },

  previewManufacturers: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<any>(`${BASE_URL}/manufacturers/preview`, formData);
    return response.data;
  },

  importManufacturers: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/manufacturers`, formData);
    return response.data;
  },

  // ==================== Organization Import (CS/DN) ====================

  /**
   * Preview Organization import (validate without importing)
   */
  previewOrganizationTestRequests: async (file: File): Promise<OrganizationTestRequestImportPreviewDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<OrganizationTestRequestImportPreviewDto>(`${BASE_URL}/organization-test-requests/preview`, formData);
    return response.data;
  },

  /**
   * Import Organizations from Excel file
   */
  importOrganizationTestRequests: async (file: File, codeOverrides?: LocationCodeOverride[]): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    if (codeOverrides?.length) {
      formData.append('codeOverrides', JSON.stringify(codeOverrides));
    }
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/organization-test-requests`, formData);
    return response.data;
  },

  /**
   * Download import template for Organization (CS/DN)
   */
  downloadOrganizationTestRequestTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/organization-test-requests/template`);
    return response.data;
  },

  // ==================== IndicatorGroup + Indicator ====================

  /**
   * Preview IndicatorGroup + Indicator import (validate without importing)
   */
  previewIndicatorGroups: async (file: File): Promise<IndicatorGroupImportPreviewDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<IndicatorGroupImportPreviewDto>(`${BASE_URL}/indicator-groups/preview`, formData);
    return response.data;
  },

  /**
   * Import IndicatorGroup + Indicator from Excel file
   */
  importIndicatorGroups: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/indicator-groups`, formData);
    return response.data;
  },

  /**
   * Download import template for IndicatorGroup + Indicator
   */
  downloadIndicatorGroupTemplate: async (): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/indicator-groups/template`);
    return response.data;
  },

  // ==================== Notes ====================

  /**
   * Preview Notes import (validate without importing)
   */
  previewNotes: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<any>(`${BASE_URL}/notes/preview`, formData);
    return response.data;
  },

  /**
   * Import Notes from Excel file
   */
  importNotes: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/notes`, formData);
    return response.data;
  },

  /**
   * Download import template for Notes
   */
  downloadNoteTemplate: () => {
    const url = `${import.meta.env.VITE_API_URL || ''}${BASE_URL}/notes/template`;
    window.open(url, '_blank');
  },

  // ==================== TestResultValues ====================

  /**
   * Preview TestResultValues import (validate without importing)
   */
  previewTestResultValues: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<any>(`${BASE_URL}/test-result-values/preview`, formData);
    return response.data;
  },

  /**
   * Import TestResultValues from Excel file
   */
  importTestResultValues: async (file: File): Promise<ImportResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<ImportResultDto>(`${BASE_URL}/test-result-values`, formData);
    return response.data;
  },

  /**
   * Download import template for TestResultValues
   */
  downloadTestResultValueTemplate: () => {
    const url = `${import.meta.env.VITE_API_URL || ''}${BASE_URL}/test-result-values/template`;
    window.open(url, '_blank');
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
