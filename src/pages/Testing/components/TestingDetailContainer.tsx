import React, { useCallback } from "react";
import { Button, Collapse, Alert, Spin, Card, Tooltip } from "antd";
import {
  ArrowLeftOutlined,
  WarningOutlined,
} from "../../../components/common/Icon";
import {
  TestingDetailDto,
  TestingSampleDto,
  SaveIndicatorResultDto,
  SampleTestingImageType,
  SampleTestingImageDto,
  IndicatorImageDto,
} from "../../../types/testing";
import { TestRequestStatus } from "../../../types/testRequest";
import IndicatorEditTable from "./IndicatorEditTable";
import RejectionHistoryModal from "./RejectionHistoryModal";
import CannotTestModal from "./CannotTestModal";
import {
  TestingDetailHeader,
  TestingOverviewSection,
  SamplePanelHeader,
  SampleImagesRow,
} from "./sections";

const { Panel } = Collapse;

const EMPTY_IDS: string[] = [];

interface SamplePanelContentProps {
  taskId: string;
  sample: TestingSampleDto;
  selectedIndicatorIds: string[];
  isUrgent: boolean;
  submitting: boolean;
  resultOptions: ResultOption[];
  getResultOptionsForIndicator?: (indicatorId: string, specimenTypeId?: string) => ResultOption[];
  canPerformActions: boolean;
  isTestRequestCancelled: boolean;
  onResultsChange: (sampleId: string, results: SaveIndicatorResultDto[]) => void;
  onSelectionChange: (sampleId: string, indicatorIds: string[]) => void;
  onImagesChange: (sampleId: string, imageType: SampleTestingImageType, images: SampleTestingImageDto[]) => void;
  onShowRejectionHistory: (indicatorId: string, indicatorName: string) => void;
  onSaveIndicator: (indicatorId: string, result?: SaveIndicatorResultDto) => void;
  onSubmitIndicator: (indicatorId: string) => void;
  onUploadIndicatorImages?: (indicatorId: string, files: File[]) => Promise<IndicatorImageDto[]>;
  onDeleteIndicatorImage?: (imageId: string) => Promise<void>;
  onShowCannotTestModal: (indicatorId: string, indicatorName: string) => void;
}

const SamplePanelContent = React.memo<SamplePanelContentProps>(function SamplePanelContent({
  taskId, sample, selectedIndicatorIds, isUrgent, submitting, resultOptions,
  getResultOptionsForIndicator, canPerformActions, isTestRequestCancelled,
  onResultsChange, onSelectionChange, onImagesChange,
  onShowRejectionHistory, onSaveIndicator, onSubmitIndicator,
  onUploadIndicatorImages, onDeleteIndicatorImage, onShowCannotTestModal,
}) {
  const handleResultsChange = useCallback(
    (results: SaveIndicatorResultDto[]) => onResultsChange(sample.sampleId, results),
    [sample.sampleId, onResultsChange],
  );
  const handleSelectionChange = useCallback(
    (ids: string[]) => onSelectionChange(sample.sampleId, ids),
    [sample.sampleId, onSelectionChange],
  );
  return (
    <>
      <SampleImagesRow
        taskId={taskId}
        sample={sample}
        onImagesChange={onImagesChange}
        canUpload={canPerformActions}
      />
      <IndicatorEditTable
        indicators={sample.indicators}
        selectedIndicatorIds={selectedIndicatorIds}
        isUrgent={isUrgent}
        submitting={submitting}
        resultOptions={resultOptions}
        getResultOptionsForIndicator={getResultOptionsForIndicator}
        canPerformActions={canPerformActions}
        isTestRequestCancelled={isTestRequestCancelled}
        onResultsChange={handleResultsChange}
        onSelectionChange={handleSelectionChange}
        onShowRejectionHistory={onShowRejectionHistory}
        onSaveIndicator={onSaveIndicator}
        onSubmitIndicator={onSubmitIndicator}
        onUploadIndicatorImages={onUploadIndicatorImages}
        onDeleteIndicatorImage={onDeleteIndicatorImage}
        onShowCannotTestModal={onShowCannotTestModal}
      />
    </>
  );
});

interface ResultOption {
  value: string;
  label: string;
}

interface TestingDetailContainerProps {
  detail: TestingDetailDto;
  taskId: string;
  loading: boolean;
  submitting: boolean;
  isUrgent: boolean;
  sortedSamples: TestingSampleDto[];
  activeKeys: string[];
  selectedIndicators: Map<string, string[]>;
  historyModal: {
    visible: boolean;
    indicatorId: string;
    indicatorName: string;
  };
  cannotTestModal: {
    visible: boolean;
    indicatorId: string;
    indicatorName: string;
  };
  resultOptions?: ResultOption[];
  /** Function to get result options filtered by (indicatorId + specimenTypeId) */
  getResultOptionsForIndicator?: (indicatorId: string, specimenTypeId?: string) => ResultOption[];
  /** Có quyền thực hiện thao tác (nhập/sửa/gửi kết quả) theo Permission Matrix */
  canPerformActions?: boolean;
  isTestRequestCancelled?: boolean;
  onBack: () => void;
  onCollapseChange: (keys: string[]) => void;
  onSubmitResults: (sampleId: string) => void;
  onResultsChange: (
    sampleId: string,
    results: SaveIndicatorResultDto[],
  ) => void;
  onSelectionChange: (sampleId: string, indicatorIds: string[]) => void;
  onImagesChange: (
    sampleId: string,
    imageType: SampleTestingImageType,
    images: SampleTestingImageDto[],
  ) => void;
  onShowRejectionHistory: (indicatorId: string, indicatorName: string) => void;
  onCloseHistoryModal: () => void;
  onShowCannotTestModal: (indicatorId: string, indicatorName: string) => void;
  onCloseCannotTestModal: () => void;
  onCannotTestSuccess: () => void;
  onSaveIndicator: (
    indicatorId: string,
    result?: SaveIndicatorResultDto,
  ) => void;
  onSubmitIndicator: (indicatorId: string) => void;
  onUploadIndicatorImages?: (
    indicatorId: string,
    files: File[],
  ) => Promise<IndicatorImageDto[]>;
  onDeleteIndicatorImage?: (imageId: string) => Promise<void>;
  /** Callback khi chọn ngày thử nghiệm bulk cho các chỉ tiêu được select */
  onBulkTestDateChange?: (
    sampleId: string,
    indicatorIds: string[],
    date: string,
  ) => void;
}

const TestingDetailContainer: React.FC<TestingDetailContainerProps> = ({
  detail,
  taskId,
  loading,
  submitting,
  isUrgent,
  sortedSamples,
  activeKeys,
  selectedIndicators,
  historyModal,
  cannotTestModal,
  resultOptions = [],
  getResultOptionsForIndicator,
  canPerformActions = false,
  isTestRequestCancelled = false,
  onBack,
  onCollapseChange,
  onSubmitResults,
  onResultsChange,
  onSelectionChange,
  onImagesChange,
  onShowRejectionHistory,
  onCloseHistoryModal,
  onShowCannotTestModal,
  onCloseCannotTestModal,
  onCannotTestSuccess,
  onSaveIndicator,
  onSubmitIndicator,
  onUploadIndicatorImages,
  onDeleteIndicatorImage,
  onBulkTestDateChange,
}) => {
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
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <Tooltip title="Quay lại">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          />
        </Tooltip>
      </div>

      {/* Alert khi phiếu yêu cầu đã bị hủy */}
      {detail.testRequestStatus === TestRequestStatus.Cancelled && (
        <Alert
          message="Phiếu yêu cầu đã bị hủy"
          description="Phiếu yêu cầu đã bị hủy. Không thể thực hiện bất kỳ thao tác nào."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Urgent Alert */}
      {isUrgent && (
        <Alert
          message="Cảnh báo"
          description="Ngày yêu cầu hoàn thành còn ≤3 ngày!"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        {/* Header */}
        <TestingDetailHeader detail={detail} />

        {/* Overview Info */}
        <TestingOverviewSection
          detail={detail}
          sortedSamples={sortedSamples}
          isUrgent={isUrgent}
        />

        {/* Sample Panels */}
        <Collapse
          className="testing-detail-collapse"
          activeKey={activeKeys}
          onChange={(keys) => onCollapseChange(keys as string[])}
          expandIconPosition="start"
        >
          {sortedSamples.map((sample) => (
            <Panel
              header={
                <SamplePanelHeader
                  sample={sample}
                  selectedIndicatorIds={
                    selectedIndicators.get(sample.sampleId) ?? EMPTY_IDS
                  }
                  submitting={submitting}
                  canPerformActions={canPerformActions}
                  onSubmitResults={onSubmitResults}
                  onBulkTestDateChange={onBulkTestDateChange}
                />
              }
              key={sample.sampleId}
            >
              <SamplePanelContent
                taskId={taskId}
                sample={sample}
                selectedIndicatorIds={
                  selectedIndicators.get(sample.sampleId) ?? EMPTY_IDS
                }
                isUrgent={isUrgent}
                submitting={submitting}
                resultOptions={resultOptions}
                getResultOptionsForIndicator={getResultOptionsForIndicator}
                canPerformActions={canPerformActions}
                isTestRequestCancelled={isTestRequestCancelled}
                onResultsChange={onResultsChange}
                onSelectionChange={onSelectionChange}
                onImagesChange={onImagesChange}
                onShowRejectionHistory={onShowRejectionHistory}
                onSaveIndicator={onSaveIndicator}
                onSubmitIndicator={onSubmitIndicator}
                onUploadIndicatorImages={onUploadIndicatorImages}
                onDeleteIndicatorImage={onDeleteIndicatorImage}
                onShowCannotTestModal={onShowCannotTestModal}
              />
            </Panel>
          ))}
        </Collapse>
      </Card>

      {/* Rejection History Modal */}
      <RejectionHistoryModal
        visible={historyModal.visible}
        indicatorId={historyModal.indicatorId}
        indicatorName={historyModal.indicatorName}
        onClose={onCloseHistoryModal}
      />

      {/* Cannot Test Modal */}
      <CannotTestModal
        visible={cannotTestModal.visible}
        taskId={taskId}
        indicatorId={cannotTestModal.indicatorId}
        indicatorName={cannotTestModal.indicatorName}
        onCancel={onCloseCannotTestModal}
        onSuccess={onCannotTestSuccess}
      />
    </div>
  );
};

export default TestingDetailContainer;
