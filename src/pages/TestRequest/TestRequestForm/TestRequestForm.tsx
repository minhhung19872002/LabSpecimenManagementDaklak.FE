// @ts-nocheck
import React from "react";
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
} from "./components";
import "../TestRequestForm.css";
import "../../../styles/ListCard.css";
import { PATH_ROUTES } from "../../../constants";

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
    navigate,
  } = useTestRequestFormData();

  // Actions hook
  const {
    addSample,
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
  });

  return (
    <>
    <Card
      className="test-request-form list-card"
      title={
        isEditMode
          ? "Chỉnh sửa yêu cầu thử nghiệm"
          : "Tạo yêu cầu thử nghiệm mới"
      }
    >
      <Spin spinning={loadingData}>
        {/* Warning when edit requires QLCL approval */}
        {isEditRequiresApproval() && (
          <Alert
            message="Lưu ý: Thay đổi cần phê duyệt"
            description="Phiếu yêu cầu đang ở trạng thái Đã gửi mẫu hoặc Đang thử nghiệm. Bạn chỉ có thể chỉnh sửa Thông tin mẫu. Các thông tin như Số HĐ, Ngày HĐ, Thông tin khách hàng đã bị khóa. Thay đổi sẽ cần được QLCL phê duyệt trước khi được áp dụng."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

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
            if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
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
          }}
        >
          {/* Top sections row: Hợp đồng (bao gồm Loại hình mẫu), Khách hàng */}
          <div className="form-top-row form-top-row-2cols">
            <div className="form-top-col-left">
              <ContractInfoSection
                isEditMode={isEditMode}
                isFieldLocked={isFieldLocked}
                updateSampleCodesPrefix={updateSampleCodesPrefix}
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
          />

          <Row gutter={[16, 0]}>
            {/* CỘT TRÁI */}
            <Col xs={24} lg={12}>
              {/* Yêu cầu về phương pháp */}
              <MethodRequirementSection methodRequirement={methodRequirement} />

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
          currentSampleSpecimenTypeName={currentSampleSpecimenTypeName}
          specimenTypeIndicatorIds={specimenTypeIndicatorIds}
          specimenTypeFilterActive={specimenTypeFilterActive}
          setSpecimenTypeFilterActive={setSpecimenTypeFilterActive}
          specimenTypesWithIndicators={specimenTypesWithIndicators}
          indicatorToSpecimenTypesMap={indicatorToSpecimenTypesMap}
          specimenTypes={specimenTypes}
          sampleTypeCategories={sampleTypeCategories}
          setIndicatorSearchText={setIndicatorSearchText}
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
    <Card style={{ marginTop: 16, textAlign: "right", boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)" }}>
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
