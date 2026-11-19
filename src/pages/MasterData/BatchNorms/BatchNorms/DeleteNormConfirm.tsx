import React, { useState } from "react";
import { Button, Modal } from "antd";
import { DeleteOutlined } from "../../../../components/common/Icon";

export interface DeleteNormTarget {
  id: string;
  indicatorName: string;
  methodName: string;
  categoryName: string;
  specimenName: string;
  materialCount: number;
  equipmentCount: number;
  /** PP cuối cùng của chỉ tiêu trên nền mẫu */
  isLast: boolean;
}

export interface DeleteNormConfirmProps {
  target: DeleteNormTarget | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ConfirmDeleteButton = React.memo<{ onConfirm: () => Promise<void> }>(function ConfirmDeleteButton({ onConfirm }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      danger
      type="primary"
      loading={loading}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await onConfirm();
        } finally {
          setLoading(false);
        }
      }}
    >
      Xóa phương pháp
    </Button>
  );
});

/** Xác nhận xóa 1 phương pháp (dịch vụ) khỏi định mức — gợi ý tắt trạng thái thay vì xóa */
const DeleteNormConfirm: React.FC<DeleteNormConfirmProps> = ({ target, onConfirm, onCancel }) => (
  <Modal
    open={target != null}
    width={480}
    title={null}
    closable={false}
    maskClosable={false}
    onCancel={onCancel}
    footer={[
      <Button key="cancel" onClick={onCancel}>
        Hủy
      </Button>,
      <ConfirmDeleteButton key="ok" onConfirm={onConfirm} />,
    ]}
  >
    {target && (
      <div className="bn-confirm">
        <span className="bn-confirm-icon">
          <DeleteOutlined style={{ fontSize: 16 }} />
        </span>
        <div className="bn-confirm-body">
          <h3 className="bn-confirm-title">Xóa phương pháp khỏi định mức?</h3>
          <span className="bn-confirm-what">
            {target.indicatorName} – {target.methodName}
          </span>
          <span className="bn-confirm-where">
            {target.categoryName === target.specimenName
              ? target.specimenName
              : `${target.categoryName} › ${target.specimenName}`}
          </span>
          <p className="bn-confirm-note">
            Định mức này ({target.materialCount} vật tư, {target.equipmentCount} thiết bị) sẽ bị xóa. Nếu chỉ muốn tạm
            không dùng, hãy tắt Trạng thái sử dụng thay vì xóa.
          </p>
          {target.isLast && (
            <p className="bn-confirm-last">
              Đây là phương pháp cuối cùng của chỉ tiêu này trên nền mẫu — chỉ tiêu sẽ không còn định mức.
            </p>
          )}
        </div>
      </div>
    )}
  </Modal>
);

export default DeleteNormConfirm;
