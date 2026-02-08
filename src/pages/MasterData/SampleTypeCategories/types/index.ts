import { SampleTypeCategoryDto, SpecimenTypeDto } from "../../../../services/masterDataService";

export interface SampleTypeCategoriesTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface SampleTypeCategoriesActions {
  handleCreate: () => void;
  handleDownloadTemplate: () => void;
  handleImport: () => void;
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

export interface SampleTypeCategoryImportPreviewItem {
  rowNumber: number;
  name: string;
  description?: string;
  isNew: boolean;
  existingId?: string;
  isValid: boolean;
  errors: string[];
}

export interface SampleTypeCategoryImportPreviewDto {
  validationResult: ImportValidationResult;
  items: SampleTypeCategoryImportPreviewItem[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newCategories: number;
  updateCategories: number;
  errorFileBase64?: string;
  errorFileName?: string;
}

export interface GroupedCategoryData extends SampleTypeCategoryDto {
  key: string;
  specimenTypes: SpecimenTypeWithKey[];
}

export interface SpecimenTypeWithKey extends SpecimenTypeDto {
  key: string;
}

export type { SampleTypeCategoryDto } from "../../../../services/masterDataService";
