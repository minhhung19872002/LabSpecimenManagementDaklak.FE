import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import { testingService } from "../../services/testingService";
import { testResultValueService } from "../../services/testResultValueService";
import { getApiErrorMessage } from "../../utils/errorHandler";
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
import { TestRequestStatus } from "../../types/testRequest";
import { PATH_ROUTES } from "../../constants";
import "./Testing.css";

interface ResultOption {
  value: string;
  label: string;
}

interface IndicatorSpecimenTypePair {
  indicatorId: string;
  specimenTypeId: string;
}

interface TestResultValueWithIndicator {
  id: string;
  name: string;
  // List of (indicatorId, specimenTypeId) pairs this result value is associated with
  indicatorSpecimenTypePairs: IndicatorSpecimenTypePair[];
}

const TestingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<TestingDetailDto | null>(null);
  const [resultOptions, setResultOptions] = useState<ResultOption[]>([]);
  const [allResultValues, setAllResultValues] = useState<TestResultValueWithIndicator[]>([]);

  // Check if viewing from "Công việc của Lab" tab (readonly mode)
  // Valid viewMode values: "my" (default), "lab" (readonly)
  const rawViewMode = searchParams.get("view");
  const viewMode = rawViewMode === "lab" ? "lab" : "my"; // Validate: chỉ accept "lab", còn lại default "my"
  const isLabView = viewMode === "lab";
  // Map viewMode for API: "lab" -> "all", "my" -> "my"
  const apiViewMode: "my" | "all" = isLabView ? "all" : "my";

  // Sử dụng hook để check permissions cho tất cả actions theo Permission Matrix
  // Testing: KTV (A), QLKT (V), Admin (V)
  const actionPermissions = useMultipleActionPermissions("testing", [
    "viewDetail",
    "inputResult",
    "editResult",
    "sendResult",
  ]);

  // Check quyền xem chi tiết từ Permission Matrix
  const hasViewDetailPermission = actionPermissions.viewDetail?.canAll || actionPermissions.viewDetail?.canView || false;

  // KTV có quyền ALL = canAll = true, QLKT/Admin chỉ có View
  const canInputResult = actionPermissions.inputResult?.canAll || false;
  const canEditResult = actionPermissions.editResult?.canAll || false;
  const canSendResult = actionPermissions.sendResult?.canAll || false;

  // Check if test request is cancelled - disable all actions
  const isTestRequestCancelled = detail?.testRequestStatus === TestRequestStatus.Cancelled;

  // Tổng hợp: có thể thao tác (nhập/sửa/gửi) nếu có bất kỳ quyền nào
  // Ưu tiên isMy: nếu task là của user hiện tại thì cho phép thao tác bất kể view mode
  // Disable tất cả khi phiếu yêu cầu đã bị hủy
  const canPerformActions = !isTestRequestCancelled && detail?.isMy && (canInputResult || canEditResult || canSendResult);

  // Kiểm tra quyền xem chi tiết:
  // - Có quyền viewDetail từ Permission Matrix (QLKT, Admin)
  // - Hoặc task là của user hiện tại (isMy)
  const canViewTestingDetail = hasViewDetailPermission || detail?.isMy;

  // Redirect đến 403 nếu không có quyền xem (sau khi đã load detail xong)
  useEffect(() => {
    // Chỉ check sau khi đã load (loading = false và detail !== null)
    if (!loading && detail !== null && !canViewTestingDetail) {
      navigate(PATH_ROUTES.forbidden, { replace: true });
    }
  }, [loading, detail, canViewTestingDetail, navigate]);

  // Helper function to update indicators optimistically (indicator-level only)
  // Task-level status is fetched from server to avoid duplicating BE logic
  const updateIndicatorsOptimistically = useCallback(
    (
      indicatorIds: string[],
      indicatorUpdates: Partial<TestingIndicatorDto>
    ) => {
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          samples: prev.samples.map((sample) => ({
            ...sample,
            indicators: sample.indicators.map((ind) =>
              indicatorIds.includes(ind.id)
                ? { ...ind, ...indicatorUpdates }
                : ind
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
      const result = await testingService.get(id, apiViewMode);
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
                testDate: existingResult?.testDate ?? ind.testDate, // Quan trọng: cần testDate để batch submit hoạt động
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
  }, [id, apiViewMode]);

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

  // Cannot test modal
  const [cannotTestModal, setCannotTestModal] = useState({
    visible: false,
    indicatorId: "",
    indicatorName: "",
  });

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Sử dụng apiViewMode để gọi API với đúng context (my hoặc all)
      const result = await testingService.get(id, apiViewMode);
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
            testDate: ind.testDate, // Quan trọng: cần testDate để batch submit hoạt động
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
    } catch (error: any) {
      console.error("Failed to load testing detail:", error);
      // Nếu API trả về 403 (Forbidden) hoặc 401 (Unauthorized), redirect đến trang 403
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        navigate(PATH_ROUTES.forbidden, { replace: true });
        return;
      }
      message.error("Không thể tải thông tin xét nghiệm");
    } finally {
      setLoading(false);
    }
  }, [id, apiViewMode, navigate]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Load result value options for autocomplete
  useEffect(() => {
    const loadResultOptions = async () => {
      try {
        // Use getWithIndicators to get full data including indicators array
        const data = await testResultValueService.getWithIndicators();
        // Store full data for filtering by (indicatorId + specimenTypeId) pair
        setAllResultValues(
          data.map((item) => ({
            id: item.id,
            name: item.name,
            indicatorSpecimenTypePairs: item.indicators?.map((ind) => ({
              indicatorId: ind.indicatorId,
              specimenTypeId: ind.specimenTypeId,
            })) || [],
          }))
        );
        // Default options (all results) - will be filtered per indicator
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

  // Function to get result options filtered by (indicatorId + specimenTypeId)
  // - If (indicatorId + specimenTypeId) has specific results declared, return only those
  // - Otherwise, return ALL results
  const getResultOptionsForIndicator = useCallback((indicatorId: string, specimenTypeId?: string): ResultOption[] => {
    // Check if there are results specific to this (indicatorId + specimenTypeId) pair
    const specificResults = allResultValues.filter(r =>
      r.indicatorSpecimenTypePairs.some(pair =>
        pair.indicatorId === indicatorId &&
        (!specimenTypeId || pair.specimenTypeId === specimenTypeId)
      )
    );

    if (specificResults.length > 0) {
      // Has specific results - return only those
      return specificResults.map(item => ({
        value: item.name,
        label: item.name,
      }));
    }

    // No specific results for this (indicatorId + specimenTypeId) - return ALL results
    return allResultValues.map(item => ({
      value: item.name,
      label: item.name,
    }));
  }, [allResultValues]);

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

  const handleSaveIndicator = async (
    indicatorId: string,
    directResult?: SaveIndicatorResultDto
  ) => {
    if (!id) return;

    // Use directResult if provided (for immediate save like testDate change)
    // Otherwise, look up from sampleResults state
    let indicatorResult: SaveIndicatorResultDto | undefined = directResult;

    if (!indicatorResult) {
      sampleResults.forEach((results) => {
        const found = results.find((r) => r.indicatorId === indicatorId);
        if (found) {
          indicatorResult = found;
        }
      });
    }

    if (!indicatorResult) return;

    try {
      await testingService.saveResults(id, { results: [indicatorResult] });
    } catch (error: any) {
      console.error("Failed to save result:", error);
      message.error(
        getApiErrorMessage(error, "Không thể lưu kết quả")
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

      // Chỉ xử lý các chỉ tiêu có trạng thái cho phép gửi (Todo, Testing, Rejected, PendingApproval)
      if (
        indicator.testingStatus !== IndicatorTestingStatus.Todo &&
        indicator.testingStatus !== IndicatorTestingStatus.Testing &&
        indicator.testingStatus !== IndicatorTestingStatus.Rejected &&
        indicator.testingStatus !== IndicatorTestingStatus.PendingApproval
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
        getApiErrorMessage(error, "Không thể gửi kết quả")
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

  const showCannotTestModal = (indicatorId: string, indicatorName: string) => {
    setCannotTestModal({
      visible: true,
      indicatorId,
      indicatorName,
    });
  };

  const closeCannotTestModal = () => {
    setCannotTestModal({
      visible: false,
      indicatorId: "",
      indicatorName: "",
    });
  };

  const handleCannotTestSuccess = async () => {
    closeCannotTestModal();
    // Reload data to get updated status
    await reloadData();
    message.success("Đã báo không thể thử nghiệm thành công");
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

    // Cho phép gửi khi trạng thái = Todo, Testing, Rejected hoặc PendingApproval (gửi lại khi QLKT chưa duyệt)
    if (
      indicator.testingStatus !== IndicatorTestingStatus.Todo &&
      indicator.testingStatus !== IndicatorTestingStatus.Testing &&
      indicator.testingStatus !== IndicatorTestingStatus.Rejected &&
      indicator.testingStatus !== IndicatorTestingStatus.PendingApproval
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
        getApiErrorMessage(error, "Không thể gửi kết quả")
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

  // Handler for bulk test date change (từ DatePicker trên SamplePanelHeader)
  const handleBulkTestDateChange = async (
    sampleId: string,
    indicatorIds: string[],
    date: string
  ) => {
    if (!id || indicatorIds.length === 0) return;

    const sample = detail?.samples.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    // Lấy current sampleResults để giữ lại kết quả đã nhập
    const currentSampleResults = sampleResults.get(sampleId) || [];

    // Tạo resultsToSave TRƯỚC KHI update state để tránh race condition
    // Ưu tiên lấy result từ sampleResults (đã nhập), fallback sang indicator.result
    const resultsToSave: SaveIndicatorResultDto[] = indicatorIds.map(
      (indicatorId) => {
        const indicator = sample.indicators.find((i) => i.id === indicatorId);
        const existingResult = currentSampleResults.find(
          (r) => r.indicatorId === indicatorId
        );
        return {
          indicatorId,
          methodId: existingResult?.methodId ?? indicator?.methodId,
          unit: existingResult?.unit ?? indicator?.unit,
          result: existingResult?.result ?? indicator?.result,
          testDate: date,
        };
      }
    );

    // Cập nhật local state (sampleResults) - giữ lại result đã nhập
    setSampleResults((prev) => {
      const newResults = new Map(prev);
      const sampleResultList = newResults.get(sampleId) || [];

      const updatedList = sampleResultList.map((result) => {
        if (indicatorIds.includes(result.indicatorId)) {
          return { ...result, testDate: date };
        }
        return result;
      });

      // Thêm result mới nếu chưa tồn tại trong sampleResults
      indicatorIds.forEach((indicatorId) => {
        if (!updatedList.find((r) => r.indicatorId === indicatorId)) {
          const indicator = sample.indicators.find(
            (i) => i.id === indicatorId
          );
          if (indicator) {
            updatedList.push({
              indicatorId,
              methodId: indicator.methodId,
              unit: indicator.unit,
              result: indicator.result,
              testDate: date,
            });
          }
        }
      });

      newResults.set(sampleId, updatedList);
      return newResults;
    });

    // Cập nhật detail state để UI hiển thị ngày mới ngay lập tức
    setDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        samples: prev.samples.map((s) => {
          if (s.sampleId !== sampleId) return s;
          return {
            ...s,
            indicators: s.indicators.map((ind) =>
              indicatorIds.includes(ind.id) ? { ...ind, testDate: date } : ind
            ),
          };
        }),
      };
    });

    // Lưu tất cả indicators với testDate mới lên server
    try {
      await testingService.saveResults(id, { results: resultsToSave });
    } catch (error: any) {
      console.error("Failed to save bulk test dates:", error);
      message.error(
        getApiErrorMessage(error, "Không thể lưu ngày thử nghiệm")
      );
      // Reload lại data nếu có lỗi để sync với server
      await reloadData();
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
      cannotTestModal={cannotTestModal}
      resultOptions={resultOptions}
      getResultOptionsForIndicator={getResultOptionsForIndicator}
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
      onShowCannotTestModal={showCannotTestModal}
      onCloseCannotTestModal={closeCannotTestModal}
      onCannotTestSuccess={handleCannotTestSuccess}
      onSaveIndicator={handleSaveIndicator}
      onSubmitIndicator={handleSubmitSingleIndicator}
      onUploadIndicatorImages={handleUploadIndicatorImages}
      onDeleteIndicatorImage={handleDeleteIndicatorImage}
      onBulkTestDateChange={handleBulkTestDateChange}
    />
  );
};

export default TestingDetail;
