import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import { testingService } from "../../services/testingService";
import {
  TestingDetailDto,
  TestingIndicatorDto,
  SaveIndicatorResultDto,
  SampleTestingImageType,
  SampleTestingImageDto,
  IndicatorTestingStatus,
} from "../../types/testing";
import TestingDetailContainer from "./components/TestingDetailContainer";

const TestingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<TestingDetailDto | null>(null);

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

  const handleCheckIn = async (sampleId: string) => {
    if (!id || !detail) return;
    const selected = selectedIndicators.get(sampleId) || [];

    if (selected.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu để thực hiện");
      return;
    }

    const sample = detail.samples.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    const validIndicatorIds: string[] = [];
    const alreadyTestingIds: string[] = [];

    selected.forEach((indicatorId) => {
      const indicator = sample.indicators.find((i) => i.id === indicatorId);
      if (!indicator) return;

      if (
        indicator.testingStatus === IndicatorTestingStatus.Todo ||
        indicator.testingStatus === IndicatorTestingStatus.Rejected
      ) {
        validIndicatorIds.push(indicatorId);
      } else if (indicator.testingStatus === IndicatorTestingStatus.Testing) {
        alreadyTestingIds.push(indicatorId);
      }
    });

    if (alreadyTestingIds.length > 0 && validIndicatorIds.length === 0) {
      const testingNames = alreadyTestingIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(
        `Các chỉ tiêu "${testingNames}" đang ở trạng thái "Đang thí nghiệm", không cần thực hiện lại`
      );
      return;
    }

    if (validIndicatorIds.length === 0) {
      message.warning(
        "Không có chỉ tiêu nào ở trạng thái 'Cần làm' hoặc 'Bị từ chối' để thực hiện"
      );
      return;
    }

    setSubmitting(true);
    try {
      await testingService.checkInIndicators(id, {
        sampleId,
        indicatorIds: validIndicatorIds,
      });

      // Optimistic update: cập nhật indicator testingStatus thành Testing
      const now = new Date().toISOString();
      updateIndicatorsOptimistically(validIndicatorIds, {
        testingStatus: IndicatorTestingStatus.Testing,
        startDate: now,
        canCheckIn: false,
        canSubmit: true,
      });

      // Reload full data from server (avoid duplicating BE logic)
      await reloadData();

      message.success(
        `Đã bắt đầu thực hiện ${validIndicatorIds.length} chỉ tiêu`
      );
      // Clear selection sau khi thành công
      setSelectedIndicators((prev) => {
        const newSelected = new Map(prev);
        newSelected.set(sampleId, []);
        return newSelected;
      });
    } catch (error: any) {
      console.error("Failed to check-in:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể thực hiện"
      );
      // Reload để sync lại với server nếu có lỗi
      await loadDetail();
    } finally {
      setSubmitting(false);
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
    const validIndicatorIds: string[] = [];
    const missingResultIds: string[] = [];
    const todoStatusIds: string[] = [];
    const rejectedStatusIds: string[] = [];

    selected.forEach((indicatorId) => {
      const indicator = sample.indicators.find((i) => i.id === indicatorId);
      if (!indicator) return;

      if (indicator.testingStatus === IndicatorTestingStatus.Todo) {
        todoStatusIds.push(indicatorId);
        return;
      }

      if (indicator.testingStatus === IndicatorTestingStatus.Rejected) {
        rejectedStatusIds.push(indicatorId);
        return;
      }

      if (indicator.testingStatus !== IndicatorTestingStatus.Testing) {
        return;
      }

      const editedResult = results.find((r) => r.indicatorId === indicatorId);
      const resultValue = editedResult?.result ?? indicator.result;

      if (!resultValue || resultValue.trim() === "") {
        missingResultIds.push(indicatorId);
        return;
      }

      validIndicatorIds.push(indicatorId);
    });

    if (todoStatusIds.length > 0 && validIndicatorIds.length === 0) {
      const todoNames = todoStatusIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(
        `Các chỉ tiêu "${todoNames}" đang ở trạng thái "Cần làm". Vui lòng ấn "Thực hiện" trước khi gửi kết quả`
      );
      return;
    }

    if (rejectedStatusIds.length > 0 && validIndicatorIds.length === 0) {
      const rejectedNames = rejectedStatusIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(
        `Các chỉ tiêu "${rejectedNames}" đang ở trạng thái "Bị từ chối". Vui lòng ấn "Thực hiện" để thử nghiệm lại`
      );
      return;
    }

    if (missingResultIds.length > 0) {
      const missingNames = missingResultIds
        .map((id) => sample.indicators.find((i) => i.id === id)?.indicatorName)
        .filter(Boolean)
        .join(", ");
      message.warning(`Vui lòng nhập kết quả cho: ${missingNames}`);
      return;
    }

    if (validIndicatorIds.length === 0) {
      message.warning("Không có chỉ tiêu hợp lệ để gửi kết quả");
      return;
    }

    const selectedResults = results.filter((r) =>
      validIndicatorIds.includes(r.indicatorId)
    );

    setSubmitting(true);
    try {
      if (selectedResults.length > 0) {
        await testingService.saveResults(id, { results: selectedResults });
      }

      await testingService.submitResults(id, {
        sampleId,
        indicatorIds: validIndicatorIds,
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
        `Gửi kết quả thành công cho ${validIndicatorIds.length} chỉ tiêu`
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

  const handleCheckInSingleIndicator = async (indicatorId: string) => {
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

    if (
      indicator.testingStatus !== IndicatorTestingStatus.Todo &&
      indicator.testingStatus !== IndicatorTestingStatus.Rejected
    ) {
      message.warning(
        'Chỉ tiêu này không ở trạng thái "Cần làm" hoặc "Bị từ chối"'
      );
      return;
    }

    setSubmitting(true);
    try {
      await testingService.checkInIndicators(id, {
        sampleId,
        indicatorIds: [indicatorId],
      });

      // Optimistic update: cập nhật indicator testingStatus thành Testing
      const now = new Date().toISOString();
      updateIndicatorsOptimistically([indicatorId], {
        testingStatus: IndicatorTestingStatus.Testing,
        startDate: now,
        canCheckIn: false,
        canSubmit: true,
      });

      // Reload full data from server (avoid duplicating BE logic)
      await reloadData();

      message.success("Đã bắt đầu thực hiện chỉ tiêu");
    } catch (error: any) {
      console.error("Failed to check-in indicator:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể thực hiện"
      );
      // Reload để sync lại với server nếu có lỗi
      await loadDetail();
    } finally {
      setSubmitting(false);
    }
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

    if (indicator.testingStatus !== IndicatorTestingStatus.Testing) {
      message.warning('Chỉ tiêu này không ở trạng thái "Đang thí nghiệm"');
      return;
    }

    const results = sampleResults.get(sampleId) || [];
    const editedResult = results.find((r) => r.indicatorId === indicatorId);
    const resultValue = editedResult?.result ?? indicator.result;

    if (!resultValue || resultValue.trim() === "") {
      message.warning("Vui lòng nhập kết quả trước khi gửi");
      return;
    }

    setSubmitting(true);
    try {
      if (editedResult) {
        await testingService.saveResults(id, { results: [editedResult] });
      }

      await testingService.submitResults(id, {
        sampleId,
        indicatorIds: [indicatorId],
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
      onBack={() => navigate("/testing")}
      onCollapseChange={setActiveKeys}
      onCheckIn={handleCheckIn}
      onSubmitResults={handleSubmitResults}
      onResultsChange={handleResultsChange}
      onSelectionChange={handleSelectionChange}
      onImagesChange={handleImagesChange}
      onShowRejectionHistory={showRejectionHistory}
      onCloseHistoryModal={() =>
        setHistoryModal({ visible: false, indicatorId: "", indicatorName: "" })
      }
      onSaveIndicator={handleSaveIndicator}
      onCheckInIndicator={handleCheckInSingleIndicator}
      onSubmitIndicator={handleSubmitSingleIndicator}
    />
  );
};

export default TestingDetail;
