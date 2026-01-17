// @ts-nocheck
import { message } from "antd";
import dayjs from "dayjs";
import { testRequestService, PreviewTestRequestFormInput } from "../../../../services/testRequestService";
import { specimenTypeService } from "../../../../services/masterDataService";
import { API_BASE_URL } from "../../../../services/api";
import {
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
  SampleStatus,
} from "../../../../types/testRequest";
import { numberToVietnameseWords } from "../../../../utils/numberToWords";
import {
  SampleFormData,
  IndicatorDateInfo,
  LaboratoryAssignment,
  IndicatorMethodKey,
  IndicatorMethodInfo,
  createIndicatorMethodKey,
  parseIndicatorMethodKey,
} from "../types";
import { generateSampleCode, getNextOrderNum, printBarcode as printBarcodeUtil, SampleBarcodeInfo } from "../utils";
import { PATH_ROUTES } from "../../../../constants";
import { getApiErrorMessage } from "../../../../utils/errorHandler";

interface UseTestRequestFormActionsProps {
  form: any;
  isEditMode: boolean;
  id: string | undefined;
  samples: SampleFormData[];
  setSamples: React.Dispatch<React.SetStateAction<SampleFormData[]>>;
  indicators: any[];
  indicatorGroups: any[];
  provinces: any[];
  wards: any[];
  sampleCodePrefix: string;
  totalSampleCost: number;
  sampleTypeTask: boolean;
  selectedIndicatorDates: Record<string, IndicatorDateInfo>;
  setSelectedIndicatorDates: React.Dispatch<React.SetStateAction<Record<string, IndicatorDateInfo>>>;
  checkedIndicators: string[];
  setCheckedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  indicatorLaboratoryMap: Record<string, LaboratoryAssignment>;
  setIndicatorLaboratoryMap: React.Dispatch<React.SetStateAction<Record<string, LaboratoryAssignment>>>;
  isSamplesLocked: () => boolean;
  setLoading: (loading: boolean) => void;
  navigate: (path: string) => void;

  // Indicator modal
  currentSampleKey: string | null;
  setCurrentSampleKey: (key: string | null) => void;
  tempSelectedIndicators: string[];
  setTempSelectedIndicators: React.Dispatch<React.SetStateAction<string[]>>;
  tempSelectedIndicatorMethods: IndicatorMethodKey[];
  setTempSelectedIndicatorMethods: React.Dispatch<React.SetStateAction<IndicatorMethodKey[]>>;
  setIndicatorModalVisible: (visible: boolean) => void;
  setSelectedGroupFilter: (filter: string) => void;
  indicatorMethodsMap: Record<string, IndicatorMethodInfo[]>;
  // Filter theo loại mẫu
  setCurrentSampleSpecimenTypeId: (id: string | undefined) => void;
  setCurrentSampleSpecimenTypeName: (name: string | undefined) => void;
  setSpecimenTypeIndicatorIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSpecimenTypeFilterActive: React.Dispatch<React.SetStateAction<boolean>>;

  // Laboratory modal
  laboratories: any[];
  selectedLaboratoryId: string | null;
  setSelectedLaboratoryId: (id: string | null) => void;
  laboratoryRequestDate: dayjs.Dayjs | null;
  setLaboratoryRequestDate: (date: dayjs.Dayjs | null) => void;
  indicatorsToSend: string[];
  setIndicatorsToSend: React.Dispatch<React.SetStateAction<string[]>>;
  setLaboratoryModalVisible: (visible: boolean) => void;
  expandedLabGroups: string[];
  setExpandedLabGroups: React.Dispatch<React.SetStateAction<string[]>>;

  // Sample indicator IDs
  sampleIndicatorIdMap: Record<string, string>;

  // Original data snapshot for change detection
  originalData: any;

  // Check if edit requires approval
  isEditRequiresApproval: () => boolean;

  // SpecimenTypes for name lookup
  specimenTypes: any[];

  // Quotation source (when creating from quotation)
  sourceQuotationId: string | null;
}

export const useTestRequestFormActions = ({
  form,
  isEditMode,
  id,
  samples,
  setSamples,
  indicators,
  indicatorGroups,
  provinces,
  wards,
  sampleCodePrefix,
  totalSampleCost,
  sampleTypeTask,
  selectedIndicatorDates,
  setSelectedIndicatorDates,
  checkedIndicators,
  setCheckedIndicators,
  indicatorLaboratoryMap,
  setIndicatorLaboratoryMap,
  isSamplesLocked,
  setLoading,
  navigate,
  currentSampleKey,
  setCurrentSampleKey,
  tempSelectedIndicators,
  setTempSelectedIndicators,
  tempSelectedIndicatorMethods,
  setTempSelectedIndicatorMethods,
  setIndicatorModalVisible,
  setSelectedGroupFilter,
  indicatorMethodsMap,
  setCurrentSampleSpecimenTypeId,
  setCurrentSampleSpecimenTypeName,
  setSpecimenTypeIndicatorIds,
  setSpecimenTypeFilterActive,
  laboratories,
  selectedLaboratoryId,
  setSelectedLaboratoryId,
  laboratoryRequestDate,
  setLaboratoryRequestDate,
  indicatorsToSend,
  setIndicatorsToSend,
  setLaboratoryModalVisible,
  expandedLabGroups,
  setExpandedLabGroups,
  sampleIndicatorIdMap,
  originalData,
  isEditRequiresApproval,
  specimenTypes,
  sourceQuotationId,
}: UseTestRequestFormActionsProps) => {

  // Helper: Build change history by comparing original and new data
  const buildChangeHistory = (newPayload: any, newSampleDtos: any[]) => {
    if (!originalData) return [];

    const changes: Array<{ fieldName: string; oldValue: string; newValue: string }> = [];

    // Fields to compare (simple fields)
    const fieldsToCompare = [
      'contractNumber', 'customerName', 'address', 'taxCode', 'contactPerson', 'phone',
      'province', 'ward', 'methodWestHighlandInstitute', 'methodCustomer', 'methodCustomerDetail',
      'resultLanguage', 'resultCopyCount', 'separatePassedResults', 'conformityDeclaration',
      'otherRequirements', 'subContract', 'samplingRequirement', 'deliveryDirectPickup',
      'deliveryPostal', 'returnStoredSample', 'sampleTypeService', 'sampleTypeContract',
      'sampleTypeTask', 'sampleTypeSubContract', 'sampleStorage', 'totalCost', 'totalCostInWords',
      'receiptNumber', 'notes', 'changeRequest', 'agreeTerms', 'sentToAccounting',
      'paymentReceived', 'sentToDepartment', 'resultReturned', 'subcontractor'
    ];

    // Date fields
    const dateFields = ['contractDate', 'expectedCompletionDate', 'resultDeliveryDate'];

    // Compare simple fields
    fieldsToCompare.forEach(field => {
      const oldVal = originalData[field];
      const newVal = newPayload[field];
      const normalize = (v: any) => (v === null || v === undefined || v === '') ? null : v;
      if (normalize(oldVal) !== normalize(newVal)) {
        changes.push({
          fieldName: field.charAt(0).toUpperCase() + field.slice(1), // PascalCase
          oldValue: oldVal != null ? String(oldVal) : '',
          newValue: newVal != null ? String(newVal) : ''
        });
      }
    });

    // Compare date fields (format to YYYY-MM-DD for comparison)
    dateFields.forEach(field => {
      const oldVal = originalData[field] ? originalData[field].split('T')[0] : null;
      const newVal = newPayload[field] ? newPayload[field].split('T')[0] : null;
      if (oldVal !== newVal) {
        changes.push({
          fieldName: field.charAt(0).toUpperCase() + field.slice(1),
          oldValue: oldVal || '',
          newValue: newVal || ''
        });
      }
    });

    // Helper to get specimen type name from ID
    const getSpecimenTypeName = (typeId: string | undefined) => {
      if (!typeId) return '';
      const specimenType = specimenTypes.find((st: any) => st.id === typeId);
      return specimenType?.name || '';
    };

    // Compare samples - convert to JSON for storage
    const oldSamples = (originalData.samples || []).map((s: any) => ({
      Id: s.id,
      SampleCode: s.sampleCode,
      SampleName: s.sampleName,
      SamplingAddress: s.samplingAddress,
      SampleQuantity: s.sampleQuantity,
      StatusText: s.statusText,
      ProcessingStatus: s.processingStatus,
      Notes: s.notes,
      StorageLocation: s.storageLocation,
      SpecimenTypeId: s.specimenTypeId,
      SpecimenTypeName: s.specimenTypeName || getSpecimenTypeName(s.specimenTypeId),
      Indicators: (s.indicators || []).map((ind: any) => ({
        Id: ind.id,
        IndicatorId: ind.indicatorId,
        IndicatorCode: ind.indicatorCode,
        IndicatorName: ind.indicatorName,
        UnitPrice: ind.unitPrice,
        TestMethodId: ind.testMethodId,
        TestMethodCode: ind.testMethodCode,
        TestMethodName: ind.testMethodName,
        LaboratoryId: ind.laboratoryId,
        Notes: ind.notes
      })),
      Attachments: (s.attachments || []).map((a: any) => ({
        FileId: a.fileId,
        FileName: a.fileName,
        FileSize: a.fileSize
      }))
    }));

    const newSamples = newSampleDtos.map((s: any) => ({
      Id: s.id || null,
      SampleCode: s.sampleCode,
      SampleName: s.sampleName,
      SamplingAddress: s.samplingAddress,
      SampleQuantity: s.sampleQuantity,
      StatusText: s.statusText,
      ProcessingStatus: s.processingStatus,
      Notes: s.notes,
      StorageLocation: s.storageLocation,
      SpecimenTypeId: s.specimenTypeId,
      SpecimenTypeName: getSpecimenTypeName(s.specimenTypeId),
      Indicators: (s.indicators || []).map((ind: any) => {
        // Find test method info from indicatorMethodsMap
        const methods = indicatorMethodsMap[ind.indicatorId] || [];
        const method = methods.find((m) => m.testMethodId === ind.testMethodId);
        return {
          Id: ind.id || null,
          IndicatorId: ind.indicatorId,
          IndicatorCode: indicators.find(i => i.id === ind.indicatorId)?.code || '',
          IndicatorName: indicators.find(i => i.id === ind.indicatorId)?.name || '',
          UnitPrice: ind.unitPrice,
          TestMethodId: ind.testMethodId,
          TestMethodCode: method?.testMethodCode || '',
          TestMethodName: method?.testMethodName || '',
          LaboratoryId: ind.laboratoryId,
          Notes: ind.notes
        };
      }),
      Attachments: (s.attachments || []).map((a: any) => ({
        FileId: a.fileId,
        FileName: a.fileName,
        FileSize: a.fileSize
      }))
    }));

    const oldSamplesJson = JSON.stringify(oldSamples);
    const newSamplesJson = JSON.stringify(newSamples);

    if (oldSamplesJson !== newSamplesJson) {
      changes.push({
        fieldName: 'Samples',
        oldValue: oldSamplesJson,
        newValue: newSamplesJson
      });
    }

    return changes;
  };

  // Sample actions
  const addSample = () => {
    if (isSamplesLocked()) {
      message.warning("Không thể thêm mẫu khi phiếu đang thực hiện");
      return;
    }

    // Get next order number based on max existing (không tái sử dụng số đã xóa)
    const existingSampleCodes = samples.map((s) => s.sampleCode);
    const nextOrderNum = getNextOrderNum(existingSampleCodes);
    const contractNumber = form.getFieldValue("contractNumber") || "";

    const newSample: SampleFormData = {
      key: `new-${Date.now()}`,
      sortOrder: samples.length + 1,
      sampleCode: generateSampleCode(contractNumber, nextOrderNum),
      sampleName: "",
      samplingAddress: "",
      sampleQuantity: "",
      status: SampleStatus.Normal,
      statusText: "",
      processingStatus: "",
      notes: "",
      storageLocation: "",
      specimenTypeName: "",
      indicatorIds: [],
      indicatorMethods: [],
      attachments: [],
      isSharedSample: false,
    };
    setSamples([...samples, newSample]);
  };

  const removeSample = (key: string) => {
    if (isSamplesLocked()) {
      message.warning("Không thể xóa mẫu khi phiếu đang thực hiện");
      return;
    }

    const newSamples = samples.filter((s) => s.key !== key);

    // Nếu là form tạo mới (không phải edit), đánh lại số mẫu liên tục
    if (!isEditMode) {
      const contractNumber = form.getFieldValue("contractNumber") || "";
      const reorderedSamples = newSamples.map((sample, index) => ({
        ...sample,
        sortOrder: index + 1,
        sampleCode: generateSampleCode(contractNumber, index + 1),
      }));
      setSamples(reorderedSamples);
    } else {
      // Edit mode: giữ nguyên mã mẫu như hiện tại
      setSamples(newSamples);
    }
  };

  const updateSample = (key: string, field: keyof SampleFormData, value: any) => {
    if (isSamplesLocked()) {
      return;
    }
    setSamples(
      samples.map((s) => {
        if (s.key === key) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const duplicateSample = (key: string) => {
    if (isSamplesLocked()) {
      message.warning("Không thể nhân đôi mẫu khi phiếu đang thực hiện");
      return;
    }

    const sourceSample = samples.find((s) => s.key === key);
    if (!sourceSample) return;

    // Get next order number based on max existing (không tái sử dụng số đã xóa)
    const existingSampleCodes = samples.map((s) => s.sampleCode);
    const nextOrderNum = getNextOrderNum(existingSampleCodes);
    const contractNumber = form.getFieldValue("contractNumber") || "";

    const newSample: SampleFormData = {
      ...sourceSample,
      key: `new-${Date.now()}`,
      id: undefined,
      sortOrder: samples.length + 1,
      sampleCode: generateSampleCode(contractNumber, nextOrderNum),
      attachments: [], // Clear attachments when duplicating to avoid duplicate FileId error
    };

    const newLabMap = { ...indicatorLaboratoryMap };
    // Copy lab assignments for indicatorMethods
    sourceSample.indicatorMethods?.forEach((methodKey) => {
      const sourceLabKey = `${key}_${methodKey}`;
      const newLabKey = `${newSample.key}_${methodKey}`;
      if (indicatorLaboratoryMap[sourceLabKey]) {
        newLabMap[newLabKey] = { ...indicatorLaboratoryMap[sourceLabKey] };
      }
    });
    // Backward compatible: also copy for indicatorIds
    sourceSample.indicatorIds.forEach((indId) => {
      const sourceLabKey = `${key}_${indId}`;
      const newLabKey = `${newSample.key}_${indId}`;
      if (indicatorLaboratoryMap[sourceLabKey]) {
        newLabMap[newLabKey] = { ...indicatorLaboratoryMap[sourceLabKey] };
      }
    });
    setIndicatorLaboratoryMap(newLabMap);

    setSamples([...samples, newSample]);
  };

  const printBarcode = (sampleInfo: SampleBarcodeInfo) => {
    printBarcodeUtil(sampleInfo);
  };

  // Indicator modal functions
  const openIndicatorModal = async (sampleKey: string) => {
    if (isSamplesLocked()) {
      message.warning("Không thể thay đổi chỉ tiêu khi phiếu đang thực hiện");
      return;
    }

    const sample = samples.find((s) => s.key === sampleKey);
    if (sample) {
      setCurrentSampleKey(sampleKey);
      setTempSelectedIndicators([...sample.indicatorIds]);
      setTempSelectedIndicatorMethods([...(sample.indicatorMethods || [])]);
      setSelectedGroupFilter("all");
      setCheckedIndicators([]); // Reset checked indicators when opening modal

      // Restore selectedIndicatorDates from indicatorLaboratoryMap for this sample
      const restoredDates: Record<string, { transferDate?: dayjs.Dayjs; requestDate?: dayjs.Dayjs }> = {
        ...selectedIndicatorDates,
      };
      (sample.indicatorMethods || []).forEach((methodKey) => {
        const labMapKey = `${sampleKey}_${methodKey}`;
        const labAssignment = indicatorLaboratoryMap[labMapKey];
        if (labAssignment) {
          restoredDates[methodKey] = {
            ...restoredDates[methodKey],
            requestDate: labAssignment.requestDate,
            transferDate: restoredDates[methodKey]?.transferDate || dayjs(),
          };
        }
      });
      setSelectedIndicatorDates(restoredDates);

      // Fetch indicators theo loại mẫu nếu có specimenTypeId
      if (sample.specimenTypeId) {
        setCurrentSampleSpecimenTypeId(sample.specimenTypeId);
        setCurrentSampleSpecimenTypeName(sample.specimenTypeName);
        setSpecimenTypeFilterActive(true); // Mặc định check filter nếu có loại mẫu
        try {
          const specimenTypeIndicators = await specimenTypeService.getIndicators(sample.specimenTypeId);
          const indicatorIds = specimenTypeIndicators
            .filter(sti => sti.isActive)
            .map(sti => sti.indicatorId);
          setSpecimenTypeIndicatorIds(indicatorIds);
          // Nếu không có chỉ tiêu -> hiện empty, nếu có thì hiện chỉ tiêu của loại mẫu đó
        } catch (error) {
          console.error("Failed to fetch specimen type indicators:", error);
          setSpecimenTypeIndicatorIds([]);
          // Vẫn giữ filter active, chỉ là danh sách rỗng
        }
      } else {
        setCurrentSampleSpecimenTypeId(undefined);
        setCurrentSampleSpecimenTypeName(undefined);
        setSpecimenTypeIndicatorIds([]);
        setSpecimenTypeFilterActive(false);
      }

      setIndicatorModalVisible(true);
    }
  };

  const handleIndicatorModalOk = () => {
    if (currentSampleKey) {
      // Không validate khoa phòng - cho phép lưu mà không cần gửi khoa phòng

      // Update both indicatorIds (for backward compat) and indicatorMethods
      const indicatorIds = tempSelectedIndicatorMethods.map((key) => {
        const { indicatorId } = parseIndicatorMethodKey(key);
        return indicatorId;
      });
      updateSample(currentSampleKey, "indicatorIds", indicatorIds);
      updateSample(currentSampleKey, "indicatorMethods", tempSelectedIndicatorMethods);
    }
    setIndicatorModalVisible(false);
    setCurrentSampleKey(null);
  };

  const handleIndicatorModalCancel = () => {
    setIndicatorModalVisible(false);
    setCurrentSampleKey(null);
    setTempSelectedIndicators([]);
    setTempSelectedIndicatorMethods([]);
  };

  // OLD: Toggle indicator (deprecated, kept for backward compat)
  const toggleIndicator = (indicatorId: string) => {
    setTempSelectedIndicators((prev) => {
      if (prev.includes(indicatorId)) {
        return prev.filter((id) => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  // NEW: Toggle indicator method (indicatorId + testMethodId)
  const toggleIndicatorMethod = (indicatorId: string, testMethodId: string) => {
    const key = createIndicatorMethodKey(indicatorId, testMethodId);
    setTempSelectedIndicatorMethods((prev) => {
      if (prev.includes(key)) {
        // Remove and clear dates
        setSelectedIndicatorDates((dates) => {
          const updated = { ...dates };
          delete updated[key];
          return updated;
        });
        return prev.filter((k) => k !== key);
      } else {
        // Add with auto-set transfer date to today, requestDate is empty by default
        setSelectedIndicatorDates((dates) => ({
          ...dates,
          [key]: {
            transferDate: dayjs(),
            requestDate: undefined, // Để trống theo yêu cầu KH
          },
        }));
        return [...prev, key];
      }
    });
  };

  // Indicator date handling - now uses IndicatorMethodKey as id
  const handleIndicatorDateChange = (
    id: string, // Can be indicatorId or IndicatorMethodKey
    field: "transferDate" | "requestDate",
    value: dayjs.Dayjs | null
  ) => {
    const currentDates = selectedIndicatorDates[id] || {};

    // Validation: requestDate cannot be in the past
    if (field === "requestDate" && value) {
      if (value.isBefore(dayjs().startOf("day"))) {
        message.warning("Ngày yêu cầu không được là ngày quá khứ");
        return;
      }
    }

    // Validation: requestDate >= transferDate
    if (field === "requestDate" && value && currentDates.transferDate) {
      if (value.isBefore(currentDates.transferDate)) {
        message.warning("Ngày yêu cầu không được nhỏ hơn ngày chuyển giao");
        return;
      }
    }

    setSelectedIndicatorDates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value || undefined,
      },
    }));

    // Also update indicatorLaboratoryMap if this indicator is already sent to a laboratory
    if (field === "requestDate" && currentSampleKey) {
      const labMapKey = `${currentSampleKey}_${id}`;
      if (indicatorLaboratoryMap[labMapKey]) {
        setIndicatorLaboratoryMap((prev) => ({
          ...prev,
          [labMapKey]: {
            ...prev[labMapKey],
            requestDate: value || dayjs(),
          },
        }));
      }
    }
  };

  // Toggle checked indicator - now uses IndicatorMethodKey
  const toggleCheckedIndicator = (id: string) => {
    setCheckedIndicators((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllIndicators = (checked: boolean) => {
    if (checked) {
      // Select all unsent indicator methods
      const unsentMethods = tempSelectedIndicatorMethods.filter(
        (key) => !indicatorLaboratoryMap[`${currentSampleKey}_${key}`]
      );
      setCheckedIndicators([...unsentMethods]);
    } else {
      setCheckedIndicators([]);
    }
  };

  // Group selector
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupFilter(groupId);
  };

  // Laboratory modal functions
  const handleSendToLaboratory = () => {
    if (checkedIndicators.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để gửi khoa phòng");
      return;
    }
    setIndicatorsToSend([...checkedIndicators]);

    // Get request date from the first checked indicator if available
    const firstCheckedIndicator = checkedIndicators[0];
    const firstIndicatorDates = selectedIndicatorDates[firstCheckedIndicator];
    const defaultRequestDate = firstIndicatorDates?.requestDate || null;

    setLaboratoryRequestDate(defaultRequestDate);
    setSelectedLaboratoryId(null);
    setLaboratoryModalVisible(true);
  };

  const handleConfirmSendToLaboratory = () => {
    if (!selectedLaboratoryId) {
      message.warning("Vui lòng chọn khoa phòng");
      return;
    }

    if (!laboratoryRequestDate) {
      message.warning("Vui lòng chọn ngày yêu cầu xong");
      return;
    }

    const selectedLab = laboratories.find((d) => d.id === selectedLaboratoryId);
    const labName = selectedLab?.name || "khoa phòng";

    setSelectedIndicatorDates((prev) => {
      const updated = { ...prev };
      indicatorsToSend.forEach((id) => {
        updated[id] = {
          ...updated[id],
          requestDate: laboratoryRequestDate,
        };
      });
      return updated;
    });

    setIndicatorLaboratoryMap((prev) => {
      const updated = { ...prev };
      indicatorsToSend.forEach((id) => {
        const key = `${currentSampleKey}_${id}`;
        updated[key] = {
          laboratoryId: selectedLaboratoryId,
          laboratoryName: labName,
          requestDate: laboratoryRequestDate,
        };
      });
      return updated;
    });

    setExpandedLabGroups((prev) => {
      if (!prev.includes(selectedLaboratoryId)) {
        return [...prev, selectedLaboratoryId];
      }
      return prev;
    });

    setLaboratoryModalVisible(false);
    setCheckedIndicators([]);
  };

  // Form submit
  const onFinish = async (values: any) => {
    if (samples.length === 0) {
      message.warning("Vui lòng thêm ít nhất một mẫu xét nghiệm");
      return;
    }

    // Validate: must have contractNumber for sample code generation
    const contractNumber = values.contractNumber;
    if (!contractNumber) {
      message.warning("Vui lòng nhập số hợp đồng");
      return;
    }

    // Note: Contract number duplicate validation is now done on the backend
    // Backend will return field-level validation errors if contract number exists

    // Validate: all samples must have sampleName
    const invalidSamples = samples.filter((s) => !s.sampleName);
    if (invalidSamples.length > 0) {
      message.warning("Vui lòng điền tên mẫu cho tất cả các mẫu");
      return;
    }

    // Validate: all samples must have at least one indicator
    const samplesWithoutIndicators = samples.filter((s) => {
      const hasIndicatorMethods = s.indicatorMethods && s.indicatorMethods.length > 0;
      const hasIndicatorIds = s.indicatorIds && s.indicatorIds.length > 0;
      return !hasIndicatorMethods && !hasIndicatorIds;
    });
    if (samplesWithoutIndicators.length > 0) {
      const sampleCodes = samplesWithoutIndicators.map((s) => s.sampleCode || s.sampleName).join(", ");
      message.warning(`Các mẫu sau chưa có chỉ tiêu: ${sampleCodes}`);
      return;
    }

    // Không validate khoa phòng - cho phép lưu mà không cần gán khoa phòng cho chỉ tiêu

    setLoading(true);
    try {
      // specimenTypeName will be resolved to specimenTypeId on backend
      // Backend will create new SpecimenType if name doesn't exist (case-insensitive)

      const sampleDtos = samples.map((sample, index) => {
        // Keep existing sampleCode (fixed, not regenerated)
        const sampleCode = sample.sampleCode;

        // Prefer indicatorMethods if available, fallback to indicatorIds
        const indicatorsList = sample.indicatorMethods && sample.indicatorMethods.length > 0
          ? sample.indicatorMethods.map((methodKey) => {
              const { indicatorId, testMethodId } = parseIndicatorMethodKey(methodKey);
              const indicatorDates = selectedIndicatorDates[methodKey];
              const methods = indicatorMethodsMap[indicatorId] || [];
              const method = methods.find((m) => m.testMethodId === testMethodId);
              const labAssignment = indicatorLaboratoryMap[`${sample.key}_${methodKey}`];
              // Get the TestRequestSampleIndicator.id if this indicator already exists
              const existingIndicatorId = sampleIndicatorIdMap[`${sample.key}_${methodKey}`];
              return {
                id: existingIndicatorId || undefined, // Include id for existing indicators
                indicatorId,
                testMethodId,
                laboratoryId: labAssignment?.laboratoryId || undefined,
                unitPrice: method?.unitPrice || 0,
                transferDate: indicatorDates?.transferDate?.format('YYYY-MM-DD') || undefined,
                requestDate:
                  labAssignment?.requestDate?.format('YYYY-MM-DD') ||
                  indicatorDates?.requestDate?.format('YYYY-MM-DD') ||
                  undefined,
                sentToDepartment: !!labAssignment || checkedIndicators.includes(methodKey),
              };
            })
          : sample.indicatorIds.map((indId) => {
              const indicatorDates = selectedIndicatorDates[indId];
              const indicator = indicators.find((i) => i.id === indId);
              const labAssignment = indicatorLaboratoryMap[`${sample.key}_${indId}`];
              // Get the TestRequestSampleIndicator.id if this indicator already exists
              const existingIndicatorId = sampleIndicatorIdMap[`${sample.key}_${indId}`];
              return {
                id: existingIndicatorId || undefined, // Include id for existing indicators
                indicatorId: indId,
                testMethodId: undefined,
                laboratoryId: labAssignment?.laboratoryId || undefined,
                unitPrice: indicator?.unitPrice || 0,
                transferDate: indicatorDates?.transferDate?.format('YYYY-MM-DD') || undefined,
                requestDate:
                  labAssignment?.requestDate?.format('YYYY-MM-DD') ||
                  indicatorDates?.requestDate?.format('YYYY-MM-DD') ||
                  undefined,
                sentToDepartment: !!labAssignment || checkedIndicators.includes(indId),
              };
            });

        return {
          id: sample.id,
          sortOrder: index + 1,
          sampleCode: sampleCode,
          sampleName: sample.sampleName,
          samplingAddress: sample.samplingAddress || undefined,
          sampleQuantity: sample.sampleQuantity || undefined,
          status: sample.status,
          statusText: sample.statusText || undefined,
          processingStatus: sample.processingStatus || undefined,
          notes: sample.notes || undefined,
          storageLocation: sample.storageLocation || undefined,
          specimenTypeId: sample.specimenTypeId || undefined,
          specimenTypeName: sample.specimenTypeName?.trim() || undefined, // Backend will resolve to ID
          isSharedSample: sample.isSharedSample || false, // Mẫu chung (Vi Sinh + Hóa)
          indicators: indicatorsList,
          // Attachments: send full info (fileId, fileName, fileSize)
          attachments: sample.attachments?.map((a) => ({
            fileId: a.fileId,
            fileName: a.fileName,
            fileSize: a.fileSize,
          })) || [],
        };
      });

      // Province and Ward: use text from form directly (editable select)
      // Code is stored separately for cascade filtering but text can be edited by user
      const provinceCode = provinces.find((p) => p.name === values.province)?.code;
      const wardCode = wards.find((w) => w.name === values.ward)?.code;

      const payload = {
        quotationId: sourceQuotationId || undefined,
        contractNumber: values.contractNumber || undefined,
        contractDate: values.contractDate ? values.contractDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        sentToAccounting: values.sentToAccounting || false,
        paymentReceived: values.paymentReceived || false,
        sentToDepartment: values.sentToDepartment || false,
        resultReturned: values.resultReturned || false,
        customerName: values.customerName,
        provinceCode: provinceCode || undefined,
        province: values.province || undefined,
        wardCode: wardCode || undefined,
        ward: values.ward || undefined,
        address: values.address || undefined,
        taxCode: values.taxCode || undefined,
        contactPerson: values.contactPerson || undefined,
        phone: values.phone || undefined,
        totalSampleCount: samples.length,
        methodWestHighlandInstitute: values.methodRequirement === "westHighlandInstitute",
        methodCustomer: values.methodRequirement === "customerRequest",
        methodCustomerDetail:
          values.methodRequirement === "customerRequest" ? values.methodCustomerDetail : undefined,
        resultLanguage: values.resultLanguage ?? ResultLanguage.Vietnamese,
        resultCopyCount: values.resultCopyCount || undefined,
        separatePassedResults: values.separatePassedResults || false,
        conformityDeclaration: values.conformityDeclaration || undefined,
        otherRequirements: values.otherRequirements || undefined,
        subContract: values.subContract || undefined,
        samplingRequirement: values.samplingRequirement ?? SamplingRequirement.CustomerSampling,
        deliveryDirectPickup: values.deliveryDirectPickup || false,
        deliveryPostal: values.deliveryPostal || false,
        returnStoredSample: values.returnStoredSample || false,
        sampleTypeService: values.sampleTypeService || false,
        sampleTypeContract: values.sampleTypeContract || false,
        sampleTypeTask: values.sampleTypeTask || false,
        sampleTypeSubContract: values.sampleTypeSubContract || false,
        resultDeliveryDate: values.expectedCompletionDate
          ? values.expectedCompletionDate.format('YYYY-MM-DD')
          : undefined,
        sampleStorage: values.sampleStorageOption ?? SampleStorageOption.No,
        totalCost: values.sampleTypeTask ? 0 : totalSampleCost,
        totalCostInWords:
          values.sampleTypeTask || totalSampleCost === 0
            ? ""
            : numberToVietnameseWords(totalSampleCost),
        receiptNumber: values.receiptNumber || undefined,
        changeRequest: values.changeRequest || undefined,
        agreeTerms: values.agreeTerms || false,
        requestDate: values.requestDate ? values.requestDate.format('YYYY-MM-DDTHH:mm:ss') : dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        notes: values.notes || undefined,
        expectedCompletionDate: values.expectedCompletionDate
          ? values.expectedCompletionDate.format('YYYY-MM-DD')
          : undefined,
        subcontractor: values.subcontractor || undefined,
        samples: sampleDtos,
      };

      if (isEditMode && id) {
        // Check if this edit requires approval
        if (isEditRequiresApproval()) {
          // Build change history from frontend comparison
          const changeHistory = buildChangeHistory(payload, sampleDtos);

          if (changeHistory.length === 0) {
            message.info("Không có thay đổi nào cần lưu");
            navigate(PATH_ROUTES.testRequests.detail(id));
            return;
          }

          // Send with change history
          await testRequestService.update(id, {
            ...payload,
            changeHistory // Frontend sends the changes
          });
          message.success("Yêu cầu thay đổi đã được gửi và đang chờ phê duyệt!");
          navigate(PATH_ROUTES.testRequests.detail(id));
        } else {
          await testRequestService.update(id, payload);
          message.success("Cập nhật phiếu yêu cầu thành công!");
          navigate(PATH_ROUTES.testRequests.detail(id));
        }
      } else {
        const testRequest = await testRequestService.create(payload);
        message.success(`Đã tạo phiếu yêu cầu XN: ${testRequest?.contractNumber}`);
        navigate(PATH_ROUTES.testRequests.detail(testRequest.id));
      }
    } catch (error: any) {
      console.error("Failed to save test request:", error);

      // Handle field-level validation errors from backend
      const errorData = error?.response?.data;
      if (errorData && typeof errorData === "object") {
        const fieldErrors: { name: string; errors: string[] }[] = [];
        const validFields = ["contractNumber", "customerName", "address", "taxCode", "phone"];

        for (const field of validFields) {
          if (errorData[field]) {
            const errorMessages = Array.isArray(errorData[field])
              ? errorData[field]
              : [errorData[field]];
            fieldErrors.push({ name: field, errors: errorMessages });
          }
        }

        if (fieldErrors.length > 0) {
          form.setFields(fieldErrors);
          message.error("Dữ liệu không hợp lệ, vui lòng kiểm tra lại");
          return;
        }
      }

      message.error(getApiErrorMessage(error, "Không thể lưu yêu cầu. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Preview test request form (BM05) with current form data
   * Opens PDF in new tab without saving to DB
   */
  const handlePreviewForm = async () => {
    try {
      // Validate required fields
      await form.validateFields(["customerName"]);
    } catch {
      message.warning("Vui lòng nhập tên khách hàng trước khi xem phiếu");
      return;
    }

    setLoading(true);
    try {
      const values = form.getFieldsValue();

      // Build preview input from form data
      const previewInput: PreviewTestRequestFormInput = {
        contractNumber: values.contractNumber || "",
        contractDate: values.contractDate ? values.contractDate.toISOString() : undefined,
        sentToAccounting: values.sentToAccounting || false,
        paymentReceived: values.paymentReceived || false,
        sentToDepartment: values.sentToDepartment || false,
        resultReturned: values.resultReturned || false,
        customerName: values.customerName || "",
        // Use text from form directly (editable select)
        provinceCode: provinces.find((p: any) => p.name === values.province)?.code || undefined,
        province: values.province || undefined,
        districtCode: values.districtCode || undefined,
        district: values.districtCode
          ? wards.find((w: any) => w.code === values.districtCode)?.name
          : undefined,
        wardCode: wards.find((w: any) => w.name === values.ward)?.code || undefined,
        ward: values.ward || undefined,
        address: values.address || undefined,
        taxCode: values.taxCode || undefined,
        contactPerson: values.contactPerson || undefined,
        phone: values.phone || undefined,
        totalSampleCount: samples.length,
        methodWestHighlandInstitute: values.methodWestHighlandInstitute || false,
        methodCustomer: values.methodCustomer || false,
        methodCustomerDetail: values.methodCustomerDetail || undefined,
        resultLanguage: values.resultLanguage ?? ResultLanguage.Vietnamese,
        resultCopyCount: values.resultCopyCount || undefined,
        separatePassedResults: values.separatePassedResults || false,
        conformityDeclaration: values.conformityDeclaration || undefined,
        otherRequirements: values.otherRequirements || undefined,
        subContract: values.subContract || undefined,
        samplingRequirement: values.samplingRequirement ?? SamplingRequirement.CustomerSampling,
        deliveryDirectPickup: values.deliveryDirectPickup || false,
        deliveryPostal: values.deliveryPostal || false,
        returnStoredSample: values.returnStoredSample || false,
        sampleTypeService: values.sampleTypeService || false,
        sampleTypeContract: values.sampleTypeContract || false,
        sampleTypeTask: values.sampleTypeTask || false,
        sampleTypeSubContract: values.sampleTypeSubContract || false,
        resultDeliveryDate: values.resultDeliveryDate
          ? values.resultDeliveryDate.toISOString()
          : undefined,
        sampleStorage: values.sampleStorageOption ?? SampleStorageOption.No,
        totalCost: totalSampleCost,
        totalCostInWords: numberToVietnameseWords(totalSampleCost),
        receiptNumber: values.receiptNumber || undefined,
        agreeTerms: values.agreeTerms || false,
        requestDate: values.requestDate
          ? values.requestDate.toISOString()
          : new Date().toISOString(),
        notes: values.notes || undefined,
        samples: samples.map((sample, index) => ({
          sortOrder: index + 1,
          sampleCode: sample.sampleCode || "",
          sampleName: sample.sampleName || "",
          samplingAddress: sample.samplingAddress || undefined,
          sampleQuantity: sample.sampleQuantity || undefined,
          statusText: sample.statusText || undefined,
          notes: sample.notes || undefined,
          indicators: (sample.indicatorMethods || []).map((methodKey: IndicatorMethodKey) => {
            const { indicatorId, testMethodId } = parseIndicatorMethodKey(methodKey);
            const indicator = indicators.find((ind: any) => ind.id === indicatorId);
            const method = indicatorMethodsMap[indicatorId]?.find(
              (m: IndicatorMethodInfo) => m.testMethodId === testMethodId
            );
            return {
              indicatorId,
              indicatorName: indicator?.name || "",
              unitPrice: method?.unitPrice || 0,
            };
          }),
        })),
      };

      const result = await testRequestService.previewTestRequestForm(previewInput);

      // Open PDF in new tab (same as In phiếu XN pattern)
      const pdfUrl = `${API_BASE_URL}/api/v1/result-forms/view/${encodeURIComponent(result.fileName)}`;
      window.open(pdfUrl, "_blank");

      message.success("Đã tạo phiếu xem trước");
    } catch (error: any) {
      console.error("Error previewing form:", error);
      message.error(getApiErrorMessage(error, "Không thể tạo phiếu xem trước. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  return {
    // Sample actions
    addSample,
    removeSample,
    updateSample,
    duplicateSample,
    printBarcode,

    // Indicator modal actions
    openIndicatorModal,
    handleIndicatorModalOk,
    handleIndicatorModalCancel,
    toggleIndicator,
    toggleIndicatorMethod,

    // Indicator date actions
    handleIndicatorDateChange,
    toggleCheckedIndicator,
    handleSelectAllIndicators,

    // Group selector
    handleGroupSelect,

    // Laboratory modal actions
    handleSendToLaboratory,
    handleConfirmSendToLaboratory,

    // Form submit
    onFinish,

    // Preview form
    handlePreviewForm,
  };
};
