import {
  SpecimenTypeDto,
  SpecimenTypeWithIndicatorsDto,
  SpecimenTypeIndicatorDto,
  CreateUpdateSpecimenTypeDto,
  AddIndicatorsToSpecimenTypeDto,
  SampleTypeCategoryDto,
  CreateUpdateSampleTypeCategoryDto,
} from "../../../../services/masterDataService";

export interface SpecimenTypesTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface SpecimenTypesActions {
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

export interface SpecimenTypeIndicatorImportItem {
  rowNumber: number;
  indicatorName: string;
  indicatorId?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface SpecimenTypeImportPreviewGroup {
  categoryName: string;
  categoryId?: string;
  specimenTypeName: string;
  generatedCode?: string;
  isNew: boolean;
  existingId?: string;
  indicators: SpecimenTypeIndicatorImportItem[];
  isValid: boolean;
  errors: string[];
}

export interface SpecimenTypeImportPreviewDto {
  validationResult: ImportValidationResult;
  groups: SpecimenTypeImportPreviewGroup[];
  totalSpecimenTypes: number;
  newSpecimenTypes: number;
  updateSpecimenTypes: number;
  totalIndicators: number;
  errorFileBase64?: string;
  errorFileName?: string;
}

export interface GroupedSpecimenTypeData extends SpecimenTypeWithIndicatorsDto {
  key: string;
}

export type {
  SpecimenTypeDto,
  SpecimenTypeWithIndicatorsDto,
  SpecimenTypeIndicatorDto,
  CreateUpdateSpecimenTypeDto,
  AddIndicatorsToSpecimenTypeDto,
  SampleTypeCategoryDto,
  CreateUpdateSampleTypeCategoryDto,
};
