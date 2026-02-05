import {
  TestResultValueDto,
  TestResultValueIndicatorDto,
  CreateUpdateTestResultValueDto,
  AddIndicatorsDto,
  BatchRemoveIndicatorsDto,
} from "../../../../services/testResultValueService";

export interface TestResultValuesTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface TestResultValuesActions {
  handleCreate: () => void;
  handleDownloadTemplate: () => void;
  handleImport: () => void;
}

export interface GroupedTestResultValueData extends TestResultValueDto {
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

export interface TestResultValueIndicatorImportItem {
  rowNumber: number;
  specimenTypeName?: string;
  specimenTypeId?: string;
  indicatorName?: string;
  indicatorId?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface TestResultValueImportPreviewGroup {
  resultName: string;
  description?: string;
  isNew: boolean;
  existingId?: string;
  indicators: TestResultValueIndicatorImportItem[];
}

export interface TestResultValueImportPreviewDto {
  validationResult: ImportValidationResult;
  groups: TestResultValueImportPreviewGroup[];
  totalResults: number;
  newResults: number;
  updateResults: number;
  totalIndicators: number;
  errorFileBase64?: string;
  errorFileName?: string;
}

export type {
  TestResultValueDto,
  TestResultValueIndicatorDto,
  CreateUpdateTestResultValueDto,
  AddIndicatorsDto,
  BatchRemoveIndicatorsDto,
};
