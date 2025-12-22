import React, { useState, useEffect, useMemo } from "react";
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
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useGetLaboratoryTaskQuery,
  useGetMethodsByIndicatorQuery,
  useGetTechniciansByLaboratoryQuery,
  useAssignSampleIndicatorsMutation,
  useApproveIndicatorMutation,
  useSendResultsMutation,
} from "../../store/api/laboratoryTaskApi";
import {
  LaboratoryTaskStatus,
  LaboratoryTaskStatusLabels,
  LaboratoryTaskStatusColors,
  LaboratoryTaskIndicatorDto,
  IndicatorApprovalStatus,
  SampleInfo,
  SampleStatus,
  SampleStatusLabels,
  SampleStatusColors,
  AssignIndicatorInput,
} from "../../types/laboratoryTask";
import IndicatorTable from "./components/IndicatorTable";

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

  // Get sample list for collapse panels với computed status
  const sampleList = useMemo<SampleInfo[]>(() => {
    const samples = Object.entries(indicatorsBySample).map(([sampleId, indicators]) => {
      // Merge local changes with server data for display
      const mergedIndicators = indicators.map((ind) => ({
        ...ind,
        ...indicatorChanges[ind.id],
      }));

      // Compute sample status từ SERVER DATA (không dùng local changes)
      // Để button "Giao việc" chỉ ẩn khi đã lưu xuống DB
      const allApproved = indicators.every(
        (i) => i.approvalStatus === IndicatorApprovalStatus.Approved
      );
      const allEntered = indicators.every(
        (i) => i.approvalStatus >= IndicatorApprovalStatus.Entered
      );
      // Chỉ check server data cho allAssigned
      const allAssigned = indicators.every((i) => i.methodId && i.technicianId);
      const hasAnyResult = indicators.some((i) => i.result);

      let sampleStatus: SampleStatus;
      if (allApproved) {
        sampleStatus = "approved";
      } else if (allEntered) {
        sampleStatus = "pendingApproval";
      } else if (hasAnyResult) {
        sampleStatus = "testing";
      } else if (allAssigned) {
        sampleStatus = "assigned";
      } else {
        sampleStatus = "pending";
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
    });

    // Sort theo sampleId để cố định vị trí
    return samples.sort((a, b) => a.sampleId.localeCompare(b.sampleId));
  }, [indicatorsBySample, indicatorChanges]);

  // Check if ALL samples are approved → enable "Gửi kết quả"
  const allSamplesApproved = useMemo(() => {
    return sampleList.length > 0 && sampleList.every((s) => s.isApproved);
  }, [sampleList]);

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

  const handleAssignSample = async (sampleId: string) => {
    if (!task) return;

    const sample = sampleList.find((s) => s.sampleId === sampleId);
    if (!sample) return;

    // Build assignments from local changes + server data
    const assignments: AssignIndicatorInput[] = sample.indicators.map(
      (ind) => ({
        indicatorId: ind.id,
        methodId: indicatorChanges[ind.id]?.methodId || ind.methodId,
        technicianId:
          indicatorChanges[ind.id]?.technicianId || ind.technicianId,
      })
    );

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
      message.error(
        error.data?.error?.message || "Không thể giao việc"
      );
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
      message.error(
        error.data?.error?.message || "Không thể xử lý phê duyệt"
      );
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
          message.error(
            error.data?.error?.message || "Không thể gửi kết quả"
          );
        }
      },
    });
  };

  // Get status tag
  const getStatusTag = (status: LaboratoryTaskStatus) => {
    return (
      <Tag color={LaboratoryTaskStatusColors[status]}>
        {LaboratoryTaskStatusLabels[status]}
      </Tag>
    );
  };

  // Get sample status tag
  const getSampleStatusTag = (status: SampleStatus) => {
    return (
      <Tag color={SampleStatusColors[status]}>{SampleStatusLabels[status]}</Tag>
    );
  };

  // Kiểm tra có thể chỉnh sửa task không (chỉ cho phép khi Chưa gắn PP hoặc Đã gán PP)
  const canEditTask =
    task?.status === LaboratoryTaskStatus.NotAssignedMethod ||
    task?.status === LaboratoryTaskStatus.AssignedMethod;

  // Generate Collapse items
  const collapseItems = sampleList.map((sample) => ({
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
          {canEditTask && (
            <Button
              type="primary"
              size="small"
              loading={actionLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleAssignSample(sample.sampleId);
              }}
            >
              {sample.sampleStatus === "pending" ? "Giao việc" : "Giao việc lại"}
            </Button>
          )}
        </Col>
      </Row>
    ),
    children: (
      <IndicatorTable
        indicators={sample.indicators}
        methods={methods}
        technicians={technicians}
        isAssigned={sample.sampleStatus !== "pending"}
        canEdit={canEditTask}
        onMethodChange={handleMethodChange}
        onTechnicianChange={handleTechnicianChange}
        onApprove={handleApprove}
        loading={actionLoading}
      />
    ),
  }));

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
          <Button type="link" onClick={() => navigate("/tasks")}>
            Quay lại danh sách
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Header Card */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/tasks")}
              >
                Quay lại
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Số nhận mẫu giao việc: {task.testRequestNumber}
              </Title>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={
                !allSamplesApproved ||
                task.status === LaboratoryTaskStatus.ResultSent
              }
              loading={actionLoading}
              onClick={handleSendResults}
            >
              Gửi kết quả
            </Button>
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
              Ngày chuyển:{" "}
              {task.transferDate
                ? dayjs(task.transferDate).format("DD/MM/YYYY")
                : "-"}
            </Text>
            <Text type="secondary">
              Ngày YC xong:{" "}
              {task.requestCompletionDate
                ? dayjs(task.requestCompletionDate).format("DD/MM/YYYY")
                : "-"}
            </Text>
            <Text type="secondary">
              Ngày TN:{" "}
              {task.testDate
                ? dayjs(task.testDate).format("DD/MM/YYYY")
                : "Chưa đặt"}
            </Text>
          </Space>
        </div>
      </Card>

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
    </div>
  );
};

export default TaskManagementDetail;
