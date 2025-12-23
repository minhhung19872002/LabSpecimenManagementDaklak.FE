import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import {
  useGetTestingDetailQuery,
  useSaveResultsMutation,
  useSubmitForApprovalMutation,
} from "../../../store/api/testingApi";
import { SaveIndicatorResultDto } from "../../../types/testing";
import { IndicatorApprovalStatus } from "../../../types/laboratoryTask";

export const useTestingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get("viewMode") as "my" | "all" | null;

  // RTK Query hooks
  const {
    data: detail,
    isLoading: loading,
  } = useGetTestingDetailQuery(
    { id: id!, viewMode: viewMode === "all" ? "all" : "my" },
    { skip: !id }
  );

  const [saveResults] = useSaveResultsMutation();
  const [submitForApproval] = useSubmitForApprovalMutation();

  // Track loading state per indicator
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

  // Edited results (per sample)
  const [sampleResults, setSampleResults] = useState<
    Map<string, SaveIndicatorResultDto[]>
  >(new Map());

  // Active collapse keys
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  // Rejection history modal
  const [historyModal, setHistoryModal] = useState({
    visible: false,
    indicatorId: "",
    indicatorName: "",
  });

  // Initialize sample results when detail loads
  useEffect(() => {
    if (detail?.samples) {
      const initialResults = new Map<string, SaveIndicatorResultDto[]>();
      detail.samples.forEach((sample) => {
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

      // Open all sample panels by default
      if (activeKeys.length === 0) {
        setActiveKeys(detail.samples.map((s) => s.sampleId));
      }
    }
  }, [detail]);

  // Sort samples by sampleId
  const sortedSamples = useMemo(() => {
    return detail?.samples
      ? [...detail.samples].sort((a, b) => a.sampleId.localeCompare(b.sampleId))
      : [];
  }, [detail?.samples]);

  // Get all indicators from all samples
  const allIndicators = useMemo(() => {
    return detail?.samples?.flatMap((s) => s.indicators) || [];
  }, [detail?.samples]);

  // Check indicators status
  const allApproved = useMemo(() => {
    return (
      allIndicators.length > 0 &&
      allIndicators.every(
        (i) => i.approvalStatus === IndicatorApprovalStatus.Approved
      )
    );
  }, [allIndicators]);

  const allSubmittedOrApproved = useMemo(() => {
    return (
      allIndicators.length > 0 &&
      allIndicators.every(
        (i) =>
          i.approvalStatus === IndicatorApprovalStatus.Entered ||
          i.approvalStatus === IndicatorApprovalStatus.Approved
      )
    );
  }, [allIndicators]);

  // Handlers
  const handleBack = () => {
    navigate(`/testing?tab=${viewMode === "all" ? "all" : "my"}`);
  };

  const handleResultsChange = (
    sampleId: string,
    results: SaveIndicatorResultDto[]
  ) => {
    const newResults = new Map(sampleResults);
    newResults.set(sampleId, results);
    setSampleResults(newResults);
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
      await saveResults({ id, input: { results: [indicatorResult] } }).unwrap();
    } catch (error: any) {
      console.error("Failed to save result:", error);
      message.error(error.data?.error?.message || "Không thể lưu kết quả");
    }
  };

  const handleSubmitForApprovalSingle = async (indicatorId: string) => {
    if (!id) return;

    // Set loading for this indicator
    setSubmittingIds((prev) => new Set(prev).add(indicatorId));

    try {
      let indicatorResult: SaveIndicatorResultDto | undefined;
      sampleResults.forEach((results) => {
        const found = results.find((r) => r.indicatorId === indicatorId);
        if (found) {
          indicatorResult = found;
        }
      });

      if (indicatorResult) {
        await saveResults({ id, input: { results: [indicatorResult] } }).unwrap();
      }

      await submitForApproval({ id, input: { indicatorIds: [indicatorId] } }).unwrap();
      message.success("Gửi duyệt thành công");
    } catch (error: any) {
      console.error("Failed to submit for approval:", error);
      message.error(error.data?.error?.message || "Không thể gửi duyệt");
    } finally {
      // Remove loading for this indicator
      setSubmittingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(indicatorId);
        return newSet;
      });
    }
  };

  const showRejectionHistory = (indicatorId: string, indicatorName: string) => {
    setHistoryModal({
      visible: true,
      indicatorId,
      indicatorName,
    });
  };

  const closeRejectionHistory = () => {
    setHistoryModal({ visible: false, indicatorId: "", indicatorName: "" });
  };

  return {
    // Data
    detail,
    loading,
    submittingIds,
    sortedSamples,
    allApproved,
    allSubmittedOrApproved,
    viewMode,

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
  };
};
