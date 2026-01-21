import React from 'react';
import { Badge, Tooltip, Button, Space, Popover, Typography, Spin } from 'antd';
import { WifiOutlined, CloudSyncOutlined, SyncOutlined } from '@ant-design/icons';
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
  const { isOnline, pendingCount, isSyncing, sync, retryFailed } = useNetworkStatus();

  // Don't show anything if online with no pending items
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  const handleSync = async () => {
    await sync();
  };

  const handleRetry = async () => {
    await retryFailed();
  };

  const popoverContent = (
    <Space direction="vertical" size="small" style={{ width: 200 }}>
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

      {isSyncing && (
        <Space>
          <Spin size="small" />
          <Text type="secondary">Syncing...</Text>
        </Space>
      )}

      {showSyncButton && isOnline && pendingCount > 0 && !isSyncing && (
        <Space>
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

        {pendingCount > 0 && (
          <Tooltip title={`${pendingCount} pending sync item(s)`}>
            <Badge count={pendingCount} size="small" offset={[-3, 3]}>
              {isSyncing ? (
                <SyncOutlined spin style={{ fontSize: 18, color: '#1890ff' }} />
              ) : (
                <CloudSyncOutlined style={{ fontSize: 18, color: '#faad14' }} />
              )}
            </Badge>
          </Tooltip>
        )}

        {isOnline && pendingCount === 0 && isSyncing && (
          <Tooltip title="Syncing...">
            <SyncOutlined spin style={{ fontSize: 18, color: '#1890ff' }} />
          </Tooltip>
        )}
      </div>
    </Popover>
  );
};

export default OfflineIndicator;
