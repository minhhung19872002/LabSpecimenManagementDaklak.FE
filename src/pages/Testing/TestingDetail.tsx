import React, { useState, useEffect, useCallback, useMemo, useTransition, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { message, Form } from "antd";
import { testingService } from "../../services/testingService";
import { testResultValueService } from "../../services/testResultValueService";
import { laboratoryTaskService } from "../../services/laboratoryTaskService";
import { MethodLookupDto } from "../../types/laboratoryTask";
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
import { usePageTitleOverride } from "../../hooks/usePageTitle";
import { TestRequestStatus } from "../../types/testRequest";
import { PATH_ROUTES, STORAGE_KEYS } from "../../constants";
import { DEFAULT_INDICATOR_VISIBLE_COLUMNS } from "./components/IndicatorEditTable";
import "./Testing.css";


interface ResultOption {
  value: string;
  label: string;
}

interface IndicatorSpecimenTypePair {
  indicatorId: string;
  specimenTypeId: string;
}

// Chỉ tiêu đổi được phương pháp — khớp điều kiện khóa Select PP từng dòng
// (IndicatorEditTable.isRowLocked) và guard của BE (Approved/CustomerCancelled)
const canBulkEditMethod = (ind: TestingIndicatorDto) =>
  ind.canEdit &&
  ind.testingStatus !== IndicatorTestingStatus.Done &&
  ind.testingStatus !== IndicatorTestingStatus.Cancelled;

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
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const submitting = bulkSubmitting;
  const [detail, setDetail] = useState<TestingDetailDto | null>(null);
  const [resultOptions, setResultOptions] = useState<ResultOption[]>([]);
  const [allResultValues, setAllResultValues] = useState<TestResultValueWithIndicator[]>([]);
  // Danh sách phương pháp từ master data cho dropdown chọn PP
  const [methods, setMethods] = useState<MethodLookupDto[]>([]);
  // Các chỉ tiêu đang lưu PP/ĐVT (disable control trong lúc chờ API)
  const [savingIndicatorIds, setSavingIndicatorIds] = useState<string[]>([]);

  // Bulk chọn phương pháp: filter hiển thị theo chỉ tiêu + modal chọn PP
  const [indicatorFilter, setIndicatorFilter] = useState<string[]>([]);
  const [methodSelectModalOpen, setMethodSelectModalOpen] = useState(false);
  const [bulkMethodLoading, setBulkMethodLoading] = useState(false);
  const [methodSelectForm] = Form.useForm();

  // Check if viewing from "Công việc của Lab" tab (readonly mode)
  // Valid viewMode values: "my" (default), "lab" (readonly)
  const rawViewMode = searchParams.get("view");
  const viewMode = rawViewMode === "lab" ? "lab" : "my"; // Validate: chỉ accept "lab", còn lại default "my"
  const isLabView = viewMode === "lab";
  // Map viewMode for API: "lab" -> "all", "my" -> "my"
  const apiViewMode: "my" | "all" = isLabView ? "all" : "my";

  // Tab header = Mã số mẫu khi mở từ "Sổ nhận mẫu giao việc" (mở tab trình duyệt mới)
  usePageTitleOverride(searchParams.get("sampleCode") || undefined);

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

  // Column visibility state for indicator table
  const [indicatorVisibleColumns, setIndicatorVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TESTING_INDICATOR_VISIBLE_COLUMNS);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return DEFAULT_INDICATOR_VISIBLE_COLUMNS;
  });

  const handleIndicatorVisibleColumnsChange = useCallback((keys: string[]) => {
    setIndicatorVisibleColumns(keys);
    localStorage.setItem(STORAGE_KEYS.TESTING_INDICATOR_VISIBLE_COLUMNS, JSON.stringify(keys));
  }, []);

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
  // Ref to read sampleResults in callbacks without adding it to useCallback deps
  // (prevents all 15 SamplePanelContent memos from failing on every keystroke)
  const sampleResultsRef = useRef(sampleResults);
  useEffect(() => { sampleResultsRef.current = sampleResults; }, [sampleResults]);

  // Selected indicators per sample (for multiselect)
  const [selectedIndicators, setSelectedIndicators] = useState<
    Map<string, string[]>
  >(new Map());

  // Active collapse keys (open all panels by default)
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const handleCollapseChange = useCallback(
    (keys: string[]) => startTransition(() => setActiveKeys(keys)),
    [],
  );

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
      const result: TestingDetailDto = await testingService.get(id, apiViewMode);
      setDetail(result);

      // Initialize sample results
      const initialResults = new Map<string, SaveIndicatorResultDto[]>();
      result.samples.forEach((sample) => {
        initialResults.set(
          sample.sampleId,
          sample.indicators.map((ind) => ({
            indicatorId: ind.id,
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

  // Load danh sách phương pháp (tất cả từ master data) cho dropdown chọn PP
  useEffect(() => {
    const loadMethods = async () => {
      try {
        // Không truyền indicatorId -> trả về toàn bộ method active
        const result = await laboratoryTaskService.getMethodsByIndicator();
        setMethods(result || []);
      } catch (error) {
        console.error("Failed to load methods:", error);
      }
    };
    loadMethods();
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

  const handleResultsChange = useCallback((
    sampleId: string,
    results: SaveIndicatorResultDto[]
  ) => {
    setSampleResults((prev) => {
      const newResults = new Map(prev);
      newResults.set(sampleId, results);
      // Update ref synchronously so handleSaveIndicator (called onBlur in the
      // same event batch) always reads the latest value, before useEffect runs.
      sampleResultsRef.current = newResults;
      return newResults;
    });
  }, []);

  const handleSelectionChange = useCallback((sampleId: string, indicatorIds: string[]) => {
    setSelectedIndicators((prev) => {
      const newSelected = new Map(prev);
      newSelected.set(sampleId, indicatorIds);
      return newSelected;
    });
  }, []);

  const handleSaveIndicator = useCallback(async (
    indicatorId: string,
    directResult?: SaveIndicatorResultDto
  ) => {
    if (!id) return;

    let indicatorResult: SaveIndicatorResultDto | undefined = directResult;

    if (!indicatorResult) {
      sampleResultsRef.current.forEach((results) => {
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
      message.error(getApiErrorMessage(error, "Không thể lưu kết quả"));
    }
  }, [id]);

  // Thay nguyên indicator trong detail bằng DTO server trả về (giống cách QLKT làm) —
  // KHÔNG spread-merge để case clear PP (field null/bị omit) không giữ lại giá trị cũ
  const replaceIndicator = useCallback((updated: TestingIndicatorDto) => {
    setDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        samples: prev.samples.map((sample) => ({
          ...sample,
          indicators: sample.indicators.map((ind) =>
            ind.id === updated.id ? updated : ind
          ),
        })),
      };
    });
  }, []);

  // Đổi phương pháp: lưu ngay qua API riêng, thay indicator bằng DTO server trả về
  // (DTO mang sẵn ĐVT resolved theo PP mới + giới hạn mới + canEdit/testingStatus mới)
  const handleMethodChange = useCallback(async (
    indicatorId: string,
    methodId: string | null
  ) => {
    setSavingIndicatorIds((prev) => [...prev, indicatorId]);
    try {
      const updated = await testingService.updateIndicatorMethod(indicatorId, methodId);
      replaceIndicator(updated);
      message.open({
        type: "success",
        content: "Đã lưu phương pháp",
        duration: 1.2,
        key: "testing-method-autosave-success",
      });
    } catch (error: any) {
      console.error("Failed to update method:", error);
      message.error(getApiErrorMessage(error, "Không thể cập nhật phương pháp"));
    } finally {
      setSavingIndicatorIds((prev) => prev.filter((i) => i !== indicatorId));
    }
  }, [replaceIndicator]);

  // Đổi ĐVT: lưu khi blur qua API riêng.
  // Không track savingIndicatorIds ở đây: ĐVT không cần disable khi lưu, và
  // push/filter trùng id với save PP sẽ mở khóa Select PP sớm hơn dự kiến.
  const handleUnitChange = useCallback(async (
    indicatorId: string,
    unit: string | null
  ) => {
    try {
      const updated = await testingService.updateIndicatorUnit(indicatorId, unit);
      replaceIndicator(updated);
    } catch (error: any) {
      console.error("Failed to update unit:", error);
      message.error(getApiErrorMessage(error, "Không thể cập nhật đơn vị tính"));
    }
  }, [replaceIndicator]);

  const handleSubmitResults = useCallback(async (sampleId: string) => {
    if (!id || !detail) return;
    const selected = selectedIndicators.get(sampleId) || [];

    if (selected.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 chỉ tiêu để gửi kết quả");
      return;
    }

    const sample = detail.samples.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    const results = sampleResultsRef.current.get(sampleId) || [];
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

    setBulkSubmitting(true);
    try {
      if (selectedResults.length > 0) {
        await testingService.saveResults(id, { results: selectedResults });
      }
      await testingService.submitResults(id, {
        sampleId,
        indicators: validIndicators,
      });
      const submittedIds = validIndicators.map((v) => v.indicatorId);
      updateIndicatorsOptimistically(submittedIds, {
        testingStatus: IndicatorTestingStatus.PendingApproval,
        submitDate: new Date().toISOString(),
        canSubmit: false,
      });
      setSelectedIndicators((prev) => {
        const newMap = new Map(prev);
        newMap.set(sampleId, []);
        return newMap;
      });
      message.success(`Gửi kết quả thành công (${validIndicators.length} chỉ tiêu)`);
      await reloadData();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Lỗi gửi kết quả"));
    } finally {
      setBulkSubmitting(false);
    }
  }, [id, detail, selectedIndicators, updateIndicatorsOptimistically, reloadData]);

  const handleImagesChange = useCallback((
    sampleId: string,
    imageType: SampleTestingImageType,
    images: SampleTestingImageDto[]
  ) => {
    setDetail((prev) => {
      if (!prev) return prev;
      const updatedSamples = prev.samples.map((sample) => {
        if (sample.sampleId !== sampleId) return sample;
        if (imageType === SampleTestingImageType.BeforeTesting) {
          return { ...sample, beforeTestingImages: images };
        } else {
          return { ...sample, afterTestingImages: images };
        }
      });
      return { ...prev, samples: updatedSamples };
    });
  }, []);

  const showRejectionHistory = useCallback((indicatorId: string, indicatorName: string) => {
    setHistoryModal({ visible: true, indicatorId, indicatorName });
  }, []);

  const showCannotTestModal = useCallback((indicatorId: string, indicatorName: string) => {
    setCannotTestModal({ visible: true, indicatorId, indicatorName });
  }, []);

  const closeCannotTestModal = useCallback(() => {
    setCannotTestModal({ visible: false, indicatorId: "", indicatorName: "" });
  }, []);

  const handleCannotTestSuccess = useCallback(async () => {
    closeCannotTestModal();
    await reloadData();
    message.success("Đã báo không thể thử nghiệm thành công");
  }, [closeCannotTestModal, reloadData]);

  const handleSubmitSingleIndicator = useCallback(async (indicatorId: string) => {
    if (!id || !detail) return;

    let sampleId: string | null = null;
    let indicator: TestingIndicatorDto | null = null;
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
      indicator.testingStatus !== IndicatorTestingStatus.Testing &&
      indicator.testingStatus !== IndicatorTestingStatus.Rejected &&
      indicator.testingStatus !== IndicatorTestingStatus.PendingApproval
    ) {
      message.warning("Chỉ tiêu này không thể gửi kết quả");
      return;
    }

    const results = sampleResultsRef.current.get(sampleId) || [];
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

    try {
      if (editedResult) {
        await testingService.saveResults(id, { results: [editedResult] });
      }
      await testingService.submitResults(id, {
        sampleId,
        indicators: [{ indicatorId, testDate }],
      });
      updateIndicatorsOptimistically([indicatorId], {
        testingStatus: IndicatorTestingStatus.PendingApproval,
        submitDate: new Date().toISOString(),
        canSubmit: false,
        result: resultValue,
      });
      message.success("Gửi kết quả thành công");
      await reloadData();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Lỗi gửi kết quả"));
    }
  }, [id, detail, updateIndicatorsOptimistically, reloadData]);

  const handleUploadIndicatorImages = useCallback(async (
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
  }, [id]);

  const handleDeleteIndicatorImage = useCallback(async (imageId: string): Promise<void> => {
    try {
      await testingService.deleteIndicatorImage(imageId);

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
  }, []);

  const handleBulkTestDateChange = useCallback(async (
    sampleId: string,
    indicatorIds: string[],
    date: string
  ) => {
    if (!id || indicatorIds.length === 0) return;

    const sample = detail?.samples.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    // Lấy current sampleResults để giữ lại kết quả đã nhập
    const currentSampleResults = sampleResultsRef.current.get(sampleId) || [];

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
  }, [id, detail, reloadData]);

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

  const sortedSamples = useMemo(
    () => detail?.samples
      ? [...detail.samples].sort((a, b) => (a.sampleCode || "").localeCompare(b.sampleCode || ""))
      : [],
    [detail?.samples]
  );

  // Options cho dropdown "Chọn chỉ tiêu" (chỉ tiêu gốc, dedup theo indicatorId)
  const indicatorFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    sortedSamples.forEach((sample) => {
      sample.indicators.forEach((ind) => {
        if (ind.indicatorId && ind.indicatorName && !ind.parentIndicatorId && !seen.has(ind.indicatorId)) {
          seen.set(ind.indicatorId, ind.indicatorName);
        }
      });
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [sortedSamples]);

  // Lọc mẫu theo chỉ tiêu đã chọn (giữ sub-indicator có parent nằm trong filter)
  const filteredSamples = useMemo(() => {
    if (indicatorFilter.length === 0) return sortedSamples;
    return sortedSamples
      .map((sample) => ({
        ...sample,
        indicators: sample.indicators.filter(
          (ind) =>
            indicatorFilter.includes(ind.indicatorId) ||
            (!!ind.parentIndicatorId && indicatorFilter.includes(ind.parentIndicatorId))
        ),
      }))
      .filter((sample) => sample.indicators.length > 0);
  }, [sortedSamples, indicatorFilter]);

  // Các chỉ tiêu chọn được toàn cục — cùng điều kiện với checkbox trong IndicatorEditTable:
  // không phải parent có children, trạng thái không phải Done/Cancelled
  const allGlobalSelectableIds = useMemo(() => {
    const result = new Map<string, string[]>();
    filteredSamples.forEach((sample) => {
      const parentIndicatorIds = new Set(
        sample.indicators
          .filter((ind) => !!ind.parentIndicatorId)
          .map((ind) => ind.parentIndicatorId as string)
      );
      const selectableIds = sample.indicators
        .filter(
          (ind) =>
            !parentIndicatorIds.has(ind.indicatorId) &&
            ind.testingStatus !== IndicatorTestingStatus.Done &&
            ind.testingStatus !== IndicatorTestingStatus.Cancelled
        )
        .map((ind) => ind.id);
      if (selectableIds.length > 0) {
        result.set(sample.sampleId, selectableIds);
      }
    });
    return result;
  }, [filteredSamples]);

  const totalGlobalSelectable = useMemo(
    () => Array.from(allGlobalSelectableIds.values()).reduce((acc, ids) => acc + ids.length, 0),
    [allGlobalSelectableIds]
  );
  const totalGlobalSelected = useMemo(
    () => Array.from(selectedIndicators.values()).reduce((acc, ids) => acc + ids.length, 0),
    [selectedIndicators]
  );
  const globalSelectedSampleCount = useMemo(
    () => Array.from(selectedIndicators.values()).filter((ids) => ids.length > 0).length,
    [selectedIndicators]
  );
  // Trong số đã chọn, số chỉ tiêu gốc thực sự đổi được PP — selection dùng chung với
  // "Gửi kết quả" nên có thể chứa chỉ tiêu không đổi được PP (canEdit=false, sub-indicator...)
  const totalMethodEditableSelected = useMemo(() => {
    const selectedIds = new Set(Array.from(selectedIndicators.values()).flat());
    return (detail?.samples ?? []).reduce(
      (acc, sample) =>
        acc +
        sample.indicators.filter(
          (ind) => selectedIds.has(ind.id) && !ind.parentIndicatorId && canBulkEditMethod(ind)
        ).length,
      0
    );
  }, [selectedIndicators, detail]);
  const isGlobalAllSelected =
    totalGlobalSelectable > 0 && totalGlobalSelected === totalGlobalSelectable;
  const isGlobalIndeterminate =
    totalGlobalSelected > 0 && totalGlobalSelected < totalGlobalSelectable;

  // Đổi filter -> reset toàn bộ selection (tránh update ngầm chỉ tiêu đang bị ẩn)
  const handleIndicatorFilterChange = useCallback((values: string[]) => {
    setIndicatorFilter(values);
    setSelectedIndicators(new Map());
  }, []);

  const handleGlobalSelectAll = useCallback(() => {
    setSelectedIndicators(isGlobalAllSelected ? new Map() : new Map(allGlobalSelectableIds));
  }, [isGlobalAllSelected, allGlobalSelectableIds]);

  const handleOpenMethodModal = useCallback(() => setMethodSelectModalOpen(true), []);
  const handleCloseMethodModal = useCallback(() => {
    setMethodSelectModalOpen(false);
    methodSelectForm.resetFields();
  }, [methodSelectForm]);

  // Bulk update PP cho các chỉ tiêu đã chọn: bỏ sub được chọn trực tiếp,
  // auto-include sub cùng mẫu có cùng PP với parent được chọn (giống QLKT bên TaskManagementDetail)
  const handleBulkMethodConfirm = useCallback(async () => {
    if (!id || !detail) return;

    let methodId: string;
    try {
      const values = await methodSelectForm.validateFields();
      methodId = values.methodId;
    } catch {
      return; // Form validation error — antd đã hiện lỗi tại field
    }

    const allSelectedIds = new Set(Array.from(selectedIndicators.values()).flat());
    if (allSelectedIds.size === 0) return;

    // idsToUpdate gồm cả sub auto-include; rootIds chỉ chỉ tiêu gốc — dùng cho message
    // để khớp với số hiển thị trên nút/title modal (totalMethodEditableSelected)
    const idsToUpdate = new Set<string>();
    const rootIds = new Set<string>();
    detail.samples.forEach((sample) => {
      sample.indicators.forEach((ind) => {
        if (!allSelectedIds.has(ind.id) || ind.parentIndicatorId) return;
        if (!canBulkEditMethod(ind)) return;
        idsToUpdate.add(ind.id);
        rootIds.add(ind.id);
        sample.indicators
          .filter(
            (i) =>
              i.parentIndicatorId === ind.indicatorId &&
              i.methodId === ind.methodId &&
              canBulkEditMethod(i)
          )
          .forEach((sub) => idsToUpdate.add(sub.id));
      });
    });
    if (idsToUpdate.size === 0) {
      message.warning("Không có chỉ tiêu đủ điều kiện để đổi phương pháp");
      return;
    }

    setBulkMethodLoading(true);
    try {
      const updated = await testingService.bulkUpdateIndicatorMethod(
        id,
        Array.from(idsToUpdate),
        methodId
      );

      // Thay nguyên DTO server trả về (không spread-merge — cùng lý do với replaceIndicator)
      if (updated.length > 0) {
        const updatedById = new Map(updated.map((ind) => [ind.id, ind]));
        setDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            samples: prev.samples.map((sample) => ({
              ...sample,
              indicators: sample.indicators.map((ind) => updatedById.get(ind.id) ?? ind),
            })),
          };
        });
      }

      await reloadData();

      // Đếm chỉ tiêu gốc theo kết quả BE thực sự update (BE có thể skip thêm) —
      // khớp với số hiển thị trên nút/title modal
      const updatedRootCount = updated.filter((u) => !u.parentIndicatorId).length;
      if (updatedRootCount < rootIds.size) {
        message.warning(
          `Đã cập nhật phương pháp cho ${updatedRootCount}/${rootIds.size} chỉ tiêu (bỏ qua chỉ tiêu không đủ điều kiện)`
        );
      } else {
        message.success(`Đã cập nhật phương pháp cho ${updatedRootCount} chỉ tiêu`);
      }
      setMethodSelectModalOpen(false);
      methodSelectForm.resetFields();
      setSelectedIndicators(new Map());
    } catch (error: any) {
      console.error("Failed to bulk update method:", error);
      message.error(getApiErrorMessage(error, "Không thể cập nhật phương pháp"));
    } finally {
      setBulkMethodLoading(false);
    }
  }, [methodSelectForm, selectedIndicators, detail, id, reloadData]);

  const handleBack = useCallback(() => navigate("/testing"), [navigate]);
  const handleCloseHistoryModal = useCallback(() =>
    setHistoryModal({ visible: false, indicatorId: "", indicatorName: "" }), []);

  return (
    <>
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
        isTestRequestCancelled={isTestRequestCancelled}
        methods={methods}
        savingIndicatorIds={savingIndicatorIds}
        onMethodChange={handleMethodChange}
        onUnitChange={handleUnitChange}
        onBack={handleBack}
        onCollapseChange={handleCollapseChange}
        onSubmitResults={handleSubmitResults}
        onResultsChange={handleResultsChange}
        onSelectionChange={handleSelectionChange}
        onImagesChange={handleImagesChange}
        onShowRejectionHistory={showRejectionHistory}
        onCloseHistoryModal={handleCloseHistoryModal}
        onShowCannotTestModal={showCannotTestModal}
        onCloseCannotTestModal={closeCannotTestModal}
        onCannotTestSuccess={handleCannotTestSuccess}
        onSaveIndicator={handleSaveIndicator}
        onSubmitIndicator={handleSubmitSingleIndicator}
        onUploadIndicatorImages={handleUploadIndicatorImages}
        onDeleteIndicatorImage={handleDeleteIndicatorImage}
        onBulkTestDateChange={handleBulkTestDateChange}
        indicatorVisibleColumns={indicatorVisibleColumns}
        onIndicatorVisibleColumnsChange={handleIndicatorVisibleColumnsChange}
        filteredSamples={filteredSamples}
        indicatorFilter={indicatorFilter}
        indicatorFilterOptions={indicatorFilterOptions}
        totalGlobalSelectable={totalGlobalSelectable}
        totalGlobalSelected={totalGlobalSelected}
        totalMethodEditableSelected={totalMethodEditableSelected}
        globalSelectedSampleCount={globalSelectedSampleCount}
        isGlobalAllSelected={isGlobalAllSelected}
        isGlobalIndeterminate={isGlobalIndeterminate}
        methodSelectModalOpen={methodSelectModalOpen}
        bulkMethodLoading={bulkMethodLoading}
        methodSelectForm={methodSelectForm}
        onIndicatorFilterChange={handleIndicatorFilterChange}
        onGlobalSelectAll={handleGlobalSelectAll}
        onOpenMethodModal={handleOpenMethodModal}
        onCloseMethodModal={handleCloseMethodModal}
        onBulkMethodConfirm={handleBulkMethodConfirm}
      />

    </>
  );
};

export default TestingDetail;
