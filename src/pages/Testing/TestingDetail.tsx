import React from "react";
import { Card, Spin, Alert } from "antd";
import { useTestingDetail } from "./hooks";
import { RejectionHistoryModal } from "./components";
import {
  TestingDetailHeader,
  TestingOverviewCard,
  TestingSamplePanels,
} from "./components/detail";

const TestingDetail: React.FC = () => {
  const {
    // Data
    detail,
    loading,
    submittingIds,
    sortedSamples,
    allApproved,
    allSubmittedOrApproved,

    // Collapse state
    activeKeys,
    setActiveKeys,

    // Modal state
    historyModal,

    // Handlers
    handleBack,
    handleResultsChange,
    handleSaveIndicator,
    handleSubmitForApprovalSingle,
    showRejectionHistory,
    closeRejectionHistory,
  } = useTestingDetail();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card>
        <Alert
          message="Không tìm thấy thông tin"
          description="Không thể tải thông tin xét nghiệm"
          type="error"
        />
      </Card>
    );
  }

  return (
    <div>
      <TestingDetailHeader
        contractNumber={detail.contractNumber}
        testingStatus={detail.testingStatus}
        technicianNames={detail.technicianNames}
        laboratoryName={detail.laboratoryName}
        allApproved={allApproved}
        allSubmittedOrApproved={allSubmittedOrApproved}
        onBack={handleBack}
      />

      <TestingOverviewCard
        customerName={detail.customerName}
        technicalManagerName={detail.technicalManagerName}
        requestCompletionDate={detail.requestCompletionDate}
        sortedSamples={sortedSamples}
        completedIndicatorCount={detail.completedIndicatorCount}
        totalIndicatorCount={detail.totalIndicatorCount}
      />

      <TestingSamplePanels
        sortedSamples={sortedSamples}
        activeKeys={activeKeys}
        onActiveKeysChange={setActiveKeys}
        onResultsChange={handleResultsChange}
        onShowRejectionHistory={showRejectionHistory}
        onSaveIndicator={handleSaveIndicator}
        onSubmitForApproval={handleSubmitForApprovalSingle}
        submittingIds={submittingIds}
      />

      <RejectionHistoryModal
        visible={historyModal.visible}
        indicatorId={historyModal.indicatorId}
        indicatorName={historyModal.indicatorName}
        onClose={closeRejectionHistory}
      />
    </div>
  );
};

export default TestingDetail;
