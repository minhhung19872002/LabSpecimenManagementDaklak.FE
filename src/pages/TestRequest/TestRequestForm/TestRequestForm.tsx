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
  SampleTypeSection,
  MethodRequirementSection,
  ResultRequirementSection,
  SamplingDeliverySection,
  CostInfoSection,
  SupervisorSection,
  OtherInfoSection,
  GroupSelectorModal,
  IndicatorSelectionModal,
  LaboratorySelectionModal,
} from "./components";
import "../TestRequestForm.css";

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
    currentStatus,
    isFieldLocked,
    isSamplesLocked,
    samples,
    setSamples,
    indicatorGroups,
    indicators,
    storageLocations,
    users,
    organizations,
    organizationOptions,
    organizationSearching,
    laboratories,
    handleOrganizationSearch,
    handleOrganizationSelect,
    handlePhoneBlur,
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
    provinces,
    wards,
    setWards,
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
    printBarcode,
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
  });

  return (
    <Card
      className="test-request-form"
      title={
        isEditMode
          ? "Chỉnh sửa yêu cầu thử nghiệm"
          : "Tạo yêu cầu thử nghiệm mới"
      }
      loading={loadingData}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          requestDate: dayjs(),
          status: TestRequestStatus.Pending,
          resultLanguage: ResultLanguage.Vietnamese,
          samplingRequirement: SamplingRequirement.CustomerSampling,
          sampleStorageOption: SampleStorageOption.No,
        }}
      >
        {/* Thông tin hợp đồng */}
        <ContractInfoSection
          isEditMode={isEditMode}
          isFieldLocked={isFieldLocked}
          setSampleCodePrefix={setSampleCodePrefix}
        />

        {/* Thông tin khách hàng */}
        <CustomerInfoSection
          form={form}
          isFieldLocked={isFieldLocked}
          provinces={provinces}
          wards={wards}
          setWards={setWards}
          organizationOptions={organizationOptions}
          organizationSearching={organizationSearching}
          handleOrganizationSearch={handleOrganizationSearch}
          handleOrganizationSelect={handleOrganizationSelect}
          handlePhoneBlur={handlePhoneBlur}
        />

        {/* Bảng thông tin mẫu */}
        <SampleTableSection
          samples={samples}
          sampleCodePrefix={sampleCodePrefix}
          isSamplesLocked={isSamplesLocked}
          addSample={addSample}
          removeSample={removeSample}
          updateSample={updateSample}
          duplicateSample={duplicateSample}
          printBarcode={printBarcode}
          openIndicatorModal={openIndicatorModal}
          getIndicatorInfo={getIndicatorInfo}
          getIndicatorMethodInfo={getIndicatorMethodInfo}
          indicatorLaboratoryMap={indicatorLaboratoryMap}
        />

        {/* Loại hình mẫu */}
        <SampleTypeSection />

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
            />

            {/* Người phụ trách */}
            <SupervisorSection users={users} />

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

        <Divider />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? "Cập nhật" : "Tạo yêu cầu"}
            </Button>
            <Button onClick={() => navigate("/requests")}>Hủy</Button>
          </Space>
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
    </Card>
  );
};

export default TestRequestForm;
