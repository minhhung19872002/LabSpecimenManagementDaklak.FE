import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Timeline, Typography, Tag, Spin, Empty, Collapse, Card } from 'antd';
import { HistoryOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { qualityManagementService } from '../../../services/qualityManagementService';
import {
  QualityManagementTaskDto,
  TaskHistoryResponseDto,
  QualityIndicatorApprovalStatus,
  QualityIndicatorApprovalStatusLabels,
  QualityIndicatorApprovalStatusColors,
  QualityTaskType,
  ChangeApprovalStatus,
  ChangeApprovalHistoryDto,
} from '../../../types/qualityManagement';

const { Text } = Typography;
const { Panel } = Collapse;

interface HistoryModalProps {
  visible: boolean;
  task: QualityManagementTaskDto | null;
  onClose: () => void;
}

// Field labels for ChangeApproval history
const FIELD_LABELS: Record<string, string> = {
  ContractNumber: 'Số hợp đồng',
  ContractDate: 'Ngày hợp đồng',
  CustomerName: 'Tên khách hàng',
  Address: 'Địa chỉ',
  TaxCode: 'Mã số thuế',
  ContactPerson: 'Người liên hệ',
  Phone: 'Số điện thoại',
  SamplingMethod: 'Phương pháp lấy mẫu',
  SampleType: 'Loại mẫu',
  TotalCost: 'Tổng chi phí',
  TotalCostInWords: 'Tổng chi phí bằng chữ',
  SupervisorId: 'Người giám sát',
  DirectorId: 'Giám đốc',
  Samples: 'Mẫu và chỉ tiêu',
  ExpectedCompletionDate: 'Ngày dự kiến hoàn thành',
  ResultDeliveryDate: 'Ngày trả kết quả',
  SampleTypeContract: 'Loại mẫu HĐ',
  SampleTypeSubContract: 'Loại mẫu HĐ phụ',
  SubContract: 'Hợp đồng phụ',
  OtherRequirements: 'Yêu cầu khác',
  ConformityDeclaration: 'Tuyên bố phù hợp',
  ResultCopyCount: 'Số bản KQ',
  ChangeRequest: 'Yêu cầu thay đổi',
  ReceiptNumber: 'Số biên nhận',
};

// Format value for display - convert boolean to checkbox style
const formatDisplayValue = (value: string | undefined | null): string => {
  if (value === undefined || value === null || value === '') {
    return '(trống)';
  }

  // Handle boolean values - display as checkbox
  const lowerValue = value.toLowerCase();
  if (lowerValue === 'true' || lowerValue === 'false') {
    return lowerValue === 'true' ? '[x]' : '[ ]';
  }

  return value;
};

const HistoryModal: React.FC<HistoryModalProps> = ({ visible, task, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<TaskHistoryResponseDto | null>(null);

  useEffect(() => {
    if (visible && task) {
      loadHistory();
    }
  }, [visible, task]);

  const loadHistory = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const result = await qualityManagementService.getTaskHistory(task.id);
      setHistoryData(result);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIndicatorStatusTag = (status: QualityIndicatorApprovalStatus) => (
    <Tag color={QualityIndicatorApprovalStatusColors[status]}>
      {QualityIndicatorApprovalStatusLabels[status]}
    </Tag>
  );

  const getChangeApprovalStatusTag = (status: ChangeApprovalStatus) => {
    switch (status) {
      case ChangeApprovalStatus.Pending:
        return <Tag color="warning">Chờ phê duyệt</Tag>;
      case ChangeApprovalStatus.Approved:
        return <Tag color="success">Đã phê duyệt</Tag>;
      case ChangeApprovalStatus.Rejected:
        return <Tag color="error">Đã từ chối</Tag>;
      default:
        return <Tag>Không xác định</Tag>;
    }
  };

  const getStatusIcon = (status: ChangeApprovalStatus) => {
    switch (status) {
      case ChangeApprovalStatus.Pending:
        return <EditOutlined style={{ color: '#faad14' }} />;
      case ChangeApprovalStatus.Approved:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case ChangeApprovalStatus.Rejected:
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const renderIndicatorTimelineItem = (item: { creationTime: string; oldStatus: QualityIndicatorApprovalStatus; newStatus: QualityIndicatorApprovalStatus; comment?: string; creatorName?: string }) => (
    <Timeline.Item key={item.creationTime} color="blue">
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(item.creationTime).format('DD/MM/YYYY HH:mm')}
          {item.creatorName && <span style={{ marginLeft: 8 }}>- {item.creatorName}</span>}
        </Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {getIndicatorStatusTag(item.oldStatus)}
        <span>→</span>
        {getIndicatorStatusTag(item.newStatus)}
      </div>
      {item.comment && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">Lý do: </Text>
          <Text>{item.comment}</Text>
        </div>
      )}
    </Timeline.Item>
  );

  // Group change histories - all items share same status since they're filtered by batch
  const groupedChangeHistory = useMemo(() => {
    if (!historyData || historyData.changeHistories.length === 0) return null;

    const items = historyData.changeHistories;
    const firstItem = items[0];

    return {
      status: firstItem.status,
      action: firstItem.action,
      creationTime: firstItem.creationTime,
      creatorName: firstItem.creatorName,
      approvalDate: firstItem.approvalDate,
      approvedByName: firstItem.approvedByName,
      rejectionReason: firstItem.rejectionReason,
      fields: items.map(item => ({
        fieldName: item.fieldName,
        oldValue: item.oldValue,
        newValue: item.newValue,
      })),
    };
  }, [historyData]);

  const renderChangeApprovalHistory = () => {
    if (!groupedChangeHistory) {
      return <Empty description="Chưa có lịch sử thay đổi" />;
    }

    const { status, creationTime, creatorName, approvalDate, approvedByName, rejectionReason, fields } = groupedChangeHistory;

    // Filter out Samples field for display (too complex)
    const displayFields = fields.filter(f => f.fieldName !== 'Samples');
    const hasSamplesChange = fields.some(f => f.fieldName === 'Samples');

    return (
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getStatusIcon(status)}
            <span>{groupedChangeHistory.action}</span>
            {getChangeApprovalStatusTag(status)}
          </div>
        }
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(creationTime).format('DD/MM/YYYY HH:mm')}
            {creatorName && ` - ${creatorName}`}
          </Text>
        }
      >
        {/* Approval/Rejection info */}
        {status === ChangeApprovalStatus.Approved && approvalDate && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f6ffed', borderRadius: 4 }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <Text>Đã phê duyệt lúc {dayjs(approvalDate).format('DD/MM/YYYY HH:mm')}</Text>
            {approvedByName && <Text type="secondary"> bởi {approvedByName}</Text>}
          </div>
        )}

        {status === ChangeApprovalStatus.Rejected && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fff2f0', borderRadius: 4 }}>
            <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            <Text>Đã từ chối</Text>
            {approvalDate && <Text> lúc {dayjs(approvalDate).format('DD/MM/YYYY HH:mm')}</Text>}
            {approvedByName && <Text type="secondary"> bởi {approvedByName}</Text>}
            {rejectionReason && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">Lý do: </Text>
                <Text type="danger">{rejectionReason}</Text>
              </div>
            )}
          </div>
        )}

        {/* Field changes - collapsed */}
        <Collapse ghost defaultActiveKey={[]}>
          <Panel
            key="fields"
            header={
              <Text type="secondary">
                {displayFields.length} trường thay đổi
                {hasSamplesChange && ' + Mẫu/Chỉ tiêu'}
              </Text>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displayFields.map((field, index) => (
                <div
                  key={index}
                  style={{
                    padding: '6px 10px',
                    background: '#fafafa',
                    borderRadius: 4,
                    borderLeft: '3px solid #1890ff'
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    <Tag color="blue" style={{ marginRight: 0 }}>
                      {FIELD_LABELS[field.fieldName || ''] || field.fieldName}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Text delete type="secondary" style={{ maxWidth: '40%' }} ellipsis>
                      {formatDisplayValue(field.oldValue)}
                    </Text>
                    <span>→</span>
                    <Text strong style={{ maxWidth: '40%', color: '#52c41a' }} ellipsis>
                      {formatDisplayValue(field.newValue)}
                    </Text>
                  </div>
                </div>
              ))}
              {hasSamplesChange && (
                <div
                  style={{
                    padding: '6px 10px',
                    background: '#fff7e6',
                    borderRadius: 4,
                    borderLeft: '3px solid #fa8c16'
                  }}
                >
                  <Tag color="orange">Mẫu và chỉ tiêu</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    (Xem chi tiết tại modal phê duyệt)
                  </Text>
                </div>
              )}
            </div>
          </Panel>
        </Collapse>
      </Card>
    );
  };

  const renderIndicatorHistory = () => {
    if (!historyData || historyData.indicatorHistories.length === 0) {
      return <Empty description="Chưa có lịch sử thay đổi" />;
    }

    return (
      <Collapse defaultActiveKey={historyData.indicatorHistories.map((_, i) => i.toString())} ghost>
        {historyData.indicatorHistories.map((indicatorHistory, index) => (
          <Panel
            key={index.toString()}
            header={
              <div>
                <Text strong>{indicatorHistory.indicatorCode}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  - {indicatorHistory.indicatorName}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  (Mẫu: {indicatorHistory.sampleCode})
                </Text>
              </div>
            }
          >
            <Timeline style={{ marginTop: 16 }}>
              {indicatorHistory.histories
                .sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime())
                .map((h) => renderIndicatorTimelineItem(h))}
            </Timeline>
          </Panel>
        ))}
      </Collapse>
    );
  };

  const hasHistory = historyData && (
    (historyData.taskType === QualityTaskType.ChangeApproval && historyData.changeHistories.length > 0) ||
    (historyData.taskType === QualityTaskType.ResultApproval && historyData.indicatorHistories.length > 0)
  );

  return (
    <Modal
      title={
        <span>
          <HistoryOutlined style={{ marginRight: 8 }} />
          Lịch sử - {task?.contractNumber}
          {task?.taskType === QualityTaskType.ChangeApproval && (
            <Tag color="orange" style={{ marginLeft: 8 }}>Thay đổi phiếu</Tag>
          )}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : !hasHistory ? (
        <Empty description="Chưa có lịch sử thay đổi" />
      ) : historyData?.taskType === QualityTaskType.ChangeApproval ? (
        renderChangeApprovalHistory()
      ) : (
        renderIndicatorHistory()
      )}
    </Modal>
  );
};

export default HistoryModal;
