import { SpecimenStatus, SpecimenDto } from "../../../types/specimen";

export interface SpecimenListFilters {
  searchText: string;
  searchInput: string;
  statusFilter: SpecimenStatus | "all";
  typeFilter: string;
}

export interface SpecimenPagination {
  currentPage: number;
  pageSize: number;
}

export interface SpecimenModalState {
  isOpen: boolean;
  editingItem: SpecimenDto | null;
}

export interface SpecimenFormValues {
  testRequestId: string;
  specimens: SpecimenFormItem[];
  storageLocation?: string;
  storageCondition?: string;
  description?: string;
}

export interface SpecimenFormItem {
  code: string;
  receivedDate: any; // dayjs object
  name: string;
  type?: string;
  quantity: number;
  unit: string;
  status: SpecimenStatus;
}
