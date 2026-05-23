import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  List,
  Typography,
  Button,
  Empty,
  Spin,
  Space,
  Select,
  Tag,
} from 'antd';
import { CheckOutlined, FilterOutlined, DownOutlined } from '../common/Icon';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  notificationService,
  NotificationDto,
  NotificationType,
  NotificationTypeLabels,
  getNotificationIcon,
  getNotificationIconColor,
  getNotificationIconBgColor,
  parseNotificationAdditionalData,
} from '../../services/notificationService';
import './NotificationModal.css';

const { Text, Title } = Typography;

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
}

// Helper to parse message with <b> tags
const parseMessage = (message: string) => {
  if (!message) return null;

  const parts = message.split(/(<b>|<\/b>)/);
  let isBold = false;

  return parts.map((part, index) => {
    if (part === '<b>') {
      isBold = true;
      return null;
    }
    if (part === '</b>') {
      isBold = false;
      return null;
    }
    if (!part) return null;

    const lines = part.split('\n');
    return lines.map((line, lineIndex) => (
      <React.Fragment key={`${index}-${lineIndex}`}>
        {lineIndex > 0 && <br />}
        {isBold ? <strong>{line}</strong> : line}
      </React.Fragment>
    ));
  });
};

// Get route based on notification type and reference
// - QLKT (0-9): referenceType = "LaboratoryTask" -> navigate to /tasks/{taskId}
// - QLCL (10-14): referenceType = "QualityManagement" -> navigate to /quality-management/{qualityTaskId}
// - SampleReceiver (20-24): referenceType = "TestRequest" -> navigate to /test-requests/{testRequestId}
// - KTV (30-35): referenceType = "Testing" -> navigate to /testing/{taskId}
const getNotificationRoute = (notification: NotificationDto): string | null => {
  const { referenceType, referenceId } = notification;

  if (!referenceId) return null;

  switch (referenceType) {
    case 'TestRequest':
      // SampleReceiver notifications (20-24)
      return `/test-requests/${referenceId}`;
    case 'LaboratoryTask':
      // QLKT notifications (0-9) - navigate to task management detail
      return `/tasks/${referenceId}`;
    case 'QualityManagement':
      // QLCL notifications (10-14) - navigate to quality management detail
      return `/quality-management/${referenceId}`;
    case 'Testing':
      // KTV notifications (30-35) - navigate to testing detail
      return `/testing/${referenceId}`;
    default:
      return null;
  }
};

// Check if notification is deadline-related
const isDeadlineNotification = (type: NotificationType): boolean => {
  return [
    NotificationType.DeadlineReminder,
    NotificationType.PendingWorkAssignment,
  ].includes(type);
};

// Filter options
const readStatusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'read', label: 'Đã đọc' },
];

const PAGE_SIZE = 10;

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  onNotificationRead,
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [readFilter, setReadFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>(undefined);

  // Track filter changes for reload
  const prevFiltersRef = useRef({ readFilter, typeFilter });

  // Convert read filter to API param
  const getIsReadParam = useCallback((): boolean | undefined => {
    if (readFilter === 'unread') return false;
    if (readFilter === 'read') return true;
    return undefined;
  }, [readFilter]);

  // Load notifications (initial or load more)
  const loadNotifications = useCallback(async (reset: boolean = true) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentCount = reset ? 0 : notifications.length;
      const result = await notificationService.getMyNotifications({
        skipCount: currentCount,
        maxResultCount: PAGE_SIZE,
        isRead: getIsReadParam(),
        type: typeFilter,
      });

      const newItems = result.items || [];

      if (reset) {
        setNotifications(newItems);
      } else {
        setNotifications(prev => [...prev, ...newItems]);
      }

      setTotalCount(result.totalCount);
      const totalLoaded = reset ? newItems.length : (notifications.length + newItems.length);
      setHasMore(totalLoaded < result.totalCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [notifications.length, getIsReadParam, typeFilter]);

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      setNotifications([]);
      setTotalCount(0);
      setHasMore(false);
      loadNotifications(true);
    }
  }, [visible]);

  // Reload when filters change
  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.readFilter !== readFilter ||
      prevFiltersRef.current.typeFilter !== typeFilter;

    if (visible && filtersChanged) {
      prevFiltersRef.current = { readFilter, typeFilter };
      setNotifications([]);
      setTotalCount(0);
      setHasMore(false);
      loadNotifications(true);
    }
  }, [readFilter, typeFilter, visible]);

  // Handle load more
  const handleLoadMore = () => {
    loadNotifications(false);
  };

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationDto) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        onNotificationRead?.();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    const route = getNotificationRoute(notification);
    if (route) {
      onClose();
      navigate(route);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      onNotificationRead?.();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get unique notification types from data
  const typeOptions = [
    { value: undefined, label: 'Tất cả loại' },
    ...Object.entries(NotificationTypeLabels)
      .filter(([key]) => {
        const numKey = parseInt(key);
        return !isNaN(numKey);
      })
      .map(([key, label]) => ({
        value: parseInt(key) as NotificationType,
        label,
      })),
  ];

  // Render notification item
  const renderNotificationItem = (notification: NotificationDto) => {
    const isUnread = !notification.isRead;
    const daysRemaining = notification.daysRemaining;
    const isDeadline = isDeadlineNotification(notification.type);
    const additionalData = parseNotificationAdditionalData(notification.additionalData);
    const iconClass = getNotificationIcon(notification.type);
    const iconColor = getNotificationIconColor(notification.type);
    const iconBgColor = getNotificationIconBgColor(notification.type);

    // Build title with contract number
    const contractNumber = additionalData?.contractNumber;
    const displayTitle = contractNumber
      ? `${notification.title} - HĐ: ${contractNumber}`
      : notification.title;

    return (
      <List.Item
        className={`notification-modal-item ${isUnread ? 'unread' : ''}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="notification-modal-item-content">
          {/* Icon on the left */}
          <div className="notification-modal-icon-wrapper" style={{ backgroundColor: iconBgColor }}>
            <i className={`notification-modal-icon ${iconClass}`} style={{ color: iconColor }} />
          </div>

          {/* Content on the right */}
          <div className="notification-modal-content">
            {/* Header: Title + Type Tag */}
            <div className="notification-modal-header">
              <span className="notification-modal-title">{displayTitle}</span>
              <Tag color={isUnread ? 'blue' : 'default'} className="notification-modal-type">
                {NotificationTypeLabels[notification.type] || 'Thông báo'}
              </Tag>
            </div>

            {/* Message content (description) */}
            <div className="notification-modal-message">
              {parseMessage(notification.message)}
            </div>

            {/* Footer: Time + Days remaining */}
            <div className="notification-modal-footer">
              <Text type="secondary" className="notification-modal-time">
                {dayjs(notification.creationTime).format('DD/MM/YYYY HH:mm')}
              </Text>
              {daysRemaining !== null && daysRemaining !== undefined && (
                <span className={`notification-modal-deadline ${daysRemaining <= 0 ? 'overdue' : ''} ${isDeadline ? 'is-deadline-type' : ''}`}>
                  {daysRemaining > 0
                    ? `Còn ${daysRemaining} ngày`
                    : daysRemaining === 0
                    ? 'Hôm nay'
                    : `Quá hạn ${Math.abs(daysRemaining)} ngày`}
                </span>
              )}
            </div>
          </div>
        </div>
      </List.Item>
    );
  };

  return (
    <Modal
      title={
        <div className="notification-modal-header">
          <Title level={4} style={{ margin: 0 }}>Tất cả thông báo</Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      className="notification-modal"
      centered
    >
      {/* Filters */}
      <div className="notification-modal-filters">
        <Space wrap>
          <FilterOutlined />
          <Select
            value={readFilter}
            onChange={setReadFilter}
            options={readStatusOptions}
            style={{ width: 120 }}
            size="small"
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions}
            style={{ width: 200 }}
            size="small"
            placeholder="Loại thông báo"
            allowClear
          />
        </Space>

        <Button
          type="link"
          icon={<CheckOutlined />}
          onClick={handleMarkAllAsRead}
          size="small"
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {/* Notification list */}
      <div className="notification-modal-body">
        {loading ? (
          <div className="notification-modal-loading">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty description="Không có thông báo" />
        ) : (
          <>
            <List
              dataSource={notifications}
              renderItem={renderNotificationItem}
              split={false}
            />

            {/* Load more button */}
            {hasMore && (
              <div className="notification-modal-load-more">
                <Button
                  type="default"
                  icon={<DownOutlined />}
                  onClick={handleLoadMore}
                  loading={loadingMore}
                  block
                >
                  Tải thêm ({notifications.length}/{totalCount})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default NotificationModal;
