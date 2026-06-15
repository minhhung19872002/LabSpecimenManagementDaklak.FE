import {
  DepartmentDto,
  SpecimenTypeDto,
  TestMethodDto,
  StorageLocationDto,
  CustomerDto,
  LaboratoryDto,
  WarehouseDto,
  MasterDataStatisticsDto,
} from "../../../../services/masterDataService";
import { UserLookupDto } from "../../../../services/userService";

// Unified type for all master data items
export type MasterDataItem =
  | DepartmentDto
  | SpecimenTypeDto
  | TestMethodDto
  | StorageLocationDto
  | CustomerDto
  | LaboratoryDto
  | WarehouseDto;

export interface MasterDataState {
  activeCategory: string;
  data: Record<string, MasterDataItem[]>;
  totalCount: Record<string, number>;
  pagination: Record<string, { current: number; pageSize: number }>;
  loading: Record<string, boolean>;
  loadedCategories: Set<string>;
  statistics: MasterDataStatisticsDto | null;
  statisticsLoading: boolean;
  error: string | null;
  searchText: string;
  isModalOpen: boolean;
  editingItem: MasterDataItem | null;
  modalLoading: boolean;
  importModalOpen: boolean;
  downloadingTemplate: boolean;
  users: UserLookupDto[];
}

export type {
  DepartmentDto,
  SpecimenTypeDto,
  TestMethodDto,
  StorageLocationDto,
  CustomerDto,
  LaboratoryDto,
  WarehouseDto,
  MasterDataStatisticsDto,
  UserLookupDto,
};
