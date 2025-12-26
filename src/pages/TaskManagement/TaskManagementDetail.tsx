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
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { laboratoryTaskService } from "../../services/laboratoryTaskService";
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
import IndicatorTable from "./components/IndicatorTable";
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
    const samples = Object.entries(indicatorsBySample).map(([sampleId, indicators]) => {
      // Merge local changes with server data for display
      const mergedIndicators = indicators.map((ind) => ({
        ...ind,
        ...indicatorChanges[ind.id],
      }));

      // Filter out CustomerCancelled indicators for status calculation
      const activeIndicators = indicators.filter(
        (i) => i.approvalStatus !== IndicatorApprovalStatus.CustomerCancelled
      );

      // Compute sample status từ SERVER DATA (không dùng local changes)
      // Để button "Giao việc" chỉ ẩn khi đã lưu xuống DB
      const allApproved = activeIndicators.length > 0 && activeIndicators.every(
        (i) => i.approvalStatus === IndicatorApprovalStatus.Approved
      );
      const allEntered = activeIndicators.length > 0 && activeIndicators.every(
        (i) => i.approvalStatus >= IndicatorApprovalStatus.Entered
      );
      // Chỉ check server data cho allAssigned
      const allAssigned = activeIndicators.length > 0 && activeIndicators.every((i) => i.methodId && i.technicianId);
      const hasAnyResult = activeIndicators.some((i) => i.result);

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

    setActionLoading(true);
    try {
      await laboratoryTaskService.assignSampleIndicators(
        task.id,
        sampleId,
        assignments
      );
      message.success("Giao việc thành công");
      setIndicatorChanges({});
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

  const handleApprove = async (
    indicatorId: string,
    approve: boolean,
    reason?: string
  ) => {
    setActionLoading(true);
    try {
      await laboratoryTaskService.approveIndicator(indicatorId, {
        approve,
        rejectionReason: reason,
      });
      message.success(approve ? "Đã duyệt kết quả" : "Đã từ chối kết quả");
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
        setActionLoading(true);
        try {
          await laboratoryTaskService.sendResults(task.id);
          message.success("Đã gửi kết quả thành công");
          await loadTask();
        } catch (error: any) {
          console.error("Failed to send results:", error);
          message.error(
            error.response?.data?.error?.message || "Không thể gửi kết quả"
          );
        } finally {
          setActionLoading(false);
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

  // Kiểm tra có thể chỉnh sửa task không
  // Cho phép khi: Chưa gán KTV, Đã gán KTV, hoặc QLCL từ chối (cần xem xét lại)
  const canEditTask =
    task?.status === LaboratoryTaskStatus.NotAssignedTechnician ||
    task?.status === LaboratoryTaskStatus.AssignedTechnician ||
    task?.status === LaboratoryTaskStatus.ResultRejected;

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
          {canEditTask && !sample.isApproved && (
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
          <Button type="link" onClick={() => navigate(PATH_ROUTES.tasks.index)}>
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
                onClick={() => navigate(PATH_ROUTES.tasks.index)}
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
                task.status === LaboratoryTaskStatus.ResultSent ||
                task.status === LaboratoryTaskStatus.ResultRejected
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

      {/* Alert khi QLCL từ chối kết quả */}
      {task.status === LaboratoryTaskStatus.ResultRejected && (
        <Alert
          message="Kết quả bị từ chối"
          description={
            <>
              <div>Quản lý Chất lượng đã từ chối kết quả và trả lại cho Quản lý Kỹ thuật xem xét.</div>
              {task.resultRejectionReason && (
                <div style={{ marginTop: 8 }}>
                  <strong>Lý do:</strong> {task.resultRejectionReason}
                </div>
              )}
            </>
          }
          type="error"
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
    </div>
  );
};

export default TaskManagementDetail;
