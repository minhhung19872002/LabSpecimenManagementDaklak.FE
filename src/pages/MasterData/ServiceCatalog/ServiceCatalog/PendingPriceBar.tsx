import React, { useState } from "react";
import { Button } from "antd";
import { ExclamationCircleOutlined } from "../../../../components/common/Icon";

export interface PendingPriceBarProps {
  count: number;
  onCancel: () => void;
  /** Handler tự try/catch (không re-throw) → Promise luôn resolve */
  onSave: () => Promise<void>;
}

/** Nút Lưu tự quản loading (pattern self-loading) */
const SavePricesButton = React.memo<{ count: number; onSave: () => Promise<void> }>(function SavePricesButton({
  count,
  onSave,
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="primary"
      loading={loading}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await onSave();
        } finally {
          setLoading(false);
        }
      }}
    >
      Lưu {count} thay đổi
    </Button>
  );
});

/** Thanh dưới cùng khi có đơn giá đã sửa chưa lưu */
const PendingPriceBar: React.FC<PendingPriceBarProps> = ({ count, onCancel, onSave }) => (
  <div className="svc-pending-bar" role="status">
    <ExclamationCircleOutlined className="svc-pending-bar-icon" />
    <span className="svc-pending-bar-text">{count} đơn giá đã sửa, chưa lưu</span>
    <Button onClick={onCancel}>Hủy</Button>
    <SavePricesButton count={count} onSave={onSave} />
  </div>
);

export default PendingPriceBar;
