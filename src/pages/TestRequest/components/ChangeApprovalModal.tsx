import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  Button,
  Spin,
  Typography,
  Row,
  Col,
  Card,
  Table,
  Tag,
  Space,
  Alert,
  Input,
  message,
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
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  TestRequestChangeHistoryDto,
  ChangeApprovalStatus,
} from '../../../types/testRequest';
import { testRequestService } from '../../../services/testRequestService';

const { Text } = Typography;
const { TextArea } = Input;

interface ChangeApprovalModalProps {
  visible: boolean;
  testRequestId: string;
  onClose: () => void;
  onApproved: () => void;
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
  'contractDate', 'ContractDate',
  'expectedCompletionDate', 'ExpectedCompletionDate',
  'resultDeliveryDate', 'ResultDeliveryDate'
];

const ChangeApprovalModal: React.FC<ChangeApprovalModalProps> = ({
  visible,
  testRequestId,
  onClose,
  onApproved,
}) => {
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<TestRequestChangeHistoryDto[]>([]);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Load pending changes
  const loadChanges = async () => {
    if (!testRequestId) return;
    setLoading(true);
    try {
      const history = await testRequestService.getChangeHistory(testRequestId);
      const pending = history.filter(h => h.approvalStatus === ChangeApprovalStatus.Pending);
      setPendingChanges(pending);
    } catch (error) {
      console.error('Error loading changes:', error);
      message.error('Không thể tải thông tin thay đổi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && testRequestId) {
      loadChanges();
    }
  }, [visible, testRequestId]);

  // Parse changes
  const { fieldChanges, indicatorChanges } = useMemo(() => {
    const fields: FieldChange[] = [];
    let indicators: IndicatorChange[] = [];

    pendingChanges.forEach(change => {
      if (change.fieldName === 'Samples') {
        // Parse sample changes
        try {
          const oldSamples = change.oldValue ? JSON.parse(change.oldValue) : [];
          const newSamples = change.newValue ? JSON.parse(change.newValue) : [];

          // Helper to get sample indicators (handle both cases)
          const getIndicators = (sample: any) => sample.indicators || sample.Indicators || [];
          const getSampleCode = (sample: any) => sample.sampleCode || sample.SampleCode;
          const getSampleId = (sample: any) => sample.id || sample.Id;

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

          // Find added samples (new samples without ID, or ID not in old)
          newSamples.forEach((s: any) => {
            const id = getSampleId(s);
            // Sample is new if it has no ID, or its ID doesn't exist in old samples
            const isNewSample = !id || !oldSampleMap.has(id);
            if (isNewSample) {
              // All indicators in new sample are added
              getIndicators(s).forEach((ind: any) => {
                indicators.push({ type: 'add', indicator: ind, sampleCode: getSampleCode(s) });
              });
            }
          });

          // Find deleted samples and their indicators
          oldSamples.forEach((s: any) => {
            const id = getSampleId(s);
            if (id && !newSampleMap.has(id)) {
              // All indicators in deleted sample are deleted
              getIndicators(s).forEach((ind: any) => {
                indicators.push({ type: 'delete', indicator: ind, sampleCode: getSampleCode(s) });
              });
            }
          });

          // Find updated samples and their indicator changes (only for samples with matching IDs)
          newSamples.forEach((newS: any) => {
            const id = getSampleId(newS);
            // Only check for updates if sample has an ID and exists in old samples
            if (!id) return;
            const oldS: any = oldSampleMap.get(id);
            if (oldS) {
              // Check indicator changes within sample
              const newInds = getIndicators(newS);
              const oldInds = getIndicators(oldS);

              // Helper to get indicator ID (backend now matches by composite key and preserves IDs)
              const getIndId = (ind: any) => ind.id || ind.Id;

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

              // Added indicators (in new but not in old, or new indicators without ID)
              newInds.forEach((newInd: any) => {
                const indId = getIndId(newInd);
                if (!indId || !oldIndMap.has(indId)) {
                  indicators.push({ type: 'add', indicator: newInd, sampleCode: getSampleCode(newS) });
                }
              });

              // Deleted indicators (in old but not in new)
              oldInds.forEach((oldInd: any) => {
                const indId = getIndId(oldInd);
                if (indId && !newIndMap.has(indId)) {
                  indicators.push({ type: 'delete', indicator: oldInd, sampleCode: getSampleCode(newS) });
                }
              });

              // Updated indicators (same ID but different values)
              newInds.forEach((newInd: any) => {
                const indId = getIndId(newInd);
                if (indId && oldIndMap.has(indId)) {
                  const oldInd = oldIndMap.get(indId);
                  // Compare meaningful fields
                  const getVal = (obj: any, key: string) => {
                    const lowerKey = key.toLowerCase();
                    for (const k of Object.keys(obj || {})) {
                      if (k.toLowerCase() === lowerKey) return obj[k];
                    }
                    return undefined;
                  };
                  const normalize = (v: any) => (v === null || v === undefined) ? '' : String(v);

                  const fieldsToCompare = ['unitPrice', 'notes', 'testMethodId', 'laboratoryId'];
                  const hasChange = fieldsToCompare.some(f =>
                    normalize(getVal(oldInd, f)) !== normalize(getVal(newInd, f))
                  );

                  if (hasChange) {
                    indicators.push({ type: 'update', indicator: newInd, oldIndicator: oldInd, sampleCode: getSampleCode(newS) });
                  }
                }
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

    return { fieldChanges: fields, indicatorChanges: indicators };
  }, [pendingChanges]);

  // Format value for display (case insensitive field matching)
  const formatValue = (value: any, fieldName: string): string => {
    if (value === null || value === undefined || value === '') return '-';

    const lowerField = fieldName.toLowerCase();

    // Date fields
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

  // Render indicator table
  const renderIndicatorTable = () => {
    if (indicatorChanges.length === 0) return null;

    const columns = [
      {
        title: '',
        dataIndex: 'type',
        width: 50,
        render: (type: string) => {
          if (type === 'add') return <Tag color="success" icon={<PlusOutlined />} style={{ margin: 0 }}>A</Tag>;
          if (type === 'delete') return <Tag color="error" icon={<DeleteOutlined />} style={{ margin: 0 }}>D</Tag>;
          if (type === 'update') return <Tag color="warning" icon={<EditOutlined />} style={{ margin: 0 }}>U</Tag>;
          return null;
        }
      },
      {
        title: 'Mã chỉ tiêu',
        dataIndex: ['indicator', 'indicatorCode'],
        width: 120,
        render: (_: string, record: any) => {
          const code = record.indicator?.indicatorCode || record.indicator?.IndicatorCode || '-';
          if (record.type === 'delete') {
            return <Text delete type="secondary">{code}</Text>;
          }
          if (record.type === 'add') {
            return <Text style={{ color: '#52c41a', fontWeight: 500 }}>{code}</Text>;
          }
          return code;
        }
      },
      {
        title: 'Tên chỉ tiêu',
        dataIndex: ['indicator', 'indicatorName'],
        render: (_: string, record: any) => {
          const name = record.indicator?.indicatorName || record.indicator?.IndicatorName || '-';
          if (record.type === 'delete') {
            return <Text delete type="secondary">{name}</Text>;
          }
          if (record.type === 'add') {
            return <Text style={{ color: '#52c41a', fontWeight: 500 }}>{name}</Text>;
          }
          if (record.type === 'update' && record.oldIndicator) {
            const oldName = record.oldIndicator?.indicatorName || record.oldIndicator?.IndicatorName;
            if (oldName !== name) {
              return (
                <div>
                  <Text delete type="secondary" style={{ fontSize: 12 }}>{oldName}</Text>
                  <br />
                  <Text style={{ color: '#52c41a' }}>{name}</Text>
                </div>
              );
            }
          }
          return name;
        }
      },
      {
        title: 'Đơn giá',
        dataIndex: ['indicator', 'unitPrice'],
        width: 120,
        render: (_: number, record: any) => {
          const price = record.indicator?.unitPrice ?? record.indicator?.UnitPrice ?? 0;
          const formattedPrice = new Intl.NumberFormat('vi-VN').format(price);

          if (record.type === 'delete') {
            return <Text delete type="secondary">{formattedPrice}</Text>;
          }
          if (record.type === 'add') {
            return <Text style={{ color: '#52c41a', fontWeight: 500 }}>{formattedPrice}</Text>;
          }
          if (record.type === 'update' && record.oldIndicator) {
            const oldPrice = record.oldIndicator?.unitPrice ?? record.oldIndicator?.UnitPrice ?? 0;
            if (oldPrice !== price) {
              return (
                <div>
                  <Text delete type="secondary" style={{ fontSize: 12 }}>
                    {new Intl.NumberFormat('vi-VN').format(oldPrice)}
                  </Text>
                  <br />
                  <Text style={{ color: '#52c41a' }}>{formattedPrice}</Text>
                </div>
              );
            }
          }
          return formattedPrice;
        }
      },
    ];

    return (
      <Card
        title={
          <Space>
            <span>Thay đổi chỉ tiêu</span>
            <Tag color="blue">{indicatorChanges.length}</Tag>
          </Space>
        }
        size="small"
        styles={{ body: { padding: '0' } }}
      >
        <Table
          dataSource={indicatorChanges}
          columns={columns}
          rowKey={(r, i) => `${r.type}-${r.indicator?.id || r.indicator?.Id || i}`}
          size="small"
          pagination={false}
          rowClassName={(record) => {
            if (record.type === 'delete') return 'row-deleted';
            if (record.type === 'add') return 'row-added';
            return '';
          }}
        />
        <style>{`
          .row-deleted {
            background-color: #fff1f0 !important;
          }
          .row-deleted td {
            text-decoration: line-through;
            color: #999 !important;
          }
          .row-added {
            background-color: #f6ffed !important;
          }
        `}</style>
      </Card>
    );
  };

  // Handle approve
  const handleApprove = async () => {
    setApproving(true);
    try {
      await testRequestService.approveChanges(testRequestId);
      message.success('Đã phê duyệt thay đổi thành công');
      onApproved();
      onClose();
    } catch (error: any) {
      console.error('Error approving:', error);
      message.error(error?.response?.data?.error?.message || 'Không thể phê duyệt');
    } finally {
      setApproving(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    setRejecting(true);
    try {
      await testRequestService.rejectChanges(testRequestId, rejectReason);
      message.success('Đã từ chối thay đổi');
      setRejectModalVisible(false);
      setRejectReason('');
      onApproved();
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

  // Fields not matching any section above - catch all remaining fields
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

  const hasChanges = fieldChanges.length > 0 || indicatorChanges.length > 0;

  return (
    <>
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Xem xét thay đổi phiếu yêu cầu</span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        centered
        styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflow: 'auto', padding: '16px 24px' } }}
        footer={[
          <Button key="cancel" onClick={onClose}>
            Đóng
          </Button>,
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
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 6
            }}>
              <Text>
                <strong>{fieldChanges.length + indicatorChanges.length}</strong> thay đổi cần xem xét
              </Text>
              {pendingChanges[0]?.creatorName && (
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

              {/* Indicator changes table */}
              {renderIndicatorTable()}
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
    </>
  );
};

export default ChangeApprovalModal;
