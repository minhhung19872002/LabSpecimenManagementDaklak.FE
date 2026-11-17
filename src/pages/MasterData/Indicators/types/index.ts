import type { UploadFile } from "antd/es/upload/interface";
import {
  IndicatorGroupDto,
  IndicatorDto,
  ImportIndicatorsResultDto,
  ImportIndicatorGroupsResultDto,
} from "../../../../services/masterDataService";

export interface IndicatorsTabProps {
  onDataChange?: () => void;
}

export interface IndicatorsActions {
  handleBulkCreate: () => void;
  handleCreateGroup: () => void;
  handleDownloadTemplate: () => void;
  handleImport: () => void;
  handleDownloadAdminTemplate: () => Promise<void>;
  handleAdminImport: () => void;
}

export interface GroupedIndicatorData extends IndicatorGroupDto {
  key: string;
  indicators: IndicatorDto[];
}

export interface IndicatorsState {
  groups: IndicatorGroupDto[];
  indicators: IndicatorDto[];
  loading: boolean;
  searchText: string;
  expandedRowKeys: string[];
  selectedRowKeys: string[];
  batchLoading: boolean;
}

export interface ModalState {
  groupModalOpen: boolean;
  indicatorModalOpen: boolean;
  bulkModalOpen: boolean;
  importModalOpen: boolean;
  importGroupModalOpen: boolean;
  editingGroup: IndicatorGroupDto | null;
  editingIndicator: IndicatorDto | null;
  modalLoading: boolean;
  importResult: ImportIndicatorsResultDto | null;
  importGroupResult: ImportIndicatorGroupsResultDto | null;
  fileList: UploadFile[];
  groupFileList: UploadFile[];
}

export type {
  IndicatorGroupDto,
  IndicatorDto,
  ImportIndicatorsResultDto,
  ImportIndicatorGroupsResultDto,
};
