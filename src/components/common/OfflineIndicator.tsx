import React from 'react';
import { Badge, Tooltip, Button, Space, Popover, Typography, Spin } from 'antd';
import { WifiOutlined, CloudSyncOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const { Text } = Typography;

interface OfflineIndicatorProps {
  showSyncButton?: boolean;
}

/**
 * Component to display offline status and pending sync count
 * Shows in the header/navbar to inform users about network status
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showSyncButton = true,
}) => {
  const { isOnline, pendingCount, failedCount, isSyncing, sync, retryFailed, clearFailed, resetFailed } = useNetworkStatus();

  // Don't show anything if online with no pending/failed items and not syncing
  if (isOnline && pendingCount === 0 && failedCount === 0 && !isSyncing) {
    return null;
  }

  const handleSync = async () => {
    await sync();
  };

  const handleRetry = async () => {
    await retryFailed();
  };

  const handleClearFailed = async () => {
    await clearFailed();
  };

  const handleResetFailed = async () => {
    await resetFailed();
  };

  const popoverContent = (
    <Space direction="vertical" size="small" style={{ width: 220 }}>
      <Space>
        {isOnline ? (
          <Badge status="success" text="Online" />
        ) : (
          <Badge status="error" text="Offline" />
        )}
      </Space>

      {pendingCount > 0 && (
        <Text type="secondary">
          {pendingCount} item(s) pending sync
        </Text>
      )}

      {failedCount > 0 && (
        <Text type="danger">
          {failedCount} item(s) failed to sync
        </Text>
      )}

      {isSyncing && (
        <Space>
          <Spin size="small" />
          <Text type="secondary">Syncing...</Text>
        </Space>
      )}

      {showSyncButton && isOnline && pendingCount > 0 && !isSyncing && (
        <Space wrap>
          <Button
            type="primary"
            size="small"
            icon={<SyncOutlined />}
            onClick={handleSync}
          >
            Sync Now
          </Button>
          <Button
            size="small"
            onClick={handleRetry}
          >
            Retry Failed
          </Button>
        </Space>
      )}

      {failedCount > 0 && isOnline && !isSyncing && (
        <Space wrap>
          <Button
            size="small"
            onClick={handleResetFailed}
            title="Reset retry count and try again"
          >
            Reset & Retry
          </Button>
          <Button
            size="small"
            danger
            onClick={handleClearFailed}
            title="Permanently remove failed items"
          >
            Clear Failed
          </Button>
        </Space>
      )}

      {!isOnline && (
        <Text type="warning">
          Changes will sync when you're back online
        </Text>
      )}
    </Space>
  );

  return (
    <Popover
      content={popoverContent}
      title="Sync Status"
      trigger="click"
      placement="bottomRight"
    >
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isOnline && (
          <Tooltip title="You are offline">
            <Badge
              dot
              status="error"
              offset={[-3, 3]}
            >
              <WifiOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
            </Badge>
          </Tooltip>
        )}

        {(pendingCount > 0 || failedCount > 0) && (
          <Tooltip title={`${pendingCount} pending, ${failedCount} failed`}>
            <Badge count={pendingCount + failedCount} size="small" offset={[-3, 3]}>
              {isSyncing ? (
                <SyncOutlined spin style={{ fontSize: 18, color: '#1890ff' }} />
              ) : failedCount > 0 ? (
                <WarningOutlined style={{ fontSize: 18, color: '#ff4d4f' }} />
              ) : (
                <CloudSyncOutlined style={{ fontSize: 18, color: '#faad14' }} />
              )}
            </Badge>
          </Tooltip>
        )}

        {isOnline && pendingCount === 0 && failedCount === 0 && isSyncing && (
          <Tooltip title="Syncing...">
            <SyncOutlined spin style={{ fontSize: 18, color: '#1890ff' }} />
          </Tooltip>
        )}
      </div>
    </Popover>
  );
};

export default OfflineIndicator;
