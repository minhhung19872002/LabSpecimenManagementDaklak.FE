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
