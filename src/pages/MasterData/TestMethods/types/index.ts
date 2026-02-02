import {
  TestMethodDto,
  TestMethodWithIndicatorsDto,
  TestMethodIndicatorDto,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  AddIndicatorsToTestMethodDto,
} from "../../../../services/masterDataService";

export interface TestMethodsTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface TestMethodsActions {
  handleCreate: () => void;
  handleDownloadTemplate: () => void;
  handleImport: () => void;
}

export interface GroupedTestMethodData extends TestMethodWithIndicatorsDto {
  key: string;
}

// Import types
export interface ImportRowError {
  rowNumber: number;
  columnName: string;
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

export interface TestMethodIndicatorImportItem {
  rowNumber: number;
  indicatorName: string;
  indicatorId?: string;
  specimenTypeName?: string;
  specimenTypeId?: string;
  unitPrice: number;
  isValid: boolean;
  errorMessage?: string;
}

export interface TestMethodImportPreviewGroup {
  testMethodName: string;
  formattedName?: string;
  description?: string;
  unit: string;
  isNew: boolean;
  existingId?: string;
  indicators: TestMethodIndicatorImportItem[];
}

export interface TestMethodImportPreviewDto {
  validationResult: ImportValidationResult;
  groups: TestMethodImportPreviewGroup[];
  totalTestMethods: number;
  newTestMethods: number;
  updateTestMethods: number;
  totalIndicators: number;
  errorFileBase64?: string;
  errorFileName?: string;
}

export interface ImportResultDto {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: ImportRowError[];
  message?: string;
}

export type {
  TestMethodDto,
  TestMethodWithIndicatorsDto,
  TestMethodIndicatorDto,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  AddIndicatorsToTestMethodDto,
};
