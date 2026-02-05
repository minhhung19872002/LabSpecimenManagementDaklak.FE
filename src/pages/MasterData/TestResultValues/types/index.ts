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
}

export interface GroupedTestResultValueData extends TestResultValueDto {
  key: string;
}

export type {
  TestResultValueDto,
  TestResultValueIndicatorDto,
  CreateUpdateTestResultValueDto,
  AddIndicatorsDto,
  BatchRemoveIndicatorsDto,
};
