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
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  CaretRightOutlined,
  TeamOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
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
import { ROLES } from "../../constants/roles";
import IndicatorTable from "./components/IndicatorTable";
import SupporterModal from "./components/SupporterModal";
import SampleImagesDisplay from "./components/SampleImagesDisplay";
import SendToQualityModal from "./components/SendToQualityModal";
import { PATH_ROUTES } from "../../constants";

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
  const [methods, setMethods] = useState<MethodLookupDto[]>([]);
  const [technicians, setTechnicians] = useState<UserLookupDto[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
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

  // Send to quality modal state
  const [sendToQualityModalOpen, setSendToQualityModalOpen] = useState(false);

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    try {
      const userInfoStr = localStorage.getItem("user_info");
      if (!userInfoStr) return false;
      const userInfo = JSON.parse(userInfoStr);
      const roles = userInfo.roles || [];
      return roles.includes(ROLES.ADMIN);
    } catch {
      return false;
    }
  }, []);

  // Check if current user can manage supporters (QLKT or Admin)
  const canManageSupporters = useMemo(() => {
    return isAdmin || (task?.isCurrentUserTechnicalManager ?? false);
  }, [isAdmin, task?.isCurrentUserTechnicalManager]);

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
          laboratoryTaskService.getTechniciansByLaboratory(data.laboratoryId),
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

  useEffect(() => {
    loadTask();
  }, [loadTask]);

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

        // Compute sample status từ SERVER DATA
        // Logic:
        // - Chưa giao việc (notStarted): Chưa có methodId hoặc technicianId
        // - Đã giao việc (assigned): Tất cả indicators đều có methodId + technicianId, nhưng chưa có testDate
        // - Đang thử nghiệm (testing): Có ít nhất 1 indicator có testDate (KTV đã check-in)
        // - Chờ phê duyệt (pendingApproval): Có ít nhất 1 indicator status = Entered
        // - Đã duyệt (approved): Tất cả indicators đã được duyệt
        // - Từ chối (rejected): Có indicator bị từ chối và KTV chưa thực hiện lại

        const allApproved =
          activeIndicators.length > 0 &&
          activeIndicators.every(
            (i) => i.approvalStatus === IndicatorApprovalStatus.Approved
          );

        // Kiểm tra đã giao việc chưa: tất cả indicators đều có methodId và technicianId
        const allAssigned =
          activeIndicators.length > 0 &&
          activeIndicators.every((i) => i.methodId && i.technicianId);

        // Có indicator đang thử nghiệm: có testDate (KTV đã check-in)
        const hasTesting = activeIndicators.some(
          (i) =>
            i.testDate && i.approvalStatus === IndicatorApprovalStatus.Pending
        );

        // Có indicator chờ phê duyệt (Entered)
        const hasEntered = activeIndicators.some(
          (i) => i.approvalStatus === IndicatorApprovalStatus.Entered
        );

        // Có indicator bị từ chối
        const hasRejected = activeIndicators.some(
          (i) => i.approvalStatus === IndicatorApprovalStatus.Rejected
        );

        let sampleStatus: SampleStatus;
        if (allApproved) {
          // Tất cả chỉ tiêu đã được duyệt
          sampleStatus = "approved";
        } else if (hasRejected && !hasTesting) {
          // Có chỉ tiêu bị từ chối và KTV chưa check-in lại
          sampleStatus = "rejected";
        } else if (hasEntered) {
          // Có ít nhất 1 chỉ tiêu chờ phê duyệt
          sampleStatus = "pendingApproval";
        } else if (hasTesting) {
          // Có ít nhất 1 chỉ tiêu đang thử nghiệm (KTV đã check-in)
          sampleStatus = "testing";
        } else if (allAssigned) {
          // Tất cả đã được giao việc nhưng KTV chưa check-in
          sampleStatus = "assigned";
        } else {
          // Chưa giao việc (chưa có methodId hoặc technicianId)
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

  // Check if there are any approved indicators that haven't been sent to quality yet
  const hasUnsentApprovedIndicators = useMemo(() => {
    if (!task?.indicators) return false;
    return task.indicators.some(
      (ind) =>
        ind.approvalStatus === IndicatorApprovalStatus.Approved &&
        !ind.isSentToQuality
    );
  }, [task]);

  // Default expand all samples on load
  useEffect(() => {
    if (sampleList.length > 0 && activeKeys.length === 0) {
      setActiveKeys(sampleList.map((s) => s.sampleId));
    }
  }, [sampleList, activeKeys.length]);

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
        errorMsg = `Chỉ tiêu chưa chọn KTV: ${missingTechnician.join(", ")}`;
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
      message.success("Giao việc thành công");
      setIndicatorChanges({});
      // Clear selection after successful assignment
      setSelectedIndicators((prev) => ({ ...prev, [sampleId]: [] }));
      await loadTask();
    } catch (error: any) {
      console.error("Failed to assign:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể giao việc"
      );
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
      message.success(approve ? "Đã duyệt kết quả" : "Đã từ chối kết quả");
      // Xóa standard selection đã lưu cho indicator này
      setStandardSelections((prev) => {
        const newSelections = { ...prev };
        delete newSelections[indicatorId];
        return newSelections;
      });
      await loadTask();
    } catch (error: any) {
      console.error("Failed to approve:", error);
      message.error(
        error.response?.data?.error?.message || "Không thể xử lý phê duyệt"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle standard change - chỉ lưu vào local state
  const handleStandardChange = (
    indicatorId: string,
    standardId: string | null
  ) => {
    setStandardSelections((prev) => ({
      ...prev,
      [indicatorId]: standardId,
    }));
  };

  const handleSendResults = () => {
    if (!task) return;
    setSendToQualityModalOpen(true);
  };

  // Handle selection change for bulk operations
  const handleSelectionChange = (sampleId: string, ids: string[]) => {
    setSelectedIndicators((prev) => ({
      ...prev,
      [sampleId]: ids,
    }));
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
      message.success(`Đã duyệt ${validIds.length} chỉ tiêu`);
      // Xóa standard selections cho các indicator đã xử lý
      setStandardSelections((prev) => {
        const newSelections = { ...prev };
        validIds.forEach((id) => delete newSelections[id]);
        return newSelections;
      });
      setSelectedIndicators((prev) => ({ ...prev, [sampleId]: [] }));
      await loadTask();
    } catch (error: any) {
      console.error("Failed to bulk approve:", error);
      const errorMsg =
        error.response?.data?.general?.[0] ||
        error.response?.data?.error?.message ||
        "Không thể duyệt chỉ tiêu";
      message.error(errorMsg);
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
      await loadTask();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      console.error("Failed to bulk reject:", error);
      const errorMsg =
        error.response?.data?.general?.[0] ||
        error.response?.data?.error?.message ||
        "Không thể từ chối chỉ tiêu";
      message.error(errorMsg);
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

  // Check if can upload images (same logic as canEditTask)
  const canUploadImages =
    task?.status === LaboratoryTaskStatus.NotAssigned ||
    task?.status === LaboratoryTaskStatus.Assigned ||
    task?.status === LaboratoryTaskStatus.Testing ||
    task?.status === LaboratoryTaskStatus.PendingApproval;

  // Get status tag
  const getStatusTag = (status: LaboratoryTaskStatus) => {
    return (
      <Tag color={LaboratoryTaskStatusColors[status]}>
        {LaboratoryTaskStatusLabels[status]}
      </Tag>
    );
  };

  // Get sample status tag for display
  // Note: 'assigned' is displayed as 'notStarted' (Chưa thực hiện) per customer requirement
  // Customer only wants 5 statuses: Chưa thực hiện, Đang thử nghiệm, Chờ phê duyệt, Đã duyệt, Từ chối
  const getSampleStatusTag = (status: SampleStatus) => {
    const displayStatus = status === "assigned" ? "notStarted" : status;
    return (
      <Tag color={SampleStatusColors[displayStatus]}>
        {SampleStatusLabels[displayStatus]}
      </Tag>
    );
  };

  // Kiểm tra có thể chỉnh sửa task không
  // Cho phép khi: Chưa giao việc hoặc Đã giao việc
  const canEditTask =
    task?.status === LaboratoryTaskStatus.NotAssigned ||
    task?.status === LaboratoryTaskStatus.Assigned;

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
              <Text strong>{sample.sampleName}</Text>
              <Text type="secondary">({sample.indicatorCount} chỉ tiêu)</Text>
              {getSampleStatusTag(sample.sampleStatus)}
            </Space>
          </Col>
          <Col>
            <Space>
              {/* Bulk approve/reject buttons - only show when pendingApproval (có indicator chờ phê duyệt) */}
              {sample.sampleStatus === "pendingApproval" && (
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
              {/* Assign button - show when sample has notStarted indicators */}
              {/* Không phụ thuộc vào task status - vì có thể có sample chưa giao trong task đang Testing */}
              {sample.sampleStatus === "notStarted" && (
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
              {/* Re-assign button - show when assigned but not approved */}
              {sample.sampleStatus !== "notStarted" && !sample.isApproved && (
                <Button
                  size="small"
                  loading={actionLoading}
                  disabled={selectedCount === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssignSample(sample.sampleId);
                  }}
                >
                  Giao việc lại{selectedCount > 0 ? ` (${selectedCount})` : ""}
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
            sampleStatus={sample.sampleStatus}
            onMethodChange={handleMethodChange}
            onTechnicianChange={handleTechnicianChange}
            onApprove={handleApprove}
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
              {/* Button "Thêm người hỗ trợ" - chỉ hiển thị cho QLKT hoặc Admin */}
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
              <Button
                type="primary"
                icon={<SendOutlined />}
                disabled={!hasUnsentApprovedIndicators}
                loading={actionLoading}
                onClick={handleSendResults}
              >
                Gửi kết quả
              </Button>
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
              Ngày gửi KP:{" "}
              {formatDate(task.transferDate)}
            </Text>
            <Text type="secondary">
              Ngày YC xong:{" "}
              {formatDate(task.requestCompletionDate)}
            </Text>
            <Text type="secondary">
              Ngày TN:{" "}
              {task.testDate
                ? formatDate(task.testDate)
                : "Chưa đặt"}
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

      {/* Collapsible Sample Panels */}
      <Card title={`Danh sách mẫu (${sampleList.length})`}>
        <Collapse
          activeKey={activeKeys}
          onChange={(keys) => setActiveKeys(keys as string[])}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          )}
          items={collapseItems}
        />
      </Card>

      {/* Supporter Modal */}
      <SupporterModal
        open={supporterModalOpen}
        onClose={() => setSupporterModalOpen(false)}
        taskId={task.id}
        currentSupporters={task.supporters || []}
        onSuccess={loadTask}
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

      {/* Send to Quality Modal */}
      <SendToQualityModal
        open={sendToQualityModalOpen}
        onClose={() => setSendToQualityModalOpen(false)}
        taskId={task.id}
        indicators={task.indicators || []}
        onSuccess={loadTask}
      />

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
                <Text strong>{item.indicatorName}</Text>
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
