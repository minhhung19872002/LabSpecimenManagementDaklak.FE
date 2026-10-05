import React, { useCallback, useEffect, useState } from 'react';
import { App, Badge, Tooltip, Button, Space, Popover, Typography, Spin, Popconfirm } from 'antd';
import { WifiOutlined, CloudSyncOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {
  syncManager,
  type FailedItemEvent,
  type SyncedItemEvent,
} from '../../services/offline/syncManager';
import type { SyncEntityType, SyncQueueItem } from '../../services/offline/db';

const { Text } = Typography;

interface OfflineIndicatorProps {
  showSyncButton?: boolean;
}

const ENTITY_LABELS: Partial<Record<SyncEntityType, string>> = {
  TestRequest: 'Phiếu yêu cầu',
  Quotation: 'Báo giá',
  NCR: 'Phiếu NCR',
  Specimen: 'Mẫu',
  Subcontractor: 'Nhà thầu phụ',
  Employee: 'Nhân viên',
  TestResult: 'Kết quả',
};

const getEntityLabel = (entityType: SyncEntityType) => ENTITY_LABELS[entityType] ?? entityType;

const getItemTitle = (entityType: SyncEntityType, data: unknown) => {
  const record = (data ?? {}) as { contractNumber?: string; customerName?: string };
  const name = record.contractNumber || record.customerName;
  return name ? `${getEntityLabel(entityType)} ${name}` : getEntityLabel(entityType);
};

/**
 * Thông báo kết quả đồng bộ cho người dùng (trước đây item lỗi bị bỏ qua im lặng → tưởng mất phiếu)
 */
function useSyncNotifications() {
  const { notification } = App.useApp();

  useEffect(() => {
    const handleItemSynced = (payload: unknown) => {
      const event = payload as SyncedItemEvent;
      // Đồng bộ thành công thì lỗi cũ (nếu có) không còn đúng
      notification.destroy(`sync-failed-${event.clientId}`);

      if (event.serverWins) {
        notification.warning({
          key: `sync-conflict-${event.clientId}`,
          message: 'Thay đổi offline không được áp dụng',
          description: `${getItemTitle(event.entityType, event.serverData)} đã được sửa trên máy chủ sau thời điểm bạn sửa offline. Hệ thống giữ bản trên máy chủ.`,
          duration: 0,
        });
        return;
      }

      if (event.operationType === 'create') {
        notification.success({
          key: `sync-ok-${event.clientId}`,
          message: 'Đã đồng bộ dữ liệu tạo offline',
          description: getItemTitle(event.entityType, event.serverData),
        });
      }
    };

    const handleItemFailed = (payload: unknown) => {
      const event = payload as FailedItemEvent;
      notification.error({
        key: `sync-failed-${event.clientId}`,
        message: `Đồng bộ thất bại: ${getEntityLabel(event.entityType)}`,
        description: `${event.error}. Dữ liệu vẫn được lưu trên máy này, bấm biểu tượng đồng bộ trên thanh tiêu đề để thử lại.`,
        duration: 0,
      });
    };

    syncManager.on('itemSynced', handleItemSynced);
    syncManager.on('itemFailed', handleItemFailed);
    return () => {
      syncManager.off('itemSynced', handleItemSynced);
      syncManager.off('itemFailed', handleItemFailed);
    };
  }, [notification]);
}

/**
 * Component to display offline status and pending sync count
 * Shows in the header/navbar to inform users about network status
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showSyncButton = true,
}) => {
  const { isOnline, pendingCount, failedCount, isSyncing, sync, clearFailed, resetFailed } = useNetworkStatus();
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([]);

  useSyncNotifications();

  const loadFailedItems = useCallback(async () => {
    setFailedItems(failedCount > 0 ? await syncManager.getFailedItems() : []);
  }, [failedCount]);

  useEffect(() => {
    loadFailedItems();
  }, [loadFailedItems]);

  // Don't show anything if online with no pending/failed items and not syncing
  if (isOnline && pendingCount === 0 && failedCount === 0 && !isSyncing) {
    return null;
  }

  const popoverContent = (
    <Space direction="vertical" size="small" style={{ width: 300 }} data-testid="sync-status-popover">
      <Space>
        {isOnline ? (
          <Badge status="success" text="Đang online" />
        ) : (
          <Badge status="error" text="Đang offline" />
        )}
      </Space>

      {pendingCount > 0 && (
        <Text type="secondary">
          {pendingCount} mục đang chờ đồng bộ
        </Text>
      )}

      {failedCount > 0 && (
        <>
          <Text type="danger">
            {failedCount} mục đồng bộ thất bại:
          </Text>
          <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 160, overflowY: 'auto' }}>
            {failedItems.map(item => (
              <li key={item.clientId} data-testid="sync-failed-item">
                <Text strong>{getItemTitle(item.entityType, item.data)}</Text>
                <Popconfirm
                  title="Xóa mục này?"
                  description="Dữ liệu tạo offline chưa lên máy chủ sẽ bị mất."
                  okText="Xóa"
                  okButtonProps={{ danger: true }}
                  cancelText="Hủy"
                  onConfirm={async () => {
                    await syncManager.discardFailedItem(item.clientId);
                    await loadFailedItems();
                  }}
                >
                  <Button type="link" size="small" danger style={{ paddingInline: 4 }}>
                    Xóa
                  </Button>
                </Popconfirm>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{item.lastError || 'Lỗi không xác định'}</Text>
              </li>
            ))}
          </ul>
        </>
      )}

      {isSyncing && (
        <Space>
          <Spin size="small" />
          <Text type="secondary">Đang đồng bộ...</Text>
        </Space>
      )}

      {/* Xóa mục lỗi không cần mạng; đồng bộ / thử lại thì cần */}
      {showSyncButton && !isSyncing && (pendingCount > 0 || failedCount > 0) && (
        <Space wrap>
          {isOnline && pendingCount > 0 && (
            <Button type="primary" size="small" icon={<SyncOutlined />} onClick={sync}>
              Đồng bộ ngay
            </Button>
          )}
          {isOnline && failedCount > 0 && (
            <Button size="small" onClick={resetFailed}>
              Thử lại mục lỗi
            </Button>
          )}
          {failedCount > 0 && (
            <Popconfirm
              title="Xóa vĩnh viễn các mục đồng bộ lỗi?"
              description="Dữ liệu tạo offline chưa lên máy chủ sẽ bị mất."
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={clearFailed}
            >
              <Button size="small" danger>
                Xóa mục lỗi
              </Button>
            </Popconfirm>
          )}
        </Space>
      )}

      {!isOnline && (
        <Text type="warning">
          Dữ liệu sẽ tự đồng bộ khi có mạng trở lại
        </Text>
      )}
    </Space>
  );

  return (
    <Popover
      content={popoverContent}
      title="Trạng thái đồng bộ"
      trigger="click"
      placement="bottomRight"
      onOpenChange={open => {
        if (open) loadFailedItems();
      }}
    >
      <div data-testid="offline-indicator" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isOnline && (
          <Tooltip title="Bạn đang offline">
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
          <Tooltip title={`${pendingCount} chờ đồng bộ, ${failedCount} lỗi`}>
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
          <Tooltip title="Đang đồng bộ...">
            <SyncOutlined spin style={{ fontSize: 18, color: '#1890ff' }} />
          </Tooltip>
        )}
      </div>
    </Popover>
  );
};

export default OfflineIndicator;
