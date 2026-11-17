import React, { useState } from "react";
import { Button, Space } from "antd";
import { CopyOutlined, SaveOutlined } from "../../../../components/common/Icon";

/** Trạng thái L4 báo lên thanh "Ngân hàng dữ liệu" để vẽ nút */
export interface YearlyForecastActionState {
  year: number;
  /** Có quyền sửa + năm chưa khóa */
  editable: boolean;
  /** Năm trước có số liệu để clone */
  canClone: boolean;
  dirtyCount: number;
}

const SaveForecastButton = React.memo<{ dirtyCount: number; onSave: () => Promise<void> }>(
  function SaveForecastButton({ dirtyCount, onSave }) {
    const [loading, setLoading] = useState(false);
    return (
      <Button
        type="primary"
        icon={<SaveOutlined />}
        loading={loading}
        disabled={dirtyCount === 0 || loading}
        onClick={async () => {
          setLoading(true);
          try {
            await onSave();
          } finally {
            setLoading(false);
          }
        }}
      >
        Lưu dự toán{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
      </Button>
    );
  }
);

export interface ForecastCardActionsProps {
  state: YearlyForecastActionState | null;
  onClone: () => void;
  onSave: () => Promise<void>;
}

/** Nút Clone / Lưu dự toán trên thanh "Ngân hàng dữ liệu" (giống các tab khác) */
const ForecastCardActions: React.FC<ForecastCardActionsProps> = ({ state, onClone, onSave }) => {
  if (!state?.editable) return null;
  return (
    <Space>
      {state.canClone && (
        <Button icon={<CopyOutlined />} onClick={onClone}>
          Clone từ năm {state.year - 1}
        </Button>
      )}
      <SaveForecastButton dirtyCount={state.dirtyCount} onSave={onSave} />
    </Space>
  );
};

export default ForecastCardActions;
