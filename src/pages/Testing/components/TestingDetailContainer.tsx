import React from "react";
import { Button, Collapse, Alert, Spin, Card } from "antd";
import { ArrowLeftOutlined, WarningOutlined } from "@ant-design/icons";
import {
  TestingDetailDto,
  TestingSampleDto,
  SaveIndicatorResultDto,
  SampleTestingImageType,
  SampleTestingImageDto,
  IndicatorImageDto,
} from "../../../types/testing";
import IndicatorEditTable from "./IndicatorEditTable";
import RejectionHistoryModal from "./RejectionHistoryModal";
import {
  TestingDetailHeader,
  TestingOverviewSection,
  SamplePanelHeader,
  SampleImagesRow,
} from "./sections";

const { Panel } = Collapse;

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
  resultOptions?: ResultOption[];
  /** Có quyền thực hiện thao tác (nhập/sửa/gửi kết quả) theo Permission Matrix */
  canPerformActions?: boolean;
  onBack: () => void;
  onCollapseChange: (keys: string[]) => void;
  onSubmitResults: (sampleId: string) => void;
  onResultsChange: (sampleId: string, results: SaveIndicatorResultDto[]) => void;
  onSelectionChange: (sampleId: string, indicatorIds: string[]) => void;
  onImagesChange: (
    sampleId: string,
    imageType: SampleTestingImageType,
    images: SampleTestingImageDto[]
  ) => void;
  onShowRejectionHistory: (indicatorId: string, indicatorName: string) => void;
  onCloseHistoryModal: () => void;
  onSaveIndicator: (indicatorId: string, result?: SaveIndicatorResultDto) => void;
  onSubmitIndicator: (indicatorId: string) => void;
  onUploadIndicatorImages?: (indicatorId: string, files: File[]) => Promise<IndicatorImageDto[]>;
  onDeleteIndicatorImage?: (imageId: string) => Promise<void>;
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
  resultOptions = [],
  canPerformActions = true,
  onBack,
  onCollapseChange,
  onSubmitResults,
  onResultsChange,
  onSelectionChange,
  onImagesChange,
  onShowRejectionHistory,
  onCloseHistoryModal,
  onSaveIndicator,
  onSubmitIndicator,
  onUploadIndicatorImages,
  onDeleteIndicatorImage,
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
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Quay lại
        </Button>
      </div>

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
                  selectedIndicators.get(sample.sampleId) || []
                }
                submitting={submitting}
                canPerformActions={canPerformActions}
                onSubmitResults={onSubmitResults}
              />
            }
            key={sample.sampleId}
          >
            {/* Images section */}
            <SampleImagesRow
              taskId={taskId}
              sample={sample}
              onImagesChange={onImagesChange}
              canUpload={canPerformActions}
            />
            {/* Indicators table */}
            <IndicatorEditTable
              indicators={sample.indicators}
              selectedIndicatorIds={
                selectedIndicators.get(sample.sampleId) || []
              }
              isUrgent={isUrgent}
              submitting={submitting}
              resultOptions={resultOptions}
              canPerformActions={canPerformActions}
              onResultsChange={(results) =>
                onResultsChange(sample.sampleId, results)
              }
              onSelectionChange={(ids) =>
                onSelectionChange(sample.sampleId, ids)
              }
              onShowRejectionHistory={onShowRejectionHistory}
              onSaveIndicator={onSaveIndicator}
              onSubmitIndicator={onSubmitIndicator}
              onUploadIndicatorImages={onUploadIndicatorImages}
              onDeleteIndicatorImage={onDeleteIndicatorImage}
            />
          </Panel>
        ))}
      </Collapse>

      {/* Rejection History Modal */}
      <RejectionHistoryModal
        visible={historyModal.visible}
        indicatorId={historyModal.indicatorId}
        indicatorName={historyModal.indicatorName}
        onClose={onCloseHistoryModal}
      />
    </div>
  );
};

export default TestingDetailContainer;
