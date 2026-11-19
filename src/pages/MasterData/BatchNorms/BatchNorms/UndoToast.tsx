import React, { useState } from "react";
import { CloseOutlined, UndoOutlined } from "../../../../components/common/Icon";

export interface UndoToastData {
  /** Đổi mỗi lần hiện để đặt lại bộ hẹn giờ tự ẩn */
  key: number;
  text: string;
  canUndo: boolean;
}

export interface UndoToastProps {
  toast: UndoToastData | null;
  onUndo: () => Promise<void>;
  onClose: () => void;
}

const UndoButton = React.memo<{ onUndo: () => Promise<void> }>(function UndoButton({ onUndo }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      className="bn-toast-undo"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await onUndo();
        } finally {
          setLoading(false);
        }
      }}
    >
      <UndoOutlined style={{ fontSize: 12, marginRight: 4 }} />
      {loading ? "Đang hoàn tác…" : "Hoàn tác"}
    </button>
  );
});

/** Thông báo dưới màn hình sau khi thêm / xóa, kèm Hoàn tác */
const UndoToast: React.FC<UndoToastProps> = ({ toast, onUndo, onClose }) =>
  toast ? (
    <div className="bn-toast" role="status" aria-live="polite">
      <span>{toast.text}</span>
      {toast.canUndo && <UndoButton key={toast.key} onUndo={onUndo} />}
      <button type="button" className="bn-toast-close" aria-label="Đóng thông báo" onClick={onClose}>
        <CloseOutlined style={{ fontSize: 12 }} />
      </button>
    </div>
  ) : null;

export default UndoToast;
