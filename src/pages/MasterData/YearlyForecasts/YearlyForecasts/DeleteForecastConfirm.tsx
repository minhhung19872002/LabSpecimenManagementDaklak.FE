import React, { useState } from "react";
import { Button, Modal } from "antd";
import { DeleteOutlined } from "../../../../components/common/Icon";
import { formatSamples } from "./utils";

export interface DeleteForecastTarget {
  /** TestMethodIndicatorId */
  id: string;
  indicatorName: string;
  methodName: string;
  specimenName: string;
  samples: number;
  /** PP cuối cùng còn dự toán của chỉ tiêu trên nền mẫu */
  isLast: boolean;
  year: number;
}

export interface DeleteForecastConfirmProps {
  target: DeleteForecastTarget | null;
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
      Xóa
    </Button>
  );
});

/** Xác nhận bỏ 1 phương pháp khỏi dự toán năm */
const DeleteForecastConfirm: React.FC<DeleteForecastConfirmProps> = ({ target, onConfirm, onCancel }) => (
  <Modal
    open={target != null}
    centered
    width={440}
    title={null}
    closable={false}
    maskClosable={false}
    onCancel={onCancel}
    styles={{ container: { borderRadius: 14 } }}
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
          <h3 className="bn-confirm-title">Xóa phương pháp {target.methodName}?</h3>
          <p className="yf-confirm-text">
            Bỏ phương pháp này khỏi chỉ tiêu <strong>{target.indicatorName}</strong> – nền mẫu{" "}
            <strong>{target.specimenName}</strong> trong dự toán năm {target.year}.
          </p>
          <div className="yf-confirm-impact">
            Sẽ xóa 1 dòng · {formatSamples(target.samples)} mẫu/năm
            {target.isLast && " — đây là phương pháp cuối, chỉ tiêu sẽ không còn trong dự toán"}
          </div>
        </div>
      </div>
    )}
  </Modal>
);

export default DeleteForecastConfirm;
