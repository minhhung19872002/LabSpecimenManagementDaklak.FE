import {
  StandardDto,
  StandardWithIndicatorsDto,
  StandardIndicatorDto,
  CreateStandardDto,
  UpdateStandardDto,
  AddIndicatorsToStandardDto,
  UpdateStandardIndicatorDto,
} from "../../../../services/masterDataService";

export interface StandardsTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface StandardsActions {
  handleCreate: () => void;
  handleDownloadTemplate: () => void;
  handleImport: () => void;
}

export interface GroupedStandardData extends StandardWithIndicatorsDto {
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

export interface StandardIndicatorImportItem {
  rowNumber: number;
  specimenTypeName: string;
  specimenTypeId?: string;
  indicatorName: string;
  indicatorId?: string;
  subIndicatorName?: string;
  subIndicatorId?: string;
  testMethodName: string;
  testMethodId?: string;
  unit: string;
  comparisonOperator: string;
  allowedLimit?: string;
  lowerOperator?: string;
  lowerLimit?: string;
  upperOperator?: string;
  upperLimit?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface StandardImportPreviewGroup {
  standardName: string;
  isNew: boolean;
  existingId?: string;
  indicators: StandardIndicatorImportItem[];
}

export interface StandardImportPreviewDto {
  validationResult: ImportValidationResult;
  groups: StandardImportPreviewGroup[];
  totalStandards: number;
  newStandards: number;
  updateStandards: number;
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
  errorFileBase64?: string;
  errorFileName?: string;
}

export type {
  StandardDto,
  StandardWithIndicatorsDto,
  StandardIndicatorDto,
  CreateStandardDto,
  UpdateStandardDto,
  AddIndicatorsToStandardDto,
  UpdateStandardIndicatorDto,
};
