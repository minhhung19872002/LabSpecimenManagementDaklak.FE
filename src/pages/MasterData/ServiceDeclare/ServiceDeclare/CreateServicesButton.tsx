import React, { useState } from "react";
import { Button } from "antd";

export interface CreateServicesButtonProps {
  count: number;
  disabled?: boolean;
  /** Handler tự try/catch, không re-throw */
  onSubmit: () => Promise<void>;
}

/** Nút "Tạo N dịch vụ" — tự quản loading */
const CreateServicesButton = React.memo<CreateServicesButtonProps>(function CreateServicesButton({ count, disabled, onSubmit }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="primary"
      style={{ height: 38, padding: "0 18px", borderRadius: 8, fontWeight: 500 }}
      loading={loading}
      disabled={disabled || loading}
      onClick={async () => {
        setLoading(true);
        try {
          await onSubmit();
        } finally {
          setLoading(false);
        }
      }}
    >
      {count === 1 ? "Tạo dịch vụ" : `Tạo ${count} dịch vụ`}
    </Button>
  );
});

export default CreateServicesButton;
