import { SampleStatus } from "../../../../types/testRequest";
import { IndicatorApprovalStatus } from "../../../../types/laboratoryTask";
import dayjs from "dayjs";

// Attachment info for sample images
export interface AttachmentInfo {
  id?: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  url: string;
  isOffline?: boolean; // True if file is stored locally (pending upload)
}

// Thông tin phương pháp cho một chỉ tiêu
export interface IndicatorMethodInfo {
  testMethodId: string;
  testMethodCode: string;
  testMethodName: string;
  testMethodFormattedName?: string;  // Tên phương pháp có định dạng HTML
  unitPrice: number;
  isActive: boolean;
  parentIndicatorId?: string;  // ID của chỉ tiêu cha nếu là sub-indicator
  // Specimen type info - cùng chỉ tiêu + phương pháp có thể có nhiều nền mẫu khác nhau
  specimenTypeId?: string;
  specimenTypeCode?: string;
  specimenTypeName?: string;
  isSubcontract?: boolean;
}

export const PENDING_TEST_METHOD_ID = "null";
export const PENDING_TEST_METHOD_NAME = "—";

export const isPendingTestMethodId = (testMethodId?: string | null): boolean =>
  !testMethodId || testMethodId === PENDING_TEST_METHOD_ID;

// Key duy nhất cho mỗi lựa chọn: indicatorId_testMethodId_specimenTypeId
// specimenTypeId có thể là "null" nếu không có nền mẫu
export type IndicatorMethodKey = `${string}_${string}_${string}`;

// Helper để tạo và parse IndicatorMethodKey
export const createIndicatorMethodKey = (
  indicatorId: string,
  testMethodId: string,
  specimenTypeId?: string
): IndicatorMethodKey =>
  `${indicatorId}_${testMethodId}_${specimenTypeId || 'null'}` as IndicatorMethodKey;

export const parseIndicatorMethodKey = (key: IndicatorMethodKey): {
  indicatorId: string;
  testMethodId: string;
  specimenTypeId: string | null;
} => {
  const parts = key.split('_');
  // Handle case where key has 2 parts (old format) or 3 parts (new format)
  if (parts.length === 2) {
    // Old format: indicatorId_testMethodId
    return { indicatorId: parts[0], testMethodId: parts[1], specimenTypeId: null };
  }
  // New format: indicatorId_testMethodId_specimenTypeId
  const [indicatorId, testMethodId, specimenTypeId] = parts;
  return { indicatorId, testMethodId, specimenTypeId: specimenTypeId === 'null' ? null : specimenTypeId };
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
  specimenTypeId?: string;
  specimenTypeName?: string; // For AutoComplete - will be resolved to ID on save
  indicatorIds: string[]; // deprecated, giữ để backward compatible
  indicatorMethods: IndicatorMethodKey[]; // NEW: array of "indicatorId_testMethodId"
  // Attachments (images)
  attachments: AttachmentInfo[];
  // Shared sample - Mẫu chung (có chỉ tiêu ở cả Lab Vi Sinh và Lab Hóa)
  isSharedSample?: boolean;
}

export interface IndicatorDateInfo {
  transferDate?: dayjs.Dayjs;
  requestDate?: dayjs.Dayjs;
}

export interface LaboratoryAssignment {
  laboratoryId: string;
  laboratoryName: string;
  requestDate: dayjs.Dayjs;
  /** Trạng thái duyệt của chỉ tiêu (null nếu mới thêm, chưa lưu) */
  approvalStatus?: IndicatorApprovalStatus;
  /** Đã gửi đến QLKT (tồn tại LaboratoryTaskIndicator) */
  isSentToQLKT?: boolean;
  /** Đã gửi tới khoa phòng (sentToDepartment trên TestRequestSampleIndicator) */
  sentToDepartment?: boolean;
}

/**
 * Kiểm tra chỉ tiêu đã gửi tới khoa phòng (locked, không cho sửa/xóa)
 * Lock khi: có approvalStatus HOẶC isSentToQLKT = true HOẶC sentToDepartment = true (đã lưu với lab assignment)
 */
export const isIndicatorLocked = (labInfo?: LaboratoryAssignment | null): boolean => {
  if (!labInfo) return false;
  if (labInfo.approvalStatus !== undefined && labInfo.approvalStatus !== null) return true;
  if (labInfo.isSentToQLKT === true) return true;
  if (labInfo.sentToDepartment === true) return true;
  return false;
};

// Map để lưu TestRequestSampleIndicator.id cho mỗi indicator trong sample
// Key format: "sampleKey_indicatorMethodKey" -> TestRequestSampleIndicator.id
export type IndicatorIdMap = Record<string, string>;

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
  specimenTypes: any[];
  provinces: any[];
  wards: any[];
  setWards: React.Dispatch<React.SetStateAction<any[]>>;

  // Organization search
  organizationOptions: { value: string; label: string }[];
  organizationSearching: boolean;
  handleOrganizationSearch: (searchText: string) => void;
  handleOrganizationSelect: (value: string) => void;
  handlePhoneBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handlePhoneEnter: () => void;

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
  printBarcode: (sampleInfo: { sampleCode: string; sampleName: string; samplingAddress?: string; sampleQuantity?: string; storageLocation?: string; }) => void;

  // Navigation
  navigate: (path: string) => void;
}
