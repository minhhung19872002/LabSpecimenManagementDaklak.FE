import React, { useState, useEffect, useCallback } from "react";
import { Badge, Popover, List, Typography, Button, Empty, Spin } from "antd";
import { BellOutlined, CheckOutlined } from "../common/Icon";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  notificationService,
  NotificationDto,
  NotificationType,
  getNotificationIcon,
  getNotificationIconColor,
  getNotificationIconBgColor,
  parseNotificationAdditionalData,
} from "../../services/notificationService";
import { signalRService } from "../../services/signalRService";
import NotificationModal from "./NotificationModal";
import "./NotificationBell.css";

const { Text } = Typography;

// Helper to parse message with <b> tags
const parseMessage = (message: string) => {
  if (!message) return null;

  // Split by <b> and </b> tags
  const parts = message.split(/(<b>|<\/b>)/);
  let isBold = false;

  return parts.map((part, index) => {
    if (part === "<b>") {
      isBold = true;
      return null;
    }
    if (part === "</b>") {
      isBold = false;
      return null;
    }
    if (!part) return null;

    // Handle newlines
    const lines = part.split("\n");
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
    case "TestRequest":
      // SampleReceiver notifications (20-24)
      return `/test-requests/${referenceId}`;
    case "LaboratoryTask":
      // QLKT notifications (0-9) - navigate to task management detail
      return `/tasks/${referenceId}`;
    case "QualityManagement":
      // QLCL notifications (10-14) - navigate to quality management detail
      return `/quality-management/${referenceId}`;
    case "Testing":
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

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, []);

  // Load notifications for popover (10 most recent)
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationService.getMyNotifications({
        skipCount: 0,
        maxResultCount: 10,
      });
      setNotifications(result.items || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Subscribe to SignalR new notification events
  useEffect(() => {
    const unsubscribe = signalRService.onNewNotification(() => {
      // Increment unread count by 1 when a new notification is received
      setUnreadCount((prev) => prev + 1);
    });

    return () => unsubscribe();
  }, []);

  // Load notifications when popover opens
  useEffect(() => {
    if (popoverVisible) {
      loadNotifications();
    }
  }, [popoverVisible, loadNotifications]);

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationDto) => {
    // Mark as read if not already
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    // Navigate to related page
    const route = getNotificationRoute(notification);
    if (route) {
      setPopoverVisible(false);
      navigate(route);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Render single notification item
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
        className={`notification-item ${isUnread ? "unread" : ""}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="notification-item-content">
          {/* Icon on the left */}
          <div className="notification-icon-wrapper" style={{ backgroundColor: iconBgColor }}>
            <i className={`notification-icon ${iconClass}`} style={{ color: iconColor }} />
          </div>

          {/* Content on the right */}
          <div className="notification-content">
            <div className="notification-title">{displayTitle}</div>
            <div className="notification-message">
              {parseMessage(notification.message)}
            </div>
            <div className="notification-footer">
              <span className="notification-time">
                {dayjs(notification.creationTime).format("DD/MM/YYYY HH:mm")}
              </span>
              {daysRemaining !== null && daysRemaining !== undefined && (
                <span
                  className={`notification-deadline ${
                    notification.isTaskCompleted
                      ? "completed"
                      : daysRemaining <= 0 ? "overdue" : ""
                  } ${isDeadline ? "is-deadline-type" : ""}`}
                >
                  {notification.isTaskCompleted
                    ? "Đã xử lý"
                    : daysRemaining > 0
                    ? `Còn ${daysRemaining} ngày`
                    : daysRemaining === 0
                    ? "Hôm nay"
                    : `Quá hạn ${Math.abs(daysRemaining)} ngày`}
                </span>
              )}
            </div>
          </div>
        </div>
      </List.Item>
    );
  };

  // Popover content
  const popoverContent = (
    <div className="notification-popover">
      {/* Header */}
      <div className="notification-popover-header">
        <Text strong>Thông báo</Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>

      {/* Notification list */}
      <div className="notification-popover-body">
        {loading ? (
          <div className="notification-loading">
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="Không có thông báo"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={renderNotificationItem}
            split={false}
          />
        )}
      </div>

      {/* Footer - View all button */}
      {notifications.length > 0 && (
        <div className="notification-popover-footer">
          <Button
            type="link"
            block
            onClick={() => {
              setPopoverVisible(false);
              setModalVisible(true);
            }}
          >
            Xem tất cả thông báo
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Popover
        content={popoverContent}
        trigger="click"
        open={popoverVisible}
        onOpenChange={setPopoverVisible}
        placement="bottomRight"
        overlayClassName="notification-popover-overlay"
        arrow={false}
      >
        <div className="notification-bell-wrapper">
          <Badge count={unreadCount} size="small" offset={[-2, 2]} overflowCount={99}>
            <BellOutlined className="notification-bell-icon" />
          </Badge>
        </div>
      </Popover>

      {/* Full notification modal */}
      <NotificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onNotificationRead={() => {
          loadUnreadCount();
          loadNotifications();
        }}
      />
    </>
  );
};

export default NotificationBell;
