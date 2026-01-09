import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import { testingService } from "../../services/testingService";
import { testResultValueService } from "../../services/testResultValueService";
import {
  TestingDetailDto,
  TestingIndicatorDto,
  SaveIndicatorResultDto,
  SampleTestingImageType,
  SampleTestingImageDto,
  IndicatorTestingStatus,
  IndicatorImageDto,
} from "../../types/testing";
import TestingDetailContainer from "./components/TestingDetailContainer";
import { useMultipleActionPermissions } from "../../hooks/useActionPermission";

interface ResultOption {
  value: string;
  label: string;
}

const TestingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<TestingDetailDto | null>(null);
  const [resultOptions, setResultOptions] = useState<ResultOption[]>([]);

  // Sử dụng hook để check permissions cho tất cả actions theo Permission Matrix
  // Testing: KTV (A), QLKT (V), Admin (V)
  const actionPermissions = useMultipleActionPermissions('testing', [
    'inputResult',
    'editResult',
    'sendResult',
  ]);

  // KTV có quyền ALL = canAll = true, QLKT/Admin chỉ có View
  const canInputResult = actionPermissions.inputResult?.canAll || false;
  const canEditResult = actionPermissions.editResult?.canAll || false;
  const canSendResult = actionPermissions.sendResult?.canAll || false;

  // Tổng hợp: có thể thao tác (nhập/sửa/gửi) nếu có bất kỳ quyền nào
  const canPerformActions = canInputResult || canEditResult || canSendResult;

  // Helper function to update indicators optimistically (indicator-level only)
  // Task-level status is fetched from server to avoid duplicating BE logic
  const updateIndicatorsOptimistically = useCallback(
    (indicatorIds: string[], indicatorUpdates: Partial<TestingIndicatorDto>) => {
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          samples: prev.samples.map((sample) => ({
            ...sample,
            indicators: sample.indicators.map((ind) =>
              indicatorIds.includes(ind.id) ? { ...ind, ...indicatorUpdates } : ind
            ),
          })),
        };
      });
    },
    []
  );

  // Reload full data from server (preserving UI states like selection, activeKeys)
  const reloadData = useCallback(async () => {
    if (!id) return;
    try {
      const result = await testingService.get(id, "my");
      setDetail(result);

      // Update sample results with new data (preserve any unsaved edits by merging)
      setSampleResults((prev) => {
        const newResults = new Map<string, SaveIndicatorResultDto[]>();
        result.samples.forEach((sample) => {
          const existingResults = prev.get(sample.sampleId);
          newResults.set(
            sample.sampleId,
            sample.indicators.map((ind) => {
              // Keep existing edited result if available
              const existingResult = existingResults?.find(
                (r) => r.indicatorId === ind.id
              );
              return {
                indicatorId: ind.id,
                methodId: ind.methodId,
                unit: ind.unit,
                result: existingResult?.result ?? ind.result,
              };
            })
          );
        });
        return newResults;
      });
      // Note: selectedIndicators and activeKeys are NOT reset
    } catch (error) {
      console.error("Failed to reload data:", error);
    }
  }, [id]);

  // Edited results (per sample)
  const [sampleResults, setSampleResults] = useState<
    Map<string, SaveIndicatorResultDto[]>
  >(new Map());

  // Selected indicators per sample (for multiselect)
  const [selectedIndicators, setSelectedIndicators] = useState<
    Map<string, string[]>
  >(new Map());

  // Active collapse keys (open all panels by default)
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  // Rejection history modal
  const [historyModal, setHistoryModal] = useState({
    visible: false,
    indicatorId: "",
    indicatorName: "",
  });

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await testingService.get(id, "my");
      setDetail(result);

      // Initialize sample results
      const initialResults = new Map<string, SaveIndicatorResultDto[]>();
      result.samples.forEach((sample) => {
        initialResults.set(
          sample.sampleId,
          sample.indicators.map((ind) => ({
            indicatorId: ind.id,
            methodId: ind.methodId,
            unit: ind.unit,
            result: ind.result,
          }))
        );
      });
      setSampleResults(initialResults);

      // Initialize selected indicators
      const initialSelected = new Map<string, string[]>();
      result.samples.forEach((sample) => {
        initialSelected.set(sample.sampleId, []);
      });
      setSelectedIndicators(initialSelected);

      // Open all sample panels by default
      setActiveKeys(result.samples.map((s) => s.sampleId));
    } catch (error) {
      console.error("Failed to load testing detail:", error);
      message.error("Không thể tải thông tin xét nghiệm");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Load result value options for autocomplete
  useEffect(() => {
    const loadResultOptions = async () => {
      try {
        const data = await testResultValueService.getActive();
        setResultOptions(
          data.map((item) => ({
            value: item.name,
            label: item.name,
          }))
        );
      } catch (error) {
        console.error("Failed to load result options:", error);
      }
    };
    loadResultOptions();
  }, []);

  const handleResultsChange = (
    sampleId: string,
    results: SaveIndicatorResultDto[]
  ) => {
    const newResults = new Map(sampleResults);
    newResults.set(sampleId, results);
    setSampleResults(newResults);
  };

  const handleSelectionChange = (sampleId: string, indicatorIds: string[]) => {
    const newSelected = new Map(selectedIndicators);
    newSelected.set(sampleId, indicatorIds);
    setSelectedIndicators(newSelected);
  };

  const handleSaveIndicator = async (indicatorId: string) => {
    if (!id) return;

    let indicatorResult: SaveIndicatorResultDto | undefined;
    sampleResults.forEach((results) => {
      const found = results.find((r) => r.indicatorId === indicatorId);
      if (found) {
        indicatorResult = found;
      }
    });

    if (!indicatorResult) return;

    try {
      await testingService.saveResults(id, { results: [indicatorResult] });
    } catch (error: any) {
      console.error("Failed to save result:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể lưu kết quả"
      );
    }
  };

  const handleSubmitResults = async (sampleId: string) => {
    if (!id || !detail) return;
    const selected = selectedIndicators.get(sampleId) || [];

    if (selected.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu để gửi kết quả");
      return;
    }

    const sample = detail.samples.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    const results = sampleResults.get(sampleId) || [];
    const validIndicators: { indicatorId: string; testDate: string }[] = [];
    const missingResultIds: string[] = [];
    const missingTestDateIds: string[] = [];

    selected.forEach((indicatorId) => {
      const indicator = sample.indicators.find((i) => i.id === indicatorId);
      if (!indicator) return;

      // Chỉ xử lý các chỉ tiêu có trạng thái cho phép gửi (Todo, Testing, Rejected)
      if (
        indicator.testingStatus !== IndicatorTestingStatus.Todo &&
        indicator.testingStatus !== IndicatorTestingStatus.Testing &&
        indicator.testingStatus !== IndicatorTestingStatus.Rejected
      ) {
        return;
      }

      const editedResult = results.find((r) => r.indicatorId === indicatorId);
      const resultValue = editedResult?.result ?? indicator.result;
      const testDate = editedResult?.testDate ?? indicator.testDate;

      if (!resultValue || resultValue.trim() === "") {
        missingResultIds.push(indicatorId);
        return;
      }

      if (!testDate) {
        missingTestDateIds.push(indicatorId);
        return;
      }

      validIndicators.push({ indicatorId, testDate });
    });

    if (missingResultIds.length > 0) {
      const missingNames = missingResultIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(`Vui lòng nhập kết quả cho: ${missingNames}`);
      return;
    }

    if (missingTestDateIds.length > 0) {
      const missingNames = missingTestDateIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(`Vui lòng chọn ngày thử nghiệm cho: ${missingNames}`);
      return;
    }

    if (validIndicators.length === 0) {
      message.warning("Không có chỉ tiêu hợp lệ để gửi kết quả");
      return;
    }

    const validIndicatorIds = validIndicators.map((v) => v.indicatorId);
    const selectedResults = results.filter((r) =>
      validIndicatorIds.includes(r.indicatorId)
    );

    setSubmitting(true);
    try {
      // Lưu kết quả trước
      if (selectedResults.length > 0) {
        await testingService.saveResults(id, { results: selectedResults });
      }

      // Gửi kết quả với testDate
      await testingService.submitResults(id, {
        sampleId,
        indicators: validIndicators.map((v) => ({
          indicatorId: v.indicatorId,
          testDate: v.testDate,
        })),
      });

      // Optimistic update: cập nhật indicator testingStatus thành PendingApproval
      const now = new Date().toISOString();
      updateIndicatorsOptimistically(validIndicatorIds, {
        testingStatus: IndicatorTestingStatus.PendingApproval,
        submitDate: now,
        canSubmit: false,
      });

      // Reload full data from server (avoid duplicating BE logic)
      await reloadData();

      message.success(
        `Gửi kết quả thành công cho ${validIndicators.length} chỉ tiêu`
      );
      // Clear selection sau khi thành công
      setSelectedIndicators((prev) => {
        const newSelected = new Map(prev);
        newSelected.set(sampleId, []);
        return newSelected;
      });
    } catch (error: any) {
      console.error("Failed to submit results:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể gửi kết quả"
      );
      // Reload để sync lại với server nếu có lỗi
      await loadDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const handleImagesChange = (
    sampleId: string,
    imageType: SampleTestingImageType,
    images: SampleTestingImageDto[]
  ) => {
    if (!detail) return;

    const updatedSamples = detail.samples.map((sample) => {
      if (sample.sampleId !== sampleId) return sample;

      if (imageType === SampleTestingImageType.BeforeTesting) {
        return { ...sample, beforeTestingImages: images };
      } else {
        return { ...sample, afterTestingImages: images };
      }
    });

    setDetail({ ...detail, samples: updatedSamples });
  };

  const showRejectionHistory = (indicatorId: string, indicatorName: string) => {
    setHistoryModal({
      visible: true,
      indicatorId,
      indicatorName,
    });
  };

  const handleSubmitSingleIndicator = async (indicatorId: string) => {
    if (!id || !detail) return;

    let sampleId: string | null = null;
    let indicator = null;
    for (const sample of detail.samples) {
      const found = sample.indicators.find((i) => i.id === indicatorId);
      if (found) {
        sampleId = sample.sampleId;
        indicator = found;
        break;
      }
    }

    if (!sampleId || !indicator) return;

    // Cho phép gửi khi trạng thái = Todo, Testing hoặc Rejected
    if (
      indicator.testingStatus !== IndicatorTestingStatus.Todo &&
      indicator.testingStatus !== IndicatorTestingStatus.Testing &&
      indicator.testingStatus !== IndicatorTestingStatus.Rejected
    ) {
      message.warning("Chỉ tiêu này không thể gửi kết quả");
      return;
    }

    const results = sampleResults.get(sampleId) || [];
    const editedResult = results.find((r) => r.indicatorId === indicatorId);
    const resultValue = editedResult?.result ?? indicator.result;
    const testDate = editedResult?.testDate ?? indicator.testDate;

    if (!resultValue || resultValue.trim() === "") {
      message.warning("Vui lòng nhập kết quả trước khi gửi");
      return;
    }

    if (!testDate) {
      message.warning("Vui lòng chọn ngày thử nghiệm trước khi gửi");
      return;
    }

    setSubmitting(true);
    try {
      // Lưu kết quả trước
      if (editedResult) {
        await testingService.saveResults(id, { results: [editedResult] });
      }

      // Gửi kết quả với testDate
      await testingService.submitResults(id, {
        sampleId,
        indicators: [{ indicatorId, testDate }],
      });

      // Optimistic update: cập nhật indicator testingStatus thành PendingApproval
      const now = new Date().toISOString();
      updateIndicatorsOptimistically([indicatorId], {
        testingStatus: IndicatorTestingStatus.PendingApproval,
        submitDate: now,
        canSubmit: false,
        result: resultValue,
      });

      // Reload full data from server (avoid duplicating BE logic)
      await reloadData();

      message.success("Gửi kết quả thành công");
    } catch (error: any) {
      console.error("Failed to submit indicator result:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể gửi kết quả"
      );
      // Reload để sync lại với server nếu có lỗi
      await loadDetail();
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for uploading indicator images
  const handleUploadIndicatorImages = async (
    indicatorId: string,
    files: File[]
  ): Promise<IndicatorImageDto[]> => {
    if (!id) return [];

    try {
      const newImages = await testingService.uploadIndicatorImages(
        id,
        indicatorId,
        files
      );

      // Update local state to reflect the new images
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          samples: prev.samples.map((sample) => ({
            ...sample,
            indicators: sample.indicators.map((ind) =>
              ind.id === indicatorId
                ? { ...ind, images: [...(ind.images || []), ...newImages] }
                : ind
            ),
          })),
        };
      });

      return newImages;
    } catch (error: any) {
      console.error("Failed to upload indicator images:", error);
      throw error;
    }
  };

  // Handler for deleting indicator image
  const handleDeleteIndicatorImage = async (imageId: string): Promise<void> => {
    try {
      await testingService.deleteIndicatorImage(imageId);

      // Update local state to remove the deleted image
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          samples: prev.samples.map((sample) => ({
            ...sample,
            indicators: sample.indicators.map((ind) => ({
              ...ind,
              images: (ind.images || []).filter((img) => img.id !== imageId),
            })),
          })),
        };
      });
    } catch (error: any) {
      console.error("Failed to delete indicator image:", error);
      throw error;
    }
  };

  // Check if deadline is urgent (<=3 days)
  const isUrgent = detail?.requestCompletionDate
    ? (() => {
        const deadline = new Date(detail.requestCompletionDate);
        const today = new Date();
        const diffDays = Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 3;
      })()
    : false;

  // Sort samples theo sampleId để cố định vị trí
  const sortedSamples = detail?.samples
    ? [...detail.samples].sort((a, b) => a.sampleId.localeCompare(b.sampleId))
    : [];

  return (
    <TestingDetailContainer
      detail={detail!}
      taskId={id!}
      loading={loading}
      submitting={submitting}
      isUrgent={isUrgent}
      sortedSamples={sortedSamples}
      activeKeys={activeKeys}
      selectedIndicators={selectedIndicators}
      historyModal={historyModal}
      resultOptions={resultOptions}
      canPerformActions={canPerformActions}
      onBack={() => navigate("/testing")}
      onCollapseChange={setActiveKeys}
      onSubmitResults={handleSubmitResults}
      onResultsChange={handleResultsChange}
      onSelectionChange={handleSelectionChange}
      onImagesChange={handleImagesChange}
      onShowRejectionHistory={showRejectionHistory}
      onCloseHistoryModal={() =>
        setHistoryModal({ visible: false, indicatorId: "", indicatorName: "" })
      }
      onSaveIndicator={handleSaveIndicator}
      onSubmitIndicator={handleSubmitSingleIndicator}
      onUploadIndicatorImages={handleUploadIndicatorImages}
      onDeleteIndicatorImage={handleDeleteIndicatorImage}
    />
  );
};

export default TestingDetail;
