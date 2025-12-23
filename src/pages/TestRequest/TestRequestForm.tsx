// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { Form, Card, Divider, Button, Space, Row, Col, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

// RTK Query imports
import {
  useGetTestRequestQuery,
  useCreateTestRequestMutation,
  useUpdateTestRequestMutation,
} from "../../store/api/testRequestApi";

// Types
import {
  TestRequestStatus,
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
  canEditTestRequest,
  canEditFullInfo,
} from "../../types/testRequest";
import { SampleFormData } from "./types";

// Hooks
import { useMasterData, useOrganizationSearch } from "./hooks/useMasterData";
import { useSampleManagement } from "./hooks/useSampleManagement";
import { useIndicatorModal } from "./hooks/useIndicatorModal";
import { useLaboratoryModal } from "./hooks/useLaboratoryModal";
import { useVietnamLocations } from "./hooks/useVietnamLocations";

// Constants
import { FORM_MESSAGES, FORM_INITIAL_VALUES, LOCKED_FIELDS } from "./constants";

// Form Sections
import {
  ContractInfoSection,
  CustomerInfoSection,
  SampleTypeSection,
  MethodSection,
  ResultSection,
  SamplingSection,
  CostSection,
  PersonnelSection,
  OtherInfoSection,
  HiddenFields,
  SampleTableSection,
} from "./components/form";

// Modals
import {
  IndicatorModal,
  LaboratoryModal,
  GroupSelectorModal,
} from "./components/modals";

import "./TestRequestForm.css";

// Helper to format date without timezone shift (keeps local date)
const formatDateForApi = (date: dayjs.Dayjs | null | undefined): string | undefined => {
  if (!date) return undefined;
  // Format as ISO string but use start of day in local timezone
  return date.startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
};

const TestRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEditMode = !!id;

  // Current status for field locking
  const [currentStatus, setCurrentStatus] = useState<TestRequestStatus | null>(null);
  const [methodCustomerChecked, setMethodCustomerChecked] = useState(false);

  // RTK Query hooks
  const { data: testRequestData, isLoading: loadingData } = useGetTestRequestQuery(id!, {
    skip: !isEditMode,
  });
  const [createTestRequest] = useCreateTestRequestMutation();
  const [updateTestRequest] = useUpdateTestRequestMutation();

  // Custom hooks
  const {
    indicatorGroups,
    indicators,
    laboratories,
    users,
    organizations,
  } = useMasterData();

  const { organizationOptions, organizationSearching, handleOrganizationSearch } =
    useOrganizationSearch(organizations);

  const {
    provinces,
    districts,
    wards,
    setWards,
    loadDistricts,
    loadWards,
    loadLocationsFromData,
  } = useVietnamLocations();

  // Field locking helpers
  const isFieldLocked = useCallback(
    (fieldName: string): boolean => {
      if (!isEditMode || currentStatus === null) return false;
      if (!canEditFullInfo(currentStatus)) {
        return LOCKED_FIELDS.includes(fieldName);
      }
      return false;
    },
    [isEditMode, currentStatus]
  );

  const isSamplesLocked = useCallback((): boolean => {
    if (!isEditMode || currentStatus === null) return false;
    return !canEditFullInfo(currentStatus);
  }, [isEditMode, currentStatus]);

  // Sample management
  const {
    samples,
    setSamples,
    totalSampleCost,
    addSample,
    removeSample,
    updateSample,
  } = useSampleManagement({ isSamplesLocked, indicators });

  // Indicator modal
  const indicatorModal = useIndicatorModal({
    samples,
    updateSample,
    isSamplesLocked,
    indicators,
    indicatorGroups,
  });

  // Laboratory modal
  const laboratoryModal = useLaboratoryModal({
    checkedIndicators: indicatorModal.checkedIndicators,
    setCheckedIndicators: indicatorModal.setCheckedIndicators,
    currentSampleKey: indicatorModal.currentSampleKey,
    laboratories,
    setSelectedIndicatorDates: indicatorModal.setSelectedIndicatorDates,
    setIndicatorLaboratoryMap: indicatorModal.setIndicatorLaboratoryMap,
    setExpandedLabGroups: indicatorModal.setExpandedLabGroups,
  });

  // Load edit data
  useEffect(() => {
    if (isEditMode && testRequestData) {
      loadDataFromQuery(testRequestData);
    }
  }, [testRequestData, isEditMode]);

  const loadDataFromQuery = (data: any) => {
    setCurrentStatus(data.status);

    if (!canEditTestRequest(data.status)) {
      message.warning(FORM_MESSAGES.cannotEdit);
      navigate(`/test-request/${id}`);
      return;
    }

    loadLocationsFromData(data.provinceCode, data.districtCode);

    form.setFieldsValue({
      ...data,
      contractDate: data.contractDate ? dayjs(data.contractDate) : null,
      requestDate: data.requestDate ? dayjs(data.requestDate) : null,
      expectedCompletionDate: data.expectedCompletionDate
        ? dayjs(data.expectedCompletionDate)
        : null,
      samplingDate: data.samplingDate ? dayjs(data.samplingDate) : null,
      samplingTime: data.samplingTime ? dayjs(data.samplingTime, "HH:mm") : null,
      sampleStorageEndDate: data.sampleStorageEndDate
        ? dayjs(data.sampleStorageEndDate)
        : null,
    });

    if (data.methodCustomer) {
      setMethodCustomerChecked(true);
    }

    // Load samples
    if (data.samples && data.samples.length > 0) {
      const sampleData: SampleFormData[] = data.samples.map((sample: any, index: number) => ({
        key: sample.id || `sample-${index}`,
        id: sample.id,
        sortOrder: sample.sortOrder,
        sampleCode: sample.sampleCode,
        sampleName: sample.sampleName,
        samplingAddress: sample.samplingAddress,
        sampleQuantity: sample.sampleQuantity,
        status: sample.status,
        statusText: sample.statusText || "",
        processingStatus: sample.processingStatus || "",
        notes: sample.notes,
        storageLocation: sample.storageLocation,
        indicatorIds: sample.indicators?.map((ind: any) => ind.indicatorId) || [],
      }));
      setSamples(sampleData);

      // Restore indicator dates and laboratory assignments
      const restoredDates: Record<string, { transferDate?: dayjs.Dayjs; requestDate?: dayjs.Dayjs }> = {};
      const restoredChecked: string[] = [];
      const restoredLabMap: Record<string, any> = {};
      const expandedLabs: string[] = [];

      data.samples.forEach((sample: any, sampleIndex: number) => {
        const sampleKey = sample.id || `sample-${sampleIndex}`;
        sample.indicators?.forEach((ind: any) => {
          restoredDates[ind.indicatorId] = {
            transferDate: ind.transferDate ? dayjs(ind.transferDate) : undefined,
            requestDate: ind.requestDate ? dayjs(ind.requestDate) : undefined,
          };
          if (ind.sentToDepartment) {
            restoredChecked.push(ind.indicatorId);
          }
          if (ind.laboratoryId && ind.laboratoryName) {
            restoredLabMap[`${sampleKey}_${ind.indicatorId}`] = {
              laboratoryId: ind.laboratoryId,
              laboratoryName: ind.laboratoryName,
              requestDate: ind.requestDate ? dayjs(ind.requestDate) : dayjs(),
            };
            if (!expandedLabs.includes(ind.laboratoryId)) {
              expandedLabs.push(ind.laboratoryId);
            }
          }
        });
      });

      indicatorModal.setSelectedIndicatorDates(restoredDates);
      indicatorModal.setCheckedIndicators(restoredChecked);
      indicatorModal.setIndicatorLaboratoryMap(restoredLabMap);
      indicatorModal.setExpandedLabGroups(expandedLabs);
    }
  };

  const onFinish = async (values: any) => {
    if (samples.length === 0) {
      message.warning(FORM_MESSAGES.noSamples);
      return;
    }

    const invalidSamples = samples.filter((s) => !s.sampleCode || !s.sampleName);
    if (invalidSamples.length > 0) {
      message.warning(FORM_MESSAGES.invalidSamples);
      return;
    }

    setSaving(true);
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
          const indicatorDates = indicatorModal.selectedIndicatorDates[indId];
          const indicator = indicators.find((i) => i.id === indId);
          const labAssignment = indicatorModal.indicatorLaboratoryMap[`${sample.key}_${indId}`];
          return {
            indicatorId: indId,
            laboratoryId: labAssignment?.laboratoryId || undefined,
            unitPrice: indicator?.unitPrice || 0,
            transferDate: formatDateForApi(indicatorDates?.transferDate),
            requestDate: formatDateForApi(labAssignment?.requestDate) ||
              formatDateForApi(indicatorDates?.requestDate),
            sentToDepartment: !!labAssignment || indicatorModal.checkedIndicators.includes(indId),
          };
        }),
      }));

      const selectedProvince = provinces.find((p) => p.code === values.provinceCode);
      const selectedDistrict = districts.find((d) => d.code === values.districtCode);
      const selectedWard = wards.find((w) => w.code === values.wardCode);

      const payload = {
        contractNumber: values.contractNumber || undefined,
        contractDate: formatDateForApi(values.contractDate),
        sentToAccounting: values.sentToAccounting || false,
        paymentReceived: values.paymentReceived || false,
        sentToDepartment: values.sentToDepartment || false,
        resultReturned: values.resultReturned || false,
        customerName: values.customerName,
        provinceCode: values.provinceCode || undefined,
        province: selectedProvince?.name || undefined,
        districtCode: values.districtCode || undefined,
        district: selectedDistrict?.name || undefined,
        wardCode: values.wardCode || undefined,
        ward: selectedWard?.name || undefined,
        address: values.address || undefined,
        taxCode: values.taxCode || undefined,
        contactPerson: values.contactPerson || undefined,
        phone: values.phone || undefined,
        totalSampleCount: samples.length,
        methodWestHighlandInstitute: values.methodWestHighlandInstitute || false,
        methodCustomer: methodCustomerChecked,
        methodCustomerDetail: methodCustomerChecked ? values.methodCustomerDetail : undefined,
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
        resultDeliveryDate: formatDateForApi(values.expectedCompletionDate),
        sampleStorage: values.sampleStorageOption ?? SampleStorageOption.No,
        totalCost: totalSampleCost,
        totalCostInWords: values.totalCostInWords || undefined,
        receiptNumber: values.receiptNumber || undefined,
        supervisorId: values.supervisorId || undefined,
        directorId: values.directorId || undefined,
        changeRequest: values.changeRequest || undefined,
        agreeTerms: values.agreeTerms || false,
        requestDate: formatDateForApi(values.requestDate) || new Date().toISOString(),
        notes: values.notes || undefined,
        expectedCompletionDate: formatDateForApi(values.expectedCompletionDate),
        subcontractor: values.subcontractor || undefined,
        samples: sampleDtos,
      };

      if (isEditMode && id) {
        await updateTestRequest({ id, data: payload }).unwrap();
        message.success(FORM_MESSAGES.updateSuccess);
      } else {
        await createTestRequest(payload).unwrap();
        message.success(FORM_MESSAGES.createSuccess);
      }
      navigate("/requests");
    } catch (error: any) {
      console.error("Failed to save test request:", error);
      message.error(error.data?.error?.message || FORM_MESSAGES.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleProvinceChange = (value: string) => {
    form.setFieldsValue({ districtCode: undefined, wardCode: undefined });
    setWards([]);
    loadDistricts(value);
  };

  const handleDistrictChange = (value: string) => {
    form.setFieldsValue({ wardCode: undefined });
    loadWards(value);
  };

  return (
    <Card
      className="test-request-form"
      title={isEditMode ? "Chỉnh sửa yêu cầu thử nghiệm" : "Tạo yêu cầu thử nghiệm mới"}
      loading={loadingData}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          requestDate: dayjs(),
          ...FORM_INITIAL_VALUES,
        }}
      >
        <ContractInfoSection isFieldLocked={isFieldLocked} />

        <CustomerInfoSection
          form={form}
          isFieldLocked={isFieldLocked}
          provinces={provinces}
          districts={districts}
          wards={wards}
          organizationOptions={organizationOptions}
          organizationSearching={organizationSearching}
          onOrganizationSearch={handleOrganizationSearch}
          onProvinceChange={handleProvinceChange}
          onDistrictChange={handleDistrictChange}
        />

        <SampleTableSection
          samples={samples}
          isSamplesLocked={isSamplesLocked()}
          indicators={indicators}
          indicatorLaboratoryMap={indicatorModal.indicatorLaboratoryMap}
          onAddSample={addSample}
          onRemoveSample={removeSample}
          onUpdateSample={updateSample}
          onOpenIndicatorModal={indicatorModal.openIndicatorModal}
        />

        <SampleTypeSection />

        <Row gutter={[16, 0]}>
          <Col xs={24} lg={12}>
            <MethodSection
              methodCustomerChecked={methodCustomerChecked}
              onMethodCustomerChange={setMethodCustomerChecked}
            />
            <ResultSection />
            <SamplingSection />
          </Col>

          <Col xs={24} lg={12}>
            <CostSection totalSampleCost={totalSampleCost} />
            <PersonnelSection users={users} />
            <OtherInfoSection />
          </Col>
        </Row>

        <HiddenFields />

        <Divider />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isEditMode ? "Cập nhật" : "Tạo yêu cầu"}
            </Button>
            <Button onClick={() => navigate("/requests")}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Modals */}
      <GroupSelectorModal
        visible={indicatorModal.groupSelectorVisible}
        searchText={indicatorModal.groupSearchText}
        selectedGroupFilter={indicatorModal.selectedGroupFilter}
        groups={indicatorModal.getFilteredGroupsWithIndicators()}
        expandedGroups={indicatorModal.expandedGroupsInSelector}
        onSearchChange={indicatorModal.setGroupSearchText}
        onGroupSelect={indicatorModal.handleGroupSelect}
        onToggleExpand={(groupId) =>
          indicatorModal.setExpandedGroupsInSelector((prev) =>
            prev.includes(groupId)
              ? prev.filter((id) => id !== groupId)
              : [...prev, groupId]
          )
        }
        onToggleExpandAll={() => {
          if (indicatorModal.expandedGroupsInSelector.length === indicatorGroups.length) {
            indicatorModal.setExpandedGroupsInSelector([]);
          } else {
            indicatorModal.setExpandedGroupsInSelector(indicatorGroups.map((g) => g.id));
          }
        }}
        onClearFilter={() => {
          indicatorModal.setGroupSearchText("");
          indicatorModal.setSelectedGroupFilter("all");
          indicatorModal.setGroupSelectorVisible(false);
        }}
        onClose={() => {
          indicatorModal.setGroupSelectorVisible(false);
          indicatorModal.setGroupSearchText("");
        }}
      />

      <IndicatorModal
        visible={indicatorModal.indicatorModalVisible}
        indicatorGroups={indicatorGroups}
        indicators={indicators}
        tempSelectedIndicators={indicatorModal.tempSelectedIndicators}
        checkedIndicators={indicatorModal.checkedIndicators}
        selectedGroupFilter={indicatorModal.selectedGroupFilter}
        expandedGroups={indicatorModal.expandedGroups}
        indicatorLaboratoryMap={indicatorModal.indicatorLaboratoryMap}
        expandedLabGroups={indicatorModal.expandedLabGroups}
        currentSampleKey={indicatorModal.currentSampleKey}
        selectedIndicatorDates={indicatorModal.selectedIndicatorDates}
        onToggleIndicator={indicatorModal.toggleIndicator}
        onToggleChecked={indicatorModal.toggleCheckedIndicator}
        onSelectAllChecked={(checked) => {
          const unsentIndicators = indicatorModal.tempSelectedIndicators.filter(
            (id) => !indicatorModal.indicatorLaboratoryMap[`${indicatorModal.currentSampleKey}_${id}`]
          );
          if (checked) {
            indicatorModal.setCheckedIndicators(unsentIndicators);
          } else {
            indicatorModal.setCheckedIndicators([]);
          }
        }}
        onToggleGroup={(groupId) =>
          indicatorModal.setExpandedGroups((prev) =>
            prev.includes(groupId)
              ? prev.filter((id) => id !== groupId)
              : [...prev, groupId]
          )
        }
        onToggleLabGroup={(labId) =>
          indicatorModal.setExpandedLabGroups((prev) =>
            prev.includes(labId)
              ? prev.filter((id) => id !== labId)
              : [...prev, labId]
          )
        }
        onSendToLaboratory={laboratoryModal.handleSendToLaboratory}
        onOpenGroupSelector={() => indicatorModal.setGroupSelectorVisible(true)}
        onDateChange={indicatorModal.handleIndicatorDateChange}
        onRemoveIndicator={(indicatorId) => {
          indicatorModal.toggleIndicator(indicatorId);
          // Also remove from laboratory map if exists
          const labMapKey = `${indicatorModal.currentSampleKey}_${indicatorId}`;
          if (indicatorModal.indicatorLaboratoryMap[labMapKey]) {
            indicatorModal.setIndicatorLaboratoryMap((prev) => {
              const updated = { ...prev };
              delete updated[labMapKey];
              return updated;
            });
          }
        }}
        onOk={indicatorModal.handleIndicatorModalOk}
        onCancel={indicatorModal.handleIndicatorModalCancel}
        getFilteredIndicators={indicatorModal.getFilteredIndicators}
      />

      <LaboratoryModal
        visible={laboratoryModal.laboratoryModalVisible}
        laboratories={laboratories}
        selectedLaboratoryId={laboratoryModal.selectedLaboratoryId}
        laboratoryRequestDate={laboratoryModal.laboratoryRequestDate}
        indicatorsToSend={laboratoryModal.indicatorsToSend}
        indicators={indicators}
        onLaboratoryChange={laboratoryModal.setSelectedLaboratoryId}
        onDateChange={laboratoryModal.setLaboratoryRequestDate}
        onConfirm={laboratoryModal.handleConfirmSendToLaboratory}
        onCancel={laboratoryModal.handleCancelLaboratoryModal}
      />
    </Card>
  );
};

export default TestRequestForm;
