// @ts-nocheck
import React, { useRef, useEffect, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  Card,
  Select,
  Row,
  Col,
  Divider,
  Space,
  Alert,
  message,
  Spin,
} from "antd";
import dayjs from "dayjs";
import {
  TestRequestStatus,
  ResultLanguage,
  SamplingRequirement,
  SampleStorageOption,
} from "../../../types/testRequest";
import { useTestRequestFormData } from "./hooks/useTestRequestFormData";
import { useTestRequestFormActions } from "./hooks/useTestRequestFormActions";
import {
  ContractInfoSection,
  CustomerInfoSection,
  SampleTableSection,
  MethodRequirementSection,
  ResultRequirementSection,
  SamplingDeliverySection,
  CostInfoSection,
  OtherInfoSection,
  GroupSelectorModal,
  IndicatorSelectionModal,
  LaboratorySelectionModal,
  StickySummaryBar,
} from "./components";
import "../TestRequestForm.css";
import "../../../styles/ListCard.css";
import { PATH_ROUTES } from "../../../constants";
import { usePageTitleOverride } from "../../../hooks/usePageTitle";

const TestRequestForm: React.FC = () => {
  // Data hook
  const {
    form,
    isEditMode,
    loading,
    setLoading,
    loadingData,
    id,
    sampleTypeTask,
    methodRequirement,
    sampleCodePrefix,
    setSampleCodePrefix,
    updateSampleCodesPrefix,
    validateContractNumberDebounced,
    currentStatus,
    isFieldLocked,
    isSamplesLocked,
    isEditRequiresApproval,
    samples,
    setSamples,
    indicatorGroups,
    indicators,
    storageLocations,
    organizations,
    organizationOptions,
    organizationSearching,
    laboratories,
    specimenTypes,
    specimenTypesWithIndicators,
    indicatorToSpecimenTypesMap,
    specimenTypeOptions,
    handleSpecimenTypeSearch,
    handleSpecimenTypeSelect,
    handleOrganizationSearch,
    handleOrganizationSelect,
    handlePhoneBlur,
    handlePhoneEnter,
    sampleConditionOptions,
    sampleTypeCategories,
    totalSampleCost,
    indicatorModalVisible,
    setIndicatorModalVisible,
    currentSampleKey,
    setCurrentSampleKey,
    tempSelectedIndicators,
    setTempSelectedIndicators,
    tempSelectedIndicatorMethods,
    setTempSelectedIndicatorMethods,
    expandedIndicators,
    setExpandedIndicators,
    selectedGroupFilter,
    setSelectedGroupFilter,
    indicatorSearchText,
    setIndicatorSearchText,
    groupSelectorVisible,
    setGroupSelectorVisible,
    groupSearchText,
    setGroupSearchText,
    currentSampleSpecimenTypeId,
    setCurrentSampleSpecimenTypeId,
    currentSampleSpecimenTypeName,
    setCurrentSampleSpecimenTypeName,
    specimenTypeIndicatorIds,
    setSpecimenTypeIndicatorIds,
    specimenTypeFilterActive,
    setSpecimenTypeFilterActive,
    selectedIndicatorDates,
    setSelectedIndicatorDates,
    checkedIndicators,
    setCheckedIndicators,
    expandedGroups,
    setExpandedGroups,
    expandedGroupsInSelector,
    setExpandedGroupsInSelector,
    indicatorMethodsMap,
    laboratoryModalVisible,
    setLaboratoryModalVisible,
    selectedLaboratoryId,
    setSelectedLaboratoryId,
    laboratoryRequestDate,
    setLaboratoryRequestDate,
    indicatorsToSend,
    setIndicatorsToSend,
    indicatorLaboratoryMap,
    setIndicatorLaboratoryMap,
    expandedLabGroups,
    setExpandedLabGroups,
    sampleIndicatorIdMap,
    customPrices,
    setCustomPrices,
    originalData,
    sourceQuotationId,
    provinces,
    wards,
    setWards,
    selectedProvinceCode,
    setSelectedProvinceCode,
    selectedWardCode,
    setSelectedWardCode,
    getIndicatorInfo,
    getMethodsForIndicator,
    getIndicatorMethodInfo,
    getFilteredIndicators,
    getFilteredGroupsWithIndicators,
    registerQuickCreatedIndicator,
    clearDraft,
    navigate,
  } = useTestRequestFormData();

  // Actions hook
  const {
    addSample,
    addExistingSample,
    removeSample,
    updateSample,
    duplicateSample,
    openIndicatorModal,
    handleIndicatorModalOk,
    handleIndicatorModalCancel,
    toggleIndicator,
    toggleIndicatorMethod,
    handleIndicatorDateChange,
    toggleCheckedIndicator,
    handleSelectAllIndicators,
    handleGroupSelect,
    handleSendToLaboratory,
    handleConfirmSendToLaboratory,
    onFinish,
    handlePreviewForm,
  } = useTestRequestFormActions({
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
  });

  // Ref to form sections to detect when scrolled past
  const formSectionsRef = useRef<HTMLDivElement>(null);
  const [showSummaryBar, setShowSummaryBar] = useState(false);
  const [summaryBarStyle, setSummaryBarStyle] = useState<React.CSSProperties>(
    {},
  );

  // Watch specific form values for sticky summary bar
  const watchedCustomerName = Form.useWatch("customerName", form);
  const watchedContactPerson = Form.useWatch("contactPerson", form);
  const watchedTaxCode = Form.useWatch("taxCode", form);
  const watchedPhone = Form.useWatch("phone", form);
  const watchedAddress = Form.useWatch("address", form);
  const watchedWard = Form.useWatch("ward", form);
  const watchedProvince = Form.useWatch("province", form);
  const watchedContractNumber = Form.useWatch("contractNumber", form);
  const watchedContractDate = Form.useWatch("contractDate", form);
  const watchedSampleType = Form.useWatch("sampleType", form);
  const watchedSubContract = Form.useWatch("subContract", form);

  usePageTitleOverride(
    isEditMode && watchedContractNumber?.trim()
      ? `Sửa phiếu - ${watchedContractNumber.trim()}`
      : undefined,
  );

  useEffect(() => {
    const formSections = formSectionsRef.current;
    if (!formSections) return;

    // Get header height based on screen size
    const getHeaderHeight = () => {
      const width = window.innerWidth;
      if (width <= 767) return 0; // Mobile - no fixed summary
      if (width <= 1100) return 113; // Tablet
      return 64; // Desktop
    };

    const handleScroll = () => {
      if (formSections) {
        const rect = formSections.getBoundingClientRect();
        const headerHeight = getHeaderHeight();
        // Show summary bar when scrolled past ~25% of the section
        const threshold = rect.height * 0.75;
        setShowSummaryBar(
          headerHeight > 0 && rect.bottom < headerHeight + threshold,
        );

        // Match summary bar width to the content wrapper (same as header)
        const contentWrapper = document.querySelector(".main-content-wrapper");
        if (contentWrapper) {
          const wrapperRect = contentWrapper.getBoundingClientRect();
          setSummaryBarStyle({
            left: wrapperRect.left,
            right: window.innerWidth - wrapperRect.right,
            width: wrapperRect.width,
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Fixed summary bar - appears when scrolled past form sections */}
      {showSummaryBar && (
        <div className="fixed-summary-bar-wrapper" style={summaryBarStyle}>
          <StickySummaryBar
            customerName={watchedCustomerName}
            contactPerson={watchedContactPerson}
            taxCode={watchedTaxCode}
            phone={watchedPhone}
            address={watchedAddress}
            ward={watchedWard}
            province={watchedProvince}
            contractNumber={watchedContractNumber}
            contractDate={watchedContractDate}
            sampleType={watchedSampleType}
            subContract={watchedSubContract}
          />
        </div>
      )}

      <Card
        className="test-request-form list-card"
        title={
          isEditMode
            ? "Chỉnh sửa yêu cầu thử nghiệm"
            : "Tạo yêu cầu thử nghiệm mới"
        }
      >
        <Spin spinning={loadingData}>
          {/* [TEMPORARY] Tạm tắt alert cảnh báo cần phê duyệt - KH cho phép edit trực tiếp */}
          {/* [OLD LOGIC]
        {isEditRequiresApproval() && (
          <Alert
            message="Lưu ý: Thay đổi cần phê duyệt"
            description="Phiếu yêu cầu đang ở trạng thái Đã gửi mẫu hoặc Đang thử nghiệm. Bạn chỉ có thể chỉnh sửa Thông tin mẫu. Các thông tin như Số HĐ, Ngày HĐ, Thông tin khách hàng đã bị khóa. Thay đổi sẽ cần được QLCL phê duyệt trước khi được áp dụng."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        */}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={(errorInfo) => {
              const firstError = errorInfo.errorFields[0];
              if (firstError) {
                message.error(
                  firstError.errors[0] ||
                    "Vui lòng kiểm tra lại các trường bắt buộc",
                );
              } else {
                message.error("Vui lòng kiểm tra lại các trường bắt buộc");
              }
            }}
            onKeyDown={(e) => {
              // Prevent form submission on Enter key press in input fields
              // Only submit form when clicking the Submit button
              if (
                e.key === "Enter" &&
                (e.target as HTMLElement).tagName === "INPUT"
              ) {
                e.preventDefault();
              }
            }}
            initialValues={{
              contractDate: dayjs(),
              requestDate: dayjs(),
              status: TestRequestStatus.Pending,
              resultLanguage: ResultLanguage.Vietnamese,
              samplingRequirement: SamplingRequirement.CustomerSampling,
              sampleStorageOption: SampleStorageOption.No,
              sampleType: ["service"],
            }}
          >
            {/* Top sections row: Hợp đồng (bao gồm Loại hình mẫu), Khách hàng */}
            <div
              ref={formSectionsRef}
              className="form-top-row form-top-row-2cols"
            >
              <div className="form-top-col-left">
                <ContractInfoSection
                  isEditMode={isEditMode}
                  isFieldLocked={isFieldLocked}
                  updateSampleCodesPrefix={updateSampleCodesPrefix}
                  validateContractNumberDebounced={
                    validateContractNumberDebounced
                  }
                  currentStatus={currentStatus}
                />
              </div>
              <div className="form-top-col-right">
                <CustomerInfoSection
                  form={form}
                  isFieldLocked={isFieldLocked}
                  provinces={provinces}
                  wards={wards}
                  setWards={setWards}
                  selectedProvinceCode={selectedProvinceCode}
                  setSelectedProvinceCode={setSelectedProvinceCode}
                  selectedWardCode={selectedWardCode}
                  setSelectedWardCode={setSelectedWardCode}
                  organizationOptions={organizationOptions}
                  organizationSearching={organizationSearching}
                  handleOrganizationSearch={handleOrganizationSearch}
                  handleOrganizationSelect={handleOrganizationSelect}
                  handlePhoneBlur={handlePhoneBlur}
                  handlePhoneEnter={handlePhoneEnter}
                />
              </div>
            </div>

            {/* Bảng thông tin mẫu */}
            <SampleTableSection
              samples={samples}
              sampleCodePrefix={sampleCodePrefix}
              isSamplesLocked={isSamplesLocked}
              addSample={addSample}
              removeSample={removeSample}
              updateSample={updateSample}
              duplicateSample={duplicateSample}
              openIndicatorModal={openIndicatorModal}
              getIndicatorInfo={getIndicatorInfo}
              getIndicatorMethodInfo={getIndicatorMethodInfo}
              indicatorLaboratoryMap={indicatorLaboratoryMap}
              specimenTypes={specimenTypes}
              specimenTypeOptions={specimenTypeOptions}
              handleSpecimenTypeSearch={handleSpecimenTypeSearch}
              handleSpecimenTypeSelect={handleSpecimenTypeSelect}
              sampleConditionOptions={sampleConditionOptions}
              indicators={indicators}
              indicatorMethodsMap={indicatorMethodsMap}
              onImportSamples={(newSamples) =>
                setSamples((prev) => [...prev, ...newSamples])
              }
              onAddExistingSample={addExistingSample}
            />

            <Row gutter={[16, 0]}>
              {/* CỘT TRÁI */}
              <Col xs={24} lg={12}>
                {/* Yêu cầu về phương pháp */}
                <MethodRequirementSection
                  methodRequirement={methodRequirement}
                />

                {/* Yêu cầu về kết quả */}
                <ResultRequirementSection />

                {/* Yêu cầu về lấy mẫu & giao trả */}
                <SamplingDeliverySection />
              </Col>

              {/* CỘT PHẢI */}
              <Col xs={24} lg={12}>
                {/* Thông tin chi phí */}
                <CostInfoSection
                  totalSampleCost={totalSampleCost}
                  sampleTypeTask={sampleTypeTask}
                  isEditMode={isEditMode}
                />

                {/* Thông tin khác */}
                <OtherInfoSection />
              </Col>
            </Row>

            {/* Hidden fields for legacy support */}
            <Form.Item name="requestDate" hidden>
              <DatePicker />
            </Form.Item>
            <Form.Item name="status" hidden>
              <Select />
            </Form.Item>
            <Form.Item name="customerEmail" hidden>
              <Input />
            </Form.Item>
          </Form>

          {/* Group Selector Modal */}
          <GroupSelectorModal
            visible={groupSelectorVisible}
            onClose={() => setGroupSelectorVisible(false)}
            groupSearchText={groupSearchText}
            setGroupSearchText={setGroupSearchText}
            indicatorGroups={indicatorGroups}
            indicators={indicators}
            expandedGroupsInSelector={expandedGroupsInSelector}
            setExpandedGroupsInSelector={setExpandedGroupsInSelector}
            selectedGroupFilter={selectedGroupFilter}
            getFilteredGroupsWithIndicators={getFilteredGroupsWithIndicators}
            handleGroupSelect={handleGroupSelect}
            setSelectedGroupFilter={setSelectedGroupFilter}
          />

          {/* Indicator Selection Modal */}
          <IndicatorSelectionModal
            visible={indicatorModalVisible}
            onOk={handleIndicatorModalOk}
            onCancel={handleIndicatorModalCancel}
            currentSampleKey={currentSampleKey}
            tempSelectedIndicators={tempSelectedIndicators}
            setTempSelectedIndicators={setTempSelectedIndicators}
            tempSelectedIndicatorMethods={tempSelectedIndicatorMethods}
            setTempSelectedIndicatorMethods={setTempSelectedIndicatorMethods}
            indicatorMethodsMap={indicatorMethodsMap}
            expandedIndicators={expandedIndicators}
            setExpandedIndicators={setExpandedIndicators}
            toggleIndicatorMethod={toggleIndicatorMethod}
            indicatorGroups={indicatorGroups}
            indicators={indicators}
            expandedGroups={expandedGroups}
            setExpandedGroups={setExpandedGroups}
            selectedGroupFilter={selectedGroupFilter}
            setGroupSelectorVisible={setGroupSelectorVisible}
            indicatorSearchText={indicatorSearchText}
            getFilteredIndicators={getFilteredIndicators}
            getIndicatorInfo={getIndicatorInfo}
            getIndicatorMethodInfo={getIndicatorMethodInfo}
            toggleIndicator={toggleIndicator}
            selectedIndicatorDates={selectedIndicatorDates}
            setSelectedIndicatorDates={setSelectedIndicatorDates}
            checkedIndicators={checkedIndicators}
            setCheckedIndicators={setCheckedIndicators}
            handleIndicatorDateChange={handleIndicatorDateChange}
            toggleCheckedIndicator={toggleCheckedIndicator}
            handleSendToLaboratory={handleSendToLaboratory}
            indicatorLaboratoryMap={indicatorLaboratoryMap}
            setIndicatorLaboratoryMap={setIndicatorLaboratoryMap}
            expandedLabGroups={expandedLabGroups}
            setExpandedLabGroups={setExpandedLabGroups}
            currentSampleSpecimenTypeId={currentSampleSpecimenTypeId}
            currentSampleSpecimenTypeName={currentSampleSpecimenTypeName}
            specimenTypeIndicatorIds={specimenTypeIndicatorIds}
            specimenTypeFilterActive={specimenTypeFilterActive}
            setSpecimenTypeFilterActive={setSpecimenTypeFilterActive}
            specimenTypesWithIndicators={specimenTypesWithIndicators}
            indicatorToSpecimenTypesMap={indicatorToSpecimenTypesMap}
            specimenTypes={specimenTypes}
            sampleTypeCategories={sampleTypeCategories}
            setIndicatorSearchText={setIndicatorSearchText}
            customPrices={customPrices}
            isRequestCompleted={currentStatus === TestRequestStatus.Completed}
            testRequestId={id}
            contractNumber={form.getFieldValue("contractNumber")}
            onQuickIndicatorCreated={registerQuickCreatedIndicator}
            onPriceChange={(key, price) =>
              setCustomPrices((prev) => ({ ...prev, [key]: price }))
            }
          />

          {/* Laboratory Selection Modal */}
          <LaboratorySelectionModal
            visible={laboratoryModalVisible}
            onCancel={() => setLaboratoryModalVisible(false)}
            laboratories={laboratories}
            selectedLaboratoryId={selectedLaboratoryId}
            setSelectedLaboratoryId={setSelectedLaboratoryId}
            laboratoryRequestDate={laboratoryRequestDate}
            setLaboratoryRequestDate={setLaboratoryRequestDate}
            indicatorsToSend={indicatorsToSend}
            getIndicatorMethodInfo={getIndicatorMethodInfo}
            handleConfirmSendToLaboratory={handleConfirmSendToLaboratory}
          />
        </Spin>
      </Card>
      <Card
        style={{
          marginTop: 16,
          textAlign: "right",
          boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Space>
          <Button onClick={() => navigate(PATH_ROUTES.testRequests.index)}>
            Hủy
          </Button>
          <Button onClick={handlePreviewForm} loading={loading}>
            Xem phiếu
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
            style={{
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              borderColor: "transparent",
            }}
          >
            {isEditMode ? "Cập nhật" : "Tạo yêu cầu"}
          </Button>
        </Space>
      </Card>
    </>
  );
};

export default TestRequestForm;
