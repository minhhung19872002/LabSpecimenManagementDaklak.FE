import React, { useCallback } from "react";
import { Button, Collapse, Alert, Spin, Card, Tooltip, Row, Col } from "antd";
import type { FormInstance } from "antd";
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
import { MethodLookupDto } from "../../../types/laboratoryTask";
import IndicatorEditTable from "./IndicatorEditTable";
import RejectionHistoryModal from "./RejectionHistoryModal";
import CannotTestModal from "./CannotTestModal";
import {
  TestingDetailHeader,
  TestingOverviewSection,
  SamplePanelHeader,
  SampleImagesRow,
  TestingBulkMethodBar,
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
  methods?: MethodLookupDto[];
  savingIndicatorIds?: string[];
  onMethodChange?: (indicatorId: string, methodId: string | null) => void;
  onUnitChange?: (indicatorId: string, unit: string | null) => void;
  onResultsChange: (sampleId: string, results: SaveIndicatorResultDto[]) => void;
  onSelectionChange: (sampleId: string, indicatorIds: string[]) => void;
  onImagesChange: (sampleId: string, imageType: SampleTestingImageType, images: SampleTestingImageDto[]) => void;
  onShowRejectionHistory: (indicatorId: string, indicatorName: string) => void;
  onSaveIndicator: (indicatorId: string, result?: SaveIndicatorResultDto) => void;
  onSubmitIndicator: (indicatorId: string) => void;
  onUploadIndicatorImages?: (indicatorId: string, files: File[]) => Promise<IndicatorImageDto[]>;
  onDeleteIndicatorImage?: (imageId: string) => Promise<void>;
  onShowCannotTestModal: (indicatorId: string, indicatorName: string) => void;
  visibleColumns?: string[];
}

const SamplePanelContent = React.memo<SamplePanelContentProps>(function SamplePanelContent({
  taskId, sample, selectedIndicatorIds, isUrgent, submitting, resultOptions,
  getResultOptionsForIndicator, canPerformActions, isTestRequestCancelled,
  methods, savingIndicatorIds, onMethodChange, onUnitChange,
  onResultsChange, onSelectionChange, onImagesChange,
  onShowRejectionHistory, onSaveIndicator, onSubmitIndicator,
  onUploadIndicatorImages, onDeleteIndicatorImage, onShowCannotTestModal,
  visibleColumns,
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
        methods={methods}
        savingIndicatorIds={savingIndicatorIds}
        onMethodChange={onMethodChange}
        onUnitChange={onUnitChange}
        onResultsChange={handleResultsChange}
        onSelectionChange={handleSelectionChange}
        onShowRejectionHistory={onShowRejectionHistory}
        onSaveIndicator={onSaveIndicator}
        onSubmitIndicator={onSubmitIndicator}
        onUploadIndicatorImages={onUploadIndicatorImages}
        onDeleteIndicatorImage={onDeleteIndicatorImage}
        onShowCannotTestModal={onShowCannotTestModal}
        visibleColumns={visibleColumns}
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
  /** Danh sách phương pháp từ master data cho dropdown chọn PP */
  methods?: MethodLookupDto[];
  /** Các chỉ tiêu đang lưu PP/ĐVT */
  savingIndicatorIds?: string[];
  onMethodChange?: (indicatorId: string, methodId: string | null) => void;
  onUnitChange?: (indicatorId: string, unit: string | null) => void;
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
  /** Danh sách key cột hiển thị cho bảng chỉ tiêu */
  indicatorVisibleColumns?: string[];
  /** Callback khi thay đổi cột hiển thị */
  onIndicatorVisibleColumnsChange?: (keys: string[]) => void;
  /** Danh sách mẫu sau khi lọc theo "Chọn chỉ tiêu" — dùng cho Collapse (overview vẫn dùng sortedSamples) */
  filteredSamples?: TestingSampleDto[];
  /** Bulk chọn phương pháp: filter + chọn tất cả toàn cục + modal */
  indicatorFilter?: string[];
  indicatorFilterOptions?: { value: string; label: string }[];
  totalGlobalSelectable?: number;
  totalGlobalSelected?: number;
  /** Số chỉ tiêu gốc trong selection thực sự đổi được PP (canEdit, không Done/Cancelled) */
  totalMethodEditableSelected?: number;
  globalSelectedSampleCount?: number;
  isGlobalAllSelected?: boolean;
  isGlobalIndeterminate?: boolean;
  methodSelectModalOpen?: boolean;
  bulkMethodLoading?: boolean;
  methodSelectForm?: FormInstance;
  onIndicatorFilterChange?: (values: string[]) => void;
  onGlobalSelectAll?: () => void;
  onOpenMethodModal?: () => void;
  onCloseMethodModal?: () => void;
  onBulkMethodConfirm?: () => void;
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
  methods,
  savingIndicatorIds,
  onMethodChange,
  onUnitChange,
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
  indicatorVisibleColumns,
  onIndicatorVisibleColumnsChange,
  filteredSamples,
  indicatorFilter = [],
  indicatorFilterOptions = [],
  totalGlobalSelectable = 0,
  totalGlobalSelected = 0,
  totalMethodEditableSelected = 0,
  globalSelectedSampleCount = 0,
  isGlobalAllSelected = false,
  isGlobalIndeterminate = false,
  methodSelectModalOpen = false,
  bulkMethodLoading = false,
  methodSelectForm,
  onIndicatorFilterChange,
  onGlobalSelectAll,
  onOpenMethodModal,
  onCloseMethodModal,
  onBulkMethodConfirm,
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
        {/* Header + Overview Info — nằm ngang 2 cột */}
        <Row gutter={16} align="stretch">
          <Col xs={24} md={8} style={{ display: "flex", flexDirection: "column" }}>
            <TestingDetailHeader detail={detail} />
          </Col>
          <Col xs={24} md={16} style={{ display: "flex", flexDirection: "column" }}>
            <TestingOverviewSection
              detail={detail}
              sortedSamples={sortedSamples}
              isUrgent={isUrgent}
              indicatorVisibleColumns={indicatorVisibleColumns}
              onIndicatorVisibleColumnsChange={onIndicatorVisibleColumnsChange}
            />
          </Col>
        </Row>

        {/* Bulk chọn phương pháp: filter chỉ tiêu + chọn tất cả + modal chọn PP */}
        {canPerformActions &&
          methodSelectForm &&
          onIndicatorFilterChange &&
          onGlobalSelectAll &&
          onOpenMethodModal &&
          onCloseMethodModal &&
          onBulkMethodConfirm && (
            <TestingBulkMethodBar
              indicatorFilter={indicatorFilter}
              indicatorFilterOptions={indicatorFilterOptions}
              onIndicatorFilterChange={onIndicatorFilterChange}
              totalGlobalSelectable={totalGlobalSelectable}
              totalGlobalSelected={totalGlobalSelected}
              totalMethodEditableSelected={totalMethodEditableSelected}
              globalSelectedSampleCount={globalSelectedSampleCount}
              isGlobalAllSelected={isGlobalAllSelected}
              isGlobalIndeterminate={isGlobalIndeterminate}
              onGlobalSelectAll={onGlobalSelectAll}
              methods={methods ?? []}
              methodSelectModalOpen={methodSelectModalOpen}
              bulkMethodLoading={bulkMethodLoading}
              methodSelectForm={methodSelectForm}
              onOpenMethodModal={onOpenMethodModal}
              onCloseMethodModal={onCloseMethodModal}
              onConfirmMethod={onBulkMethodConfirm}
            />
          )}

        {/* Sample Panels */}
        <Collapse
          className="testing-detail-collapse"
          activeKey={activeKeys}
          onChange={(keys) => onCollapseChange(keys as string[])}
          expandIconPosition="start"
        >
          {(filteredSamples ?? sortedSamples).map((sample) => (
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
                methods={methods}
                savingIndicatorIds={savingIndicatorIds}
                onMethodChange={onMethodChange}
                onUnitChange={onUnitChange}
                onResultsChange={onResultsChange}
                onSelectionChange={onSelectionChange}
                onImagesChange={onImagesChange}
                onShowRejectionHistory={onShowRejectionHistory}
                onSaveIndicator={onSaveIndicator}
                onSubmitIndicator={onSubmitIndicator}
                onUploadIndicatorImages={onUploadIndicatorImages}
                onDeleteIndicatorImage={onDeleteIndicatorImage}
                onShowCannotTestModal={onShowCannotTestModal}
                visibleColumns={indicatorVisibleColumns}
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
