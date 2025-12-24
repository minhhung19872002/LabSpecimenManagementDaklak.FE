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

export interface GroupedStandardData extends StandardWithIndicatorsDto {
  key: string;
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
