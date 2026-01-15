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
  Divider,
  message,
  Spin,
  Modal,
  Alert,
  Form,
  Input,
  Tabs,
  Select,
  Popover,
} from "antd";
import StatusTag from "../../components/common/StatusTag";
import {
  ArrowLeftOutlined,
  CaretRightOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  UserOutlined,
} from "../../components/common/Icon";
import { laboratoryTaskService } from "../../services/laboratoryTaskService";
import { formatDate } from "../../utils/formatters";
import { testingService } from "../../services/testingService";
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
} from "../../types/laboratoryTask";
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
  key: K
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
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
            indicatorIds.includes(ind.id) ? { ...ind, ...updates } : ind
          ),
        };
      });
    },
    []
  );
  const [methods, setMethods] = useState<MethodLookupDto[]>([]);
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Standard selections state - lưu trữ local standard selections chưa được save
  const [standardSelections, setStandardSelections] = useState<
    Record<string, string | null>
  >({});

  // Bulk reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingSampleId, setRejectingSampleId] = useState<string | null>(
    null
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
    "assignTesting",
    "addSupporter",
    "editMethod",
    "approveResult",
  ]);

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

  // Check quyền từ Permission Matrix + supporter status
  // QLKT (A) = canAll, Admin (V) = canView, Supporter = same as QLKT (except addSupporter)
  // Người hỗ trợ có quyền: giao KTV, duyệt/từ chối, gửi QLCL
  // Người hỗ trợ KHÔNG có quyền: xóa task, thêm supporter khác
  const canAssignTesting =
    actionPermissions.assignTesting?.canAll || isCurrentUserSupporter || false;
  const canAddSupporter = actionPermissions.addSupporter?.canAll || false; // Supporter KHÔNG có quyền thêm supporter khác
  const canEditMethod =
    actionPermissions.editMethod?.canAll || isCurrentUserSupporter || false;
  const canApproveResult =
    actionPermissions.approveResult?.canAll || isCurrentUserSupporter || false;

  // Check if current user can manage supporters (chỉ QLKT của task hoặc có quyền addSupporter)
  // Supporter KHÔNG có quyền này
  const canManageSupporters = useMemo(() => {
    return canAddSupporter || (task?.isCurrentUserTechnicalManager ?? false);
  }, [canAddSupporter, task?.isCurrentUserTechnicalManager]);

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
    } catch (error) {
      console.error("Failed to load task:", error);
      message.error("Không thể tải thông tin công việc");
    } finally {
      setLoading(false);
    }
  }, [id]);

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
          (i) => i.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
        );

        // Check if all indicators are CustomerCancelled
        const allCustomerCancelled =
          indicators.length > 0 &&
          indicators.every(
            (i) =>
              i.approvalStatus === IndicatorApprovalStatus.CustomerCancelled
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
            (i) => i.approvalStatus === IndicatorApprovalStatus.Approved
          );

        // TẤT CẢ chỉ tiêu đã được giao việc (có method + KTV)
        const allAssigned =
          activeIndicators.length > 0 &&
          activeIndicators.every((i) => i.methodId && i.technicianId);

        // Có ≥1 chỉ tiêu đang thử nghiệm (có testDate, KTV đã check-in)
        const anyTesting = activeIndicators.some(
          (i) =>
            i.testDate && i.approvalStatus === IndicatorApprovalStatus.Pending
        );

        // Có ≥1 chỉ tiêu chờ phê duyệt (Entered) - ưu tiên hiển thị vì cần action
        const anyEntered = activeIndicators.some(
          (i) => i.approvalStatus === IndicatorApprovalStatus.Entered
        );

        // Có ≥1 chỉ tiêu bị từ chối - ưu tiên hiển thị vì cần action
        const anyRejected = activeIndicators.some(
          (i) => i.approvalStatus === IndicatorApprovalStatus.Rejected
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
          indicatorCount: indicators.length,
          indicators: mergedIndicators as LaboratoryTaskIndicatorDto[],
          sampleStatus,
          isApproved: allApproved,
        };
      }
    );

    // Sort theo sampleId để cố định vị trí
    return samples.sort((a, b) => a.sampleId.localeCompare(b.sampleId));
  }, [indicatorsBySample, indicatorChanges]);

  // Handlers
  const handleMethodChange = (indicatorId: string, methodId: string) => {
    setIndicatorChanges((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        methodId,
      },
    }));
  };

  const handleTechnicianChange = (
    indicatorId: string,
    technicianId: string
  ) => {
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
        ind.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
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
      }
    );

    // Validate - check which indicators are missing method or technician
    const missingMethod: string[] = [];
    const missingTechnician: string[] = [];

    for (const assignment of assignments) {
      const indicator = selectedIndicatorsList.find(
        (ind) => ind.id === assignment.indicatorId
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
          ", "
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
        (ind) => ind.id === assignment.indicatorId
      );
      const indicator = selectedIndicatorsList.find(
        (ind) => ind.id === assignment.indicatorId
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
            (t) => t.id === newTechnicianId
          );
          // Lấy tên KTV hiện tại từ server hoặc từ danh sách technicians
          const currentTechnician = technicians.find(
            (t) => t.id === originalIndicator.technicianId
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
    assignments: AssignIndicatorInput[]
  ) => {
    if (!task) return;

    setActionLoading(true);
    try {
      await laboratoryTaskService.assignSampleIndicators(
        task.id,
        sampleId,
        assignments
      );

      // Optimistic update: cập nhật indicators ngay lập tức
      const now = new Date().toISOString();
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          indicators: prev.indicators?.map((ind) => {
            const assignment = assignments.find(
              (a) => a.indicatorId === ind.id
            );
            if (assignment) {
              const technician = technicians.find(
                (t) => t.id === assignment.technicianId
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
    standardId?: string | null
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
    standardId: string | null
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
        standardId
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

  // Handle update note (for single indicator from modal)
  const handleUpdateNote = async (indicatorId: string, note: string | null) => {
    try {
      const updatedIndicator = await laboratoryTaskService.updateIndicatorNote(
        indicatorId,
        note
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
    sampleId: string
  ) => {
    const sample = sampleList.find((s) => s.sampleId === sampleId);
    const allIds = sample?.indicators.map((i) => i.id) || [];

    // Lấy indicator hiện tại để auto-fill dữ liệu
    const currentIndicator = sample?.indicators.find(
      (i) => i.id === indicatorId
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
      selectedIds.includes(i.id)
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
    technicianId: string
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
    const technicianName =
      technician?.displayName || technician?.userName || "KTV";
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
        "Không có chỉ tiêu nào đủ điều kiện duyệt (Chờ phê duyệt)"
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
      const ids = selectedIndicators[rejectingSampleId] || [];

      // Filter only indicators with Entered or Rejected status
      const sample = sampleList.find((s) => s.sampleId === rejectingSampleId);
      const validIds = ids.filter((id) => {
        const ind = sample?.indicators.find((i) => i.id === id);
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
        approve: false,
        rejectionReason: values.reason,
        standardIds: standardIdsMap,
      });

      // Optimistic update: cập nhật indicators ngay lập tức
      updateIndicatorsOptimistically(validIds, {
        approvalStatus: IndicatorApprovalStatus.Rejected,
        rejectionReason: values.reason,
      });

      // Reload full data from server (avoid duplicating BE logic for task status)
      await reloadData();

      message.success(`Đã từ chối ${validIds.length} chỉ tiêu`);
      // Xóa standard selections cho các indicator đã xử lý
      setStandardSelections((prev) => {
        const newSelections = { ...prev };
        validIds.forEach((id) => delete newSelections[id]);
        return newSelections;
      });
      setSelectedIndicators((prev) => ({ ...prev, [rejectingSampleId]: [] }));
      setRejectModalOpen(false);
      setRejectingSampleId(null);
      rejectForm.resetFields();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      console.error("Failed to bulk reject:", error);
      message.error(getApiErrorMessage(error, "Không thể từ chối chỉ tiêu"));
      // Reload để sync lại với server nếu có lỗi
      await loadTask();
    } finally {
      setActionLoading(false);
    }
  };

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
              sampleId
            );
            setSampleImages((prev) => ({
              ...prev,
              [sampleId]: {
                sampleAttachments: [],
                beforeTesting: images.filter(
                  (i) => i.imageType === SampleTestingImageType.BeforeTesting
                ),
                afterTesting: images.filter(
                  (i) => i.imageType === SampleTestingImageType.AfterTesting
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
    images: SampleTestingImageDto[]
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
    images: SampleTestingImageDto[]
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

  // Check if task is in completed phase (Approved, Rejected, SentToQuality, TestingRejected)
  // During this phase, cannot assign/edit
  const isCompletedPhase =
    task?.status === LaboratoryTaskStatus.Approved ||
    task?.status === LaboratoryTaskStatus.Rejected ||
    task?.status === LaboratoryTaskStatus.SentToQuality ||
    task?.status === LaboratoryTaskStatus.TestingRejected;

  // Check if can assign technician to indicators
  // Allowed when: PartialAccepted, FullyAccepted, Assigned, InProgress, WaitingApproval
  // NOT allowed when: UnderEvaluation, WaitingCustomerResponse, Approved, Rejected, SentToQuality, TestingRejected
  const canAssignToIndicator =
    !isInEvaluationPhase && !isCompletedPhase && canAssignTesting;

  // Check if can upload images (same logic as canEditTask)
  // Allow upload during: Assigned, InProgress, WaitingApproval
  const canUploadImages =
    !isInEvaluationPhase &&
    (task?.status === LaboratoryTaskStatus.Assigned ||
      task?.status === LaboratoryTaskStatus.InProgress ||
      task?.status === LaboratoryTaskStatus.WaitingApproval);

  // Get status tag
  const getStatusTag = (status: LaboratoryTaskStatus) => {
    return (
      <StatusTag color={LaboratoryTaskStatusColors[status]}>
        {LaboratoryTaskStatusLabels[status]}
      </StatusTag>
    );
  };

  // Get sample status tag for display
  // Note: 'assigned' is displayed as 'notStarted' (Chưa thực hiện) per customer requirement
  // Customer only wants 5 statuses: Chưa thực hiện, Đang thử nghiệm, Chờ phê duyệt, Đã duyệt, Từ chối
  const getSampleStatusTag = (status: SampleStatus) => {
    const displayStatus = status === "assigned" ? "notStarted" : status;
    return (
      <StatusTag color={SampleStatusColors[displayStatus]}>
        {SampleStatusLabels[displayStatus]}
      </StatusTag>
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

  // Generate Collapse items
  const collapseItems = sampleList.map((sample) => {
    const selectedCount = getSampleSelectedCount(sample.sampleId);
    const sampleImagesData = sampleImages[sample.sampleId];

    return {
      key: sample.sampleId,
      label: (
        <Row justify="space-between" align="middle" style={{ width: "100%" }}>
          <Col>
            <Space>
              <Tag color="blue">{sample.sampleCode}</Tag>
              <Text type="secondary">({sample.indicatorCount} chỉ tiêu)</Text>
              {getSampleStatusTag(sample.sampleStatus)}
            </Space>
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
                      disabled={selectedCount === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        openRejectModal(sample.sampleId);
                      }}
                    >
                      Từ chối{selectedCount > 0 ? ` (${selectedCount})` : ""}
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      loading={actionLoading}
                      disabled={selectedCount === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBulkApprove(sample.sampleId);
                      }}
                    >
                      Duyệt{selectedCount > 0 ? ` (${selectedCount})` : ""}
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
                                value
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
              {/* Bulk note button - show when has selected indicators (không phụ thuộc task status) */}
              {selectedCount > 0 && !sample.isApproved && (
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
            onTechnicianChange={handleTechnicianChange}
            onApprove={handleApprove}
            onUpdateNote={handleUpdateNote}
            onOpenNoteModal={handleOpenNoteModal}
            loading={actionLoading}
            showCheckbox={true}
            selectedIndicatorIds={selectedIndicators[sample.sampleId] || []}
            onSelectionChange={(ids) =>
              handleSelectionChange(sample.sampleId, ids)
            }
            standardSelections={standardSelections}
            onStandardChange={handleStandardChange}
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
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(PATH_ROUTES.tasks.index)}
        >
          Quay lại
        </Button>
      </div>

      {/* Header Card */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Số nhận mẫu giao việc
            </Title>
          </Col>
          <Col>
            <Space>
              {/* Button "Thêm người hỗ trợ" - chỉ hiển thị cho QLKT (có quyền addSupporter) hoặc là QLKT của task này */}
              {canManageSupporters && (
                <Button
                  icon={<TeamOutlined />}
                  onClick={() => setSupporterModalOpen(true)}
                >
                  Thêm người hỗ trợ
                  {task.supporters && task.supporters.length > 0 && (
                    <span style={{ marginLeft: 4 }}>
                      ({task.supporters.length})
                    </span>
                  )}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
        <div style={{ marginTop: 12 }}>
          <Space split={<Divider type="vertical" />}>
            <Text>
              Số hợp đồng: <Text strong>{task.contractNumber || "-"}</Text>
            </Text>
            <Text>
              Khoa phòng: <Text strong>{task.laboratoryName || "-"}</Text>
            </Text>
            <Text>
              QLKT: <Text strong>{task.technicalManagerName || "-"}</Text>
            </Text>
            {getStatusTag(task.status)}
          </Space>
        </div>
        <div style={{ marginTop: 8 }}>
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary">
              Ngày gửi KP: {formatDate(task.transferDate)}
            </Text>
            <Text type="secondary">
              Ngày YC xong: {formatDate(task.requestCompletionDate)}
            </Text>
            <Text type="secondary">
              Ngày TN: {task.testDate ? formatDate(task.testDate) : "Chưa đặt"}
            </Text>
          </Space>
        </div>
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

      {/* Tabs for Evaluation and Sample List */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "evaluation",
              label: `Đánh giá chỉ tiêu (${task.indicators?.length || 0})`,
              children: (
                <>
                  {/* Alert based on task status */}
                  {task.status === LaboratoryTaskStatus.UnderEvaluation ||
                  task.status ===
                    LaboratoryTaskStatus.WaitingCustomerResponse ? (
                    <Alert
                      message={
                        task.status ===
                        LaboratoryTaskStatus.WaitingCustomerResponse
                          ? "Chờ khách hàng xác nhận"
                          : "Chế độ đánh giá thử nghiệm"
                      }
                      description={
                        task.status ===
                        LaboratoryTaskStatus.WaitingCustomerResponse
                          ? "Có chỉ tiêu đang chờ KH xác nhận (đổi PP hoặc từ chối TN). QLKT vẫn có thể đánh giá các chỉ tiêu Pending còn lại."
                          : "QLKT đánh giá từng chỉ tiêu: Chấp nhận, Yêu cầu đổi phương pháp, hoặc Từ chối thử nghiệm."
                      }
                      type={
                        task.status ===
                        LaboratoryTaskStatus.WaitingCustomerResponse
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
                      canApproveResult &&
                      (task.status === LaboratoryTaskStatus.UnderEvaluation ||
                        task.status ===
                          LaboratoryTaskStatus.WaitingCustomerResponse)
                    }
                    loading={loading}
                    onEvaluationComplete={reloadData}
                  />
                </>
              ),
            },
            {
              key: "samples",
              label: `Danh sách mẫu (${sampleList.length})`,
              children: (
                <Collapse
                  defaultActiveKey={sampleList.map((s) => s.sampleId)}
                  expandIcon={({ isActive }) => (
                    <CaretRightOutlined rotate={isActive ? 90 : 0} />
                  )}
                  items={collapseItems}
                />
              ),
            },
          ]}
        />
      </Card>

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
