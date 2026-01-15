import React, { useState, useEffect } from 'react';
import { Modal, Timeline, Typography, Tag, Spin, Empty, Collapse, Card, Button } from 'antd';
import { HistoryOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, EyeOutlined, ExperimentOutlined } from '../../../components/common/Icon';
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
  ChangeApprovalBatchDto,
} from '../../../types/qualityManagement';
import ChangeApprovalModal from './ChangeApprovalModal';
import StatusTag from '../../../components/common/StatusTag';
import { IndicatorName } from '../../../components/common';

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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ChangeApprovalBatchDto | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<string>('');

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
    <StatusTag color={QualityIndicatorApprovalStatusColors[status]}>
      {QualityIndicatorApprovalStatusLabels[status]}
    </StatusTag>
  );

  const getChangeApprovalStatusTag = (status: ChangeApprovalStatus) => {
    switch (status) {
      case ChangeApprovalStatus.Pending:
        return <StatusTag color="warning">Chờ phê duyệt</StatusTag>;
      case ChangeApprovalStatus.Approved:
        return <StatusTag color="success">Đã phê duyệt</StatusTag>;
      case ChangeApprovalStatus.Rejected:
        return <StatusTag color="error">Đã từ chối</StatusTag>;
      default:
        return <StatusTag>Không xác định</StatusTag>;
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

  const renderIndicatorTimelineItem = (item: { creationTime: string; oldStatus: QualityIndicatorApprovalStatus; newStatus: QualityIndicatorApprovalStatus; comment?: string; creatorName?: string }) => {
    const MAX_COMMENT_LENGTH = 100;
    const isLongComment = item.comment && item.comment.length > MAX_COMMENT_LENGTH;

    return (
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
            {isLongComment ? (
              <>
                <Text style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.comment}
                </Text>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: 'auto' }}
                  onClick={() => {
                    setSelectedComment(item.comment || '');
                    setCommentModalVisible(true);
                  }}
                >
                  Xem thêm
                </Button>
              </>
            ) : (
              <Text>{item.comment}</Text>
            )}
          </div>
        )}
      </Timeline.Item>
    );
  };

  // Render a single batch card
  const renderBatchCard = (batch: ChangeApprovalBatchDto, index: number, orderNumber?: number) => {
    const { status, creationTime, creatorName, approvalDate, approvedByName, rejectionReason, fields, action } = batch;

    // Filter out Samples field for display (too complex)
    const displayFields = fields.filter(f => f.fieldName !== 'Samples');
    const hasSamplesChange = fields.some(f => f.fieldName === 'Samples');

    // Use orderNumber if provided, otherwise fall back to index + 1
    const displayOrder = orderNumber ?? (index + 1);

    return (
      <Card
        key={`${creationTime}-${index}`}
        size="small"
        style={{ marginBottom: 12 }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getStatusIcon(status)}
            <span>{action}</span>
            {getChangeApprovalStatusTag(status)}
            <Tag style={{ marginLeft: 'auto' }}>Lần {displayOrder}</Tag>
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
              {displayFields.map((field, fieldIndex) => (
                <div
                  key={fieldIndex}
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
                    borderLeft: '3px solid #fa8c16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <Tag color="orange">Mẫu và chỉ tiêu</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Có thay đổi mẫu/chỉ tiêu
                    </Text>
                  </div>
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedBatch(batch);
                      setDetailModalVisible(true);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              )}
            </div>
          </Panel>
        </Collapse>
      </Card>
    );
  };

  const renderChangeApprovalHistory = () => {
    // Use changeHistoryBatches if available (new format)
    let batches = historyData?.changeHistoryBatches || [];

    // Fallback: if changeHistoryBatches is empty but changeHistories exists,
    // convert changeHistories to batch format (for backward compatibility)
    if (batches.length === 0 && historyData?.changeHistories && historyData.changeHistories.length > 0) {
      // Group changeHistories by creationTime (within 1 second tolerance)
      const batchMap = new Map<string, ChangeApprovalBatchDto>();

      historyData.changeHistories.forEach(ch => {
        const batchTime = new Date(ch.creationTime);
        // Round to nearest second for grouping
        const batchKey = Math.floor(batchTime.getTime() / 1000).toString();

        if (batchMap.has(batchKey)) {
          batchMap.get(batchKey)!.fields.push({
            id: ch.id,
            fieldName: ch.fieldName,
            oldValue: ch.oldValue,
            newValue: ch.newValue,
          });
        } else {
          batchMap.set(batchKey, {
            creationTime: ch.creationTime,
            creatorId: ch.creatorId,
            creatorName: ch.creatorName,
            status: ch.status,
            action: ch.action,
            approvalDate: ch.approvalDate,
            approvedById: ch.approvedById,
            approvedByName: ch.approvedByName,
            rejectionReason: ch.rejectionReason,
            fields: [{
              id: ch.id,
              fieldName: ch.fieldName,
              oldValue: ch.oldValue,
              newValue: ch.newValue,
            }],
          });
        }
      });

      batches = Array.from(batchMap.values());
    }

    if (batches.length === 0) {
      return <Empty description="Chưa có lịch sử thay đổi" />;
    }

    // Sort batches by creationTime ascending to get correct order numbers (Lần 1, 2, 3...)
    const sortedByTimeAsc = [...batches].sort(
      (a, b) => new Date(a.creationTime).getTime() - new Date(b.creationTime).getTime()
    );

    // Create index map for batch order numbers
    const batchOrderMap = new Map<string, number>();
    sortedByTimeAsc.forEach((batch, index) => {
      batchOrderMap.set(batch.creationTime, index + 1);
    });

    // Sort batches by creationTime descending (newest first for display)
    const sortedBatches = [...batches].sort(
      (a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime()
    );

    return (
      <div>
        {sortedBatches.map((batch) => {
          const orderNumber = batchOrderMap.get(batch.creationTime) || 1;
          return renderBatchCard(batch, orderNumber - 1, orderNumber);
        })}
      </div>
    );
  };

  const renderIndicatorHistory = () => {
    if (!historyData || historyData.indicatorHistories.length === 0) {
      return <Empty description="Chưa có lịch sử thay đổi" />;
    }

    // Group indicators by sample
    const groupedBySample = historyData.indicatorHistories.reduce((acc, indicator) => {
      const sampleKey = indicator.sampleCode || 'unknown';
      if (!acc[sampleKey]) {
        acc[sampleKey] = {
          sampleCode: indicator.sampleCode,
          sampleName: indicator.sampleName,
          indicators: []
        };
      }
      acc[sampleKey].indicators.push(indicator);
      return acc;
    }, {} as Record<string, { sampleCode?: string; sampleName?: string; indicators: typeof historyData.indicatorHistories }>);

    const sampleGroups = Object.values(groupedBySample);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sampleGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Sample Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderBottom: 'none',
              borderRadius: '6px 6px 0 0'
            }}>
              <ExperimentOutlined style={{ color: '#1890ff' }} />
              <Text strong>{group.sampleCode}</Text>
              {group.sampleName && (
                <Text type="secondary">- {group.sampleName}</Text>
              )}
              <Tag color="blue" style={{ marginLeft: 'auto' }}>
                {group.indicators.length} chỉ tiêu
              </Tag>
            </div>

            {/* Indicators Collapse */}
            <div style={{
              border: '1px solid #d9d9d9',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              overflow: 'hidden'
            }}>
              <Collapse
                defaultActiveKey={group.indicators.map((_, i) => `${groupIndex}-${i}`)}
                style={{ background: '#fff', border: 'none' }}
                ghost
              >
                {group.indicators.map((indicatorHistory, index) => (
                  <Panel
                    key={`${groupIndex}-${index}`}
                    style={{
                      borderBottom: index < group.indicators.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                    header={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ color: '#1890ff' }}>{indicatorHistory.indicatorCode}</Text>
                        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>- <IndicatorName name={indicatorHistory.indicatorName || ""} formattedName={indicatorHistory.indicatorFormattedName} /></span>
                        <Tag color="default" style={{ marginLeft: 'auto' }}>
                          {indicatorHistory.histories.length} thay đổi
                        </Tag>
                      </div>
                    }
                  >
                    <Timeline style={{ marginTop: 8, marginBottom: 0, paddingLeft: 8 }}>
                      {indicatorHistory.histories
                        .sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime())
                        .map((h) => renderIndicatorTimelineItem(h))}
                    </Timeline>
                  </Panel>
                ))}
              </Collapse>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const hasHistory = historyData && (
    (historyData.taskType === QualityTaskType.ChangeApproval && (historyData.changeHistoryBatches?.length > 0 || historyData.changeHistories.length > 0)) ||
    (historyData.taskType === QualityTaskType.ResultApproval && historyData.indicatorHistories.length > 0)
  );

  return (
    <>
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
        width={800}
        centered
        getContainer={() => document.body}
        styles={{
          body: { maxHeight: '70vh', overflowY: 'auto' },
          mask: { position: 'fixed', inset: 0 },
          wrapper: { position: 'fixed', inset: 0 }
        }}
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

      {/* Detail Modal - show changes for selected batch using ChangeApprovalModal */}
      <ChangeApprovalModal
        visible={detailModalVisible}
        taskId={null}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedBatch(null);
        }}
        onUpdated={() => {}}
        batchData={selectedBatch || undefined}
        contractNumber={task?.contractNumber}
      />

      {/* Comment Detail Modal */}
      <Modal
        title="Chi tiết lý do"
        open={commentModalVisible}
        onCancel={() => {
          setCommentModalVisible(false);
          setSelectedComment('');
        }}
        footer={[
          <Button key="close" onClick={() => {
            setCommentModalVisible(false);
            setSelectedComment('');
          }}>
            Đóng
          </Button>
        ]}
        width={500}
        centered
      >
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {selectedComment}
        </div>
      </Modal>
    </>
  );
};

export default HistoryModal;
