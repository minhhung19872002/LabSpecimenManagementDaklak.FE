import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  SendOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { qualityManagementService } from '../../services/qualityManagementService';
import {
  QualityManagementTaskDto,
  QualityManagementStatus,
  QualityManagementStatusLabels,
  QualityManagementStatusColors,
  QualityTaskType,
  QualityIndicatorApprovalStatus,
} from '../../types/qualityManagement';
import IndicatorTable from './components/IndicatorTable';
import PrintModal from './components/PrintModal';
import RejectModal from './components/RejectModal';
import { PATH_ROUTES } from '../../constants';

const { Title } = Typography;

const QualityManagementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<QualityManagementTaskDto | null>(null);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);

  // Modals
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printMode, setPrintMode] = useState<'single' | 'mixed'>('single');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingIndicatorId, setRejectingIndicatorId] = useState<string | null>(null);

  // Action states
  const [sendingResult, setSendingResult] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await qualityManagementService.get(id);
      setTask(result);
    } catch (error) {
      console.error('Error loading task:', error);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleBack = () => {
    navigate(PATH_ROUTES.qualityManagement);
  };

  const handleApproveIndicator = async (indicatorId: string) => {
    try {
      await qualityManagementService.approveIndicator(indicatorId);
      message.success('Đã duyệt chỉ tiêu');
      loadData();
    } catch (error) {
      console.error('Error approving indicator:', error);
      message.error('Không thể duyệt chỉ tiêu');
    }
  };

  const handleRejectIndicator = (indicatorId: string) => {
    setRejectingIndicatorId(indicatorId);
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingIndicatorId) return;
    try {
      await qualityManagementService.rejectIndicator(rejectingIndicatorId, reason);
      message.success('Đã từ chối chỉ tiêu');
      setRejectModalVisible(false);
      setRejectingIndicatorId(null);
      loadData();
    } catch (error) {
      console.error('Error rejecting indicator:', error);
      throw error;
    }
  };

  const handlePrintSingle = () => {
    setPrintMode('single');
    setPrintModalVisible(true);
  };

  const handlePrintMixed = () => {
    setPrintMode('mixed');
    setPrintModalVisible(true);
  };

  const handlePrint = async (indicatorIds: string[]) => {
    if (!task) return;
    try {
      if (printMode === 'single') {
        await qualityManagementService.printSingleResult(task.id, indicatorIds[0]);
      } else {
        await qualityManagementService.printMixedResult(task.id, indicatorIds);
      }
      message.success('Đã gửi lệnh in');
      setPrintModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Error printing:', error);
      message.error('Không thể in kết quả');
    }
  };

  const handleSendResult = async () => {
    if (!task) return;
    setSendingResult(true);
    try {
      await qualityManagementService.sendResult(task.id);
      message.success('Đã gửi kết quả');
      loadData();
    } catch (error) {
      console.error('Error sending result:', error);
      message.error('Không thể gửi kết quả');
    } finally {
      setSendingResult(false);
    }
  };

  // Computed
  const indicators = task?.indicators || [];
  const approvedCount = indicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Approved
  ).length;
  const pendingCount = indicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.PendingApproval
  ).length;
  const rejectedCount = indicators.filter(
    (ind) => ind.approvalStatus === QualityIndicatorApprovalStatus.Rejected
  ).length;

  // Button states
  const canPrint = approvedCount > 0 && task?.status !== QualityManagementStatus.ResultSent;
  const canSendResult = task?.status === QualityManagementStatus.Approved ||
                        task?.status === QualityManagementStatus.PendingSignature;

  // Status tag
  const getStatusTag = (status: QualityManagementStatus) => (
    <Tag color={QualityManagementStatusColors[status]} style={{ fontSize: 14, padding: '4px 12px' }}>
      {QualityManagementStatusLabels[status]}
    </Tag>
  );

  if (loading && !task) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Không tìm thấy dữ liệu" showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
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
                In KQ Đơn
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrintMixed}
                disabled={!canPrint || selectedIndicatorIds.length === 0}
              >
                In KQ Hỗn hợp ({selectedIndicatorIds.length})
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendResult}
                disabled={!canSendResult}
                loading={sendingResult}
              >
                Gửi kết quả
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Task Info */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={4} size="small">
          <Descriptions.Item label="Khách hàng">{task.customerName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Tổng mẫu">{task.totalSampleCount}</Descriptions.Item>
          <Descriptions.Item label="Tổng chỉ tiêu">{task.totalIndicatorCount}</Descriptions.Item>
          <Descriptions.Item label="Khoa phòng">{task.laboratoryNames || '-'}</Descriptions.Item>
          <Descriptions.Item label="Ngày chuyển đi">
            {task.transferDate ? dayjs(task.transferDate).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày YC xong">
            {task.requestCompletionDate ? dayjs(task.requestCompletionDate).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày gửi KQ">
            {task.resultSentDate ? dayjs(task.resultSentDate).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="QLKT">{task.technicalManagerNames || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Indicator Statistics */}
      {task.taskType === QualityTaskType.ResultApproval && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col>
              <Space>
                <Tag color="warning">{pendingCount} Chờ duyệt</Tag>
                <Tag color="success">{approvedCount} Đã duyệt</Tag>
                {rejectedCount > 0 && <Tag color="error">{rejectedCount} Từ chối</Tag>}
              </Space>
            </Col>
            {task.status === QualityManagementStatus.Approved && (
              <Col>
                <Alert
                  type="success"
                  message="Tất cả chỉ tiêu đã được duyệt"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  style={{ padding: '4px 12px' }}
                />
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* Indicator Table (for ResultApproval tasks) */}
      {task.taskType === QualityTaskType.ResultApproval && (
        <Card size="small" title="Danh sách chỉ tiêu">
          <IndicatorTable
            indicators={indicators}
            taskStatus={task.status}
            selectedIndicatorIds={selectedIndicatorIds}
            onSelectChange={setSelectedIndicatorIds}
            onApprove={handleApproveIndicator}
            onReject={handleRejectIndicator}
            onIndicatorUpdate={loadData}
          />
        </Card>
      )}

      {/* Modals */}
      <PrintModal
        visible={printModalVisible}
        mode={printMode}
        indicators={indicators}
        selectedIds={selectedIndicatorIds}
        onCancel={() => setPrintModalVisible(false)}
        onPrint={handlePrint}
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
    </div>
  );
};

export default QualityManagementDetail;
