// @ts-nocheck
import { message } from "antd";
import dayjs from "dayjs";
import { testRequestService } from "../../../../services/testRequestService";
import {
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
  SampleStatus,
} from "../../../../types/testRequest";
import { numberToVietnameseWords } from "../../../../utils/numberToWords";
import { SampleFormData, IndicatorDateInfo, LaboratoryAssignment } from "../types";
import { generateSampleCode, printBarcode as printBarcodeUtil } from "../utils";

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
  setIndicatorModalVisible: (visible: boolean) => void;
  setSelectedGroupFilter: (filter: string) => void;

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
  setIndicatorModalVisible,
  setSelectedGroupFilter,
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
}: UseTestRequestFormActionsProps) => {
  // Sample actions
  const addSample = () => {
    if (isSamplesLocked()) {
      message.warning("Không thể thêm mẫu khi phiếu đang thực hiện");
      return;
    }

    const nextIndex = samples.length + 1;
    const newSample: SampleFormData = {
      key: `new-${Date.now()}`,
      sortOrder: nextIndex,
      sampleCode: generateSampleCode(form.getFieldValue("contractNumber") || "", nextIndex),
      sampleName: "",
      samplingAddress: "",
      sampleQuantity: "",
      status: SampleStatus.Normal,
      statusText: "",
      processingStatus: "",
      notes: "",
      storageLocation: "",
      indicatorIds: [],
    };
    setSamples([...samples, newSample]);
  };

  const removeSample = (key: string) => {
    if (isSamplesLocked()) {
      message.warning("Không thể xóa mẫu khi phiếu đang thực hiện");
      return;
    }
    setSamples(samples.filter((s) => s.key !== key));
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

    const newSample: SampleFormData = {
      ...sourceSample,
      key: `new-${Date.now()}`,
      id: undefined,
      sortOrder: samples.length + 1,
      sampleCode: generateSampleCode(form.getFieldValue("contractNumber") || "", samples.length + 1),
    };

    const newLabMap = { ...indicatorLaboratoryMap };
    sourceSample.indicatorIds.forEach((indId) => {
      const sourceLabKey = `${key}_${indId}`;
      const newLabKey = `${newSample.key}_${indId}`;
      if (indicatorLaboratoryMap[sourceLabKey]) {
        newLabMap[newLabKey] = { ...indicatorLaboratoryMap[sourceLabKey] };
      }
    });
    setIndicatorLaboratoryMap(newLabMap);

    setSamples([...samples, newSample]);
    message.success("Đã nhân đôi mẫu thành công");
  };

  const printBarcode = (sampleCode: string, sampleName: string) => {
    printBarcodeUtil(sampleCode, sampleName);
  };

  // Indicator modal functions
  const openIndicatorModal = (sampleKey: string) => {
    if (isSamplesLocked()) {
      message.warning("Không thể thay đổi chỉ tiêu khi phiếu đang thực hiện");
      return;
    }

    const sample = samples.find((s) => s.key === sampleKey);
    if (sample) {
      setCurrentSampleKey(sampleKey);
      setTempSelectedIndicators([...sample.indicatorIds]);
      setSelectedGroupFilter("all");
      setIndicatorModalVisible(true);
    }
  };

  const handleIndicatorModalOk = () => {
    const unsentIndicators = tempSelectedIndicators.filter(
      (id) => !indicatorLaboratoryMap[`${currentSampleKey}_${id}`]
    );
    if (unsentIndicators.length > 0) {
      message.warning(
        `Còn ${unsentIndicators.length} chỉ tiêu chưa được gửi đến khoa phòng. Vui lòng gửi tất cả chỉ tiêu trước khi lưu.`
      );
      return;
    }

    if (currentSampleKey) {
      updateSample(currentSampleKey, "indicatorIds", tempSelectedIndicators);
    }
    setIndicatorModalVisible(false);
    setCurrentSampleKey(null);
  };

  const handleIndicatorModalCancel = () => {
    setIndicatorModalVisible(false);
    setCurrentSampleKey(null);
    setTempSelectedIndicators([]);
  };

  const toggleIndicator = (indicatorId: string) => {
    setTempSelectedIndicators((prev) => {
      if (prev.includes(indicatorId)) {
        return prev.filter((id) => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  // Indicator date handling
  const handleIndicatorDateChange = (
    indicatorId: string,
    field: "transferDate" | "requestDate",
    value: dayjs.Dayjs | null
  ) => {
    const currentDates = selectedIndicatorDates[indicatorId] || {};

    if (field === "transferDate" && value && currentDates.requestDate) {
      if (value.isAfter(currentDates.requestDate)) {
        message.warning("Ngày chuyển giao không được lớn hơn ngày yêu cầu");
        return;
      }
    }
    if (field === "requestDate" && value && currentDates.transferDate) {
      if (value.isBefore(currentDates.transferDate)) {
        message.warning("Ngày yêu cầu không được nhỏ hơn ngày chuyển giao");
        return;
      }
    }

    setSelectedIndicatorDates((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        [field]: value || undefined,
      },
    }));
  };

  const toggleCheckedIndicator = (indicatorId: string) => {
    setCheckedIndicators((prev) => {
      if (prev.includes(indicatorId)) {
        return prev.filter((id) => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  const handleSelectAllIndicators = (checked: boolean) => {
    if (checked) {
      setCheckedIndicators([...tempSelectedIndicators]);
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
    setLaboratoryRequestDate(null);
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

    message.success(`Đã gửi ${indicatorsToSend.length} chỉ tiêu đến ${labName}`);
    setLaboratoryModalVisible(false);
    setCheckedIndicators([]);
  };

  // Form submit
  const onFinish = async (values: any) => {
    if (!values.agreeTerms) {
      message.warning("Vui lòng đọc và đồng ý với quy định chung về yêu cầu dịch vụ thử nghiệm");
      return;
    }

    if (samples.length === 0) {
      message.warning("Vui lòng thêm ít nhất một mẫu xét nghiệm");
      return;
    }

    const invalidSamples = samples.filter((s) => !s.sampleCode || !s.sampleName);
    if (invalidSamples.length > 0) {
      message.warning("Vui lòng điền đầy đủ mã mẫu và tên mẫu cho tất cả các mẫu");
      return;
    }

    setLoading(true);
    try {
      const sampleDtos = samples.map((sample, index) => ({
        id: sample.id,
        sortOrder: index + 1,
        sampleCode: sample.sampleCode,
        sampleName: sample.sampleName,
        samplingAddress: sample.samplingAddress || undefined,
        sampleQuantity: sample.sampleQuantity || undefined,
        status: sample.status,
        statusText: sample.statusText || undefined,
        processingStatus: sample.processingStatus || undefined,
        notes: sample.notes || undefined,
        storageLocation: sample.storageLocation || undefined,
        indicators: sample.indicatorIds.map((indId) => {
          const indicatorDates = selectedIndicatorDates[indId];
          const indicator = indicators.find((i) => i.id === indId);
          const labAssignment = indicatorLaboratoryMap[`${sample.key}_${indId}`];
          return {
            indicatorId: indId,
            laboratoryId: labAssignment?.laboratoryId || undefined,
            unitPrice: indicator?.unitPrice || 0,
            transferDate: indicatorDates?.transferDate?.toISOString() || undefined,
            requestDate:
              labAssignment?.requestDate?.toISOString() ||
              indicatorDates?.requestDate?.toISOString() ||
              undefined,
            sentToDepartment: !!labAssignment || checkedIndicators.includes(indId),
          };
        }),
      }));

      const selectedProvince = provinces.find((p) => p.code === values.provinceCode);
      const selectedWard = wards.find((w) => w.code === values.wardCode);

      const payload = {
        contractNumber: values.contractNumber || undefined,
        contractDate: values.contractDate ? values.contractDate.toISOString() : undefined,
        sentToAccounting: values.sentToAccounting || false,
        paymentReceived: values.paymentReceived || false,
        sentToDepartment: values.sentToDepartment || false,
        resultReturned: values.resultReturned || false,
        customerName: values.customerName,
        provinceCode: values.provinceCode || undefined,
        province: selectedProvince?.name || undefined,
        wardCode: values.wardCode || undefined,
        ward: selectedWard?.name || undefined,
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
          ? values.expectedCompletionDate.toISOString()
          : undefined,
        sampleStorage: values.sampleStorageOption ?? SampleStorageOption.No,
        totalCost: values.sampleTypeTask ? 0 : totalSampleCost,
        totalCostInWords:
          values.sampleTypeTask || totalSampleCost === 0
            ? ""
            : numberToVietnameseWords(totalSampleCost),
        receiptNumber: values.receiptNumber || undefined,
        supervisorId: values.supervisorId || undefined,
        directorId: values.directorId || undefined,
        changeRequest: values.changeRequest || undefined,
        agreeTerms: values.agreeTerms || false,
        requestDate: values.requestDate ? values.requestDate.toISOString() : new Date().toISOString(),
        notes: values.notes || undefined,
        expectedCompletionDate: values.expectedCompletionDate
          ? values.expectedCompletionDate.toISOString()
          : undefined,
        subcontractor: values.subcontractor || undefined,
        samples: sampleDtos,
      };

      if (isEditMode && id) {
        await testRequestService.update(id, payload);
        message.success("Cập nhật yêu cầu thành công!");
      } else {
        await testRequestService.create(payload);
        message.success("Tạo yêu cầu thành công!");
      }
      navigate("/requests");
    } catch (error: any) {
      console.error("Failed to save test request:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể lưu yêu cầu. Vui lòng thử lại."
      );
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
  };
};
