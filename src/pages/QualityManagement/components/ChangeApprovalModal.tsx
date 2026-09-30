import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  Button,
  Spin,
  Typography,
  Row,
  Col,
  Card,
  Tag,
  Space,
  Alert,
  Input,
  message,
  Table,
  Image,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowDownOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  FileImageOutlined,
} from '../../../components/common/Icon';
import dayjs from 'dayjs';
import {
  TestRequestChangeHistoryDto,
  ChangeApprovalStatus,
} from '../../../types/testRequest';
import { testRequestService } from '../../../services/testRequestService';
import { qualityManagementService } from '../../../services/qualityManagementService';
import { userService, UserLookupDto } from '../../../services/userService';
import {
  QualityManagementTaskDto,
  QualityTaskType,
  ChangeApprovalBatchDto,
} from '../../../types/qualityManagement';
import fileService from '../../../services/fileService';
import { IndicatorName } from '../../../components/common';

const { Text } = Typography;
const { TextArea } = Input;

interface ChangeApprovalModalProps {
  visible: boolean;
  taskId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  /** Chế độ chỉ xem - ẩn các button Phê duyệt/Từ chối */
  readonly?: boolean;
  /** Dữ liệu batch được truyền trực tiếp (từ HistoryModal) - không cần gọi API */
  batchData?: ChangeApprovalBatchDto;
  /** Contract number để hiển thị khi dùng batchData */
  contractNumber?: string;
}

interface FieldChange {
  fieldName: string;
  oldValue: any;
  newValue: any;
}

interface IndicatorChange {
  type: 'add' | 'update' | 'delete';
  indicator: any;
  oldIndicator?: any;
  sampleCode?: string;
}

interface AttachmentInfo {
  fileId: string;
  fileName: string;
  fileSize: number;
}

interface SampleChange {
  type: 'add' | 'update' | 'delete';
  sampleCode: string;
  oldSampleCode?: string;
  sampleName?: string;
  oldSampleName?: string;
  oldSample?: any;
  newSample?: any;
  indicators: IndicatorChange[];
  samplingAddress?: string;
  oldSamplingAddress?: string;
  sampleQuantity?: string;
  oldSampleQuantity?: string;
  storageLocation?: string;
  oldStorageLocation?: string;
  specimenTypeId?: string;
  oldSpecimenTypeId?: string;
  specimenTypeName?: string;
  oldSpecimenTypeName?: string;
  status?: number;
  oldStatus?: number;
  statusText?: string;
  oldStatusText?: string;
  processingStatus?: string;
  oldProcessingStatus?: string;
  notes?: string;
  oldNotes?: string;
  totalCost: number;
  oldTotalCost?: number;
  // Attachments
  attachments?: AttachmentInfo[];
  oldAttachments?: AttachmentInfo[];
}

// Field labels mapping (support both camelCase and PascalCase)
const FIELD_LABELS: Record<string, string> = {
  // camelCase
  contractNumber: 'Số hợp đồng',
  contractDate: 'Ngày hợp đồng',
  customerName: 'Tên khách hàng',
  address: 'Địa chỉ',
  taxCode: 'Mã số thuế',
  contactPerson: 'Người liên hệ',
  phone: 'Số điện thoại',
  email: 'Email',
  provinceCode: 'Tỉnh/Thành phố',
  province: 'Tỉnh/Thành phố',
  districtCode: 'Quận/Huyện',
  district: 'Quận/Huyện',
  wardCode: 'Phường/Xã',
  ward: 'Phường/Xã',
  notes: 'Ghi chú',
  expectedCompletionDate: 'Ngày hoàn thành dự kiến',
  resultDeliveryDate: 'Ngày trả kết quả',
  totalCost: 'Tổng chi phí',
  totalCostInWords: 'Tổng chi phí bằng chữ',
  methodWestHighlandInstitute: 'PP Viện Tây Nguyên',
  methodCustomer: 'PP Khách hàng',
  methodCustomerDetail: 'Chi tiết PP khách hàng',
  resultLanguage: 'Ngôn ngữ kết quả',
  resultCopyCount: 'Số bản sao',
  separatePassedResults: 'Tách KQ đạt',
  conformityDeclaration: 'Công bố hợp quy',
  otherRequirements: 'Yêu cầu khác',
  subContract: 'Hợp đồng phụ',
  samplingRequirement: 'Yêu cầu lấy mẫu',
  deliveryDirectPickup: 'Nhận trực tiếp',
  deliveryPostal: 'Gửi bưu điện',
  returnStoredSample: 'Trả mẫu lưu',
  sampleTypeService: 'Mẫu dịch vụ',
  sampleTypeContract: 'Mẫu hợp đồng',
  sampleTypeTask: 'Mẫu nhiệm vụ',
  sampleTypeSubContract: 'Mẫu thầu phụ',
  sampleStorage: 'Lưu mẫu',
  supervisorId: 'Người phụ trách',
  directorId: 'Giám đốc',
  sentToAccounting: 'Đã gửi kế toán',
  paymentReceived: 'Đã nhận thanh toán',
  sentToDepartment: 'Đã gửi khoa phòng',
  resultReturned: 'Đã trả kết quả',
  agreeTerms: 'Đồng ý điều khoản',
  receiptNumber: 'Số biên lai',
  changeRequest: 'Yêu cầu thay đổi',
  // PascalCase (from C# backend)
  ContractNumber: 'Số hợp đồng',
  ContractDate: 'Ngày hợp đồng',
  CustomerName: 'Tên khách hàng',
  Address: 'Địa chỉ',
  TaxCode: 'Mã số thuế',
  ContactPerson: 'Người liên hệ',
  Phone: 'Số điện thoại',
  ProvinceCode: 'Tỉnh/Thành phố',
  Province: 'Tỉnh/Thành phố',
  DistrictCode: 'Quận/Huyện',
  District: 'Quận/Huyện',
  WardCode: 'Phường/Xã',
  Ward: 'Phường/Xã',
  Notes: 'Ghi chú',
  ExpectedCompletionDate: 'Ngày hoàn thành dự kiến',
  ResultDeliveryDate: 'Ngày trả kết quả',
  TotalCost: 'Tổng chi phí',
  TotalCostInWords: 'Tổng chi phí bằng chữ',
  MethodWestHighlandInstitute: 'PP Viện Tây Nguyên',
  MethodCustomer: 'PP Khách hàng',
  MethodCustomerDetail: 'Chi tiết PP khách hàng',
  ResultLanguage: 'Ngôn ngữ kết quả',
  ResultCopyCount: 'Số bản sao',
  SeparatePassedResults: 'Tách KQ đạt',
  ConformityDeclaration: 'Công bố hợp quy',
  OtherRequirements: 'Yêu cầu khác',
  SubContract: 'Hợp đồng phụ',
  SamplingRequirement: 'Yêu cầu lấy mẫu',
  DeliveryDirectPickup: 'Nhận trực tiếp',
  DeliveryPostal: 'Gửi bưu điện',
  ReturnStoredSample: 'Trả mẫu lưu',
  SampleTypeService: 'Mẫu dịch vụ',
  SampleTypeContract: 'Mẫu hợp đồng',
  SampleTypeTask: 'Mẫu nhiệm vụ',
  SampleTypeSubContract: 'Mẫu thầu phụ',
  SampleStorage: 'Lưu mẫu',
  SupervisorId: 'Người phụ trách',
  DirectorId: 'Giám đốc',
  SentToAccounting: 'Đã gửi kế toán',
  PaymentReceived: 'Đã nhận thanh toán',
  SentToDepartment: 'Đã gửi khoa phòng',
  ResultReturned: 'Đã trả kết quả',
  AgreeTerms: 'Đồng ý điều khoản',
  ReceiptNumber: 'Số biên lai',
  ChangeRequest: 'Yêu cầu thay đổi',
};

// Checkbox fields (both cases)
const CHECKBOX_FIELDS = [
  'methodWestHighlandInstitute', 'MethodWestHighlandInstitute',
  'methodCustomer', 'MethodCustomer',
  'separatePassedResults', 'SeparatePassedResults',
  'deliveryDirectPickup', 'DeliveryDirectPickup',
  'deliveryPostal', 'DeliveryPostal',
  'returnStoredSample', 'ReturnStoredSample',
  'sampleTypeService', 'SampleTypeService',
  'sampleTypeContract', 'SampleTypeContract',
  'sampleTypeTask', 'SampleTypeTask',
  'sampleTypeSubContract', 'SampleTypeSubContract',
  'sentToAccounting', 'SentToAccounting',
  'paymentReceived', 'PaymentReceived',
  'sentToDepartment', 'SentToDepartment',
  'resultReturned', 'ResultReturned',
  'agreeTerms', 'AgreeTerms',
];

// Date fields (both cases)
const DATE_FIELDS = [
  'expectedCompletionDate', 'ExpectedCompletionDate',
  'resultDeliveryDate', 'ResultDeliveryDate'
];

// DateTime fields (show time as well)
const DATETIME_FIELDS = [
  'contractDate', 'ContractDate',
];

const ChangeApprovalModal: React.FC<ChangeApprovalModalProps> = ({
  visible,
  taskId,
  onClose,
  onUpdated,
  readonly = false,
  batchData,
  contractNumber,
}) => {
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [task, setTask] = useState<QualityManagementTaskDto | null>(null);
  const [pendingChanges, setPendingChanges] = useState<TestRequestChangeHistoryDto[]>([]);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [users, setUsers] = useState<UserLookupDto[]>([]);
  // State for attachment preview modal
  const [previewImages, setPreviewImages] = useState<AttachmentInfo[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');

  // Check if using batchData mode (data passed directly instead of loading from API)
  const isBatchDataMode = !!batchData;

  // Load task and pending changes
  const loadData = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      // Load task first to get testRequestId
      const taskData = await qualityManagementService.get(taskId);
      setTask(taskData);

      // Load change history from TestRequest
      const [history, usersData] = await Promise.all([
        testRequestService.getChangeHistory(taskData.testRequestId),
        userService.getLookup(),
      ]);

      // In readonly mode, show all history for this task's batch
      // In edit mode, only show pending changes
      if (readonly) {
        // Get the batch/creation time of changes related to this task
        // Filter history by task's creation time range (same batch)
        setPendingChanges(history);
      } else {
        const pending = history.filter(h => h.approvalStatus === ChangeApprovalStatus.Pending);
        setPendingChanges(pending);
      }
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Không thể tải thông tin thay đổi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If batchData is provided, convert it to pendingChanges format
    if (visible && isBatchDataMode && batchData) {
      // Convert batchData.fields to TestRequestChangeHistoryDto format
      const changes: TestRequestChangeHistoryDto[] = batchData.fields.map(field => ({
        id: field.id,
        testRequestId: '',
        fieldName: field.fieldName || '',
        oldValue: field.oldValue,
        newValue: field.newValue,
        reason: '',
        creationTime: batchData.creationTime,
        creatorId: batchData.creatorId,
        creatorName: batchData.creatorName,
        approvalStatus: batchData.status as any,
        approvalDate: batchData.approvalDate,
        approvedById: batchData.approvedById,
        approvedByName: batchData.approvedByName,
        rejectionReason: batchData.rejectionReason,
      }));
      setPendingChanges(changes);
      return;
    }

    if (visible && taskId && !isBatchDataMode) {
      loadData();
    } else if (!visible) {
      setTask(null);
      setPendingChanges([]);
    }
  }, [visible, taskId, isBatchDataMode, batchData]);

  // Parse changes
  const { fieldChanges, sampleChanges } = useMemo(() => {
    const fields: FieldChange[] = [];
    const samples: SampleChange[] = [];

    // Helper functions
    const getVal = (obj: any, key: string) => {
      if (!obj) return undefined;
      const lowerKey = key.toLowerCase();
      for (const k of Object.keys(obj)) {
        if (k.toLowerCase() === lowerKey) return obj[k];
      }
      return undefined;
    };
    const normalize = (v: any) => (v === null || v === undefined) ? '' : String(v);

    pendingChanges.forEach(change => {
      if (change.fieldName === 'Samples') {
        // Parse sample changes
        try {
          const oldSamples = change.oldValue ? JSON.parse(change.oldValue) : [];
          const newSamples = change.newValue ? JSON.parse(change.newValue) : [];

          // Helper to get sample fields (handle both cases)
          const getIndicators = (sample: any) => sample.indicators || sample.Indicators || [];
          const getAttachments = (sample: any) => sample.attachments || sample.Attachments || [];
          const getSampleCode = (sample: any) => sample.sampleCode || sample.SampleCode || '-';
          const getSampleName = (sample: any) => sample.sampleName || sample.SampleName || '';
          const getSampleId = (sample: any) => sample.id || sample.Id;
          const getSamplingAddress = (sample: any) => sample.samplingAddress || sample.SamplingAddress || '';
          const getSampleQuantity = (sample: any) => sample.sampleQuantity || sample.SampleQuantity || '';
          const getStorageLocation = (sample: any) => sample.storageLocation || sample.StorageLocation || '';
          const getSpecimenTypeId = (sample: any) => sample.specimenTypeId || sample.SpecimenTypeId || '';
          const getSpecimenTypeName = (sample: any) => sample.specimenTypeName || sample.SpecimenTypeName || '';
          const getStatus = (sample: any) => sample.status ?? sample.Status ?? 0;
          const getStatusText = (sample: any) => sample.statusText || sample.StatusText || '';
          const getProcessingStatus = (sample: any) => sample.processingStatus || sample.ProcessingStatus || '';
          const getNotes = (sample: any) => sample.notes || sample.Notes || '';

          // Calculate total cost for a sample
          const calcTotalCost = (sample: any) => {
            const inds = getIndicators(sample);
            return inds.reduce((sum: number, ind: any) => {
              const price = ind.unitPrice ?? ind.UnitPrice ?? 0;
              return sum + price;
            }, 0);
          };

          // Build map only for samples with valid IDs
          const oldSampleMap = new Map<string, any>();
          oldSamples.forEach((s: any) => {
            const id = getSampleId(s);
            if (id) oldSampleMap.set(id, s);
          });

          const newSampleMap = new Map<string, any>();
          newSamples.forEach((s: any) => {
            const id = getSampleId(s);
            if (id) newSampleMap.set(id, s);
          });

          // Helper to get indicator ID
          const getIndId = (ind: any) => ind.id || ind.Id;

          // Find added samples (new samples without ID, or ID not in old)
          newSamples.forEach((s: any) => {
            const id = getSampleId(s);
            const isNewSample = !id || !oldSampleMap.has(id);
            if (isNewSample) {
              const indicatorChanges: IndicatorChange[] = getIndicators(s).map((ind: any) => ({
                type: 'add' as const,
                indicator: ind,
                sampleCode: getSampleCode(s)
              }));

              samples.push({
                type: 'add',
                sampleCode: getSampleCode(s),
                sampleName: getSampleName(s),
                newSample: s,
                indicators: indicatorChanges,
                samplingAddress: getSamplingAddress(s),
                sampleQuantity: getSampleQuantity(s),
                storageLocation: getStorageLocation(s),
                specimenTypeId: getSpecimenTypeId(s),
                specimenTypeName: getSpecimenTypeName(s),
                status: getStatus(s),
                statusText: getStatusText(s),
                processingStatus: getProcessingStatus(s),
                notes: getNotes(s),
                totalCost: calcTotalCost(s),
                attachments: getAttachments(s).map((a: any) => ({
                  fileId: a.fileId || a.FileId,
                  fileName: a.fileName || a.FileName,
                  fileSize: a.fileSize || a.FileSize || 0,
                })),
              });
            }
          });

          // Find deleted samples
          oldSamples.forEach((s: any) => {
            const id = getSampleId(s);
            if (id && !newSampleMap.has(id)) {
              const indicatorChanges: IndicatorChange[] = getIndicators(s).map((ind: any) => ({
                type: 'delete' as const,
                indicator: ind,
                sampleCode: getSampleCode(s)
              }));

              samples.push({
                type: 'delete',
                sampleCode: getSampleCode(s),
                sampleName: getSampleName(s),
                oldSample: s,
                indicators: indicatorChanges,
                samplingAddress: getSamplingAddress(s),
                sampleQuantity: getSampleQuantity(s),
                storageLocation: getStorageLocation(s),
                specimenTypeId: getSpecimenTypeId(s),
                specimenTypeName: getSpecimenTypeName(s),
                status: getStatus(s),
                statusText: getStatusText(s),
                processingStatus: getProcessingStatus(s),
                notes: getNotes(s),
                totalCost: calcTotalCost(s),
                oldAttachments: getAttachments(s).map((a: any) => ({
                  fileId: a.fileId || a.FileId,
                  fileName: a.fileName || a.FileName,
                  fileSize: a.fileSize || a.FileSize || 0,
                })),
              });
            }
          });

          // Find updated samples
          newSamples.forEach((newS: any) => {
            const id = getSampleId(newS);
            if (!id) return;
            const oldS = oldSampleMap.get(id);
            if (!oldS) return;

            const newInds = getIndicators(newS);
            const oldInds = getIndicators(oldS);

            // Build maps by ID
            const oldIndMap = new Map<string, any>();
            oldInds.forEach((i: any) => {
              const indId = getIndId(i);
              if (indId) oldIndMap.set(indId, i);
            });

            const newIndMap = new Map<string, any>();
            newInds.forEach((i: any) => {
              const indId = getIndId(i);
              if (indId) newIndMap.set(indId, i);
            });

            const indicatorChanges: IndicatorChange[] = [];

            // Added indicators
            newInds.forEach((newInd: any) => {
              const indId = getIndId(newInd);
              if (!indId || !oldIndMap.has(indId)) {
                indicatorChanges.push({ type: 'add', indicator: newInd, sampleCode: getSampleCode(newS) });
              }
            });

            // Deleted indicators
            oldInds.forEach((oldInd: any) => {
              const indId = getIndId(oldInd);
              if (indId && !newIndMap.has(indId)) {
                indicatorChanges.push({ type: 'delete', indicator: oldInd, sampleCode: getSampleCode(newS) });
              }
            });

            // Updated indicators
            newInds.forEach((newInd: any) => {
              const indId = getIndId(newInd);
              if (indId && oldIndMap.has(indId)) {
                const oldInd = oldIndMap.get(indId);
                const fieldsToCompare = ['unitPrice', 'notes', 'testMethodId', 'laboratoryId'];
                const hasChange = fieldsToCompare.some(f =>
                  normalize(getVal(oldInd, f)) !== normalize(getVal(newInd, f))
                );
                if (hasChange) {
                  indicatorChanges.push({ type: 'update', indicator: newInd, oldIndicator: oldInd, sampleCode: getSampleCode(newS) });
                }
              }
            });

            // Check if sample itself has changes or has indicator changes
            const sampleFieldsToCompare = ['samplingAddress', 'sampleQuantity', 'storageLocation', 'specimenTypeId', 'status', 'sampleName', 'sampleCode', 'statusText', 'processingStatus', 'notes'];
            const hasSampleChange = sampleFieldsToCompare.some(f =>
              normalize(getVal(oldS, f)) !== normalize(getVal(newS, f))
            );

            // Check attachments change
            const oldAttachmentsJson = JSON.stringify(getAttachments(oldS).map((a: any) => a.fileId || a.FileId).sort());
            const newAttachmentsJson = JSON.stringify(getAttachments(newS).map((a: any) => a.fileId || a.FileId).sort());
            const hasAttachmentsChange = oldAttachmentsJson !== newAttachmentsJson;

            if (indicatorChanges.length > 0 || hasSampleChange || hasAttachmentsChange) {
              samples.push({
                type: 'update',
                sampleCode: getSampleCode(newS),
                oldSampleCode: getSampleCode(oldS),
                sampleName: getSampleName(newS),
                oldSampleName: getSampleName(oldS),
                oldSample: oldS,
                newSample: newS,
                indicators: indicatorChanges,
                samplingAddress: getSamplingAddress(newS),
                oldSamplingAddress: getSamplingAddress(oldS),
                sampleQuantity: getSampleQuantity(newS),
                oldSampleQuantity: getSampleQuantity(oldS),
                storageLocation: getStorageLocation(newS),
                oldStorageLocation: getStorageLocation(oldS),
                specimenTypeId: getSpecimenTypeId(newS),
                oldSpecimenTypeId: getSpecimenTypeId(oldS),
                specimenTypeName: getSpecimenTypeName(newS),
                oldSpecimenTypeName: getSpecimenTypeName(oldS),
                status: getStatus(newS),
                oldStatus: getStatus(oldS),
                statusText: getStatusText(newS),
                oldStatusText: getStatusText(oldS),
                processingStatus: getProcessingStatus(newS),
                oldProcessingStatus: getProcessingStatus(oldS),
                notes: getNotes(newS),
                oldNotes: getNotes(oldS),
                totalCost: calcTotalCost(newS),
                oldTotalCost: calcTotalCost(oldS),
                attachments: getAttachments(newS).map((a: any) => ({
                  fileId: a.fileId || a.FileId,
                  fileName: a.fileName || a.FileName,
                  fileSize: a.fileSize || a.FileSize || 0,
                })),
                oldAttachments: getAttachments(oldS).map((a: any) => ({
                  fileId: a.fileId || a.FileId,
                  fileName: a.fileName || a.FileName,
                  fileSize: a.fileSize || a.FileSize || 0,
                })),
              });
            }
          });
        } catch (e) {
          console.error('Error parsing sample changes:', e);
        }
      } else if (change.fieldName !== 'Snapshot') {
        // Regular field change
        fields.push({
          fieldName: change.fieldName,
          oldValue: change.oldValue,
          newValue: change.newValue,
        });
      }
    });

    return { fieldChanges: fields, sampleChanges: samples };
  }, [pendingChanges]);

  // Format value for display (case insensitive field matching)
  const formatValue = (value: any, fieldName: string): string => {
    if (value === null || value === undefined || value === '') return '-';

    const lowerField = fieldName.toLowerCase();

    // DateTime fields (show date and time)
    if (DATETIME_FIELDS.some(f => f.toLowerCase() === lowerField)) {
      const d = dayjs(value);
      return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : value;
    }

    // Date fields (show date only)
    if (DATE_FIELDS.some(f => f.toLowerCase() === lowerField)) {
      const d = dayjs(value);
      return d.isValid() ? d.format('DD/MM/YYYY') : value;
    }

    // Checkbox fields - handle boolean, "True", "False", "true", "false"
    if (CHECKBOX_FIELDS.some(f => f.toLowerCase() === lowerField)) {
      const strVal = String(value).toLowerCase();
      return value === true || strVal === 'true' ? 'Có' : 'Không';
    }

    // ResultLanguage - support both numeric and string values
    if (lowerField === 'resultlanguage') {
      const map: Record<string, string> = {
        '0': 'Tiếng Việt', 'vietnamese': 'Tiếng Việt',
        '1': 'Tiếng Anh', 'english': 'Tiếng Anh',
        '2': 'Song ngữ', 'vietnameseandenglish': 'Song ngữ'
      };
      return map[String(value).toLowerCase()] || map[String(value)] || value;
    }

    // SamplingRequirement
    if (lowerField === 'samplingrequirement') {
      const map: Record<string, string> = { '0': 'Phòng TN lấy mẫu', '1': 'Khách hàng lấy mẫu' };
      return map[String(value)] || value;
    }

    // SampleStorage
    if (lowerField === 'samplestorage') {
      const map: Record<string, string> = { '0': 'Không', '1': 'Có' };
      return map[String(value)] || value;
    }

    // TotalCost
    if (lowerField === 'totalcost') {
      return new Intl.NumberFormat('vi-VN').format(Number(value)) + ' đ';
    }

    // SupervisorId, DirectorId - convert ID to name
    if (lowerField === 'supervisorid' || lowerField === 'directorid') {
      const user = users.find(u => u.id === value);
      return user ? (user.name || value) : value;
    }

    return String(value);
  };

  // Render field change - compact style
  const renderFieldChange = (change: FieldChange) => {
    const label = FIELD_LABELS[change.fieldName] || change.fieldName;
    const isCheckbox = CHECKBOX_FIELDS.some(f => f.toLowerCase() === change.fieldName.toLowerCase());
    const oldVal = formatValue(change.oldValue, change.fieldName);
    const newVal = formatValue(change.newValue, change.fieldName);

    if (isCheckbox) {
      const wasChecked = change.oldValue === true || String(change.oldValue).toLowerCase() === 'true';
      const isChecked = change.newValue === true || String(change.newValue).toLowerCase() === 'true';

      return (
        <div key={change.fieldName} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, minWidth: 100 }}>{label}:</Text>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '1px 6px',
            backgroundColor: '#fff1f0',
            borderRadius: 3,
            textDecoration: 'line-through',
            color: '#ff4d4f',
            fontSize: 12
          }}>
            {wasChecked ? <CheckSquareOutlined /> : <BorderOutlined />}
          </span>
          <ArrowDownOutlined style={{ color: '#1890ff', transform: 'rotate(-90deg)', fontSize: 10 }} />
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '1px 6px',
            backgroundColor: '#f6ffed',
            borderRadius: 3,
            color: '#52c41a',
            fontWeight: 500,
            fontSize: 12
          }}>
            {isChecked ? <CheckSquareOutlined /> : <BorderOutlined />}
          </span>
        </div>
      );
    }

    return (
      <div key={change.fieldName} style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, minWidth: 100, flexShrink: 0 }}>{label}:</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Text delete style={{ color: '#ff4d4f', backgroundColor: '#fff1f0', padding: '1px 4px', borderRadius: 3, fontSize: 12 }}>
              {oldVal}
            </Text>
            <ArrowDownOutlined style={{ color: '#1890ff', transform: 'rotate(-90deg)', fontSize: 10 }} />
            <Text strong style={{ color: '#52c41a', backgroundColor: '#f6ffed', padding: '1px 4px', borderRadius: 3, fontSize: 12 }}>
              {newVal}
            </Text>
          </div>
        </div>
      </div>
    );
  };

  // Render change value with old/new comparison
  const renderChangeValue = (label: string, newVal: string | undefined, oldVal: string | undefined, isDelete: boolean = false, isAdd: boolean = false) => {
    const hasChange = oldVal !== undefined && oldVal !== newVal;

    if (isDelete) {
      return (
        <div style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 11, marginRight: 4 }}>{label}:</Text>
          <Text delete type="secondary" style={{ fontSize: 12 }}>{newVal || '-'}</Text>
        </div>
      );
    }

    if (isAdd) {
      return (
        <div style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 11, marginRight: 4 }}>{label}:</Text>
          <Text style={{ fontSize: 12, color: '#52c41a', fontWeight: 500 }}>{newVal || '-'}</Text>
        </div>
      );
    }

    if (hasChange) {
      return (
        <div style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 11, marginRight: 4 }}>{label}:</Text>
          <Text delete type="secondary" style={{ fontSize: 11, marginRight: 4 }}>{oldVal || '-'}</Text>
          <ArrowDownOutlined style={{ color: '#1890ff', transform: 'rotate(-90deg)', fontSize: 9, marginRight: 4 }} />
          <Text style={{ fontSize: 12, color: '#52c41a', fontWeight: 500 }}>{newVal || '-'}</Text>
        </div>
      );
    }

    return null; // Don't show unchanged fields
  };

  // Render sample changes with expandable table
  const renderSampleChanges = () => {
    if (sampleChanges.length === 0) return null;

    const totalIndicatorChanges = sampleChanges.reduce((sum, s) => sum + s.indicators.length, 0);

    // Table columns for samples
    const columns = [
      {
        title: '',
        dataIndex: 'type',
        width: 70,
        render: (type: string) => {
          if (type === 'add') return <Tag color="success" icon={<PlusOutlined />}>Thêm</Tag>;
          if (type === 'delete') return <Tag color="error" icon={<DeleteOutlined />}>Xóa</Tag>;
          return <Tag color="warning" icon={<EditOutlined />}>Sửa</Tag>;
        }
      },
      {
        title: 'Mã mẫu',
        dataIndex: 'sampleCode',
        width: 120,
        render: (code: string, record: SampleChange) => {
          if (record.type === 'delete') {
            return <Text strong delete type="secondary">{code}</Text>;
          }
          if (record.type === 'add') {
            return <Text strong style={{ color: '#52c41a' }}>{code}</Text>;
          }
          if (record.oldSampleCode && record.oldSampleCode !== code) {
            return (
              <span>
                <Text delete type="secondary" style={{ fontSize: 11 }}>{record.oldSampleCode}</Text>
                <ArrowDownOutlined style={{ color: '#1890ff', transform: 'rotate(-90deg)', fontSize: 9, margin: '0 4px' }} />
                <Text strong style={{ color: '#52c41a' }}>{code}</Text>
              </span>
            );
          }
          return <Text strong>{code}</Text>;
        }
      },
      {
        title: 'Tên mẫu',
        dataIndex: 'sampleName',
        render: (name: string, record: SampleChange) => {
          if (record.type === 'delete') {
            return <Text delete type="secondary">{name || '-'}</Text>;
          }
          if (record.type === 'add') {
            return <Text style={{ color: '#52c41a', fontWeight: 500 }}>{name || '-'}</Text>;
          }
          if (record.oldSampleName && record.oldSampleName !== name) {
            return (
              <span>
                <Text delete type="secondary" style={{ fontSize: 11 }}>{record.oldSampleName || '-'}</Text>
                <ArrowDownOutlined style={{ color: '#1890ff', transform: 'rotate(-90deg)', fontSize: 9, margin: '0 4px' }} />
                <Text style={{ color: '#52c41a', fontWeight: 500 }}>{name || '-'}</Text>
              </span>
            );
          }
          return <Text>{name || '-'}</Text>;
        }
      },
      {
        title: 'Chỉ tiêu',
        dataIndex: 'indicators',
        width: 80,
        align: 'center' as const,
        render: (inds: IndicatorChange[]) => inds.length > 0 ? <Tag color="blue">{inds.length}</Tag> : null
      },
      {
        title: 'Đơn giá',
        dataIndex: 'totalCost',
        width: 140,
        align: 'right' as const,
        render: (cost: number, record: SampleChange) => {
          const formatted = new Intl.NumberFormat('vi-VN').format(cost);
          const oldFormatted = record.oldTotalCost !== undefined
            ? new Intl.NumberFormat('vi-VN').format(record.oldTotalCost)
            : null;

          if (record.type === 'delete') {
            return <Text delete type="secondary">{formatted}đ</Text>;
          }
          if (record.type === 'add') {
            return <Text style={{ color: '#52c41a', fontWeight: 500 }}>{formatted}đ</Text>;
          }
          if (oldFormatted && oldFormatted !== formatted) {
            return (
              <span>
                <Text delete type="secondary" style={{ fontSize: 11 }}>{oldFormatted}đ</Text>
                <ArrowDownOutlined style={{ color: '#1890ff', transform: 'rotate(-90deg)', fontSize: 9, margin: '0 4px' }} />
                <Text style={{ color: '#52c41a', fontWeight: 500 }}>{formatted}đ</Text>
              </span>
            );
          }
          return <Text>{formatted}đ</Text>;
        }
      },
    ];

    // Expanded row render
    const expandedRowRender = (sample: SampleChange) => (
      <div style={{ padding: '8px 16px', backgroundColor: '#fafafa' }}>
        {/* Sample info changes */}
        <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px dashed #e8e8e8' }}>
          <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>Thông tin mẫu:</Text>
          <Row gutter={16}>
            <Col span={12}>
              {renderChangeValue('Tình trạng mẫu', sample.statusText, sample.oldStatusText, sample.type === 'delete', sample.type === 'add')}
              {renderChangeValue('Trạng thái xử lý', sample.processingStatus, sample.oldProcessingStatus, sample.type === 'delete', sample.type === 'add')}
              {renderChangeValue('Địa chỉ lấy mẫu', sample.samplingAddress, sample.oldSamplingAddress, sample.type === 'delete', sample.type === 'add')}
            </Col>
            <Col span={12}>
              {renderChangeValue('Loại mẫu', sample.specimenTypeName, sample.oldSpecimenTypeName, sample.type === 'delete', sample.type === 'add')}
              {renderChangeValue('Lượng mẫu', sample.sampleQuantity, sample.oldSampleQuantity, sample.type === 'delete', sample.type === 'add')}
              {renderChangeValue('Vị trí lưu mẫu', sample.storageLocation, sample.oldStorageLocation, sample.type === 'delete', sample.type === 'add')}
              {renderChangeValue('Ghi chú', sample.notes, sample.oldNotes, sample.type === 'delete', sample.type === 'add')}
            </Col>
          </Row>
        </div>

        {/* Attachments changes */}
        {(() => {
          const attachments = sample.attachments || [];
          const oldAttachments = sample.oldAttachments || [];
          const hasAttachmentChanges = sample.type === 'add' || sample.type === 'delete' ||
            JSON.stringify(attachments.map(a => a.fileId).sort()) !== JSON.stringify(oldAttachments.map(a => a.fileId).sort());

          if (!hasAttachmentChanges && attachments.length === 0 && oldAttachments.length === 0) return null;

          // Tìm attachments thêm mới và xóa
          const oldFileIds = new Set(oldAttachments.map(a => a.fileId));
          const newFileIds = new Set(attachments.map(a => a.fileId));
          const addedAttachments = attachments.filter(a => !oldFileIds.has(a.fileId));
          const removedAttachments = oldAttachments.filter(a => !newFileIds.has(a.fileId));

          if (sample.type !== 'add' && sample.type !== 'delete' && addedAttachments.length === 0 && removedAttachments.length === 0) return null;

          // Helper to render image thumbnails with +N button
          const renderImageThumbnails = (
            images: AttachmentInfo[],
            type: 'add' | 'delete',
            label?: string
          ) => {
            if (images.length === 0) return null;
            const maxDisplay = 2;
            const displayImages = images.slice(0, maxDisplay);
            const remainingCount = images.length - maxDisplay;

            const borderColor = type === 'add' ? '#52c41a' : '#ff4d4f';
            const bgColor = type === 'add' ? '#f6ffed' : '#fff1f0';

            return (
              <div style={{ marginBottom: 8 }}>
                {label && (
                  <Text type="secondary" style={{ fontSize: 11, marginRight: 8, display: 'block', marginBottom: 4 }}>
                    <Tag color={type === 'add' ? 'success' : 'error'} style={{ marginRight: 4 }}>
                      {type === 'add' ? <PlusOutlined /> : <DeleteOutlined />}
                    </Tag>
                    {label}:
                  </Text>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Image.PreviewGroup>
                    {displayImages.map((att, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: 60,
                          height: 60,
                          borderRadius: 4,
                          overflow: 'hidden',
                          border: `2px solid ${borderColor}`,
                          backgroundColor: bgColor,
                        }}
                      >
                        <Image
                          src={fileService.getFileUrl(att.fileId)}
                          alt={att.fileName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: type === 'delete' ? 0.5 : 1,
                          }}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlJREFUaN7t2D0KwjAYBuDXohvg4uTq4OLm5ubk4OLm5uLg4OYJPIGbJ/AEnkB3cXAQBwfBwcVBcHDw+0FSNNSS9k9S3g9CIW3zPCVJm1QKJZGsEIBYmm3bFwCqpNsHKqqqrgLwqJBe0zStaLfbu0aj0R1F0bNOq9VKAhAL53D4FRhj0Ol0ekulEkwTIE9zuHGO43gwTXMAQNUJcBWApmkaOL9Wq/GZGONzSAIA1DCsEJ7nfep0On46k/B9PwGgRvrYP0RnAZjcgGlCZAG4AkB3MBjANE2oqvo+BqABQKPb7QIA6AOJ+P4fEonE2wiABiZwA9M0EYYh4vH4WxTwPiMB0IvH4zFOnU4nqSgKDg4OcHJyggcA0hYAwLt2u/0CwMXFRRydnZ3h8vJSxEYiALJxMhqN+AMAYDAYgKIoLC8v4+joiB8RSdkbO4gCANcAuL29RXAJ+EfxCsm1Ye4EAAAAAElFTkSuQmCC"
                        />
                        {type === 'delete' && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(255, 77, 79, 0.3)',
                            }}
                          >
                            <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </Image.PreviewGroup>
                  {remainingCount > 0 && (
                    <div
                      onClick={() => {
                        setPreviewImages(images);
                        setPreviewTitle(`${type === 'add' ? 'Thêm' : 'Xóa'} - ${sample.sampleCode}`);
                        setPreviewVisible(true);
                      }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 4,
                        border: `2px dashed ${borderColor}`,
                        backgroundColor: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = type === 'add' ? '#d9f7be' : '#ffccc7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = bgColor;
                      }}
                    >
                      <Text strong style={{ color: borderColor, fontSize: 14 }}>
                        +{remainingCount}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px dashed #e8e8e8' }}>
              <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                <FileImageOutlined style={{ marginRight: 4 }} />
                Hình ảnh đính kèm:
              </Text>

              {sample.type === 'add' ? (
                // Mẫu mới - hiển thị tất cả attachments là thêm mới
                attachments.length > 0 ? (
                  renderImageThumbnails(attachments, 'add')
                ) : (
                  <Text type="secondary" style={{ fontSize: 11 }}>Không có hình ảnh</Text>
                )
              ) : sample.type === 'delete' ? (
                // Mẫu bị xóa - hiển thị tất cả attachments là bị xóa
                oldAttachments.length > 0 ? (
                  renderImageThumbnails(oldAttachments, 'delete')
                ) : (
                  <Text type="secondary" style={{ fontSize: 11 }}>Không có hình ảnh</Text>
                )
              ) : (
                // Mẫu được update - hiển thị thay đổi
                <div>
                  {renderImageThumbnails(addedAttachments, 'add', 'Thêm')}
                  {renderImageThumbnails(removedAttachments, 'delete', 'Xóa')}
                </div>
              )}
            </div>
          );
        })()}

        {/* Indicators list */}
        {sample.indicators.length > 0 && (
          <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>Danh sách chỉ tiêu:</Text>
        )}
        {sample.indicators.map((ind, indIdx) => {
          const indCode = ind.indicator?.indicatorCode || ind.indicator?.IndicatorCode || '-';
          const indName = ind.indicator?.indicatorName || ind.indicator?.IndicatorName || '-';
          const indFormattedName = ind.indicator?.indicatorFormattedName || ind.indicator?.IndicatorFormattedName;
          const methodName = ind.indicator?.testMethodName || ind.indicator?.TestMethodName ||
                            ind.indicator?.testMethodCode || ind.indicator?.TestMethodCode || '-';
          const price = ind.indicator?.unitPrice ?? ind.indicator?.UnitPrice ?? 0;
          const formattedPrice = new Intl.NumberFormat('vi-VN').format(price);

          const oldMethodName = ind.oldIndicator?.testMethodName || ind.oldIndicator?.TestMethodName ||
                               ind.oldIndicator?.testMethodCode || ind.oldIndicator?.TestMethodCode;
          const oldPrice = ind.oldIndicator?.unitPrice ?? ind.oldIndicator?.UnitPrice;

          const tagStyle = { marginRight: 4, fontSize: 10, lineHeight: '16px', padding: '0 4px' };
          const indTypeTag = ind.type === 'add'
            ? <Tag color="success" style={tagStyle}>A</Tag>
            : ind.type === 'delete'
            ? <Tag color="error" style={tagStyle}>D</Tag>
            : <Tag color="warning" style={tagStyle}>U</Tag>;

          const rowStyle: React.CSSProperties = ind.type === 'delete'
            ? { backgroundColor: '#fff1f0', padding: '6px 8px', marginBottom: 4, borderRadius: 4 }
            : ind.type === 'add'
            ? { backgroundColor: '#f6ffed', padding: '6px 8px', marginBottom: 4, borderRadius: 4 }
            : { backgroundColor: '#fffbe6', padding: '6px 8px', marginBottom: 4, borderRadius: 4 };

          const textStyle: React.CSSProperties = ind.type === 'delete'
            ? { textDecoration: 'line-through', color: '#999' }
            : ind.type === 'add'
            ? { color: '#52c41a', fontWeight: 500 }
            : {};

          return (
            <div key={`ind-${indIdx}`} style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    {indTypeTag}
                    <Text strong style={{ ...textStyle, fontSize: 12 }}>{indCode}</Text>
                    <span style={{ ...textStyle, marginLeft: 8, fontSize: 12 }}><IndicatorName name={indName} formattedName={indFormattedName} /></span>
                  </div>
                  <div style={{ marginLeft: 28 }}>
                    {ind.type === 'update' && oldMethodName && oldMethodName !== methodName ? (
                      <div style={{ fontSize: 11 }}>
                        <Text type="secondary">PP thử: </Text>
                        <Text delete type="secondary">{oldMethodName}</Text>
                        <ArrowDownOutlined style={{ color: '#1890ff', transform: 'rotate(-90deg)', fontSize: 9, margin: '0 4px' }} />
                        <Text style={{ color: '#52c41a' }}>{methodName}</Text>
                      </div>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 11 }}>PP thử: <span style={textStyle}>{methodName}</span></Text>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  {ind.type === 'update' && oldPrice !== undefined && oldPrice !== price ? (
                    <div>
                      <Text delete type="secondary" style={{ fontSize: 11 }}>
                        {new Intl.NumberFormat('vi-VN').format(oldPrice)}đ
                      </Text>
                      <br />
                      <Text style={{ color: '#52c41a', fontWeight: 500 }}>{formattedPrice}đ</Text>
                    </div>
                  ) : (
                    <Text style={{ ...textStyle, fontWeight: 500 }}>{formattedPrice}đ</Text>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

    return (
      <Card
        className="quality-change-sample-card"
        title={
          <Space>
            <span>Thay đổi mẫu & chỉ tiêu</span>
            <Tag color="blue">{sampleChanges.length} mẫu</Tag>
            {totalIndicatorChanges > 0 && <Tag color="cyan">{totalIndicatorChanges} chỉ tiêu</Tag>}
          </Space>
        }
        size="small"
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={sampleChanges}
          columns={columns}
          rowKey={(r, i) => `sample-${r.sampleCode}-${i}`}
          size="small"
          pagination={false}
          expandable={{
            expandedRowRender,
          }}
          rowClassName={(record) => {
            if (record.type === 'delete') return 'sample-row-deleted';
            if (record.type === 'add') return 'sample-row-added';
            return 'sample-row-updated';
          }}
        />
        <style>{`
          .sample-row-deleted {
            background-color: #fff1f0 !important;
          }
          .sample-row-added {
            background-color: #f6ffed !important;
          }
          .sample-row-updated {
            background-color: #fffbe6 !important;
          }
        `}</style>
      </Card>
    );
  };

  // Handle approve - call QualityManagement API
  const handleApprove = async () => {
    if (!taskId) return;
    setApproving(true);
    try {
      await qualityManagementService.approveChanges(taskId);
      message.success('Đã phê duyệt thay đổi thành công');
      onUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error approving:', error);
      message.error(error?.response?.data?.error?.message || 'Không thể phê duyệt');
    } finally {
      setApproving(false);
    }
  };

  // Handle reject - call QualityManagement API
  const handleReject = async () => {
    if (!taskId) return;
    if (!rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    setRejecting(true);
    try {
      await qualityManagementService.rejectChanges(taskId, rejectReason);
      message.success('Đã từ chối thay đổi');
      setRejectModalVisible(false);
      setRejectReason('');
      onUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error rejecting:', error);
      message.error(error?.response?.data?.error?.message || 'Không thể từ chối');
    } finally {
      setRejecting(false);
    }
  };

  // Helper to check field name (case insensitive)
  const matchField = (fieldName: string, targets: string[]) => {
    const lowerField = fieldName.toLowerCase();
    return targets.some(t => t.toLowerCase() === lowerField);
  };

  // Group field changes by section (support both camelCase and PascalCase)
  const contractFields = fieldChanges.filter(f =>
    matchField(f.fieldName, ['contractNumber', 'contractDate', 'sentToAccounting', 'paymentReceived', 'sentToDepartment', 'resultReturned'])
  );

  const customerFields = fieldChanges.filter(f =>
    matchField(f.fieldName, ['customerName', 'address', 'taxCode', 'contactPerson', 'phone', 'provinceCode', 'province', 'districtCode', 'district', 'wardCode', 'ward'])
  );

  const methodFields = fieldChanges.filter(f =>
    matchField(f.fieldName, ['methodWestHighlandInstitute', 'methodCustomer', 'methodCustomerDetail', 'resultLanguage', 'resultCopyCount', 'separatePassedResults', 'conformityDeclaration', 'otherRequirements'])
  );

  const sampleTypeFields = fieldChanges.filter(f =>
    matchField(f.fieldName, ['sampleTypeService', 'sampleTypeContract', 'sampleTypeTask', 'sampleTypeSubContract'])
  );

  const deliveryFields = fieldChanges.filter(f =>
    matchField(f.fieldName, ['samplingRequirement', 'deliveryDirectPickup', 'deliveryPostal', 'returnStoredSample', 'sampleStorage'])
  );

  const costFields = fieldChanges.filter(f =>
    matchField(f.fieldName, ['totalCost', 'totalCostInWords', 'receiptNumber'])
  );

  const otherFields = fieldChanges.filter(f =>
    matchField(f.fieldName, ['notes', 'expectedCompletionDate', 'resultDeliveryDate', 'supervisorId', 'directorId', 'agreeTerms', 'changeRequest'])
  );

  // Fields not matching any section above
  const allKnownFieldsLower = [
    'contractnumber', 'contractdate', 'senttoaccounting', 'paymentreceived', 'senttodepartment', 'resultreturned',
    'customername', 'address', 'taxcode', 'contactperson', 'phone', 'provincecode', 'province', 'districtcode', 'district', 'wardcode', 'ward',
    'methodwesthighlandinstitute', 'methodcustomer', 'methodcustomerdetail', 'resultlanguage', 'resultcopycount', 'separatepassedresults', 'conformitydeclaration', 'otherrequirements',
    'sampletypeservice', 'sampletypecontract', 'sampletypetask', 'sampletypesubcontract',
    'samplingrequirement', 'deliverydirectpickup', 'deliverypostal', 'returnstoredsample', 'samplestorage',
    'totalcost', 'totalcostinwords', 'receiptnumber',
    'notes', 'expectedcompletiondate', 'resultdeliverydate', 'supervisorid', 'directorid', 'agreeterms', 'changerequest',
  ];
  const unmatchedFields = fieldChanges.filter(f => !allKnownFieldsLower.includes(f.fieldName.toLowerCase()));

  const hasChanges = fieldChanges.length > 0 || sampleChanges.length > 0;

  return (
    <>
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: (readonly || isBatchDataMode) ? '#1890ff' : '#faad14' }} />
            <span>{(readonly || isBatchDataMode) ? 'Chi tiết thay đổi phiếu yêu cầu' : 'Xem xét thay đổi phiếu yêu cầu'}</span>
            {(task?.contractNumber || contractNumber) && <Tag color="blue">{task?.contractNumber || contractNumber}</Tag>}
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        centered
        className="quality-change-approval-modal"
        styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflow: 'auto', padding: '16px 24px' } }}
        footer={(readonly || isBatchDataMode || !hasChanges) ? [
          <Button key="close" onClick={onClose}>
            Đóng
          </Button>
        ] : [
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => setRejectModalVisible(true)}
          >
            Từ chối
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={approving}
            onClick={handleApprove}
          >
            Phê duyệt
          </Button>,
        ]}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : !isBatchDataMode && !task ? (
          <Alert type="error" message="Không tìm thấy dữ liệu" showIcon />
        ) : !isBatchDataMode && task?.taskType !== QualityTaskType.ChangeApproval ? (
          <Alert type="warning" message="Task này không phải là phê duyệt thay đổi" showIcon />
        ) : !hasChanges ? (
          <Alert
            message="Không có thay đổi"
            description="Không có thay đổi nào cần phê duyệt."
            type="info"
            showIcon
          />
        ) : (
          <>
            {/* Header info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              padding: '8px 12px',
              background: isBatchDataMode ? '#e6f7ff' : '#fffbe6',
              border: isBatchDataMode ? '1px solid #91d5ff' : '1px solid #ffe58f',
              borderRadius: 6
            }}>
              <Text>
                <strong>{fieldChanges.length + sampleChanges.length}</strong> {isBatchDataMode ? 'thay đổi' : 'thay đổi cần xem xét'}
              </Text>
              {(isBatchDataMode && batchData?.creatorName) ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  bởi <strong>{batchData.creatorName}</strong> - {dayjs(batchData.creationTime).format('DD/MM/YYYY HH:mm')}
                </Text>
              ) : pendingChanges[0]?.creatorName && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  bởi <strong>{pendingChanges[0].creatorName}</strong> - {dayjs(pendingChanges[0].creationTime).format('DD/MM/YYYY HH:mm')}
                </Text>
              )}
            </div>

            {/* Changes list - compact layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Row 1: Contract & Sample Type */}
              {(contractFields.length > 0 || sampleTypeFields.length > 0) && (
                <Row gutter={12}>
                  {contractFields.length > 0 && (
                    <Col span={sampleTypeFields.length > 0 ? 12 : 24}>
                      <Card title="Thông tin hợp đồng" size="small" styles={{ body: { padding: '8px 12px' } }}>
                        {contractFields.map(renderFieldChange)}
                      </Card>
                    </Col>
                  )}
                  {sampleTypeFields.length > 0 && (
                    <Col span={contractFields.length > 0 ? 12 : 24}>
                      <Card title="Loại hình mẫu" size="small" styles={{ body: { padding: '8px 12px' } }}>
                        {sampleTypeFields.map(renderFieldChange)}
                      </Card>
                    </Col>
                  )}
                </Row>
              )}

              {/* Row 2: Method & Delivery */}
              {(methodFields.length > 0 || deliveryFields.length > 0) && (
                <Row gutter={12}>
                  {methodFields.length > 0 && (
                    <Col span={deliveryFields.length > 0 ? 12 : 24}>
                      <Card title="Phương pháp & Kết quả" size="small" styles={{ body: { padding: '8px 12px' } }}>
                        {methodFields.map(renderFieldChange)}
                      </Card>
                    </Col>
                  )}
                  {deliveryFields.length > 0 && (
                    <Col span={methodFields.length > 0 ? 12 : 24}>
                      <Card title="Lấy mẫu & Giao trả" size="small" styles={{ body: { padding: '8px 12px' } }}>
                        {deliveryFields.map(renderFieldChange)}
                      </Card>
                    </Col>
                  )}
                </Row>
              )}

              {/* Row 3: Cost & Other */}
              {(costFields.length > 0 || otherFields.length > 0) && (
                <Row gutter={12}>
                  {costFields.length > 0 && (
                    <Col span={otherFields.length > 0 ? 12 : 24}>
                      <Card title="Thông tin chi phí" size="small" styles={{ body: { padding: '8px 12px' } }}>
                        {costFields.map(renderFieldChange)}
                      </Card>
                    </Col>
                  )}
                  {otherFields.length > 0 && (
                    <Col span={costFields.length > 0 ? 12 : 24}>
                      <Card title="Thông tin khác" size="small" styles={{ body: { padding: '8px 12px' } }}>
                        {otherFields.map(renderFieldChange)}
                      </Card>
                    </Col>
                  )}
                </Row>
              )}

              {/* Customer fields (usually locked, but show if changed) */}
              {customerFields.length > 0 && (
                <Card title="Thông tin khách hàng" size="small" styles={{ body: { padding: '8px 12px' } }}>
                  <Row gutter={12}>
                    {customerFields.map((f) => (
                      <Col span={12} key={f.fieldName}>
                        {renderFieldChange(f)}
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* Unmatched fields */}
              {unmatchedFields.length > 0 && (
                <Card title="Các thay đổi khác" size="small" styles={{ body: { padding: '8px 12px' } }}>
                  <Row gutter={12}>
                    {unmatchedFields.map((f) => (
                      <Col span={12} key={f.fieldName}>
                        {renderFieldChange(f)}
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* Fallback: show all if no section matches */}
              {contractFields.length === 0 && customerFields.length === 0 &&
               methodFields.length === 0 && sampleTypeFields.length === 0 &&
               deliveryFields.length === 0 && costFields.length === 0 &&
               otherFields.length === 0 && unmatchedFields.length === 0 &&
               fieldChanges.length > 0 && (
                <Card title="Các thay đổi" size="small" styles={{ body: { padding: '8px 12px' } }}>
                  <Row gutter={12}>
                    {fieldChanges.map((f) => (
                      <Col span={12} key={f.fieldName}>
                        {renderFieldChange(f)}
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* Sample & Indicator changes */}
              {renderSampleChanges()}
            </div>
          </>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối thay đổi"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setRejectModalVisible(false);
            setRejectReason('');
          }}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={rejecting}
            disabled={!rejectReason.trim()}
            onClick={handleReject}
          >
            Từ chối
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 12 }}>
          <Text>Dữ liệu sẽ được rollback về trạng thái trước khi thay đổi.</Text>
        </div>
        <div style={{ marginBottom: 8 }}>
          <Text>Vui lòng nhập lý do từ chối:</Text>
        </div>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
          maxLength={1000}
          showCount
        />
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        title={
          <Space>
            <FileImageOutlined />
            <span>Xem hình ảnh: {previewTitle}</span>
          </Space>
        }
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          setPreviewImages([]);
          setPreviewTitle('');
        }}
        footer={null}
        width={800}
        centered
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <Image.PreviewGroup>
            {previewImages.map((img, idx) => (
              <div
                key={idx}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #f0f0f0',
                }}
              >
                <Image
                  src={fileService.getFileUrl(img.fileId)}
                  alt={img.fileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlJREFUaN7t2D0KwjAYBuDXohvg4uTq4OLm5ubk4OLm5uLg4OYJPIGbJ/AEnkB3cXAQBwfBwcVBcHDw+0FSNNSS9k9S3g9CIW3zPCVJm1QKJZGsEIBYmm3bFwCqpNsHKqqqrgLwqJBe0zStaLfbu0aj0R1F0bNOq9VKAhAL53D4FRhj0Ol0ekulEkwTIE9zuHGO43gwTXMAQNUJcBWApmkaOL9Wq/GZGONzSAIA1DCsEJ7nfep0On46k/B9PwGgRvrYP0RnAZjcgGlCZAG4AkB3MBjANE2oqvo+BqABQKPb7QIA6AOJ+P4fEonE2wiABiZwA9M0EYYh4vH4WxTwPiMB0IvH4zFOnU4nqSgKDg4OcHJyggcA0hYAwLt2u/0CwMXFRRydnZ3h8vJSxEYiALJxMhqN+AMAYDAYgKIoLC8v4+joiB8RSdkbO4gCANcAuL29RXAJ+EfxCsm1Ye4EAAAAAElFTkSuQmCC"
                />
                <div style={{ padding: 4, textAlign: 'center' }}>
                  <Text ellipsis style={{ fontSize: 11 }}>{img.fileName}</Text>
                </div>
              </div>
            ))}
          </Image.PreviewGroup>
        </div>
      </Modal>
    </>
  );
};

export default ChangeApprovalModal;
