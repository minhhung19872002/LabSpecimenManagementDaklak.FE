import { SampleStatus } from "../../../../types/testRequest";
import dayjs from "dayjs";

// Thông tin phương pháp cho một chỉ tiêu
export interface IndicatorMethodInfo {
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  unitPrice: number;
  isActive: boolean;
}

// Key duy nhất cho mỗi lựa chọn: indicatorId_testMethodId
export type IndicatorMethodKey = `${string}_${string}`;

// Helper để tạo và parse IndicatorMethodKey
export const createIndicatorMethodKey = (indicatorId: string, testMethodId: string): IndicatorMethodKey =>
  `${indicatorId}_${testMethodId}` as IndicatorMethodKey;

export const parseIndicatorMethodKey = (key: IndicatorMethodKey): { indicatorId: string; testMethodId: string } => {
  const [indicatorId, testMethodId] = key.split('_');
  return { indicatorId, testMethodId };
};

export interface SampleFormData {
  key: string;
  id?: string;
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  indicatorIds: string[]; // deprecated, giữ để backward compatible
  indicatorMethods: IndicatorMethodKey[]; // NEW: array of "indicatorId_testMethodId"
}

export interface IndicatorDateInfo {
  transferDate?: dayjs.Dayjs;
  requestDate?: dayjs.Dayjs;
}

export interface LaboratoryAssignment {
  laboratoryId: string;
  laboratoryName: string;
  requestDate: dayjs.Dayjs;
}

export interface TestRequestFormContextValue {
  // Form state
  form: any;
  isEditMode: boolean;
  loading: boolean;
  loadingData: boolean;

  // Sample code prefix
  sampleCodePrefix: string;
  setSampleCodePrefix: (prefix: string) => void;

  // Status
  currentStatus: number | null;
  isFieldLocked: (fieldName: string) => boolean;
  isSamplesLocked: () => boolean;

  // Samples
  samples: SampleFormData[];
  setSamples: React.Dispatch<React.SetStateAction<SampleFormData[]>>;
  addSample: () => void;
  removeSample: (key: string) => void;
  updateSample: (key: string, field: keyof SampleFormData, value: any) => void;
  duplicateSample: (key: string) => void;

  // Master data
  indicatorGroups: any[];
  indicators: any[];
  storageLocations: any[];
  users: any[];
  organizations: any[];
  laboratories: any[];
  provinces: any[];
  wards: any[];
  setWards: React.Dispatch<React.SetStateAction<any[]>>;

  // Organization search
  organizationOptions: { value: string; label: string }[];
  organizationSearching: boolean;
  handleOrganizationSearch: (searchText: string) => void;
  handleOrganizationSelect: (value: string) => void;
  handlePhoneBlur: (e: React.FocusEvent<HTMLInputElement>) => void;

  // Costs
  totalSampleCost: number;
  sampleTypeTask: boolean;

  // Indicator modal
  indicatorModalVisible: boolean;
  setIndicatorModalVisible: (visible: boolean) => void;
  currentSampleKey: string | null;
  tempSelectedIndicators: string[];
  setTempSelectedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  selectedGroupFilter: string;
  setSelectedGroupFilter: (filter: string) => void;
  indicatorSearchText: string;
  setIndicatorSearchText: (text: string) => void;
  expandedGroups: string[];
  setExpandedGroups: React.Dispatch<React.SetStateAction<string[]>>;
  openIndicatorModal: (sampleKey: string) => void;
  handleIndicatorModalOk: () => void;
  handleIndicatorModalCancel: () => void;
  toggleIndicator: (indicatorId: string) => void;
  getIndicatorInfo: (indicatorId: string) => any;
  getFilteredIndicators: () => any[];

  // Group selector modal
  groupSelectorVisible: boolean;
  setGroupSelectorVisible: (visible: boolean) => void;
  groupSearchText: string;
  setGroupSearchText: (text: string) => void;
  expandedGroupsInSelector: string[];
  setExpandedGroupsInSelector: React.Dispatch<React.SetStateAction<string[]>>;
  getFilteredGroupsWithIndicators: () => any[];
  handleGroupSelect: (groupId: string) => void;

  // Indicator dates and checks
  selectedIndicatorDates: Record<string, IndicatorDateInfo>;
  setSelectedIndicatorDates: React.Dispatch<React.SetStateAction<Record<string, IndicatorDateInfo>>>;
  checkedIndicators: string[];
  setCheckedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  handleIndicatorDateChange: (indicatorId: string, field: "transferDate" | "requestDate", value: dayjs.Dayjs | null) => void;
  toggleCheckedIndicator: (indicatorId: string) => void;
  handleSelectAllIndicators: (checked: boolean) => void;

  // Laboratory modal
  laboratoryModalVisible: boolean;
  setLaboratoryModalVisible: (visible: boolean) => void;
  selectedLaboratoryId: string | null;
  setSelectedLaboratoryId: (id: string | null) => void;
  laboratoryRequestDate: dayjs.Dayjs | null;
  setLaboratoryRequestDate: (date: dayjs.Dayjs | null) => void;
  indicatorsToSend: string[];
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  setIndicatorLaboratoryMap: React.Dispatch<React.SetStateAction<Record<string, LaboratoryAssignment>>>;
  expandedLabGroups: string[];
  setExpandedLabGroups: React.Dispatch<React.SetStateAction<string[]>>;
  handleSendToLaboratory: () => void;
  handleConfirmSendToLaboratory: () => void;

  // Print barcode
  printBarcode: (sampleCode: string, sampleName: string) => void;

  // Navigation
  navigate: (path: string) => void;
}
