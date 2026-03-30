export interface UnitTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface UnitActions {
  handleCreate: () => void;
}

export type { UnitDto, CreateUpdateUnitDto } from "../../../../services/masterDataService";
