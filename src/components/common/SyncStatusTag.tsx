import React from "react";
import { Tag, Tooltip } from "antd";
import type { OfflineSyncInfo } from "../../services/offline/createOfflineService";

/**
 * Tag trạng thái đồng bộ của bản ghi có thay đổi offline chưa lên server (cùng kiểu với danh sách phiếu yêu cầu)
 */
const SyncStatusTag: React.FC<{ record: OfflineSyncInfo }> = ({ record }) => {
  if (!record.syncStatus) return null;
  if (record.syncStatus === "failed") {
    return (
      <Tooltip title={record.syncError}>
        <Tag color="error" data-testid="sync-status-tag">Lỗi đồng bộ</Tag>
      </Tooltip>
    );
  }
  return <Tag color="warning" data-testid="sync-status-tag">Chờ đồng bộ</Tag>;
};

export default SyncStatusTag;
