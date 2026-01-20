/**
 * Types for importing specimens from Excel in TestRequestForm
 */

// Row data từ Excel
export interface SpecimenExcelRow {
  "Tên mẫu": string;
  "Loại mẫu"?: string;
  "Địa chỉ lấy mẫu"?: string;
  "Lượng mẫu"?: string;
  "Tình trạng mẫu"?: string;
  "Chỉ tiêu kiểm nghiệm": string;
}

// Preview item sau khi validate - đại diện cho 1 specimen
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

// Indicator item trong specimen
export interface SpecimenIndicatorImportItem {
  rowNumber: number;
  indicatorName: string;
  indicatorId?: string;
  testMethodId?: string; // Default test method
  testMethodName?: string;
  isValid: boolean;
  errorMessage?: string;
}

// Preview result - kết quả sau khi parse và validate
export interface SpecimenImportPreviewResult {
  isValid: boolean;
  totalRows: number;
  totalSpecimens: number;
  totalIndicators: number;
  validSpecimens: number;
  specimens: SpecimenImportPreviewItem[];
  errors: ImportRowError[];
}

// Import row error
export interface ImportRowError {
  rowNumber: number;
  columnName: string;
  errorMessage: string;
  value?: string;
}
