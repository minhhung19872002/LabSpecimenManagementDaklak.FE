import React, { useState } from "react";
import { Button } from "antd";

export interface SaveNormsButtonProps {
  count: number;
  /** Còn lỗi → nút xám nhưng vẫn bấm được để hiện lỗi */
  invalid: boolean;
  /** Handler tự try/catch, không re-throw */
  onSubmit: () => Promise<void>;
}

/** Nút "Tạo N định mức" — tự quản loading */
const SaveNormsButton = React.memo<SaveNormsButtonProps>(function SaveNormsButton({ count, invalid, onSubmit }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type={invalid ? "default" : "primary"}
      style={{
        height: 38,
        padding: "0 18px",
        borderRadius: 8,
        fontWeight: 500,
        ...(invalid ? { background: "#f5f5f5", color: "rgba(0,0,0,.45)" } : {}),
      }}
      loading={loading}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await onSubmit();
        } finally {
          setLoading(false);
        }
      }}
    >
      {count > 1 ? `Tạo ${count} định mức` : "Tạo định mức"}
    </Button>
  );
});

export default SaveNormsButton;
