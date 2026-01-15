import React, { useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Tag,
  Alert,
  message,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
} from '../../../components/common/Icon';
import dayjs from 'dayjs';
import { qualityManagementService } from '../../../services/qualityManagementService';
import {
  QualityManagementTaskDto,
  QualityManagementStatus,
} from '../../../types/qualityManagement';
import RejectModal from './RejectModal';

const { Text } = Typography;

interface ChangeApprovalSectionProps {
  task: QualityManagementTaskDto;
  onUpdate: () => void;
}

const ChangeApprovalSection: React.FC<ChangeApprovalSectionProps> = ({
  task,
  onUpdate,
}) => {
  const [approving, setApproving] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  // Only show for ChangeApproval tasks
  if (task.taskType !== 1) {
    return null;
  }

  const changeHistory = task.changeHistory;
  if (!changeHistory) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Alert
          type="warning"
          message="Không tìm thấy thông tin thay đổi"
          showIcon
        />
      </Card>
    );
  }

  const isPending = task.status === QualityManagementStatus.PendingApproval;

  const handleApprove = async () => {
    setApproving(true);
    try {
      await qualityManagementService.approveChanges(task.id);
      message.success('Đã phê duyệt thay đổi');
      onUpdate();
    } catch (error) {
      console.error('Error approving changes:', error);
      message.error('Không thể phê duyệt thay đổi');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await qualityManagementService.rejectChanges(task.id, reason);
      message.success('Đã từ chối thay đổi');
      setRejectModalVisible(false);
      onUpdate();
    } catch (error) {
      console.error('Error rejecting changes:', error);
      throw error;
    }
  };

  // Parse the change details
  const renderChangeValue = (value: string | null | undefined) => {
    if (!value) return <Text type="secondary">(trống)</Text>;
    // Try to parse as date
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dayjs(value).format('DD/MM/YYYY');
    }
    return value;
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <span>
          <EditOutlined style={{ marginRight: 8 }} />
          Thông tin thay đổi phiếu yêu cầu
        </span>
      }
      extra={
        isPending && (
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApprove}
              loading={approving}
            >
              Phê duyệt thay đổi
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => setRejectModalVisible(true)}
            >
              Từ chối thay đổi
            </Button>
          </Space>
        )
      }
    >
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Người thay đổi">
          {changeHistory.createdByName || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Thời gian thay đổi">
          {changeHistory.creationTime
            ? dayjs(changeHistory.creationTime).format('DD/MM/YYYY HH:mm')
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Trường thay đổi" span={2}>
          <Tag color="blue">{changeHistory.fieldName}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Giá trị cũ">
          <Text delete type="secondary">
            {renderChangeValue(changeHistory.oldValue)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Giá trị mới">
          <Text strong type="success">
            {renderChangeValue(changeHistory.newValue)}
          </Text>
        </Descriptions.Item>
        {changeHistory.reason && (
          <Descriptions.Item label="Lý do thay đổi" span={2}>
            {changeHistory.reason}
          </Descriptions.Item>
        )}
      </Descriptions>

      {!isPending && task.status === QualityManagementStatus.HandedOver && (
        <Alert
          style={{ marginTop: 16 }}
          type="success"
          message="Thay đổi đã được phê duyệt"
          showIcon
        />
      )}

      {!isPending && task.status === QualityManagementStatus.Rejected && (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          message="Thay đổi đã bị từ chối"
          description={changeHistory.rejectionReason}
          showIcon
        />
      )}

      <RejectModal
        visible={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onConfirm={handleReject}
        title="Từ chối thay đổi phiếu yêu cầu"
      />
    </Card>
  );
};

export default ChangeApprovalSection;
