import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Descriptions,
  Spin,
  message,
  Row,
  Col,
  Alert,
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
import IndicatorTable from "./components/IndicatorTable";
import PrintModal from "./components/PrintModal";
import RejectModal from "./components/RejectModal";
import { PATH_ROUTES } from "../../constants";
import { authService } from "../../services/authService";
import { PERMISSIONS } from "../../constants/permissionMapping";

const { Title } = Typography;

const QualityManagementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Note: QualityManagement theo Permission Matrix chỉ có QLCL (A) và Admin (A)
  // Cả 2 đều có full quyền nên không cần check UI chi tiết
  // Route permission đã được config đúng trong permissions.ts

  // Check permissions
  const canApprove = authService.hasPermission(PERMISSIONS.TestResults.Approve);
  const canReject = authService.hasPermission(PERMISSIONS.TestResults.Reject);

  // State
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<QualityManagementTaskDto | null>(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);

  // Modals
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printMode, setPrintMode] = useState<"single" | "mixed">("single");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingIndicatorId, setRejectingIndicatorId] = useState<
    string | null
  >(null);
  const [bulkRejectModalVisible, setBulkRejectModalVisible] = useState(false);

  // Action states
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkRejecting, setBulkRejecting] = useState(false);

  // Helper function to update indicators optimistically
  const updateIndicatorsOptimistically = useCallback(
    (
      indicatorIds: string[],
      updates: Partial<QualityManagementIndicatorDto>
    ) => {
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

  // Load data
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await qualityManagementService.get(id);
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
      const result = await qualityManagementService.get(id);
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
        reason
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

  // Bulk approve handlers
  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chỉ tiêu để duyệt");
      return;
    }
    setBulkApproving(true);
    try {
      const result = await qualityManagementService.bulkApproveIndicators(
        selectedPendingIds
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
        reason
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
  const indicators = task?.indicators || [];
  const approvedCount = indicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved
  ).length;
  const pendingCount = indicators.filter(
    (ind) =>
      ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval
  ).length;
  const rejectedCount = indicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Rejected
  ).length;

  // Button states
  // In KQ: chỉ khi có chỉ tiêu đã duyệt và status >= PendingPublish
  const canPrint = approvedCount > 0 && task?.status !== QualityManagementStatus.PendingApproval && task?.status !== QualityManagementStatus.Rejected;

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
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Quay lại
          </Button>
        </Space>

        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>
                <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                Quản lý chất lượng: {task.contractNumber}
              </Title>
              {getStatusTag(task.status)}
              {task.taskType === QualityTaskType.ChangeApproval && (
                <Tag color="orange">Phê duyệt thay đổi</Tag>
              )}
            </Space>
          </Col>
          <Col>
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
          </Col>
        </Row>
      </div>

      {/* Task Info */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={4} size="small">
          <Descriptions.Item label="Khách hàng">
            {task.customerName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng mẫu">
            {task.totalSampleCount}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng chỉ tiêu">
            {task.totalIndicatorCount}
          </Descriptions.Item>
          <Descriptions.Item label="Khoa phòng">
            {task.laboratoryNames || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày chuyển đi">
            {formatDate(task.transferDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày YC xong">
            {formatDate(task.requestCompletionDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày giao BPGN">
            {formatDate(task.handoverDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Người giao BPGN">
            {task.handoverByUserName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="QLKT">
            {task.technicalManagerNames || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Indicator Statistics */}
      {task.taskType === QualityTaskType.ResultApproval && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={24} justify="space-between" align="middle">
            <Col>
              <Space>
                <Tag color="warning">{pendingCount} Chờ duyệt</Tag>
                <Tag color="success">{approvedCount} Đã duyệt</Tag>
                {rejectedCount > 0 && (
                  <Tag color="error">{rejectedCount} Từ chối</Tag>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                {/* Bulk action buttons - only visible if user has permission */}
                {canReject && (
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
                {canApprove && (
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
                  message={`Đã giao BPGN${task.handoverNote ? ` - Ghi chú: ${task.handoverNote}` : ''}`}
                  showIcon
                  icon={<CheckCircleOutlined />}
                  style={{ padding: "4px 12px" }}
                />
              </Col>
            </Row>
          )}
        </Card>
      )}

      {/* Indicator Table (for ResultApproval tasks) */}
      {task.taskType === QualityTaskType.ResultApproval && (
        <Card size="small" title="Danh sách chỉ tiêu">
          <IndicatorTable
            indicators={indicators}
            taskStatus={task.status}
            onApprove={handleApproveIndicator}
            onReject={handleRejectIndicator}
            onIndicatorUpdate={loadData}
            selectedPendingIds={selectedPendingIds}
            onPendingSelectChange={setSelectedPendingIds}
          />
        </Card>
      )}

      {/* Modals */}
      <PrintModal
        visible={printModalVisible}
        mode={printMode}
        taskId={id!}
        indicators={indicators}
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
    </div>
  );
};

export default QualityManagementDetail;
