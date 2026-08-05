// @ts-nocheck
import { message } from "antd";
import dayjs from "dayjs";
import { testRequestService, offlineTestRequestService, PreviewTestRequestFormInput } from "../../../../services/testRequestService";
import { specimenTypeService } from "../../../../services/masterDataService";
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
  PENDING_TEST_METHOD_ID,
  createIndicatorMethodKey,
  parseIndicatorMethodKey,
  isIndicatorLocked,
} from "../types";
import { generateSampleCode, getNextOrderNum, splitSampleCode, isNumericSuffix, printBarcode as printBarcodeUtil, SampleBarcodeInfo } from "../utils";
import { PATH_ROUTES } from "../../../../constants";
import { getApiErrorMessage } from "../../../../utils/errorHandler";
import { isHeavyMetalComboMet, isHgIndicator, isEcoliColiformComboMet, isEcoliIndicator } from "../constants";

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

  // Custom prices override (per sample + indicator method)
  customPrices: Record<string, number>;
  setCustomPrices: React.Dispatch<React.SetStateAction<Record<string, number>>>;

  // Draft management
  clearDraft: () => void;
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
  customPrices,
  setCustomPrices,
  clearDraft,
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
      'deliveryPostal', 'returnStoredSample', 'sampleTypeService', 'sampleTypeContract', 'sampleTypeTask', 'sampleTypeSubContract',
      'sampleStorage', 'totalCost', 'totalCostInWords',
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
        // Must match both testMethodId AND specimenTypeId to get correct method info
        const method = methods.find(
          (m) => m.testMethodId === ind.testMethodId && (m.specimenTypeId || null) === (ind.specimenTypeId || null)
        );
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

  const addExistingSample = (existingSample: any, selectedIndicators: any[]) => {
    if (isSamplesLocked()) {
      message.warning("Không thể thêm mẫu khi phiếu đang thực hiện");
      return;
    }

    const existingSampleCodes = samples.map((s) => s.sampleCode);
    const nextOrderNum = getNextOrderNum(existingSampleCodes);
    const contractNumber = form.getFieldValue("contractNumber") || "";

    const indicatorMethods: IndicatorMethodKey[] = selectedIndicators.map((ind) =>
      createIndicatorMethodKey(ind.indicatorId, ind.testMethodId || "null", ind.specimenTypeId)
    );

    const newSampleKey = `new-${Date.now()}`;
    const newSample: SampleFormData = {
      key: newSampleKey,
      sortOrder: samples.length + 1,
      sampleCode: generateSampleCode(contractNumber, nextOrderNum),
      sampleName: existingSample.sampleName || "",
      samplingAddress: "",
      sampleQuantity: existingSample.sampleQuantity || "",
      status: existingSample.status ?? SampleStatus.Normal,
      statusText: existingSample.statusText || "",
      processingStatus: "",
      notes: "",
      storageLocation: "",
      specimenTypeId: existingSample.specimenTypeId,
      specimenTypeName: existingSample.specimenTypeName || "",
      indicatorIds: [],
      indicatorMethods,
      attachments: [],
      isSharedSample: false,
    };

    // Set dates and custom prices from modal selections
    const now = dayjs();
    const newDates: Record<string, IndicatorDateInfo> = {};
    const newPrices: Record<string, number> = {};

    selectedIndicators.forEach((ind) => {
      const methodKey = createIndicatorMethodKey(ind.indicatorId, ind.testMethodId || "null", ind.specimenTypeId);
      const dateKey = `${newSampleKey}_${methodKey}`;
      newDates[dateKey] = {
        transferDate: ind.transferDate || now,
        requestDate: ind.requestDate || undefined,
      };
      // Set custom price from modal (user may have edited it)
      newPrices[dateKey] = ind.unitPrice;
    });

    setSelectedIndicatorDates((prev) => ({ ...prev, ...newDates }));
    setCustomPrices((prev) => ({ ...prev, ...newPrices }));
    setSamples([...samples, newSample]);
    message.success(`Đã thêm mẫu "${newSample.sampleName}" với ${selectedIndicators.length} chỉ tiêu`);
  };

  const removeSample = (key: string) => {
    if (isSamplesLocked()) {
      message.warning("Không thể xóa mẫu khi phiếu đang thực hiện");
      return;
    }

    // Không cho xóa mẫu có chỉ tiêu đã gửi tới khoa phòng
    const sample = samples.find((s) => s.key === key);
    if (sample) {
      const hasSentIndicator = (sample.indicatorMethods || []).some((methodKey) => {
        const labMapKey = `${key}_${methodKey}`;
        const labInfo = indicatorLaboratoryMap[labMapKey];
        return isIndicatorLocked(labInfo);
      });
      if (hasSentIndicator) {
        message.warning("Không thể xóa mẫu có chỉ tiêu đã gửi tới khoa phòng");
        return;
      }
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

  // Commit mã mẫu người dùng nhập tay (gọi khi blur/Enter khỏi ô Mã mẫu).
  // Trả về true nếu chấp nhận; false nếu từ chối (ô nhập tự revert về mã cũ).
  const commitSampleCode = (key: string, newCode: string): boolean => {
    if (isSamplesLocked()) {
      return false;
    }

    const editedIndex = samples.findIndex((s) => s.key === key);
    if (editedIndex < 0) return false;

    const trimmedCode = (newCode || "").trim();
    const contractNumber = form.getFieldValue("contractNumber") || "";
    const expectedPrefix = contractNumber || "--";
    const { prefix, suffix } = splitSampleCode(trimmedCode);

    if (!trimmedCode || !suffix || prefix !== expectedPrefix) {
      message.error("Mã mẫu không được khác số hợp đồng");
      return false;
    }

    let nextSamples: SampleFormData[];
    if (isNumericSuffix(suffix)) {
      // Suffix là số: các dòng SAU dòng đang sửa tăng dần theo số vừa nhập
      // (sửa 26022/01 -> 26022/05 thì dòng sau thành 26022/06, 26022/07...)
      const editedNum = parseInt(suffix, 10);
      const padLength = Math.max(suffix.length, 2);
      nextSamples = samples.map((s, i) => {
        if (i === editedIndex) return { ...s, sampleCode: trimmedCode };
        if (i > editedIndex) {
          const orderNum = String(editedNum + (i - editedIndex)).padStart(padLength, "0");
          return { ...s, sampleCode: `${expectedPrefix}/${orderNum}` };
        }
        return s;
      });
    } else {
      // Suffix không phải số: chỉ lưu cho dòng này, không tự điều chỉnh các mã khác
      nextSamples = samples.map((s) =>
        s.key === key ? { ...s, sampleCode: trimmedCode } : s
      );
    }

    const isDuplicate = nextSamples.some(
      (s, i) => i !== editedIndex && s.sampleCode === trimmedCode
    );
    if (isDuplicate) {
      message.warning(`Mã mẫu ${trimmedCode} đang trùng với mẫu khác trong danh sách`);
    }

    setSamples(nextSamples);
    return true;
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
        newLabMap[newLabKey] = {
          ...indicatorLaboratoryMap[sourceLabKey],
          approvalStatus: undefined,
          isSentToQLKT: false,
          sentToDepartment: false,
        };
      }
    });
    // Backward compatible: also copy for indicatorIds
    sourceSample.indicatorIds.forEach((indId) => {
      const sourceLabKey = `${key}_${indId}`;
      const newLabKey = `${newSample.key}_${indId}`;
      if (indicatorLaboratoryMap[sourceLabKey]) {
        newLabMap[newLabKey] = {
          ...indicatorLaboratoryMap[sourceLabKey],
          approvalStatus: undefined,
          isSentToQLKT: false,
          sentToDepartment: false,
        };
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

  // Helper: Get all sub-indicator keys for a parent indicator + method + specimenType
  const getSubIndicatorKeysForParent = (
    parentIndicatorId: string,
    testMethodId: string,
    specimenTypeId?: string | null
  ): IndicatorMethodKey[] => {
    const subKeys: IndicatorMethodKey[] = [];
    // Normalize specimenTypeId: treat null, undefined, and empty string as equivalent
    const normalizedSpecimenTypeId = specimenTypeId || null;
    Object.entries(indicatorMethodsMap).forEach(([indId, methods]) => {
      methods.forEach((method) => {
        // Normalize method's specimenTypeId the same way
        const methodSpecimenTypeId = method.specimenTypeId || null;
        if (
          method.testMethodId === testMethodId &&
          method.parentIndicatorId === parentIndicatorId &&
          method.isActive &&
          methodSpecimenTypeId === normalizedSpecimenTypeId
        ) {
          subKeys.push(createIndicatorMethodKey(indId, testMethodId, method.specimenTypeId));
        }
      });
    });
    return subKeys;
  };

  // Helper: Check if an indicator is a sub-indicator for a given method + specimenType
  const isSubIndicatorForMethod = (
    indicatorId: string,
    testMethodId: string,
    specimenTypeId?: string
  ): boolean => {
    const methods = indicatorMethodsMap[indicatorId];
    if (!methods) return false;
    const methodInfo = methods.find(
      (m) => m.testMethodId === testMethodId &&
        (m.specimenTypeId || null) === (specimenTypeId || null)
    );
    return !!methodInfo?.parentIndicatorId;
  };

  // Toggle indicator method (indicatorId + testMethodId + specimenTypeId)
  // Auto-adds sub-indicators when selecting a parent indicator
  const toggleIndicatorMethod = (indicatorId: string, testMethodId: string, specimenTypeId?: string) => {
    const key = createIndicatorMethodKey(indicatorId, testMethodId, specimenTypeId);
    const isCurrentlySelected = tempSelectedIndicatorMethods.includes(key);

    // Không cho bỏ chọn chỉ tiêu đã gửi tới khoa phòng
    if (isCurrentlySelected && currentSampleKey) {
      const labMapKey = `${currentSampleKey}_${key}`;
      const labInfo = indicatorLaboratoryMap[labMapKey];
      if (isIndicatorLocked(labInfo)) {
        return; // Chỉ tiêu đã gửi, không cho bỏ chọn
      }
    }

    // Check if this is a sub-indicator (has parentIndicatorId)
    const isSub = isSubIndicatorForMethod(indicatorId, testMethodId, specimenTypeId);

    // Get sub-indicator keys if this is a parent
    const subKeys = isSub ? [] : getSubIndicatorKeysForParent(indicatorId, testMethodId, specimenTypeId);

    setTempSelectedIndicatorMethods((prev) => {
      if (isCurrentlySelected) {
        // REMOVE: If removing parent, also remove all its subs
        const keysToRemove = [key, ...subKeys];

        // Clear dates for all removed keys
        setSelectedIndicatorDates((dates) => {
          const updated = { ...dates };
          keysToRemove.forEach((k) => {
            delete updated[k];
          });
          return updated;
        });

        return prev.filter((k) => !keysToRemove.includes(k));
      } else {
        // ADD: If adding parent, also auto-add all its subs
        const keysToAdd = [key, ...subKeys];

        // Set dates for all added keys
        setSelectedIndicatorDates((dates) => {
          const updated = { ...dates };
          keysToAdd.forEach((k) => {
            if (!updated[k]) {
              updated[k] = {
                transferDate: dayjs(),
                requestDate: undefined, // Để trống theo yêu cầu KH
              };
            }
          });
          return updated;
        });

        // Filter out keys that are already in prev to avoid duplicates
        const newKeys = keysToAdd.filter((k) => !prev.includes(k));
        return [...prev, ...newKeys];
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
      // Select all unsent indicator methods, excluding sub-indicators
      // (sub-indicators follow their parent automatically)
      const unsentMethods = tempSelectedIndicatorMethods.filter((key) => {
        // Check if already sent
        if (indicatorLaboratoryMap[`${currentSampleKey}_${key}`]) {
          return false;
        }
        // Check if this is a sub-indicator (has parentIndicatorId)
        const { indicatorId, testMethodId } = parseIndicatorMethodKey(key);
        if (isSubIndicatorForMethod(indicatorId, testMethodId)) {
          return false;
        }
        return true;
      });
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

    // Include sub-indicators automatically when parent is checked
    const indicatorsWithSubs: string[] = [];
    checkedIndicators.forEach((key) => {
      indicatorsWithSubs.push(key);
      // Get sub-indicator keys for this indicator (including specimenTypeId)
      const { indicatorId, testMethodId, specimenTypeId } = parseIndicatorMethodKey(key as IndicatorMethodKey);
      const subKeys = getSubIndicatorKeysForParent(indicatorId, testMethodId, specimenTypeId || undefined);
      // Add subs that are in tempSelectedIndicatorMethods
      subKeys.forEach((subKey) => {
        if (
          tempSelectedIndicatorMethods.includes(subKey) &&
          !indicatorsWithSubs.includes(subKey)
        ) {
          indicatorsWithSubs.push(subKey);
        }
      });
    });

    setIndicatorsToSend(indicatorsWithSubs);

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
        const existing = prev[key];
        updated[key] = {
          laboratoryId: selectedLaboratoryId,
          laboratoryName: labName,
          requestDate: laboratoryRequestDate,
          sentToDepartment: existing?.sentToDepartment,
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
    const selectedSampleTypes: string[] = Array.isArray(values.sampleType)
      ? values.sampleType
      : values.sampleType
        ? [values.sampleType]
        : [];
    const sampleTypeService = selectedSampleTypes.includes("service");
    const sampleTypeContract = selectedSampleTypes.includes("contract");
    const sampleTypeTask = selectedSampleTypes.includes("task");
    const sampleTypeSubContract = selectedSampleTypes.includes("subContract");
    const normalizedSubContract = sampleTypeSubContract
      ? values.subContract?.trim()
      : undefined;

    if (samples.length === 0) {
      message.warning("Vui lòng thêm ít nhất một mẫu xét nghiệm");
      return;
    }

    if (selectedSampleTypes.length === 0) {
      message.warning("Vui lòng chọn ít nhất một loại hình mẫu");
      return;
    }

    if (sampleTypeSubContract && !normalizedSubContract) {
      message.warning("Vui lòng nhập hợp đồng phụ");
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

    // Validate: mã mẫu (có thể đã sửa tay) phải theo số hợp đồng
    const mismatchedSamples = samples.filter(
      (s) => splitSampleCode(s.sampleCode || "").prefix !== contractNumber
    );
    if (mismatchedSamples.length > 0) {
      message.error("Mã mẫu không được khác số hợp đồng");
      return;
    }

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

        // Group indicator names by specimenTypeId để check combo riêng từng loại mẫu
        const groupedBySpecimenType: Record<string, (string | undefined)[]> = {};
        for (const mk of (sample.indicatorMethods || [])) {
          const { indicatorId, specimenTypeId: stId } = parseIndicatorMethodKey(mk);
          const ind = indicators.find((i) => i.id === indicatorId);
          const key = stId || '_none';
          if (!groupedBySpecimenType[key]) groupedBySpecimenType[key] = [];
          groupedBySpecimenType[key].push(ind?.name);
        }
        const comboMetBySpecimenType: Record<string, boolean> = {};
        const ecoliComboMetBySpecimenType: Record<string, boolean> = {};
        for (const [stId, names] of Object.entries(groupedBySpecimenType)) {
          const st = stId !== '_none' ? specimenTypes.find((s: any) => s.id === stId) : null;
          comboMetBySpecimenType[stId] = isHeavyMetalComboMet(names, st?.sampleTypeCategoryName, st?.name);
          ecoliComboMetBySpecimenType[stId] = isEcoliColiformComboMet(names, st?.sampleTypeCategoryName, st?.name);
        }

        // Prefer indicatorMethods if available, fallback to indicatorIds
        const indicatorsList = sample.indicatorMethods && sample.indicatorMethods.length > 0
          ? sample.indicatorMethods.map((methodKey) => {
              const { indicatorId, testMethodId, specimenTypeId } = parseIndicatorMethodKey(methodKey);
              const indicatorDates = selectedIndicatorDates[methodKey];
              const methods = indicatorMethodsMap[indicatorId] || [];
              // Must match both testMethodId AND specimenTypeId to get correct price
              const method = methods.find(
                (m) => m.testMethodId === testMethodId && (m.specimenTypeId || null) === specimenTypeId
              );
              const labAssignment = indicatorLaboratoryMap[`${sample.key}_${methodKey}`];
              // Get the TestRequestSampleIndicator.id if this indicator already exists
              const existingIndicatorId = sampleIndicatorIdMap[`${sample.key}_${methodKey}`];
              // Combo miễn phí: Hg (kim loại nặng, per specimen type) hoặc E.Coli (E.Coli + Coliform, per specimen type)
              const ind = indicators.find((i) => i.id === indicatorId);
              const stComboKey = specimenTypeId || '_none';
              const isComboFree = (comboMetBySpecimenType[stComboKey] && isHgIndicator(ind?.name)) ||
                (ecoliComboMetBySpecimenType[stComboKey] && isEcoliIndicator(ind?.name));
              const customPriceKey = `${sample.key}_${methodKey}`;
              const masterPrice = method?.unitPrice || 0;
              const effectivePrice = customPrices[customPriceKey] !== undefined ? customPrices[customPriceKey] : masterPrice;
              return {
                id: existingIndicatorId || undefined, // Include id for existing indicators
                indicatorId,
                testMethodId:
                  testMethodId === PENDING_TEST_METHOD_ID
                    ? undefined
                    : testMethodId,
                specimenTypeId: specimenTypeId || undefined, // Include specimenTypeId to correctly identify price
                laboratoryId: labAssignment?.laboratoryId || undefined,
                unitPrice: isComboFree ? 0 : effectivePrice,
                originalUnitPrice: isComboFree ? masterPrice : undefined,
                transferDate: indicatorDates?.transferDate?.format('YYYY-MM-DD') || undefined,
                requestDate:
                  labAssignment?.requestDate?.format('YYYY-MM-DD') ||
                  indicatorDates?.requestDate?.format('YYYY-MM-DD') ||
                  undefined,
                sentToDepartment: (!!labAssignment && labAssignment.sentToDepartment === true) || checkedIndicators.includes(methodKey),
                isSubcontract: method?.isSubcontract || false,
              };
            })
          : sample.indicatorIds.map((indId) => {
              const indicatorDates = selectedIndicatorDates[indId];
              const indicator = indicators.find((i) => i.id === indId);
              const labAssignment = indicatorLaboratoryMap[`${sample.key}_${indId}`];
              // Get the TestRequestSampleIndicator.id if this indicator already exists
              const existingIndicatorId = sampleIndicatorIdMap[`${sample.key}_${indId}`];
              // Combo miễn phí (fallback logic - no specimenTypeId, check _none group)
              const isComboFree = (comboMetBySpecimenType['_none'] && isHgIndicator(indicator?.name)) ||
                (ecoliComboMetBySpecimenType['_none'] && isEcoliIndicator(indicator?.name));
              const fallbackCustomKey = `${sample.key}_${indId}`;
              const fallbackMasterPrice = indicator?.unitPrice || 0;
              const fallbackEffectivePrice = customPrices[fallbackCustomKey] !== undefined ? customPrices[fallbackCustomKey] : fallbackMasterPrice;
              return {
                id: existingIndicatorId || undefined, // Include id for existing indicators
                indicatorId: indId,
                testMethodId: undefined,
                laboratoryId: labAssignment?.laboratoryId || undefined,
                unitPrice: isComboFree ? 0 : fallbackEffectivePrice,
                originalUnitPrice: isComboFree ? fallbackMasterPrice : undefined,
                transferDate: indicatorDates?.transferDate?.format('YYYY-MM-DD') || undefined,
                requestDate:
                  labAssignment?.requestDate?.format('YYYY-MM-DD') ||
                  indicatorDates?.requestDate?.format('YYYY-MM-DD') ||
                  undefined,
                sentToDepartment: (!!labAssignment && labAssignment.sentToDepartment === true) || checkedIndicators.includes(indId),
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
        contractDate: values.contractDate ? values.contractDate.format('YYYY-MM-DDTHH:mm:ssZZ') : undefined,
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
        subContract: normalizedSubContract,
        samplingRequirement: values.samplingRequirement ?? SamplingRequirement.CustomerSampling,
        deliveryDirectPickup: values.deliveryDirectPickup || false,
        deliveryPostal: values.deliveryPostal || false,
        returnStoredSample: values.returnStoredSample || false,
        sampleTypeService,
        sampleTypeContract,
        sampleTypeTask,
        sampleTypeSubContract,
        resultDeliveryDate: values.expectedCompletionDate
          ? values.expectedCompletionDate.format('YYYY-MM-DD')
          : undefined,
        sampleStorage: values.sampleStorageOption ?? SampleStorageOption.No,
        totalCost: sampleTypeTask ? 0 : totalSampleCost,
        totalCostInWords:
          sampleTypeTask || totalSampleCost === 0
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
        // [TEMPORARY] Tạm tắt approval flow - luôn update trực tiếp
        // [OLD LOGIC] Check if this edit requires approval
        // if (isEditRequiresApproval()) {
        //   const changeHistory = buildChangeHistory(payload, sampleDtos);
        //   if (changeHistory.length === 0) {
        //     message.info("Không có thay đổi nào cần lưu");
        //     navigate(PATH_ROUTES.testRequests.detail(id));
        //     return;
        //   }
        //   const updateResponse = await offlineTestRequestService.update(id, {
        //     ...payload,
        //     changeHistory
        //   });
        //   if (updateResponse.isOffline) {
        //     message.warning("Đã lưu thay đổi tạm thời (chế độ offline). Dữ liệu sẽ được đồng bộ khi có kết nối.");
        //   } else {
        //     message.success("Yêu cầu thay đổi đã được gửi và đang chờ phê duyệt!");
        //   }
        //   navigate(PATH_ROUTES.testRequests.detail(id));
        // } else {

        // [TEMPORARY] Luôn update trực tiếp không cần approval
        {
          const updateResponse = await offlineTestRequestService.update(id, payload);
          if (updateResponse.isOffline) {
            message.warning("Đã lưu cập nhật tạm thời (chế độ offline). Dữ liệu sẽ được đồng bộ khi có kết nối.");
          } else {
            message.success("Cập nhật phiếu yêu cầu thành công!");
          }
          clearDraft();
          navigate(PATH_ROUTES.testRequests.detail(id));
        }
      } else {
        // Use offline-aware service for create
        const response = await offlineTestRequestService.create(payload);
        const testRequest = response.data;

        if (response.isOffline) {
          message.warning(`Đã lưu phiếu yêu cầu tạm thời (chế độ offline). Dữ liệu sẽ được đồng bộ khi có kết nối.`);
        } else {
          message.success(`Đã tạo phiếu yêu cầu XN: ${testRequest?.contractNumber}`);
        }
        clearDraft();
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
      const selectedSampleTypes: string[] = Array.isArray(values.sampleType)
        ? values.sampleType
        : values.sampleType
          ? [values.sampleType]
          : [];
      const sampleTypeService = selectedSampleTypes.includes("service");
      const sampleTypeContract = selectedSampleTypes.includes("contract");
      const sampleTypeTask = selectedSampleTypes.includes("task");
      const sampleTypeSubContract = selectedSampleTypes.includes("subContract");
      const normalizedSubContract = sampleTypeSubContract
        ? values.subContract?.trim()
        : undefined;

      // Build preview input from form data
      const previewInput: PreviewTestRequestFormInput = {
        contractNumber: values.contractNumber || "",
        contractDate: values.contractDate ? values.contractDate.format('YYYY-MM-DDTHH:mm:ssZZ') : undefined,
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
        subContract: normalizedSubContract,
        samplingRequirement: values.samplingRequirement ?? SamplingRequirement.CustomerSampling,
        deliveryDirectPickup: values.deliveryDirectPickup || false,
        deliveryPostal: values.deliveryPostal || false,
        returnStoredSample: values.returnStoredSample || false,
        sampleTypeService,
        sampleTypeContract,
        sampleTypeTask,
        sampleTypeSubContract,
        resultDeliveryDate: values.resultDeliveryDate
          ? values.resultDeliveryDate.toISOString()
          : undefined,
        sampleStorage: values.sampleStorageOption ?? SampleStorageOption.No,
        totalCost: sampleTypeTask ? 0 : totalSampleCost,
        totalCostInWords:
          sampleTypeTask || totalSampleCost === 0
            ? ""
            : numberToVietnameseWords(totalSampleCost),
        receiptNumber: values.receiptNumber || undefined,
        agreeTerms: values.agreeTerms || false,
        requestDate: values.requestDate
          ? values.requestDate.toISOString()
          : new Date().toISOString(),
        notes: values.notes || undefined,
        samples: samples.map((sample, index) => {
          // Group by specimenTypeId để check combo riêng từng loại mẫu
          const previewGrouped: Record<string, (string | undefined)[]> = {};
          for (const mk of (sample.indicatorMethods || [])) {
            const { indicatorId: iId, specimenTypeId: stId } = parseIndicatorMethodKey(mk);
            const ind = indicators.find((i) => i.id === iId);
            const gKey = stId || '_none';
            if (!previewGrouped[gKey]) previewGrouped[gKey] = [];
            previewGrouped[gKey].push(ind?.name);
          }
          const previewComboByType: Record<string, boolean> = {};
          const previewEcoliComboByType: Record<string, boolean> = {};
          for (const [stId, names] of Object.entries(previewGrouped)) {
            const st = stId !== '_none' ? specimenTypes.find((s: any) => s.id === stId) : null;
            previewComboByType[stId] = isHeavyMetalComboMet(names, st?.sampleTypeCategoryName, st?.name);
            previewEcoliComboByType[stId] = isEcoliColiformComboMet(names, st?.sampleTypeCategoryName, st?.name);
          }
          return {
            sortOrder: index + 1,
            sampleCode: sample.sampleCode || "",
            sampleName: sample.sampleName || "",
            samplingAddress: sample.samplingAddress || undefined,
            sampleQuantity: sample.sampleQuantity || undefined,
            statusText: sample.statusText || undefined,
            notes: sample.notes || undefined,
            indicators: (sample.indicatorMethods || []).map((methodKey: IndicatorMethodKey) => {
              const { indicatorId, testMethodId, specimenTypeId } = parseIndicatorMethodKey(methodKey);
              const indicator = indicators.find((ind: any) => ind.id === indicatorId);
              const methods = indicatorMethodsMap[indicatorId] || [];
              const method = methods.find(
                (m: IndicatorMethodInfo) => m.testMethodId === testMethodId && (m.specimenTypeId || null) === specimenTypeId
              );
              const previewStKey = specimenTypeId || '_none';
              const isComboFree = (previewComboByType[previewStKey] && isHgIndicator(indicator?.name)) ||
                (previewEcoliComboByType[previewStKey] && isEcoliIndicator(indicator?.name));
              const previewCustomKey = `${sample.key}_${methodKey}`;
              const previewMasterPrice = method?.unitPrice || 0;
              const previewEffectivePrice = customPrices[previewCustomKey] !== undefined ? customPrices[previewCustomKey] : previewMasterPrice;
              return {
                indicatorId,
                testMethodId:
                  testMethodId && testMethodId !== PENDING_TEST_METHOD_ID
                    ? testMethodId
                    : undefined,
                specimenTypeId: specimenTypeId || undefined,
                indicatorName: indicator?.name || "",
                indicatorFormattedName: indicator?.formattedName || undefined,
                unitPrice: isComboFree ? 0 : previewEffectivePrice,
                originalUnitPrice: isComboFree ? previewMasterPrice : undefined,
              };
            }),
          };
        }),
      };

      const result = await testRequestService.previewTestRequestForm(previewInput);

      // Open Word Editor (BE now returns .docx directly)
      const editorUrl = `/document-editor?file=${encodeURIComponent(result.fileName)}`;
      window.open(editorUrl, "_blank");

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
    addExistingSample,
    removeSample,
    updateSample,
    commitSampleCode,
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
