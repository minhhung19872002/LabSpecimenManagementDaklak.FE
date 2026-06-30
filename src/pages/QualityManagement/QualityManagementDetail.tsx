import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Spin,
  message,
  Row,
  Col,
  Alert,
  Tooltip,
  Checkbox,
  Select,
} from "antd";

import StatusTag from "../../components/common/StatusTag";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
} from "../../components/common/Icon";
import { qualityManagementService } from "../../services/qualityManagementService";
import { formatDate } from "../../utils/formatters";
import {
  QualityManagementTaskDto,
  QualityManagementIndicatorDto,
  QualityManagementStatus,
  QualityManagementStatusLabels,
  QualityManagementStatusColors,
  QualityTaskType,
  QualityIndicatorApprovalStatus,
} from "../../types/qualityManagement";
import { TestRequestStatus } from "../../types/testRequest";
import IndicatorTable from "./components/IndicatorTable";
import PrintModal from "./components/PrintModal";
import RejectModal from "./components/RejectModal";
import { PATH_ROUTES } from "../../constants";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";
import { ROLES } from "../../constants/roles";

import "../../styles/ListCard.css";
import "./QualityManagement.css";

const { Title, Text } = Typography;

const QualityManagementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Note: QualityManagement theo Permission Matrix chỉ có QLCL (A) và Admin (A)
  // Cả 2 đều có full quyền nên không cần check UI chi tiết
  // Route permission đã được config đúng trong permissions.ts

  // Check permissions
  const canApprove = authService.hasPermission(PERMISSIONS.TestResults.Approve);
  const canReject = authService.hasPermission(PERMISSIONS.TestResults.Reject);

  // QLKT không được xem tên khách hàng (đảm bảo duyệt khách quan)
  const isQLKT = authService.getUserRoles().includes(ROLES.LAB_TECHNICAL_MANAGER);

  // State
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<QualityManagementTaskDto | null>(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [indicatorFilter, setIndicatorFilter] = useState<string[]>([]);

  // Modals
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printMode, setPrintMode] = useState<"single" | "mixed">("single");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingIndicatorId, setRejectingIndicatorId] = useState<
    string | null
  >(null);
  const [bulkRejectModalVisible, setBulkRejectModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returningIndicatorId, setReturningIndicatorId] = useState<
    string | null
  >(null);

  // Action states
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkRejecting, setBulkRejecting] = useState(false);

  // Helper function to update indicators optimistically
  const updateIndicatorsOptimistically = useCallback(
    (
      indicatorIds: string[],
      updates: Partial<QualityManagementIndicatorDto>,
    ) => {
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

  // Load data
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await qualityManagementService.getFullDetail(id);
      setTask(result);
    } catch (error) {
      console.error("Error loading task:", error);
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reload full data from server (preserving UI states like selection)
  const reloadData = useCallback(async () => {
    if (!id) return;
    try {
      const result = await qualityManagementService.getFullDetail(id);
      setTask(result);
      // Note: selectedPendingIds is NOT reset
    } catch (error) {
      console.error("Failed to reload data:", error);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleBack = () => {
    navigate(PATH_ROUTES.qualityManagement.index);
  };

  const handleApproveIndicator = async (indicatorId: string) => {
    try {
      await qualityManagementService.approveIndicator(indicatorId);

      // Optimistic update: cập nhật approvalStatus thành Approved
      const now = new Date().toISOString();
      updateIndicatorsOptimistically([indicatorId], {
        approvalStatus: QualityIndicatorApprovalStatus.Approved,
        approvalDate: now,
      });

      // Reload full data from server (avoid duplicating BE logic for task status)
      await reloadData();

      message.success("Đã duyệt chỉ tiêu");
    } catch (error) {
      console.error("Error approving indicator:", error);
      message.error("Không thể duyệt chỉ tiêu");
      // Reload để sync lại với server nếu có lỗi
      await loadData();
    }
  };

  const handleRejectIndicator = (indicatorId: string) => {
    setRejectingIndicatorId(indicatorId);
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingIndicatorId) return;
    try {
      await qualityManagementService.rejectIndicator(
        rejectingIndicatorId,
        reason,
      );

      // Optimistic update: cập nhật approvalStatus thành Rejected
      updateIndicatorsOptimistically([rejectingIndicatorId], {
        approvalStatus: QualityIndicatorApprovalStatus.Rejected,
        rejectionReason: reason,
      });

      // Reload full data from server (avoid duplicating BE logic for task status)
      await reloadData();

      message.success("Đã từ chối chỉ tiêu");
      setRejectModalVisible(false);
      setRejectingIndicatorId(null);
    } catch (error) {
      console.error("Error rejecting indicator:", error);
      // Reload để sync lại với server nếu có lỗi
      await loadData();
      throw error;
    }
  };

  const handleReturnResult = (indicatorId: string) => {
    setReturningIndicatorId(indicatorId);
    setReturnModalVisible(true);
  };

  const handleReturnConfirm = async (reason: string) => {
    if (!returningIndicatorId) return;
    try {
      await qualityManagementService.rejectIndicator(
        returningIndicatorId,
        reason,
      );

      // Optimistic update: cập nhật approvalStatus thành Rejected
      updateIndicatorsOptimistically([returningIndicatorId], {
        approvalStatus: QualityIndicatorApprovalStatus.Rejected,
        rejectionReason: reason,
      });

      // Reload full data from server (avoid duplicating BE logic for task status)
      await reloadData();

      message.success("Đã trả lại kết quả");
      setReturnModalVisible(false);
      setReturningIndicatorId(null);
    } catch (error) {
      console.error("Error returning indicator result:", error);
      // Reload để sync lại với server nếu có lỗi
      await loadData();
      throw error;
    }
  };

  // Bulk approve handlers
  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để duyệt");
      return;
    }
    setBulkApproving(true);
    try {
      const result =
        await qualityManagementService.bulkApproveIndicators(
          selectedPendingIds,
        );

      // Optimistic update: cập nhật approvalStatus thành Approved cho tất cả
      const now = new Date().toISOString();
      updateIndicatorsOptimistically(selectedPendingIds, {
        approvalStatus: QualityIndicatorApprovalStatus.Approved,
        approvalDate: now,
      });

      // Reload full data from server (avoid duplicating BE logic for task status)
      await reloadData();

      if (result.successCount > 0) {
        message.success(`Đã duyệt ${result.successCount} chỉ tiêu`);
      }
      if (result.failedCount > 0) {
        message.warning(`${result.failedCount} chỉ tiêu không thể duyệt`);
      }
      setSelectedPendingIds([]);
    } catch (error) {
      console.error("Error bulk approving indicators:", error);
      message.error("Không thể duyệt chỉ tiêu");
      // Reload để sync lại với server nếu có lỗi
      await loadData();
    } finally {
      setBulkApproving(false);
    }
  };

  const handleBulkRejectClick = () => {
    if (selectedPendingIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để từ chối");
      return;
    }
    setBulkRejectModalVisible(true);
  };

  const handleBulkRejectConfirm = async (reason: string) => {
    setBulkRejecting(true);
    try {
      const result = await qualityManagementService.bulkRejectIndicators(
        selectedPendingIds,
        reason,
      );

      // Optimistic update: cập nhật approvalStatus thành Rejected cho tất cả
      updateIndicatorsOptimistically(selectedPendingIds, {
        approvalStatus: QualityIndicatorApprovalStatus.Rejected,
        rejectionReason: reason,
      });

      // Reload full data from server (avoid duplicating BE logic for task status)
      await reloadData();

      if (result.successCount > 0) {
        message.success(`Đã từ chối ${result.successCount} chỉ tiêu`);
      }
      if (result.failedCount > 0) {
        message.warning(`${result.failedCount} chỉ tiêu không thể từ chối`);
      }
      setBulkRejectModalVisible(false);
      setSelectedPendingIds([]);
    } catch (error) {
      console.error("Error bulk rejecting indicators:", error);
      // Reload để sync lại với server nếu có lỗi
      await loadData();
      throw error;
    } finally {
      setBulkRejecting(false);
    }
  };

  const handlePrintSingle = () => {
    setPrintMode("single");
    setPrintModalVisible(true);
  };

  const handlePrintMixed = () => {
    setPrintMode("mixed");
    setPrintModalVisible(true);
  };

  // Computed
  const qualityIndicators = task?.indicators || [];
  const displayIndicators =
    task?.allIndicators && task.allIndicators.length > 0
      ? task.allIndicators
      : qualityIndicators;

  const indicatorFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    qualityIndicators.forEach(ind => {
      if (ind.indicatorId && ind.indicatorName && !ind.parentIndicatorId && !seen.has(ind.indicatorId)) {
        seen.set(ind.indicatorId, ind.indicatorName);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [qualityIndicators]);

  const filteredDisplayIndicators = useMemo(() => {
    if (indicatorFilter.length === 0) return displayIndicators;
    return displayIndicators.filter(ind =>
      indicatorFilter.includes(ind.indicatorId) ||
      (ind.parentIndicatorId && indicatorFilter.includes(ind.parentIndicatorId))
    );
  }, [displayIndicators, indicatorFilter]);

  // Helper: check if an indicator is a parent with children in the list
  const isParentWithChildren = useCallback(
    (indicator: QualityManagementIndicatorDto): boolean => {
      if (indicator.parentIndicatorId) return false; // Đây là sub-indicator
      // Kiểm tra xem có sub-indicators nào có parentIndicatorId === indicator.indicatorId AND cùng methodId
      return qualityIndicators.some(
        (ind) =>
          ind.parentIndicatorId === indicator.indicatorId &&
          ind.methodId === indicator.methodId
      );
    },
    [qualityIndicators]
  );

  // Filter out parent indicators with children for counting
  const activeIndicators = qualityIndicators.filter((ind) => !isParentWithChildren(ind));

  const approvedCount = activeIndicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved,
  ).length;
  const pendingCount = activeIndicators.filter(
    (ind) =>
      ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval,
  ).length;
  const rejectedCount = activeIndicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Rejected,
  ).length;

  const allSelectablePendingIds = useMemo(() =>
    qualityIndicators
      .filter(ind =>
        !isParentWithChildren(ind) &&
        ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval &&
        ind.isInQualityScope &&
        (indicatorFilter.length === 0 ||
         indicatorFilter.includes(ind.indicatorId) ||
         (ind.parentIndicatorId && indicatorFilter.includes(ind.parentIndicatorId)))
      )
      .map(ind => ind.id),
    [qualityIndicators, isParentWithChildren, indicatorFilter]
  );

  const selectedSampleCount = useMemo(() => {
    const sampleIds = new Set(
      qualityIndicators
        .filter(ind => selectedPendingIds.includes(ind.id))
        .map(ind => ind.sampleId)
    );
    return sampleIds.size;
  }, [qualityIndicators, selectedPendingIds]);

  const isAllSelected = allSelectablePendingIds.length > 0 &&
    selectedPendingIds.length === allSelectablePendingIds.length;
  const isIndeterminate = selectedPendingIds.length > 0 &&
    selectedPendingIds.length < allSelectablePendingIds.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPendingIds([]);
    } else {
      setSelectedPendingIds(allSelectablePendingIds);
    }
  };

  // Check if test request is cancelled - disable all actions (except print)
  const isTestRequestCancelled = task?.testRequestStatus === TestRequestStatus.Cancelled;

  // Button states
  // In KQ: cho phép in nếu có ÍT NHẤT 1 chỉ tiêu đã được duyệt
  // (không cần quan tâm task.status - có thể vẫn đang PendingApproval nếu còn chỉ tiêu chưa duyệt)
  const canPrint = approvedCount > 0;

  // Status tag
  const getStatusTag = (status: QualityManagementStatus) => (
    <StatusTag
      color={QualityManagementStatusColors[status]}
      style={{ fontSize: 14, padding: "2px 10px" }}
    >
      {QualityManagementStatusLabels[status]}
    </StatusTag>
  );

  if (loading && !task) {
    return (
      <div className="page-wrapper" style={{ textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="page-wrapper">
        <Alert type="error" message="Không tìm thấy dữ liệu" showIcon />
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <Tooltip title="Quay lại">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          />
        </Tooltip>
      </div>

      <Card
        className="list-card quality-detail-card"
        title={
          <Space align="center">
            <SafetyCertificateOutlined />
            Quản lý chất lượng: {task.contractNumber}
            {getStatusTag(task.status)}
            {task.taskType === QualityTaskType.ChangeApproval && (
              <Tag color="orange">Phê duyệt thay đổi</Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrintSingle}
              disabled={!canPrint}
            >
              In KQ
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrintMixed}
              disabled={!canPrint}
            >
              In KQ Hỗn hợp
            </Button>
          </Space>
        }
      >
        {/* Task Info */}
        <Card
          size="small"
          style={{
            marginBottom: 16,
            background: "#FAFAFA",
            borderColor: "#D9D9D9",
          }}
        >
          <Title level={5} style={{ margin: "0 0 16px 0" }}>
            Thông tin hợp đồng
          </Title>
          <Row gutter={[48, 12]}>
            <Col xs={24} md={12}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {!isQLKT && (
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">Khách hàng:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{task.customerName || "-"}</Text>
                  </Col>
                </Row>
                )}
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">Tổng mẫu:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{task.totalSampleCount}</Text>
                  </Col>
                </Row>
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">Tổng chỉ tiêu:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{task.totalIndicatorCount}</Text>
                  </Col>
                </Row>
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">Khoa phòng:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{task.laboratoryNames || "-"}</Text>
                  </Col>
                </Row>
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">Ngày chuyển đi:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{formatDate(task.transferDate)}</Text>
                  </Col>
                </Row>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">Ngày YC xong:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{formatDate(task.requestCompletionDate)}</Text>
                  </Col>
                </Row>
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">Ngày giao BPGN:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{formatDate(task.handoverDate)}</Text>
                  </Col>
                </Row>
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">Người giao BPGN:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{task.handoverByUserName || "-"}</Text>
                  </Col>
                </Row>
                <Row>
                  <Col flex="150px">
                    <Text type="secondary">QLKT:</Text>
                  </Col>
                  <Col flex="auto">
                    <Text>{task.technicalManagerNames || "-"}</Text>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Alert khi phiếu yêu cầu đã bị hủy */}
        {isTestRequestCancelled && (
          <Alert
            message="Phiếu yêu cầu đã bị hủy"
            description="Phiếu yêu cầu đã bị hủy. Không thể thực hiện bất kỳ thao tác nào."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Bulk actions + alerts */}
        {task.taskType === QualityTaskType.ResultApproval && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 16px",
              boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
            }}
          >
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
                  setSelectedPendingIds([]);
                }}
                optionFilterProp="label"
                maxTagCount="responsive"
              />
            </div>
            <Row gutter={24} justify="space-between" align="middle">
              {allSelectablePendingIds.length > 0 && !isTestRequestCancelled && (
                <Col>
                  <div
                    onClick={handleSelectAll}
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                    >
                      Chọn tất cả  (Đã chọn {selectedSampleCount} mẫu - {selectedPendingIds.length} chỉ tiêu)
                    </Checkbox>
                  </div>
                </Col>
              )}
              <Col>
                <Space>
                  {canReject && !isTestRequestCancelled && (
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={handleBulkRejectClick}
                      loading={bulkRejecting}
                      disabled={selectedPendingIds.length === 0}
                    >
                      Từ chối{" "}
                      {selectedPendingIds.length > 0
                        ? `(${selectedPendingIds.length})`
                        : ""}
                    </Button>
                  )}
                  {canApprove && !isTestRequestCancelled && (
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={handleBulkApprove}
                      loading={bulkApproving}
                      disabled={selectedPendingIds.length === 0}
                    >
                      Duyệt{" "}
                      {selectedPendingIds.length > 0
                        ? `(${selectedPendingIds.length})`
                        : ""}
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
            {task.status === QualityManagementStatus.PendingPublish && (
              <Row style={{ marginTop: 8 }}>
                <Col>
                  <Alert
                    type="success"
                    message="Tất cả chỉ tiêu đã được duyệt - Chờ phát hành"
                    showIcon
                    icon={<CheckCircleOutlined />}
                    style={{ padding: "4px 12px" }}
                  />
                </Col>
              </Row>
            )}
            {task.status === QualityManagementStatus.HandedOver && (
              <Row style={{ marginTop: 8 }}>
                <Col>
                  <Alert
                    type="info"
                    message={`Đã giao BPGN${task.handoverNote ? ` - Ghi chú: ${task.handoverNote}` : ""}`}
                    showIcon
                    icon={<CheckCircleOutlined />}
                    style={{ padding: "4px 12px" }}
                  />
                </Col>
              </Row>
            )}
          </div>
        )}

        {/* Indicator Table (for ResultApproval tasks) */}
        {task.taskType === QualityTaskType.ResultApproval && (
          <Card
            size="small"
            className="quality-indicator-card"
            style={{ overflow: "hidden" }}
            title={
              <Space>
                <span>Danh sách chỉ tiêu</span>
                <StatusTag color="warning">
                  {pendingCount} Chờ duyệt
                </StatusTag>
                <StatusTag color="success">
                  {approvedCount} Đã duyệt
                </StatusTag>
                {rejectedCount > 0 && (
                  <StatusTag color="error">{rejectedCount} Từ chối</StatusTag>
                )}
              </Space>
            }
          >
            <IndicatorTable
              indicators={filteredDisplayIndicators}
              taskStatus={task.status}
              onApprove={handleApproveIndicator}
              onReject={handleRejectIndicator}
              onReturnResult={handleReturnResult}
              onIndicatorUpdate={loadData}
              selectedPendingIds={selectedPendingIds}
              onPendingSelectChange={setSelectedPendingIds}
              forceDisableActions={isTestRequestCancelled}
            />
          </Card>
        )}
      </Card>

      {/* Modals */}
      <PrintModal
        visible={printModalVisible}
        mode={printMode}
        taskId={id!}
        indicators={qualityIndicators}
        onCancel={() => setPrintModalVisible(false)}
        onSuccess={loadData}
      />

      <RejectModal
        visible={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectingIndicatorId(null);
        }}
        onConfirm={handleRejectConfirm}
        title="Từ chối duyệt chỉ tiêu"
      />

      {/* Bulk Reject Modal */}
      <RejectModal
        visible={bulkRejectModalVisible}
        onCancel={() => setBulkRejectModalVisible(false)}
        onConfirm={handleBulkRejectConfirm}
        title={`Từ chối ${selectedPendingIds.length} chỉ tiêu`}
      />

      {/* Return Result Modal */}
      <RejectModal
        visible={returnModalVisible}
        onCancel={() => {
          setReturnModalVisible(false);
          setReturningIndicatorId(null);
        }}
        onConfirm={handleReturnConfirm}
        title="Trả lại kết quả"
        label="Lý do trả kết quả"
        placeholder="Nhập lý do trả kết quả..."
        okText="Xác nhận trả KQ"
        errorMessage="Không thể trả lại kết quả. Vui lòng thử lại."
      />
    </div>
  );
};

export default QualityManagementDetail;
