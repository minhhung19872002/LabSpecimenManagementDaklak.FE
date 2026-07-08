import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Tag,
  Collapse,
  message,
  Spin,
  Modal,
  Alert,
  Form,
  Input,
  Radio,
  Select,
  Popover,
  Tooltip,
  Checkbox,
} from "antd";
import StatusTag from "../../components/common/StatusTag";
import {
  ArrowLeftOutlined,
  CaretRightOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  UserOutlined,
} from "../../components/common/Icon";
import { laboratoryTaskService } from "../../services/laboratoryTaskService";
import { formatDate, formatDateVN } from "../../utils/formatters";
import { testingService } from "../../services/testingService";
import {
  standardService,
  StandardWithIndicatorsDto,
} from "../../services/masterDataService";
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  LaboratoryTaskStatusLabels,
  LaboratoryTaskStatusColors,
  LaboratoryTaskIndicatorDto,
  IndicatorApprovalStatus,
  MethodLookupDto,
  UserLookupDto,
  SampleInfo,
  SampleStatus,
  SampleStatusLabels,
  SampleStatusColors,
  AssignIndicatorInput,
  UpdateSubContractMethodInput,
} from "../../types/laboratoryTask";
import { TestRequestStatus } from "../../types/testRequest";
import {
  SampleTestingImageDto,
  SampleTestingImageType,
  SampleAttachmentDto,
} from "../../types/testing";
import IndicatorTable from "./components/IndicatorTable";
import EvaluationIndicatorTable from "./components/EvaluationIndicatorTable";
import SupporterModal from "./components/SupporterModal";
import SampleImagesDisplay from "./components/SampleImagesDisplay";
import NoteModal, { NoteSaveInput } from "./components/NoteModal";
import { PATH_ROUTES, STORAGE_KEYS } from "../../constants";
import { useMultipleActionPermissions } from "../../hooks/useActionPermission";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { IndicatorName } from "../../components/common";

const { Title, Text } = Typography;

// Helper to group indicators by sampleId
const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K,
): Record<string, T[]> => {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
};

const TaskManagementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [task, setTask] = useState<LaboratoryTaskDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to update indicators optimistically
  const updateIndicatorsOptimistically = useCallback(
    (indicatorIds: string[], updates: Partial<LaboratoryTaskIndicatorDto>) => {
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          indicators: prev.indicators?.map((ind) =>
            indicatorIds.includes(ind.id) ? { ...ind, ...updates } : ind,
          ),
        };
      });
    },
    [],
  );
  const [methods, setMethods] = useState<MethodLookupDto[]>([]);
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingMethodIndicatorIds, setSavingMethodIndicatorIds] = useState<
    string[]
  >([]);

  // Local state for indicator changes (before saving)
  const [indicatorChanges, setIndicatorChanges] = useState<
    Record<string, Partial<LaboratoryTaskIndicatorDto>>
  >({});

  // Supporter modal state
  const [supporterModalOpen, setSupporterModalOpen] = useState(false);

  // Bulk selection state - per sample
  const [selectedIndicators, setSelectedIndicators] = useState<
    Record<string, string[]>
  >({});

  // Indicator filter state
  const [indicatorFilter, setIndicatorFilter] = useState<string[]>([]);

  // Standard selections state - lưu trữ local standard selections chưa được save
  const [standardSelections, setStandardSelections] = useState<
    Record<string, string | null>
  >({});

  // Standards data for auto-set feature (use ref to avoid re-renders and infinite loops)
  const standardsDataRef = React.useRef<StandardWithIndicatorsDto[]>([]);

  // Bulk reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingSampleId, setRejectingSampleId] = useState<string | null>(
    null,
  );
  const [rejectForm] = Form.useForm();

  // Note modal state
  const [noteModal, setNoteModal] = useState<{
    visible: boolean;
    selectedIndicatorIds: string[];
    allIndicatorIds: string[];
    sampleId: string;
    initialFreeTextNote: string;
    selectedIndicatorsMasterData: {
      indicatorId: string;
      masterDataNoteIds: string;
    }[];
  }>({
    visible: false,
    selectedIndicatorIds: [],
    allIndicatorIds: [],
    sampleId: "",
    initialFreeTextNote: "",
    selectedIndicatorsMasterData: [],
  });

  // Tab state for switching between Evaluation and Sample List
  const [activeTab, setActiveTab] = useState<string>("samples");

  // Sample images state (includes sample attachments from TestRequest)
  const [sampleImages, setSampleImages] = useState<
    Record<
      string,
      {
        sampleAttachments: SampleAttachmentDto[];
        beforeTesting: SampleTestingImageDto[];
        afterTesting: SampleTestingImageDto[];
      }
    >
  >({});

  // Sử dụng hook để check permissions cho tất cả actions theo Permission Matrix
  const actionPermissions = useMultipleActionPermissions("tasks", [
    "viewDetail",
    "assignTesting",
    "addSupporter",
    "editMethod",
    "approveResult",
  ]);

  // Check quyền xem chi tiết task từ Permission Matrix
  const hasViewDetailPermission =
    actionPermissions.viewDetail?.canAll ||
    actionPermissions.viewDetail?.canView ||
    false;

  // Check if current user is a supporter of this task
  const isCurrentUserSupporter = useMemo(() => {
    if (!task?.supporters) return false;
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!storedUser) return false;
    try {
      const userInfo = JSON.parse(storedUser);
      return task.supporters.some((s) => s.userId === userInfo.id);
    } catch {
      return false;
    }
  }, [task?.supporters]);

  // Kiểm tra quyền xem chi tiết task:
  // - Có quyền viewDetail từ Permission Matrix (QLKT, Admin)
  // - Hoặc là supporter của task
  // - Hoặc là department supporter của khoa phòng
  // - Hoặc là QLKT sở hữu task (isCurrentUserTechnicalManager)
  const isCurrentUserDeptSupporter =
    task?.isCurrentUserDepartmentSupporter || false;
  const canViewTaskDetail =
    hasViewDetailPermission ||
    isCurrentUserSupporter ||
    isCurrentUserDeptSupporter ||
    task?.isCurrentUserTechnicalManager;

  // Redirect đến 403 nếu không có quyền xem (sau khi đã load task xong)
  useEffect(() => {
    // Chỉ check sau khi đã load task (loading = false và task !== null hoặc task load thất bại)
    if (!loading && task !== null && !canViewTaskDetail) {
      navigate(PATH_ROUTES.forbidden, { replace: true });
    }
  }, [loading, task, canViewTaskDetail, navigate]);

  // Check quyền từ Permission Matrix + supporter status
  // QLKT (A) = canAll, Admin (V) = canView, Supporter = same as QLKT (except addSupporter)
  // Người hỗ trợ (per-task + department) có quyền: giao KTV, duyệt/từ chối, gửi QLCL
  // Người hỗ trợ KHÔNG có quyền: xóa task, thêm supporter khác
  const isSupporterOrDeptSupporter =
    isCurrentUserSupporter || isCurrentUserDeptSupporter;
  const canAssignTesting =
    actionPermissions.assignTesting?.canAll ||
    isSupporterOrDeptSupporter ||
    false;
  const canAddSupporter = actionPermissions.addSupporter?.canAll || false; // Supporter KHÔNG có quyền thêm supporter khác
  const canEditMethod =
    actionPermissions.editMethod?.canAll || isSupporterOrDeptSupporter || false;
  const canApproveResult =
    actionPermissions.approveResult?.canAll ||
    isSupporterOrDeptSupporter ||
    false;

  // Check if current user can manage supporters (chỉ QLKT của task hoặc có quyền addSupporter)
  // Supporter KHÔNG có quyền này
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _canManageSupporters = useMemo(() => {
    return canAddSupporter || (task?.isCurrentUserTechnicalManager ?? false);
  }, [canAddSupporter, task?.isCurrentUserTechnicalManager]);
  void _canManageSupporters;

  // Load task data
  const loadTask = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await laboratoryTaskService.get(id);
      setTask(data);

      // Load lookups - API returns array directly (not wrapped in { items: [] })
      if (data.laboratoryId) {
        const [methodsResult, techniciansResult] = await Promise.all([
          // Load all methods (indicatorId is optional)
          laboratoryTaskService.getMethodsByIndicator(),
          // Load technicians by task (filter by QLKT's department + role LabTechnician)
          laboratoryTaskService.getTechniciansByTask(id!),
        ]);
        setMethods(methodsResult || []);
        setTechnicians(techniciansResult || []);
      }
    } catch (error: any) {
      console.error("Failed to load task:", error);
      // Nếu API trả về 403 (Forbidden) hoặc 401 (Unauthorized), redirect đến trang 403
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        navigate(PATH_ROUTES.forbidden, { replace: true });
        return;
      }
      message.error("Không thể tải thông tin công việc");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Reload full data from server (preserving UI states like selection, activeKeys)
  const reloadData = useCallback(async () => {
    if (!id) return;
    try {
      const result = await laboratoryTaskService.get(id);
      setTask(result);
      // Note: selectedIndicators, activeKeys, indicatorChanges are NOT reset
    } catch (error) {
      console.error("Failed to reload data:", error);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  // Track which indicators have been processed for auto-set standard (to avoid duplicate API calls)
  const processedIndicatorsRef = React.useRef<Set<string>>(new Set());

  // Track if standards have been loaded (to prevent infinite loop)
  const standardsLoadedRef = React.useRef<boolean>(false);

  // Auto-set StandardId for indicators that don't have one
  // Load standards and check which indicators need auto-set
  useEffect(() => {
    const autoSetStandards = async () => {
      if (!task?.indicators || task.indicators.length === 0) return;

      // Load standards if not loaded yet (use ref to prevent infinite loop)
      let standards = standardsDataRef.current;
      if (!standardsLoadedRef.current) {
        try {
          standardsLoadedRef.current = true; // Set flag before API call to prevent duplicate calls
          standards = await standardService.getWithIndicators();
          standardsDataRef.current = standards;
        } catch (error) {
          console.error("Failed to load standards for auto-set:", error);
          standardsLoadedRef.current = false; // Reset flag on error to allow retry
          return;
        }
      }

      // Find indicators without standardId that haven't been processed yet
      // Cũng bao gồm indicators có MethodChanged (PP đã đổi, cần set lại tiêu chuẩn theo PP mới)
      const indicatorsNeedingStandard = task.indicators.filter(
        (ind) =>
          (!ind.standardId ||
            ind.approvalStatus === IndicatorApprovalStatus.MethodChanged) &&
          !processedIndicatorsRef.current.has(ind.id) &&
          ind.approvalStatus !== IndicatorApprovalStatus.Approved &&
          ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled,
      );

      if (indicatorsNeedingStandard.length === 0) return;

      // Auto-set first matching standard for each indicator
      for (const indicator of indicatorsNeedingStandard) {
        // Mark as processed immediately to avoid duplicate calls
        processedIndicatorsRef.current.add(indicator.id);

        // Find matching standards for this indicator (and method + specimenType if available)
        // Only consider active StandardIndicators
        const matchingStandards = standards.filter((standard) =>
          standard.indicators.some(
            (si) =>
              si.indicatorId === indicator.indicatorId &&
              si.isActive === true &&
              (!indicator.methodId || si.testMethodId === indicator.methodId) &&
              (!indicator.specimenTypeId ||
                !si.specimenTypeId ||
                si.specimenTypeId === indicator.specimenTypeId),
          ),
        );

        if (matchingStandards.length > 0) {
          const firstStandard = matchingStandards[0];
          try {
            // Call API to update standardId
            await laboratoryTaskService.updateIndicatorStandard(
              indicator.id,
              firstStandard.id,
            );
            // Update local state
            setStandardSelections((prev) => ({
              ...prev,
              [indicator.id]: firstStandard.id,
            }));
          } catch (error) {
            console.error(
              `Failed to auto-set standard for indicator ${indicator.id}:`,
              error,
            );
            // Remove from processed set so it can be retried
            processedIndicatorsRef.current.delete(indicator.id);
          }
        }
      }
    };

    autoSetStandards();
  }, [task?.indicators]);

  // Set default active tab based on task status
  useEffect(() => {
    if (task) {
      const needsEvaluation =
        task.status === LaboratoryTaskStatus.UnderEvaluation ||
        task.status === LaboratoryTaskStatus.WaitingCustomerResponse;
      setActiveTab(needsEvaluation ? "evaluation" : "samples");
    }
  }, [task?.status]);

  // Group indicators by sample
  const indicatorsBySample = useMemo(() => {
    if (!task?.indicators) return {};
    return groupBy(task.indicators, "sampleId");
  }, [task]);

  // Get sample list for collapse panels với computed status
  const sampleList = useMemo<SampleInfo[]>(() => {
    const samples = Object.entries(indicatorsBySample).map(
      ([sampleId, indicators]) => {
        // Merge local changes with server data for display
        const mergedIndicators = indicators.map((ind) => ({
          ...ind,
          ...indicatorChanges[ind.id],
        }));

        // Filter out CustomerCancelled indicators for status calculation
        const activeIndicators = indicators.filter(
          (i) => i.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled,
        );

        // Check if all indicators are CustomerCancelled
        const allCustomerCancelled =
          indicators.length > 0 &&
          indicators.every(
            (i) =>
              i.approvalStatus === IndicatorApprovalStatus.CustomerCancelled,
          );

        // Compute sample status từ SERVER DATA
        // Logic mới: Ưu tiên trạng thái THẤP NHẤT (phải hoàn thành TẤT CẢ mới lên status cao hơn)
        // Ngoại trừ PendingApproval/Rejected - ưu tiên hiển thị vì cần action
        //
        // Thứ tự kiểm tra:
        // 1. KH hủy (customerCancelled): Tất cả chỉ tiêu đều bị KH hủy
        // 2. Chờ phê duyệt (pendingApproval): Có ≥1 indicator Entered → cần QLKT duyệt
        // 3. Từ chối (rejected): Có ≥1 indicator Rejected (và không có Testing) → cần KTV làm lại
        // 4. Đã duyệt (approved): TẤT CẢ indicators đã được duyệt
        // 5. Đang thử nghiệm (testing): TẤT CẢ đã giao việc + có ≥1 đang test
        // 6. Đã giao việc (assigned): TẤT CẢ indicators đã có method + KTV
        // 7. Chưa giao việc (notStarted): Còn indicator chưa được giao

        // TẤT CẢ chỉ tiêu đã được duyệt
        const allApproved =
          activeIndicators.length > 0 &&
          activeIndicators.every(
            (i) => i.approvalStatus === IndicatorApprovalStatus.Approved,
          );

        // TẤT CẢ chỉ tiêu đã được giao việc (có method + KTV)
        const allAssigned =
          activeIndicators.length > 0 &&
          activeIndicators.every((i) => i.methodId && i.technicianId);

        // Có ≥1 chỉ tiêu đang thử nghiệm (có testDate, KTV đã check-in)
        const anyTesting = activeIndicators.some(
          (i) =>
            i.testDate && i.approvalStatus === IndicatorApprovalStatus.Pending,
        );

        // Có ≥1 chỉ tiêu chờ phê duyệt (Entered) - ưu tiên hiển thị vì cần action
        const anyEntered = activeIndicators.some(
          (i) => i.approvalStatus === IndicatorApprovalStatus.Entered,
        );

        // Có ≥1 chỉ tiêu bị từ chối - ưu tiên hiển thị vì cần action
        const anyRejected = activeIndicators.some(
          (i) => i.approvalStatus === IndicatorApprovalStatus.Rejected,
        );

        let sampleStatus: SampleStatus;
        if (allCustomerCancelled) {
          // Tất cả chỉ tiêu đều bị KH hủy
          sampleStatus = "customerCancelled";
        } else if (anyEntered) {
          // Có ≥1 chỉ tiêu chờ duyệt - ưu tiên hiển thị vì cần QLKT duyệt
          sampleStatus = "pendingApproval";
        } else if (anyRejected && !anyTesting) {
          // Có ≥1 chỉ tiêu bị từ chối và KTV chưa check-in lại - cần KTV làm lại
          sampleStatus = "rejected";
        } else if (allApproved) {
          // TẤT CẢ chỉ tiêu đã được duyệt
          sampleStatus = "approved";
        } else if (allAssigned && anyTesting) {
          // TẤT CẢ đã được giao việc VÀ có ≥1 đang thử nghiệm
          sampleStatus = "testing";
        } else if (allAssigned) {
          // TẤT CẢ đã được giao việc (chưa có ai test)
          sampleStatus = "assigned";
        } else {
          // Còn chỉ tiêu chưa được giao việc
          sampleStatus = "notStarted";
        }

        return {
          sampleId,
          sampleCode: indicators[0]?.sampleCode,
          sampleName: indicators[0]?.sampleName,
          sampleQuantity: indicators[0]?.sampleQuantity,
          sampleStatusText: indicators[0]?.sampleStatusText,
          specimenTypeName: indicators[0]?.specimenTypeName,
          indicatorCount: indicators.length,
          indicators: mergedIndicators as LaboratoryTaskIndicatorDto[],
          sampleStatus,
          isApproved: allApproved,
        };
      },
    );

    return samples.sort((a, b) => (a.sampleCode || "").localeCompare(b.sampleCode || ""));
  }, [indicatorsBySample, indicatorChanges]);

  const indicatorFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    sampleList.forEach((sample) => {
      sample.indicators.forEach((ind) => {
        if (ind.indicatorId && ind.indicatorName && !ind.parentIndicatorId && !seen.has(ind.indicatorId)) {
          seen.set(ind.indicatorId, ind.indicatorName);
        }
      });
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [sampleList]);

  const filteredSampleList = useMemo(() => {
    if (indicatorFilter.length === 0) return sampleList;
    return sampleList
      .map((sample) => ({
        ...sample,
        indicators: sample.indicators.filter(
          (ind) =>
            indicatorFilter.includes(ind.indicatorId) ||
            (ind.parentIndicatorId && indicatorFilter.includes(ind.parentIndicatorId))
        ),
      }))
      .filter((sample) => sample.indicators.length > 0);
  }, [sampleList, indicatorFilter]);

  // Handlers
  const handleMethodChange = async (
    indicatorId: string,
    methodId: string | null,
  ) => {
    const indicator = task?.indicators?.find((ind) => ind.id === indicatorId);
    if (!indicator) return;

    const selectedMethodName = methods
      .find((m) => m.id === methodId)
      ?.name?.trim();
    const keepSubContractButton = selectedMethodName === "-";

    const affectedIndicatorIds = new Set<string>([indicatorId]);

    if (!indicator.parentIndicatorId) {
      const subIndicators =
        task?.indicators?.filter(
          (ind) =>
            ind.parentIndicatorId === indicator.indicatorId &&
            ind.methodId === indicator.methodId,
        ) || [];

      subIndicators.forEach((sub) => affectedIndicatorIds.add(sub.id));
    }

    const idsToUpdate = Array.from(affectedIndicatorIds);
    const nextMethodId = methodId || undefined;
    const previousMethodById = new Map<string, string | undefined>(
      idsToUpdate.map((id) => {
        const localMethodId = indicatorChanges[id]?.methodId;
        const taskMethodId = task?.indicators?.find(
          (ind) => ind.id === id,
        )?.methodId;

        return [id, localMethodId ?? taskMethodId ?? undefined];
      }),
    );

    const clearLocalMethodDrafts = () => {
      setIndicatorChanges((prev) => {
        const updated = { ...prev };
        idsToUpdate.forEach((id) => {
          const existing = updated[id];
          if (!existing) return;

          const {
            methodId: _removed,
            isSubContractMethod: _removedSubContractFlag,
            subContractMethodName: _removedSubContractMethodName,
            subContractNumber: _removedSubContractNumber,
            subContractCost: _removedSubContractCost,
            ...rest
          } = existing;
          if (Object.keys(rest).length === 0) {
            delete updated[id];
          } else {
            updated[id] = rest;
          }
        });
        return updated;
      });
    };

    const restoreLocalMethodDrafts = () => {
      setIndicatorChanges((prev) => {
        const updated = { ...prev };

        idsToUpdate.forEach((id) => {
          const previousMethodId = previousMethodById.get(id);

          if (previousMethodId === undefined) {
            const existing = updated[id];
            if (!existing) return;

            const { methodId: _removed, ...rest } = existing;
            if (Object.keys(rest).length === 0) {
              delete updated[id];
            } else {
              updated[id] = rest;
            }
            return;
          }

          updated[id] = { ...updated[id], methodId: previousMethodId };
        });

        return updated;
      });
    };

    // Optimistic local update để UI phản hồi ngay
    setIndicatorChanges((prev) => {
      const updated = { ...prev };
      idsToUpdate.forEach((id) => {
        updated[id] = { ...updated[id], methodId: nextMethodId };
      });
      return updated;
    });

    setSavingMethodIndicatorIds((prev) =>
      Array.from(new Set([...prev, ...idsToUpdate])),
    );

    try {
      const updatedIndicators = await Promise.all(
        idsToUpdate.map((id) =>
          laboratoryTaskService.updateIndicatorMethod(id, methodId),
        ),
      );

      const normalizedUpdatedIndicators = updatedIndicators.map((ind) => ({
        ...ind,
        isSubContractMethod: keepSubContractButton,
        subContractMethodName: keepSubContractButton
          ? ind.subContractMethodName
          : undefined,
        subContractNumber: keepSubContractButton
          ? ind.subContractNumber
          : undefined,
        subContractCost: keepSubContractButton
          ? ind.subContractCost
          : undefined,
      }));

      const updatedById = new Map(
        normalizedUpdatedIndicators.map((ind) => [ind.id, ind]),
      );
      setTask((prev) => {
        if (!prev?.indicators) return prev;
        return {
          ...prev,
          indicators: prev.indicators.map(
            (ind) => updatedById.get(ind.id) ?? ind,
          ),
        };
      });

      clearLocalMethodDrafts();
      message.open({
        type: "success",
        content: "Đã lưu phương pháp",
        duration: 1.2,
        key: "task-method-autosave-success",
      });
    } catch (error: any) {
      console.error("Failed to update method:", error);
      message.error(
        getApiErrorMessage(error, "Không thể cập nhật phương pháp"),
      );
      // Revert về giá trị trước khi đổi (snapshot local), không phụ thuộc reload.
      restoreLocalMethodDrafts();
    } finally {
      setSavingMethodIndicatorIds((prev) =>
        prev.filter((id) => !affectedIndicatorIds.has(id)),
      );
    }
  };

  const handleUpdateSubContractMethod = async (
    indicatorId: string,
    input: UpdateSubContractMethodInput,
  ) => {
    try {
      const updated = await laboratoryTaskService.updateSubContractMethod(
        indicatorId,
        input,
      );

      updateIndicatorsOptimistically([indicatorId], {
        methodName: updated.methodName,
        methodFormattedName: updated.methodFormattedName,
        isSubContractMethod: updated.isSubContractMethod,
        subContractMethodName: updated.subContractMethodName,
        subContractNumber: updated.subContractNumber,
        subContractCost: updated.subContractCost,
      });

      setIndicatorChanges((prev) => {
        const updatedChanges = { ...prev };
        const existing = updatedChanges[indicatorId];
        if (!existing) {
          return updatedChanges;
        }

        const {
          methodName: _methodName,
          methodFormattedName: _methodFormattedName,
          isSubContractMethod: _isSubContractMethod,
          subContractMethodName: _subContractMethodName,
          subContractNumber: _subContractNumber,
          subContractCost: _subContractCost,
          ...rest
        } = existing;

        if (Object.keys(rest).length === 0) {
          delete updatedChanges[indicatorId];
        } else {
          updatedChanges[indicatorId] = rest;
        }

        return updatedChanges;
      });

      message.open({
        type: "success",
        content: "Đã cập nhật phương pháp",
        duration: 1.2,
        key: "task-subcontract-method-success",
      });
    } catch (error: any) {
      message.error(
        getApiErrorMessage(error, "Không thể cập nhật phương pháp"),
      );
      throw error;
    }
  };

  const handleTechnicianChange = (
    indicatorId: string,
    technicianId: string,
  ) => {
    // Check if this is a parent with sub-indicators
    const indicator = task?.indicators?.find((ind) => ind.id === indicatorId);
    if (indicator && !indicator.parentIndicatorId) {
      // Find all sub-indicators that belong to this parent
      const subIndicators =
        task?.indicators?.filter(
          (ind) =>
            ind.parentIndicatorId === indicator.indicatorId &&
            ind.methodId === indicator.methodId,
        ) || [];
      if (subIndicators.length > 0) {
        // Propagate technician to parent AND all sub-indicators
        setIndicatorChanges((prev) => {
          const updated = { ...prev };
          // Set for parent
          updated[indicatorId] = { ...updated[indicatorId], technicianId };
          // Set for all subs
          subIndicators.forEach((sub) => {
            updated[sub.id] = { ...updated[sub.id], technicianId };
          });
          return updated;
        });
        return;
      }
    }
    // Normal indicator (no subs) - set directly
    setIndicatorChanges((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        technicianId,
      },
    }));
  };

  // State for reassign confirmation modal
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignInfo, setReassignInfo] = useState<{
    sampleId: string;
    assignments: AssignIndicatorInput[];
    reassignedIndicators: Array<{
      indicatorName: string;
      indicatorFormattedName?: string;
      currentTechnicianName: string;
      newTechnicianName: string;
    }>;
  } | null>(null);

  const handleAssignSample = async (sampleId: string) => {
    if (!task) return;

    const sample = sampleList.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    // Get selected indicators for this sample
    const selectedIds = selectedIndicators[sampleId] || [];
    if (selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để giao việc");
      return;
    }

    // Filter only selected indicators (excluding Approved and CustomerCancelled)
    const selectedIndicatorsList = sample.indicators.filter(
      (ind) =>
        selectedIds.includes(ind.id) &&
        ind.approvalStatus !== IndicatorApprovalStatus.Approved &&
        ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled,
    );

    if (selectedIndicatorsList.length === 0) {
      message.warning("Không có chỉ tiêu nào đủ điều kiện để giao việc");
      return;
    }

    // Build assignments from local changes + server data
    const assignments: AssignIndicatorInput[] = selectedIndicatorsList.map(
      (ind) => {
        const localChange = indicatorChanges[ind.id];
        return {
          indicatorId: ind.id,
          methodId: localChange?.methodId || ind.methodId,
          technicianId: localChange?.technicianId || ind.technicianId,
        };
      },
    );

    // Validate - check which indicators are missing method or technician
    const missingMethod: string[] = [];
    const missingTechnician: string[] = [];

    for (const assignment of assignments) {
      const indicator = selectedIndicatorsList.find(
        (ind) => ind.id === assignment.indicatorId,
      );
      const indicatorName = indicator?.indicatorName || "-";

      if (!assignment.methodId) {
        missingMethod.push(indicatorName);
      }
      if (!assignment.technicianId) {
        missingTechnician.push(indicatorName);
      }
    }

    if (missingMethod.length > 0 || missingTechnician.length > 0) {
      let errorMsg = "";
      if (missingTechnician.length > 0) {
        errorMsg = `Chỉ tiêu chưa chọn TNV: ${missingTechnician.join(", ")}`;
      }
      if (missingMethod.length > 0) {
        if (errorMsg) errorMsg += ". ";
        errorMsg += `Chỉ tiêu chưa chọn phương pháp: ${missingMethod.join(
          ", ",
        )}`;
      }
      message.error(errorMsg);
      return;
    }

    // Check if any indicator is being reassigned to a different technician
    const reassignedIndicators: Array<{
      indicatorName: string;
      indicatorFormattedName?: string;
      currentTechnicianName: string;
      newTechnicianName: string;
    }> = [];

    for (const assignment of assignments) {
      // Lấy indicator từ task.indicators (giá trị gốc từ server, không bị merge)
      const originalIndicator = task.indicators?.find(
        (ind) => ind.id === assignment.indicatorId,
      );
      const indicator = selectedIndicatorsList.find(
        (ind) => ind.id === assignment.indicatorId,
      );

      // Chỉ check reassign nếu indicator đã được giao việc (có assignedDate) và có KTV
      // Sử dụng originalIndicator để lấy giá trị gốc từ server
      if (
        originalIndicator &&
        originalIndicator.assignedDate &&
        originalIndicator.technicianId
      ) {
        // Indicator đã được giao việc trước đó
        const newTechnicianId = assignment.technicianId;
        if (
          newTechnicianId &&
          newTechnicianId !== originalIndicator.technicianId
        ) {
          // Đang giao lại cho người khác
          const newTechnician = technicians.find(
            (t) => t.id === newTechnicianId,
          );
          // Lấy tên KTV hiện tại từ server hoặc từ danh sách technicians
          const currentTechnician = technicians.find(
            (t) => t.id === originalIndicator.technicianId,
          );
          const currentTechnicianName =
            originalIndicator.technicianName ||
            currentTechnician?.displayName ||
            currentTechnician?.userName ||
            "-";
          reassignedIndicators.push({
            indicatorName: indicator?.indicatorName || "-",
            indicatorFormattedName: indicator?.indicatorFormattedName,
            currentTechnicianName,
            newTechnicianName:
              newTechnician?.displayName || newTechnician?.userName || "-",
          });
        }
      }
    }

    // If there are reassigned indicators, show confirmation modal
    if (reassignedIndicators.length > 0) {
      setReassignInfo({
        sampleId,
        assignments,
        reassignedIndicators,
      });
      setReassignModalOpen(true);
      return;
    }

    // No reassignment, proceed directly
    await executeAssignment(sampleId, assignments);
  };

  const executeAssignment = async (
    sampleId: string,
    assignments: AssignIndicatorInput[],
  ) => {
    if (!task) return;

    setActionLoading(true);
    try {
      await laboratoryTaskService.assignSampleIndicators(
        task.id,
        sampleId,
        assignments,
      );

      // Optimistic update: cập nhật indicators ngay lập tức
      const now = new Date().toISOString();
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          indicators: prev.indicators?.map((ind) => {
            const assignment = assignments.find(
              (a) => a.indicatorId === ind.id,
            );
            if (assignment) {
              const technician = technicians.find(
                (t) => t.id === assignment.technicianId,
              );
              const method = methods.find((m) => m.id === assignment.methodId);
              return {
                ...ind,
                methodId: assignment.methodId,
                technicianId: assignment.technicianId,
                technicianName:
                  technician?.displayName ||
                  technician?.userName ||
                  ind.technicianName,
                methodName: method?.name || ind.methodName,
                assignedDate: now,
              };
            }
            return ind;
          }),
        };
      });

      // Reload full data from server (avoid duplicating BE logic)
      await reloadData();

      message.success("Giao việc thành công");
      setIndicatorChanges({});
      // Clear selection after successful assignment
      setSelectedIndicators((prev) => ({ ...prev, [sampleId]: [] }));
    } catch (error: any) {
      console.error("Failed to assign:", error);
      message.error(getApiErrorMessage(error, "Không thể giao việc"));
      // Reload để sync lại với server nếu có lỗi
      await loadTask();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!reassignInfo) return;
    setReassignModalOpen(false);
    await executeAssignment(reassignInfo.sampleId, reassignInfo.assignments);
    setReassignInfo(null);
  };

  const handleCancelReassign = () => {
    setReassignModalOpen(false);
    setReassignInfo(null);
  };

  const handleApprove = async (
    indicatorId: string,
    approve: boolean,
    reason?: string,
    standardId?: string | null,
  ) => {
    setActionLoading(true);
    try {
      await laboratoryTaskService.approveIndicator(indicatorId, {
        approve,
        rejectionReason: reason,
        standardId: standardId,
      });

      // Optimistic update: cập nhật indicator ngay lập tức
      updateIndicatorsOptimistically([indicatorId], {
        approvalStatus: approve
          ? IndicatorApprovalStatus.Approved
          : IndicatorApprovalStatus.Rejected,
        rejectionReason: approve ? undefined : reason,
        standardId: standardId ?? undefined,
      });

      // Reload full data from server (avoid duplicating BE logic for task status)
      await reloadData();

      message.success(approve ? "Đã duyệt kết quả" : "Đã từ chối kết quả");
      // Xóa standard selection đã lưu cho indicator này
      setStandardSelections((prev) => {
        const newSelections = { ...prev };
        delete newSelections[indicatorId];
        return newSelections;
      });
    } catch (error: any) {
      console.error("Failed to approve:", error);
      message.error(getApiErrorMessage(error, "Không thể xử lý phê duyệt"));
      // Reload để sync lại với server nếu có lỗi
      await loadTask();
    } finally {
      setActionLoading(false);
    }
  };

  // Handle standard change - lưu vào DB và local state
  const handleStandardChange = async (
    indicatorId: string,
    standardId: string | null,
  ) => {
    // Optimistic update: cập nhật local state trước
    setStandardSelections((prev) => ({
      ...prev,
      [indicatorId]: standardId,
    }));

    try {
      // Gọi API để lưu vào database (dùng laboratoryTaskService cho QLKT)
      await laboratoryTaskService.updateIndicatorStandard(
        indicatorId,
        standardId,
      );
    } catch (error: any) {
      console.error("Failed to update standard:", error);
      message.error(getApiErrorMessage(error, "Không thể cập nhật tiêu chuẩn"));
      // Revert local state nếu có lỗi
      setStandardSelections((prev) => {
        const newState = { ...prev };
        delete newState[indicatorId];
        return newState;
      });
    }
  };

  // Handle unit change - lưu silent (không loading, không thông báo)
  const handleUnitChange = async (indicatorId: string, unit: string | null) => {
    try {
      const updatedIndicator = await laboratoryTaskService.updateIndicatorUnit(
        indicatorId,
        unit,
      );
      // Optimistic update
      updateIndicatorsOptimistically([indicatorId], {
        unit: updatedIndicator.unit,
      });
    } catch (error: any) {
      console.error("Failed to update unit:", error);
      // Silent fail - không hiển thị error message theo yêu cầu
    }
  };

  // Handle update note (for single indicator from modal)
  const handleUpdateNote = async (indicatorId: string, note: string | null) => {
    try {
      const updatedIndicator = await laboratoryTaskService.updateIndicatorNote(
        indicatorId,
        note,
      );
      // Optimistic update
      updateIndicatorsOptimistically([indicatorId], {
        freeTextNote: updatedIndicator.freeTextNote,
      });
    } catch (error: any) {
      console.error("Failed to update note:", error);
      message.error(getApiErrorMessage(error, "Không thể cập nhật ghi chú"));
      throw error;
    }
  };

  // Handle open note modal for single indicator (click từ cell)
  const handleOpenNoteModal = (
    indicatorId: string,
    _currentNote: string,
    sampleId: string,
  ) => {
    const sample = sampleList.find((s) => s.sampleId === sampleId);
    const allIds = sample?.indicators.map((i) => i.id) || [];

    // Lấy indicator hiện tại để auto-fill dữ liệu
    const currentIndicator = sample?.indicators.find(
      (i) => i.id === indicatorId,
    );

    setNoteModal({
      visible: true,
      selectedIndicatorIds: [indicatorId],
      allIndicatorIds: allIds,
      sampleId,
      initialFreeTextNote: currentIndicator?.freeTextNote || "",
      selectedIndicatorsMasterData: [
        {
          indicatorId,
          masterDataNoteIds: currentIndicator?.masterDataNoteIds || "",
        },
      ],
    });
  };

  // Handle open note modal for bulk indicators (click button)
  const handleOpenBulkNoteModal = (sampleId: string) => {
    const sample = sampleList.find((s) => s.sampleId === sampleId);
    const allIds = sample?.indicators.map((i) => i.id) || [];
    const selectedIds = selectedIndicators[sampleId] || [];

    if (selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    // Lấy FreeTextNote từ indicator đầu tiên (vì FreeTextNote chung cho cả sample)
    const firstIndicator = sample?.indicators.find((i) =>
      selectedIds.includes(i.id),
    );

    // Lấy MasterDataNoteIds của tất cả các indicator được chọn để detect mixed data
    const selectedIndicatorsMasterData = selectedIds.map((indicatorId) => {
      const indicator = sample?.indicators.find((i) => i.id === indicatorId);
      return {
        indicatorId,
        masterDataNoteIds: indicator?.masterDataNoteIds || "",
      };
    });

    setNoteModal({
      visible: true,
      selectedIndicatorIds: selectedIds,
      allIndicatorIds: allIds,
      sampleId,
      initialFreeTextNote: firstIndicator?.freeTextNote || "",
      selectedIndicatorsMasterData,
    });
  };

  // Handle save note from modal
  const handleSaveNote = async (input: NoteSaveInput) => {
    if (!id) return;

    try {
      // Gọi API mới với cấu trúc tách biệt FreeTextNote và MasterDataNoteIds
      await laboratoryTaskService.bulkUpdateIndicatorNote(id, {
        allIndicatorIds: noteModal.allIndicatorIds,
        selectedIndicatorIds: noteModal.selectedIndicatorIds,
        freeTextNote: input.freeText,
        masterDataNoteIds: input.skipMasterDataUpdate
          ? null
          : input.masterDataNoteIds.length > 0
            ? input.masterDataNoteIds
            : [],
        appendMode: false, // Replace mode - vì đây là modal nhập mới
        skipMasterDataUpdate: input.skipMasterDataUpdate,
      });

      // Reload task data
      await loadTask();
      message.success("Đã cập nhật ghi chú");
    } catch (error) {
      console.error("Failed to save note:", error);
      message.error("Không thể lưu ghi chú");
      throw error;
    }

    setNoteModal({
      visible: false,
      selectedIndicatorIds: [],
      allIndicatorIds: [],
      sampleId: "",
      initialFreeTextNote: "",
      selectedIndicatorsMasterData: [],
    });
    setSelectedIndicators({});
  };

  // Handle selection change for bulk operations
  const handleSelectionChange = (sampleId: string, ids: string[]) => {
    setSelectedIndicators((prev) => ({
      ...prev,
      [sampleId]: ids,
    }));
  };

  // Handle quick assign technician to selected indicators
  const handleQuickAssignTechnician = (
    sampleId: string,
    technicianId: string,
  ) => {
    const selectedIds = selectedIndicators[sampleId] || [];
    if (selectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    // Update local indicator changes for all selected indicators
    const newChanges: Record<string, Partial<LaboratoryTaskIndicatorDto>> = {};
    selectedIds.forEach((indicatorId) => {
      newChanges[indicatorId] = {
        ...indicatorChanges[indicatorId],
        technicianId,
      };
    });

    setIndicatorChanges((prev) => ({
      ...prev,
      ...newChanges,
    }));

    const technician = technicians.find((t) => t.id === technicianId);
    // technicianName available for future use
    void (technician?.displayName || technician?.userName || "KTV");
  };

  // Handle bulk approve
  const handleBulkApprove = async (sampleId: string) => {
    if (!task) return;

    const ids = selectedIndicators[sampleId] || [];
    if (ids.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    // Filter only indicators with Entered status (Chờ phê duyệt)
    const sample = sampleList.find((s) => s.sampleId === sampleId);
    const validIds = ids.filter((id) => {
      const ind = sample?.indicators.find((i) => i.id === id);
      return ind?.approvalStatus === IndicatorApprovalStatus.Entered;
    });

    if (validIds.length === 0) {
      message.warning(
        "Không có chỉ tiêu nào đủ điều kiện duyệt (Chờ phê duyệt)",
      );
      return;
    }

    setActionLoading(true);
    try {
      // Lấy standardIds cho các indicator được chọn
      const standardIdsMap: Record<string, string | null> = {};
      validIds.forEach((id) => {
        const indicator = sample?.indicators.find((i) => i.id === id);
        // Ưu tiên local state, fallback to DB value
        standardIdsMap[id] =
          standardSelections[id] !== undefined
            ? standardSelections[id]
            : indicator?.standardId || null;
      });

      await laboratoryTaskService.bulkApproveIndicators(task.id, {
        indicatorIds: validIds,
        approve: true,
        standardIds: standardIdsMap,
      });

      // Optimistic update: cập nhật indicators ngay lập tức
      updateIndicatorsOptimistically(validIds, {
        approvalStatus: IndicatorApprovalStatus.Approved,
      });

      // Reload full data from server (avoid duplicating BE logic for task status)
      await reloadData();

      message.success(`Đã duyệt ${validIds.length} chỉ tiêu`);
      // Xóa standard selections cho các indicator đã xử lý
      setStandardSelections((prev) => {
        const newSelections = { ...prev };
        validIds.forEach((id) => delete newSelections[id]);
        return newSelections;
      });
      setSelectedIndicators((prev) => ({ ...prev, [sampleId]: [] }));
    } catch (error: any) {
      console.error("Failed to bulk approve:", error);
      message.error(getApiErrorMessage(error, "Không thể duyệt chỉ tiêu"));
      // Reload để sync lại với server nếu có lỗi
      await loadTask();
    } finally {
      setActionLoading(false);
    }
  };

  // Open reject modal
  const openRejectModal = (sampleId: string) => {
    const ids = selectedIndicators[sampleId] || [];
    if (ids.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }
    setRejectingSampleId(sampleId);
    setRejectModalOpen(true);
  };

  // Handle bulk reject
  const handleBulkReject = async () => {
    if (!task || !rejectingSampleId) return;

    try {
      const values = await rejectForm.validateFields();
      const isGlobal = rejectingSampleId === "__global__";
      const ids = isGlobal
        ? Object.values(selectedIndicators).flat()
        : selectedIndicators[rejectingSampleId] || [];

      // Filter only indicators with Entered or Rejected status
      const validIds = ids.filter((id) => {
        const ind = task.indicators?.find((i) => i.id === id);
        return (
          ind?.approvalStatus === IndicatorApprovalStatus.Entered ||
          ind?.approvalStatus === IndicatorApprovalStatus.Rejected
        );
      });

      if (validIds.length === 0) {
        message.warning("Không có chỉ tiêu nào đủ điều kiện từ chối");
        return;
      }

      setActionLoading(true);
      const standardIdsMap: Record<string, string | null> = {};
      validIds.forEach((id) => {
        const indicator = task.indicators?.find((i) => i.id === id);
        standardIdsMap[id] =
          standardSelections[id] !== undefined
            ? standardSelections[id]
            : indicator?.standardId || null;
      });

      await laboratoryTaskService.bulkApproveIndicators(task.id, {
        indicatorIds: validIds,
        approve: false,
        rejectionReason: values.reason,
        standardIds: standardIdsMap,
      });

      updateIndicatorsOptimistically(validIds, {
        approvalStatus: IndicatorApprovalStatus.Rejected,
        rejectionReason: values.reason,
      });

      await reloadData();

      message.success(`Đã từ chối ${validIds.length} chỉ tiêu`);
      setStandardSelections((prev) => {
        const newSelections = { ...prev };
        validIds.forEach((id) => delete newSelections[id]);
        return newSelections;
      });
      if (isGlobal) {
        setSelectedIndicators({});
      } else {
        setSelectedIndicators((prev) => ({ ...prev, [rejectingSampleId]: [] }));
      }
      setRejectModalOpen(false);
      setRejectingSampleId(null);
      rejectForm.resetFields();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      console.error("Failed to bulk reject:", error);
      message.error(getApiErrorMessage(error, "Không thể từ chối chỉ tiêu"));
      await loadTask();
    } finally {
      setActionLoading(false);
    }
  };

  // ============= Shared Sample Handlers =============

  // Handle send shared sample (Lab Vi Sinh -> Lab Hóa)
  const handleSendSharedSample = async () => {
    if (!task) return;

    setActionLoading(true);
    try {
      await laboratoryTaskService.sendSharedSample(task.id);
      message.success("Đã gửi mẫu chung cho Lab Hóa");
      await reloadData();
    } catch (error: any) {
      console.error("Failed to send shared sample:", error);
      message.error(getApiErrorMessage(error, "Không thể gửi mẫu chung"));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle receive shared sample (Lab Hóa nhận từ Vi Sinh)
  const handleReceiveSharedSample = async () => {
    if (!task) return;

    setActionLoading(true);
    try {
      await laboratoryTaskService.receiveSharedSample(task.id);
      message.success("Đã xác nhận nhận mẫu chung");
      await reloadData();
    } catch (error: any) {
      console.error("Failed to receive shared sample:", error);
      message.error(getApiErrorMessage(error, "Không thể xác nhận nhận mẫu"));
    } finally {
      setActionLoading(false);
    }
  };

  // Check if task can send shared sample (Lab Vi Sinh, all indicators approved, not sent yet)
  // Only Lab Vi Sinh (no priorLabTaskId) can send shared sample
  const canSendSharedSample = useMemo(() => {
    if (!task) return false;
    if (task.testRequestStatus === TestRequestStatus.Cancelled) return false;

    // Must be shared sample task
    if (!task.isSharedSampleTask) return false;

    // Lab Vi Sinh has no priorLabTaskId, Lab Hóa has priorLabTaskId
    if (task.priorLabTaskId) return false;

    // Not sent yet
    if (task.sampleSentToNextLab === true) return false;

    // Check if all indicators are Approved (QLKT đã duyệt hết)
    const allApproved = task.indicators?.every(
      (ind) => ind.approvalStatus === IndicatorApprovalStatus.Approved,
    );
    return allApproved === true;
  }, [task]);

  // Check if task can receive shared sample (Lab Hóa, prior lab sent, not received yet)
  const canReceiveSharedSample = useMemo(() => {
    if (!task) return false;
    if (task.testRequestStatus === TestRequestStatus.Cancelled) return false;

    // Must be shared sample task with priorLabTaskId (Lab Hóa)
    if (!task.isSharedSampleTask || !task.priorLabTaskId) return false;

    // Prior lab must have sent sample
    if (task.priorLabSentSample !== true) return false;

    // Not received yet (check sampleReceivedDate)
    if (task.sampleReceivedDate) return false;

    return true;
  }, [task]);

  // Load sample images (testing images + sample attachments from TestRequest)
  useEffect(() => {
    const loadSampleImages = async () => {
      if (!task || !id) return;

      try {
        // Load testing detail to get all sample images at once
        const testingDetail = await testingService.get(id);

        const newSampleImages: Record<
          string,
          {
            sampleAttachments: SampleAttachmentDto[];
            beforeTesting: SampleTestingImageDto[];
            afterTesting: SampleTestingImageDto[];
          }
        > = {};

        for (const sample of testingDetail.samples) {
          newSampleImages[sample.sampleId] = {
            sampleAttachments: sample.sampleImages || [],
            beforeTesting: sample.beforeTestingImages || [],
            afterTesting: sample.afterTestingImages || [],
          };
        }

        setSampleImages(newSampleImages);
      } catch (error) {
        console.error("Failed to load sample images:", error);
        // Fallback: load images per sample
        const sampleIds = Object.keys(indicatorsBySample);
        for (const sampleId of sampleIds) {
          try {
            const images = await testingService.getSampleTestingImages(
              id,
              sampleId,
            );
            setSampleImages((prev) => ({
              ...prev,
              [sampleId]: {
                sampleAttachments: [],
                beforeTesting: images.filter(
                  (i) => i.imageType === SampleTestingImageType.BeforeTesting,
                ),
                afterTesting: images.filter(
                  (i) => i.imageType === SampleTestingImageType.AfterTesting,
                ),
              },
            }));
          } catch (err) {
            console.error(`Failed to load images for sample ${sampleId}:`, err);
          }
        }
      }
    };

    loadSampleImages();
  }, [task, id, indicatorsBySample]);

  // Handle before testing images change
  const handleBeforeImagesChange = (
    sampleId: string,
    images: SampleTestingImageDto[],
  ) => {
    setSampleImages((prev) => ({
      ...prev,
      [sampleId]: {
        ...prev[sampleId],
        beforeTesting: images,
      },
    }));
  };

  // Handle after testing images change
  const handleAfterImagesChange = (
    sampleId: string,
    images: SampleTestingImageDto[],
  ) => {
    setSampleImages((prev) => ({
      ...prev,
      [sampleId]: {
        ...prev[sampleId],
        afterTesting: images,
      },
    }));
  };

  // Check if task is in evaluation phase (UnderEvaluation or WaitingCustomerResponse)
  // During this phase, cannot assign/edit in Sample List tab
  const isInEvaluationPhase =
    task?.status === LaboratoryTaskStatus.UnderEvaluation ||
    task?.status === LaboratoryTaskStatus.WaitingCustomerResponse;

  // Lab Hóa can now work in parallel with Lab Vi Sinh - no blocking
  // These flags are kept for compatibility but always false
  const isFullyWaitingSharedSample = false;

  // Show alert only when prior lab hasn't sent sample yet (for informational purposes)
  const isWaitingSharedSample =
    task?.isSharedSampleTask === true &&
    task?.priorLabTaskId != null &&
    task?.priorLabSentSample !== true;

  // Check if test request is cancelled - disable all actions
  const isTestRequestCancelled =
    task?.testRequestStatus === TestRequestStatus.Cancelled;

  // Check if task is in completed phase (Approved, Rejected, SentToQuality, TestingRejected)
  // During this phase, cannot assign/edit
  // Also treat cancelled test request as completed phase
  const isCompletedPhase =
    isTestRequestCancelled ||
    task?.status === LaboratoryTaskStatus.Approved ||
    task?.status === LaboratoryTaskStatus.Rejected ||
    task?.status === LaboratoryTaskStatus.SentToQuality ||
    task?.status === LaboratoryTaskStatus.TestingRejected;

  // Check if task has any indicators that have been accepted for testing
  // These indicators can be assigned even during evaluation phase
  const hasAcceptedIndicators = task?.indicators?.some(
    (ind) => ind.approvalStatus === IndicatorApprovalStatus.AcceptedForTesting,
  );

  // Helper function: check if an indicator is a parent with children in the list
  // Parent with children = không có parentIndicatorId VÀ có sub-indicators trong list
  const isParentWithChildren = useCallback(
    (indicator: LaboratoryTaskIndicatorDto): boolean => {
      if (indicator.parentIndicatorId) return false; // Đây là sub-indicator
      // Kiểm tra xem có sub-indicators nào có parentIndicatorId === indicator.indicatorId AND cùng methodId
      return (
        task?.indicators?.some(
          (ind) =>
            ind.parentIndicatorId === indicator.indicatorId &&
            ind.methodId === indicator.methodId,
        ) ?? false
      );
    },
    [task?.indicators],
  );

  // Count indicators excluding parent indicators with children (for display purposes)
  const activeIndicatorCount = useMemo(() => {
    if (!task?.indicators) return 0;
    return task.indicators.filter((ind) => !isParentWithChildren(ind)).length;
  }, [task?.indicators, isParentWithChildren]);

  // Check if can assign technician to indicators
  // Allowed when: PartialAccepted, FullyAccepted, Assigned, InProgress, WaitingApproval
  // Also allowed during UnderEvaluation/WaitingCustomerResponse if some indicators are already AcceptedForTesting
  // NOT allowed when: Approved, Rejected, SentToQuality, TestingRejected, WaitingSharedSample (fully)
  // For mixed tasks (isFullyWaitingSharedSample=false), allow assignment - individual indicators will be disabled
  const canAssignToIndicator =
    (!isInEvaluationPhase || hasAcceptedIndicators) &&
    !isCompletedPhase &&
    !isFullyWaitingSharedSample &&
    canAssignTesting;

  // Global select all - compute selectable IDs across all samples (respects filter)
  const allGlobalSelectableIds = useMemo(() => {
    const result: Record<string, string[]> = {};
    filteredSampleList.forEach((sample) => {
      const selectionMode =
        sample.sampleStatus === "notStarted" ||
        sample.sampleStatus === "assigned" ||
        sample.sampleStatus === "pendingApproval"
          ? "assignment"
          : "approval";

      const selectableIds = sample.indicators
        .filter((ind) => {
          if (selectionMode === "assignment") {
            return (
              ind.approvalStatus ===
                IndicatorApprovalStatus.AcceptedForTesting ||
              ind.approvalStatus === IndicatorApprovalStatus.Entered ||
              ind.approvalStatus === IndicatorApprovalStatus.MethodChanged
            );
          }
          return (
            ind.approvalStatus !== IndicatorApprovalStatus.Approved &&
            ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled &&
            ind.approvalStatus !== IndicatorApprovalStatus.Pending
          );
        })
        .map((ind) => ind.id);

      if (selectableIds.length > 0) {
        result[sample.sampleId] = selectableIds;
      }
    });
    return result;
  }, [filteredSampleList]);

  const totalGlobalSelectable = Object.values(allGlobalSelectableIds).flat().length;
  const totalGlobalSelected = Object.values(selectedIndicators).flat().length;
  const globalSelectedSampleCount = Object.entries(selectedIndicators).filter(
    ([, ids]) => ids.length > 0,
  ).length;

  const isGlobalAllSelected =
    totalGlobalSelectable > 0 && totalGlobalSelected === totalGlobalSelectable;
  const isGlobalIndeterminate =
    totalGlobalSelected > 0 && totalGlobalSelected < totalGlobalSelectable;

  const handleGlobalSelectAll = () => {
    if (isGlobalAllSelected) {
      setSelectedIndicators({});
    } else {
      setSelectedIndicators(allGlobalSelectableIds);
    }
  };

  const handleGlobalQuickAssignTechnician = (technicianId: string) => {
    const allSelectedIds = Object.values(selectedIndicators).flat();
    if (allSelectedIds.length === 0) return;

    const newChanges: Record<string, Partial<LaboratoryTaskIndicatorDto>> = {};
    allSelectedIds.forEach((indicatorId) => {
      newChanges[indicatorId] = {
        ...indicatorChanges[indicatorId],
        technicianId,
      };
    });
    setIndicatorChanges((prev) => ({ ...prev, ...newChanges }));
  };

  const handleGlobalBulkNoteModal = () => {
    const allSelectedIds = Object.values(selectedIndicators).flat();
    if (allSelectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }
    const allIds = task?.indicators?.map((i) => i.id) || [];
    const firstIndicator = task?.indicators?.find((i) =>
      allSelectedIds.includes(i.id),
    );
    const selectedIndicatorsMasterData = allSelectedIds.map((indicatorId) => {
      const indicator = task?.indicators?.find((i) => i.id === indicatorId);
      return {
        indicatorId,
        masterDataNoteIds: indicator?.masterDataNoteIds || "",
      };
    });

    setNoteModal({
      visible: true,
      selectedIndicatorIds: allSelectedIds,
      allIndicatorIds: allIds,
      sampleId: firstIndicator?.sampleId || "",
      initialFreeTextNote: firstIndicator?.freeTextNote || "",
      selectedIndicatorsMasterData,
    });
  };

  const handleGlobalAssign = async () => {
    const samplesWithSelections = Object.entries(selectedIndicators).filter(
      ([, ids]) => ids.length > 0,
    );

    if (samplesWithSelections.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để giao việc");
      return;
    }

    for (const [sampleId] of samplesWithSelections) {
      await handleAssignSample(sampleId);
    }
    setSelectedIndicators({});
  };

  const handleGlobalBulkApprove = async () => {
    if (!task) return;

    const allSelectedIds = Object.values(selectedIndicators).flat();
    if (allSelectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }

    const validIds = allSelectedIds.filter((id) => {
      const ind = task.indicators?.find((i) => i.id === id);
      return ind?.approvalStatus === IndicatorApprovalStatus.Entered;
    });

    if (validIds.length === 0) {
      message.warning("Không có chỉ tiêu nào đủ điều kiện duyệt (Chờ phê duyệt)");
      return;
    }

    setActionLoading(true);
    try {
      const standardIdsMap: Record<string, string | null> = {};
      validIds.forEach((id) => {
        const indicator = task.indicators?.find((i) => i.id === id);
        standardIdsMap[id] =
          standardSelections[id] !== undefined
            ? standardSelections[id]
            : indicator?.standardId || null;
      });

      await laboratoryTaskService.bulkApproveIndicators(task.id, {
        indicatorIds: validIds,
        approve: true,
        standardIds: standardIdsMap,
      });

      updateIndicatorsOptimistically(validIds, {
        approvalStatus: IndicatorApprovalStatus.Approved,
      });

      await reloadData();

      message.success(`Đã duyệt ${validIds.length} chỉ tiêu`);
      setStandardSelections((prev) => {
        const newSelections = { ...prev };
        validIds.forEach((id) => delete newSelections[id]);
        return newSelections;
      });
      setSelectedIndicators({});
    } catch (error: any) {
      console.error("Failed to global bulk approve:", error);
      message.error(getApiErrorMessage(error, "Không thể duyệt chỉ tiêu"));
      await loadTask();
    } finally {
      setActionLoading(false);
    }
  };

  const handleGlobalReject = () => {
    const allSelectedIds = Object.values(selectedIndicators).flat();
    if (allSelectedIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu");
      return;
    }
    setRejectingSampleId("__global__");
    setRejectModalOpen(true);
  };

  // Check if can upload images
  // Cho phép QLKT upload ảnh ở mọi giai đoạn trừ khi đã hoàn thành (Approved, Rejected, SentToQuality, TestingRejected)
  const canUploadImages = !isCompletedPhase;

  // Get status tag
  const getStatusTag = (status: LaboratoryTaskStatus) => {
    if (isTestRequestCancelled) {
      return <StatusTag color="error">Hủy bỏ yêu cầu</StatusTag>;
    }

    return (
      <StatusTag color={LaboratoryTaskStatusColors[status]}>
        {LaboratoryTaskStatusLabels[status]}
      </StatusTag>
    );
  };

  // Get sample status tag for display (outlined style: color as text+border, light bg)
  // Note: 'assigned' is displayed as 'notStarted' (Chưa thực hiện) per customer requirement
  const sampleStatusHexColors: Record<string, string> = {
    default: "#8C8C8C",
    processing: "#1890FF",
    warning: "#FAAD14",
    success: "#52C41A",
    error: "#F5222D",
    volcano: "#FA541C",
  };

  const getSampleStatusTag = (status: SampleStatus) => {
    const displayStatus = status === "assigned" ? "notStarted" : status;
    const colorKey = SampleStatusColors[displayStatus] || "default";
    const hex = sampleStatusHexColors[colorKey] || "#8C8C8C";
    return (
      <Tag
        style={{
          color: hex,
          backgroundColor: "#F6FFED",
          border: `1px solid ${hex}`,
          borderRadius: 18,
          padding: "2px 8px",
          minWidth: 70,
          textAlign: "center",
          margin: 0,
        }}
      >
        {SampleStatusLabels[displayStatus]}
      </Tag>
    );
  };

  // Kiểm tra có thể chỉnh sửa task không
  // Cho phép khi: FullyAccepted/PartialAccepted (sau khi QLKT đánh giá) hoặc Đã giao việc VÀ có quyền editMethod
  // KHÔNG cho phép khi đang trong giai đoạn đánh giá (UnderEvaluation/WaitingCustomerResponse)
  const canEditTask =
    !isInEvaluationPhase &&
    (task?.status === LaboratoryTaskStatus.FullyAccepted ||
      task?.status === LaboratoryTaskStatus.PartialAccepted ||
      task?.status === LaboratoryTaskStatus.Assigned) &&
    canEditMethod;

  // Check if sample has selected indicators for bulk actions
  const getSampleSelectedCount = (sampleId: string) => {
    return (selectedIndicators[sampleId] || []).length;
  };

  // Get count of selected indicators that need approval (Entered status only)
  const getApprovalCount = (sampleId: string) => {
    const ids = selectedIndicators[sampleId] || [];
    const sample = sampleList.find((s) => s.sampleId === sampleId);
    return ids.filter((id) => {
      const ind = sample?.indicators.find((i) => i.id === id);
      return ind?.approvalStatus === IndicatorApprovalStatus.Entered;
    }).length;
  };

  // Generate Collapse items
  const collapseItems = filteredSampleList.map((sample) => {
    const selectedCount = getSampleSelectedCount(sample.sampleId);
    const approvalCount = getApprovalCount(sample.sampleId); // Chỉ đếm chỉ tiêu cần phê duyệt (Entered)
    const sampleImagesData = sampleImages[sample.sampleId];

    return {
      key: sample.sampleId,
      label: (
        <Row justify="space-between" align="middle" style={{ width: "100%" }}>
          <Col>
            <Space>
              <Tag color="blue">
                {[sample.sampleCode, sample.sampleName, sample.specimenTypeName]
                  .filter(Boolean)
                  .join(" - ")}
              </Tag>
              <Text type="secondary">({sample.indicatorCount} chỉ tiêu)</Text>
              {getSampleStatusTag(sample.sampleStatus)}
            </Space>
            {(sample.sampleQuantity || sample.sampleStatusText) && (
              <div style={{ marginTop: 4, display: "flex", gap: 16, fontSize: 13 }}>
                {sample.sampleQuantity && (
                  <Text style={{ fontSize: 13 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Lượng mẫu gửi:</Text>{" "}
                    {sample.sampleQuantity}
                  </Text>
                )}
                {sample.sampleStatusText && (
                  <Text style={{ fontSize: 13 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Tình trạng mẫu:</Text>{" "}
                    {sample.sampleStatusText}
                  </Text>
                )}
              </div>
            )}
          </Col>
          <Col>
            <Space>
              {/* Bulk approve/reject buttons - only show when pendingApproval VÀ có quyền approveResult VÀ không trong giai đoạn đánh giá
                  Note: Cho phép duyệt khi SentToQuality vì có thể có mẫu chưa được duyệt */}
              {!isInEvaluationPhase &&
                (task?.status === LaboratoryTaskStatus.SentToQuality ||
                  !isCompletedPhase) &&
                sample.sampleStatus === "pendingApproval" &&
                canApproveResult && (
                  <>
                    <Button
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      loading={actionLoading}
                      disabled={approvalCount === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        openRejectModal(sample.sampleId);
                      }}
                    >
                      Từ chối{approvalCount > 0 ? ` (${approvalCount})` : ""}
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      loading={actionLoading}
                      disabled={approvalCount === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBulkApprove(sample.sampleId);
                      }}
                    >
                      Duyệt{approvalCount > 0 ? ` (${approvalCount})` : ""}
                    </Button>
                  </>
                )}
              {/* Quick Technician Selector - show when has selected indicators VÀ có quyền assignTesting VÀ sample chưa approved */}
              {canAssignToIndicator &&
                selectedCount > 0 &&
                !sample.isApproved && (
                  <Popover
                    content={
                      <div
                        style={{ width: 250 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>
                          Chọn TNV cho {selectedCount} chỉ tiêu
                        </div>
                        <Select
                          style={{ width: "100%" }}
                          placeholder="Chọn thử nghiệm viên..."
                          showSearch
                          optionFilterProp="label"
                          options={technicians.map((t) => ({
                            value: t.id,
                            label: t.displayName || t.userName,
                          }))}
                          onChange={(value) => {
                            if (value) {
                              handleQuickAssignTechnician(
                                sample.sampleId,
                                value,
                              );
                            }
                          }}
                        />
                        <div
                          style={{ marginTop: 8, fontSize: 12, color: "#888" }}
                        >
                          Danh sách KTV thuộc{" "}
                          {task?.laboratoryName || "khoa phòng"}
                        </div>
                      </div>
                    }
                    trigger="click"
                    placement="bottomRight"
                  >
                    <Button
                      size="small"
                      icon={<UserOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Chọn TNV ({selectedCount})
                    </Button>
                  </Popover>
                )}
              {/* Bulk note button - show when has selected indicators, not in completed/cancelled phase */}
              {selectedCount > 0 && !sample.isApproved && !isCompletedPhase && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  loading={actionLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenBulkNoteModal(sample.sampleId);
                  }}
                >
                  Ghi chú ({selectedCount})
                </Button>
              )}
              {/* Assign button - show when sample has notStarted indicators VÀ có quyền assignTesting VÀ không trong giai đoạn đánh giá/hoàn thành */}
              {canAssignToIndicator && sample.sampleStatus === "notStarted" && (
                <Button
                  type="primary"
                  size="small"
                  loading={actionLoading}
                  disabled={selectedCount === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssignSample(sample.sampleId);
                  }}
                >
                  Giao việc{selectedCount > 0 ? ` (${selectedCount})` : ""}
                </Button>
              )}
              {/* Re-assign button - show when assigned but not approved, hide when customerCancelled VÀ có quyền assignTesting VÀ không trong giai đoạn đánh giá/hoàn thành */}
              {canAssignToIndicator &&
                sample.sampleStatus !== "notStarted" &&
                sample.sampleStatus !== "customerCancelled" &&
                !sample.isApproved && (
                  <Button
                    size="small"
                    loading={actionLoading}
                    disabled={selectedCount === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignSample(sample.sampleId);
                    }}
                  >
                    Giao việc lại
                    {selectedCount > 0 ? ` (${selectedCount})` : ""}
                  </Button>
                )}
            </Space>
          </Col>
        </Row>
      ),
      children: (
        <>
          {/* Sample Images Display with upload support */}
          <SampleImagesDisplay
            taskId={id}
            sampleId={sample.sampleId}
            sampleImages={sampleImagesData?.sampleAttachments}
            beforeTestingImages={sampleImagesData?.beforeTesting}
            afterTestingImages={sampleImagesData?.afterTesting}
            canUpload={canUploadImages}
            maxImages={5}
            onBeforeImagesChange={(images) =>
              handleBeforeImagesChange(sample.sampleId, images)
            }
            onAfterImagesChange={(images) =>
              handleAfterImagesChange(sample.sampleId, images)
            }
          />
          <IndicatorTable
            indicators={sample.indicators}
            methods={methods}
            technicians={technicians}
            isAssigned={sample.sampleStatus !== "notStarted"}
            canEdit={canEditTask}
            canAssignTechnician={canAssignToIndicator}
            sampleStatus={sample.sampleStatus}
            sampleId={sample.sampleId}
            onMethodChange={handleMethodChange}
            onUpdateSubContractMethod={handleUpdateSubContractMethod}
            onTechnicianChange={handleTechnicianChange}
            onApprove={handleApprove}
            onUpdateNote={handleUpdateNote}
            onOpenNoteModal={handleOpenNoteModal}
            onUnitChange={handleUnitChange}
            savingMethodIndicatorIds={savingMethodIndicatorIds}
            loading={actionLoading}
            showCheckbox={true}
            selectedIndicatorIds={selectedIndicators[sample.sampleId] || []}
            onSelectionChange={(ids) =>
              handleSelectionChange(sample.sampleId, ids)
            }
            standardSelections={standardSelections}
            onStandardChange={handleStandardChange}
            forceDisableAll={isTestRequestCancelled}
          />
        </>
      ),
    };
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Text type="secondary">Không tìm thấy công việc</Text>
          <br />
          <Button type="link" onClick={() => navigate(PATH_ROUTES.tasks.index)}>
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Tooltip title="Quay lại">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(PATH_ROUTES.tasks.index)}
          />
        </Tooltip>
      </div>

      {/* Alert khi phiếu yêu cầu đã bị hủy */}
      {isTestRequestCancelled && (
        <Alert
          message="Phiếu yêu cầu đã bị hủy"
          description="Phiếu yêu cầu đã bị hủy. Không thể thực hiện bất kỳ thao tác nào trên task này."
          type="error"
          showIcon
          style={{ marginBottom: 8 }}
        />
      )}

      {/* Alert và actions cho Shared Sample (Mẫu chung) */}
      {task.isSharedSampleTask && (
        <div style={{ marginBottom: 8 }}>
          {/* Alert thông báo mẫu chung - Lab Hóa có thể làm việc song song */}
          {isWaitingSharedSample && (
            <Alert
              message="Mẫu chung - Lab Vi Sinh chưa gửi mẫu"
              description={
                <>
                  <div>
                    Đây là mẫu chung. Lab Vi Sinh chưa gửi mẫu vật lý. Bạn vẫn
                    có thể đánh giá và phân công công việc song song.
                  </div>
                </>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Button xác nhận nhận mẫu khi Lab Vi Sinh đã gửi */}
          {canReceiveSharedSample && (
            <Alert
              message="Lab Vi Sinh đã gửi mẫu chung"
              description={
                <>
                  <div>
                    Lab Vi Sinh đã gửi mẫu vật lý. Nhấn nút bên dưới để xác nhận
                    nhận mẫu và ghi nhận ngày nhận.
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Button
                      type="primary"
                      onClick={handleReceiveSharedSample}
                      loading={actionLoading}
                    >
                      Xác nhận nhận mẫu
                    </Button>
                  </div>
                </>
              }
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Alert và button khi Lab Vi Sinh cần gửi mẫu cho Lab Hóa */}
          {canSendSharedSample && (
            <Alert
              message="Mẫu chung - Cần gửi cho Lab Hóa"
              description={
                <>
                  <div>
                    Đã hoàn thành xử lý mẫu chung. Vui lòng gửi mẫu cho Lab Hóa
                    để tiếp tục quy trình.
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Button
                      type="primary"
                      onClick={handleSendSharedSample}
                      loading={actionLoading}
                    >
                      Gửi mẫu cho Lab Hóa
                    </Button>
                  </div>
                </>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Badge hiển thị đây là mẫu chung (đã gửi) - Lab Vi Sinh */}
          {task.sampleSentToNextLab && !task.priorLabTaskId && (
            <Alert
              message="Đã gửi mẫu chung cho Lab Hóa"
              description={`Ngày gửi: ${task.sampleSentDate ? formatDate(task.sampleSentDate) : "-"}`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Badge hiển thị đã xác nhận nhận mẫu chung - Lab Hóa */}
          {task.priorLabTaskId && task.sampleReceivedDate && (
            <Alert
              message="Đã xác nhận nhận mẫu chung"
              description={`Ngày xác nhận: ${formatDate(task.sampleReceivedDate)}`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </div>
      )}

      <Card>
        {/* Header Card */}
        <Card
          style={{
            marginBottom: 16,
            background: "#FAFAFA",
            border: "1px solid #D9D9D9",
          }}
        >
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <Col>
              <Title level={5} style={{ margin: 0 }}>
                Số nhận mẫu giao việc
              </Title>
            </Col>
          </Row>
          <Row gutter={[48, 10]}>
            <Col xs={24} sm={12}>
              <div style={{ display: "flex", gap: 12 }}>
                <Text type="secondary" style={{ minWidth: 90, flexShrink: 0 }}>
                  Số hợp đồng:
                </Text>
                <Text>{task.contractNumber || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: "flex", gap: 12 }}>
                <Text type="secondary" style={{ minWidth: 100, flexShrink: 0 }}>
                  Ngày gửi KP:
                </Text>
                <Text>{formatDateVN(task.underReviewDate)}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: "flex", gap: 12 }}>
                <Text type="secondary" style={{ minWidth: 90, flexShrink: 0 }}>
                  Khoa phòng:
                </Text>
                <Text>{task.laboratoryName || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: "flex", gap: 12 }}>
                <Text type="secondary" style={{ minWidth: 100, flexShrink: 0 }}>
                  Ngày YC xong:
                </Text>
                <Text>{formatDate(task.requestCompletionDate)}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: "flex", gap: 12 }}>
                <Text type="secondary" style={{ minWidth: 90, flexShrink: 0 }}>
                  QLKT:
                </Text>
                <Text>{task.technicalManagerName || "-"}</Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: "flex", gap: 12 }}>
                <Text type="secondary" style={{ minWidth: 100, flexShrink: 0 }}>
                  Ngày TN:
                </Text>
                <Text>
                  {task.testDateRange ||
                    (task.testDate ? formatDate(task.testDate) : "Chưa đặt")}
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Text type="secondary" style={{ minWidth: 90, flexShrink: 0 }}>
                  Trạng thái:
                </Text>
                <Space size={4}>
                  {getStatusTag(task.status)}
                  {task.isSharedSampleTask && (
                    <Tag color="purple">Mẫu chung</Tag>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Tabs for Evaluation and Sample List */}
        <div className="statistics-detail-tabs">
          <Radio.Group
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            optionType="button"
          >
            <Radio.Button value="evaluation">
              Đánh giá chỉ tiêu ({activeIndicatorCount})
            </Radio.Button>
            <Radio.Button value="samples">
              Danh sách mẫu ({sampleList.length})
            </Radio.Button>
          </Radio.Group>
        </div>
        <Card className="statistics-detail-card task-detail-card">
          {activeTab === "evaluation" && (
            <div className="task-tab-evaluation">
              {/* Alert based on task status */}
              {task.status === LaboratoryTaskStatus.UnderEvaluation ||
              task.status === LaboratoryTaskStatus.WaitingCustomerResponse ? (
                <Alert
                  message={
                    task.status === LaboratoryTaskStatus.WaitingCustomerResponse
                      ? "Chờ khách hàng xác nhận"
                      : "Chế độ đánh giá thử nghiệm"
                  }
                  description={
                    task.status === LaboratoryTaskStatus.WaitingCustomerResponse
                      ? "Có chỉ tiêu đang chờ KH xác nhận (đổi PP hoặc từ chối TN). QLKT vẫn có thể đánh giá các chỉ tiêu Pending còn lại."
                      : "QLKT đánh giá từng chỉ tiêu: Chấp nhận, Yêu cầu đổi phương pháp, hoặc Từ chối thử nghiệm."
                  }
                  type={
                    task.status === LaboratoryTaskStatus.WaitingCustomerResponse
                      ? "warning"
                      : "info"
                  }
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <Alert
                  message="Không có yêu cầu đánh giá"
                  description="Công việc này đã hoàn thành giai đoạn đánh giá hoặc chưa cần đánh giá."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <EvaluationIndicatorTable
                indicators={task.indicators || []}
                methods={methods}
                taskId={task.id}
                canEvaluate={
                  !isTestRequestCancelled &&
                  canApproveResult &&
                  (task.status === LaboratoryTaskStatus.UnderEvaluation ||
                    task.status ===
                      LaboratoryTaskStatus.WaitingCustomerResponse ||
                    // Cho phép evaluate khi task đã ở trạng thái sau nhưng còn indicator Pending (gửi QLKT sau)
                    ((task.status === LaboratoryTaskStatus.FullyAccepted ||
                      task.status === LaboratoryTaskStatus.PartialAccepted ||
                      task.status === LaboratoryTaskStatus.Assigned ||
                      task.status === LaboratoryTaskStatus.InProgress ||
                      task.status === LaboratoryTaskStatus.WaitingApproval ||
                      task.status === LaboratoryTaskStatus.SentToQuality) &&
                      (task.indicators?.some(
                        (ind) =>
                          ind.approvalStatus ===
                            IndicatorApprovalStatus.Pending ||
                          ind.approvalStatus ===
                            IndicatorApprovalStatus.CannotTest,
                      ) ??
                        false)))
                }
                loading={loading}
                onEvaluationComplete={reloadData}
                isSharedSampleTask={task.isSharedSampleTask}
                isTestRequestCancelled={isTestRequestCancelled}
              />
            </div>
          )}
          {activeTab === "samples" && (
            <>
              <div style={{ marginBottom: 8 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Chọn chỉ tiêu"
                  style={{ width: 300 }}
                  options={indicatorFilterOptions}
                  value={indicatorFilter}
                  onChange={(values) => {
                    setIndicatorFilter(values);
                    setSelectedIndicators({});
                  }}
                  optionFilterProp="label"
                  maxTagCount="responsive"
                />
              </div>
              {(canAssignToIndicator || canApproveResult) && totalGlobalSelectable > 0 && (
                <div
                  style={{
                    marginBottom: 8,
                    padding: "10px 16px",
                    boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <div
                        onClick={handleGlobalSelectAll}
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        <Checkbox
                          checked={isGlobalAllSelected}
                          indeterminate={isGlobalIndeterminate}
                        >
                          Chọn tất cả (Đã chọn {globalSelectedSampleCount} mẫu -{" "}
                          {totalGlobalSelected} chỉ tiêu)
                        </Checkbox>
                      </div>
                    </Col>
                    <Col>
                      <Space>
                        {canAssignToIndicator && (
                          <Popover
                            content={
                              <div
                                style={{ width: 250 }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                  Chọn TNV cho {totalGlobalSelected} chỉ tiêu
                                </div>
                                <Select
                                  style={{ width: "100%" }}
                                  placeholder="Chọn thử nghiệm viên..."
                                  showSearch
                                  optionFilterProp="label"
                                  options={technicians.map((t) => ({
                                    value: t.id,
                                    label: t.displayName || t.userName,
                                  }))}
                                  onChange={(value) => {
                                    if (value)
                                      handleGlobalQuickAssignTechnician(value);
                                  }}
                                />
                                <div
                                  style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: "#888",
                                  }}
                                >
                                  Danh sách KTV thuộc{" "}
                                  {task?.laboratoryName || "khoa phòng"}
                                </div>
                              </div>
                            }
                            trigger="click"
                            placement="bottomRight"
                          >
                            <Button
                              size="small"
                              icon={<UserOutlined />}
                              disabled={totalGlobalSelected === 0}
                            >
                              Chọn TNV
                              {totalGlobalSelected > 0
                                ? ` (${totalGlobalSelected})`
                                : ""}
                            </Button>
                          </Popover>
                        )}
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          disabled={totalGlobalSelected === 0}
                          loading={actionLoading}
                          onClick={handleGlobalBulkNoteModal}
                        >
                          Ghi chú
                          {totalGlobalSelected > 0
                            ? ` (${totalGlobalSelected})`
                            : ""}
                        </Button>
                        {canAssignToIndicator && (
                          <Button
                            type="primary"
                            size="small"
                            disabled={totalGlobalSelected === 0}
                            loading={actionLoading}
                            onClick={handleGlobalAssign}
                          >
                            Giao việc
                            {totalGlobalSelected > 0
                              ? ` (${totalGlobalSelected})`
                              : ""}
                          </Button>
                        )}
                        {canApproveResult && (
                          <>
                            <Button
                              danger
                              size="small"
                              icon={<CloseOutlined />}
                              disabled={totalGlobalSelected === 0}
                              loading={actionLoading}
                              onClick={handleGlobalReject}
                            >
                              Từ chối KQ
                              {totalGlobalSelected > 0
                                ? ` (${totalGlobalSelected})`
                                : ""}
                            </Button>
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckOutlined />}
                              disabled={totalGlobalSelected === 0}
                              loading={actionLoading}
                              onClick={handleGlobalBulkApprove}
                            >
                              Duyệt KQ
                              {totalGlobalSelected > 0
                                ? ` (${totalGlobalSelected})`
                                : ""}
                            </Button>
                          </>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </div>
              )}
              <Collapse
                defaultActiveKey={filteredSampleList.map((s) => s.sampleId)}
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
                items={collapseItems}
              />
            </>
          )}
        </Card>
      </Card>

      {/* Alert khi có lý do từ chối từ QLCL */}
      {task.resultRejectionReason && (
        <Alert
          message="Kết quả bị từ chối"
          description={
            <>
              <div>
                Quản lý Chất lượng đã từ chối kết quả. Vui lòng xem xét và gửi
                lại.
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Lý do:</strong> {task.resultRejectionReason}
              </div>
            </>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Supporter Modal */}
      <SupporterModal
        open={supporterModalOpen}
        onClose={() => setSupporterModalOpen(false)}
        taskId={task.id}
        currentSupporters={task.supporters || []}
        onSuccess={reloadData}
      />

      {/* Note Modal */}
      <NoteModal
        open={noteModal.visible}
        onClose={() =>
          setNoteModal({
            visible: false,
            selectedIndicatorIds: [],
            allIndicatorIds: [],
            sampleId: "",
            initialFreeTextNote: "",
            selectedIndicatorsMasterData: [],
          })
        }
        selectedIndicatorIds={noteModal.selectedIndicatorIds}
        allIndicatorIds={noteModal.allIndicatorIds}
        onSave={handleSaveNote}
        loading={actionLoading}
        title={
          noteModal.selectedIndicatorIds.length > 1
            ? `Ghi chú cho ${noteModal.selectedIndicatorIds.length} chỉ tiêu`
            : "Ghi chú"
        }
        initialFreeTextNote={noteModal.initialFreeTextNote}
        selectedIndicatorsMasterData={noteModal.selectedIndicatorsMasterData}
      />

      {/* Bulk Reject Modal */}
      <Modal
        title="Lý do từ chối"
        open={rejectModalOpen}
        onOk={handleBulkReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectingSampleId(null);
          rejectForm.resetFields();
        }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: actionLoading }}
        width={500}
        centered
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[{ required: true, message: "Vui lòng nhập lý do từ chối" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do từ chối kết quả..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reassign Confirmation Modal */}
      <Modal
        title="Xác nhận giao việc lại"
        open={reassignModalOpen}
        onOk={handleConfirmReassign}
        onCancel={handleCancelReassign}
        okText="Xác nhận giao việc lại"
        cancelText="Hủy"
        okButtonProps={{ loading: actionLoading }}
        width={600}
        centered
      >
        <Alert
          message="Một số chỉ tiêu đã được giao việc cho KTV khác"
          description="Bạn có chắc chắn muốn giao lại các chỉ tiêu sau cho KTV mới?"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {reassignInfo?.reassignedIndicators.map((item, index) => (
            <div
              key={index}
              style={{
                padding: "8px 12px",
                marginBottom: 8,
                backgroundColor: "#fafafa",
                borderRadius: 4,
                border: "1px solid #d9d9d9",
              }}
            >
              <div>
                <IndicatorName
                  name={item.indicatorName}
                  formattedName={item.indicatorFormattedName}
                  style={{ fontWeight: 600 }}
                />
              </div>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">KTV hiện tại: </Text>
                <Text>{item.currentTechnicianName}</Text>
                <Text type="secondary"> → KTV mới: </Text>
                <Text type="success">{item.newTechnicianName}</Text>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default TaskManagementDetail;
