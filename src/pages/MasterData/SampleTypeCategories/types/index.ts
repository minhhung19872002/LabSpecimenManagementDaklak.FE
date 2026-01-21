import { SampleTypeCategoryDto, SpecimenTypeDto } from "../../../../services/masterDataService";

export interface SampleTypeCategoriesTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface GroupedCategoryData extends SampleTypeCategoryDto {
  key: string;
  specimenTypes: SpecimenTypeWithKey[];
}

export interface SpecimenTypeWithKey extends SpecimenTypeDto {
  key: string;
}

export type { SampleTypeCategoryDto } from "../../../../services/masterDataService";
