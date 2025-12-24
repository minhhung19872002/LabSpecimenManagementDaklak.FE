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

export interface GroupedTestMethodData extends TestMethodWithIndicatorsDto {
  key: string;
}

export type {
  TestMethodDto,
  TestMethodWithIndicatorsDto,
  TestMethodIndicatorDto,
  CreateTestMethodDto,
  UpdateTestMethodDto,
  AddIndicatorsToTestMethodDto,
};
