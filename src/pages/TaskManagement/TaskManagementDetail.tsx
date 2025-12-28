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
import dayjs from "dayjs";
import { laboratoryTaskService } from "../../services/laboratoryTaskService";
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

  // Check if there are any approved indicators to send
  const hasApprovedIndicators = useMemo(() => {
    if (!task?.indicators) return false;
    return task.indicators.some(
      (ind) => ind.approvalStatus === IndicatorApprovalStatus.Approved
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
      await laboratoryTaskService.bulkApproveIndicators(task.id, {
        indicatorIds: validIds,
        approve: true,
      });
      message.success(`Đã duyệt ${validIds.length} chỉ tiêu`);
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
      await laboratoryTaskService.bulkApproveIndicators(task.id, {
        indicatorIds: validIds,
        approve: false,
        rejectionReason: values.reason,
      });
      message.success(`Đã từ chối ${validIds.length} chỉ tiêu`);
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
              {/* Assign button - only show when notStarted */}
              {canEditTask && sample.sampleStatus === "notStarted" && (
                <Button
                  type="primary"
                  size="small"
                  loading={actionLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssignSample(sample.sampleId);
                  }}
                >
                  Giao việc
                </Button>
              )}
              {/* Re-assign button - show when assigned but not approved */}
              {canEditTask &&
                sample.sampleStatus !== "notStarted" &&
                !sample.isApproved && (
                  <Button
                    size="small"
                    loading={actionLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignSample(sample.sampleId);
                    }}
                  >
                    Giao việc lại
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
            onMethodChange={handleMethodChange}
            onTechnicianChange={handleTechnicianChange}
            onApprove={handleApprove}
            loading={actionLoading}
            showCheckbox={true}
            selectedIndicatorIds={selectedIndicators[sample.sampleId] || []}
            onSelectionChange={(ids) =>
              handleSelectionChange(sample.sampleId, ids)
            }
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
              Số nhận mẫu giao việc: {task.testRequestNumber}
            </Title>
          </Col>
          <Col>
            <Space>
              {/* Button "Thêm người hỗ trợ" */}
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
              <Button
                type="primary"
                icon={<SendOutlined />}
                disabled={
                  !hasApprovedIndicators ||
                  task.status === LaboratoryTaskStatus.SentToQuality
                }
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
    </div>
  );
};

export default TaskManagementDetail;
