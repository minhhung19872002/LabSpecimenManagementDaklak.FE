export interface SampleConditionTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface SampleConditionActions {
  handleCreate: () => void;
}

export type { SampleConditionDto, CreateUpdateSampleConditionDto } from "../../../../services/masterDataService";
