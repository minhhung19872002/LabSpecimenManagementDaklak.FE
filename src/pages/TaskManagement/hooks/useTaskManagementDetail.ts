import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Modal } from "antd";
import {
  useGetLaboratoryTaskQuery,
  useGetMethodsByIndicatorQuery,
  useGetTechniciansByLaboratoryQuery,
  useAssignSampleIndicatorsMutation,
  useApproveIndicatorMutation,
  useSendResultsMutation,
} from "../../../store/api/laboratoryTaskApi";
import {
  LaboratoryTaskStatus,
  LaboratoryTaskIndicatorDto,
  AssignIndicatorInput,
} from "../../../types/laboratoryTask";
import { groupBy, buildSampleList } from "../utils/taskHelpers";

export const useTaskManagementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for collapse panels
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  // Local state for indicator changes (before saving)
  const [indicatorChanges, setIndicatorChanges] = useState<
    Record<string, Partial<LaboratoryTaskIndicatorDto>>
  >({});

  // RTK Query hooks
  const {
    data: task,
    isLoading: loading,
    isFetching,
  } = useGetLaboratoryTaskQuery(id!, { skip: !id });

  // Get first indicator ID for method lookup
  const firstIndicatorId = task?.indicators?.[0]?.indicatorId || "";

  const { data: methods = [] } = useGetMethodsByIndicatorQuery(firstIndicatorId, {
    skip: !firstIndicatorId,
  });

  const { data: technicians = [] } = useGetTechniciansByLaboratoryQuery(
    task?.laboratoryId,
    { skip: !task?.laboratoryId }
  );

  // Mutations
  const [assignSampleIndicators, { isLoading: isAssigning }] =
    useAssignSampleIndicatorsMutation();
  const [approveIndicator, { isLoading: isApproving }] =
    useApproveIndicatorMutation();
  const [sendResults, { isLoading: isSending }] = useSendResultsMutation();

  const actionLoading = isAssigning || isApproving || isSending || isFetching;

  // Group indicators by sample
  const indicatorsBySample = useMemo(() => {
    if (!task?.indicators) return {};
    return groupBy(task.indicators, "sampleId");
  }, [task]);

  // Get sample list for collapse panels
  const sampleList = useMemo(() => {
    return buildSampleList(indicatorsBySample, indicatorChanges);
  }, [indicatorsBySample, indicatorChanges]);

  // Check if ALL samples are approved → enable "Gửi kết quả"
  const allSamplesApproved = useMemo(() => {
    return sampleList.length > 0 && sampleList.every((s) => s.isApproved);
  }, [sampleList]);

  // Can edit task (only when NotAssignedMethod or AssignedMethod)
  const canEditTask =
    task?.status === LaboratoryTaskStatus.NotAssignedMethod ||
    task?.status === LaboratoryTaskStatus.AssignedMethod;

  // Default expand all samples on load
  useEffect(() => {
    if (sampleList.length > 0 && activeKeys.length === 0) {
      setActiveKeys(sampleList.map((s) => s.sampleId));
    }
  }, [sampleList, activeKeys.length]);

  // Handlers
  const handleBack = () => navigate("/tasks");

  const handleMethodChange = (indicatorId: string, methodId: string) => {
    setIndicatorChanges((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        methodId,
      },
    }));
  };

  const handleTechnicianChange = (indicatorId: string, technicianId: string) => {
    setIndicatorChanges((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        technicianId,
      },
    }));
  };

  const handleAssignSample = async (sampleId: string) => {
    if (!task) return;

    const sample = sampleList.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    // Build assignments from local changes + server data
    const assignments: AssignIndicatorInput[] = sample.indicators.map((ind) => ({
      indicatorId: ind.id,
      methodId: indicatorChanges[ind.id]?.methodId || ind.methodId,
      technicianId: indicatorChanges[ind.id]?.technicianId || ind.technicianId,
    }));

    // Validate
    const invalid = assignments.some((a) => !a.methodId || !a.technicianId);
    if (invalid) {
      message.error(
        "Vui lòng chọn phương pháp và kỹ thuật viên cho tất cả chỉ tiêu"
      );
      return;
    }

    try {
      await assignSampleIndicators({
        taskId: task.id,
        sampleId,
        assignments,
      }).unwrap();
      message.success("Giao việc thành công");
      setIndicatorChanges({});
    } catch (error: any) {
      console.error("Failed to assign:", error);
      message.error(error.data?.error?.message || "Không thể giao việc");
    }
  };

  const handleApprove = async (
    indicatorId: string,
    approve: boolean,
    reason?: string
  ) => {
    try {
      await approveIndicator({
        indicatorId,
        input: {
          approve,
          rejectionReason: reason,
        },
      }).unwrap();
      message.success(approve ? "Đã duyệt kết quả" : "Đã từ chối kết quả");
    } catch (error: any) {
      console.error("Failed to approve:", error);
      message.error(error.data?.error?.message || "Không thể xử lý phê duyệt");
    }
  };

  const handleSendResults = async () => {
    if (!task) return;

    Modal.confirm({
      title: "Xác nhận gửi kết quả",
      content:
        "Bạn có chắc chắn muốn gửi kết quả? Sau khi gửi sẽ không thể chỉnh sửa.",
      okText: "Gửi kết quả",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          await sendResults(task.id).unwrap();
          message.success("Đã gửi kết quả thành công");
        } catch (error: any) {
          console.error("Failed to send results:", error);
          message.error(error.data?.error?.message || "Không thể gửi kết quả");
        }
      },
    });
  };

  return {
    // Data
    task,
    loading,
    actionLoading,
    methods,
    technicians,
    sampleList,
    allSamplesApproved,
    canEditTask,

    // Collapse state
    activeKeys,
    setActiveKeys,

    // Handlers
    handleBack,
    handleMethodChange,
    handleTechnicianChange,
    handleAssignSample,
    handleApprove,
    handleSendResults,
  };
};
