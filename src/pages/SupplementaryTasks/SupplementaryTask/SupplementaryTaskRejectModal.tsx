import React, { useEffect, useState } from "react";
import { Button, Input, Modal, Space } from "antd";
import { SupplementaryTaskDto } from "../../../services/supplementaryTaskService";

export interface SupplementaryTaskRejectModalProps {
  open: boolean;
  item?: SupplementaryTaskDto;
  rejecting: boolean;
  onConfirm: (id: string, reason: string) => Promise<void>;
  onClose: () => void;
}

const SupplementaryTaskRejectModal: React.FC<SupplementaryTaskRejectModalProps> = ({
  open, item, rejecting, onConfirm, onClose,
}) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const handleConfirm = async () => {
    if (!item || !reason.trim()) return;
    await onConfirm(item.id, reason.trim());
  };

  return (
    <Modal
      open={open}
      title="Từ chối hoàn thành"
      width={480}
      centered
      onCancel={onClose}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" danger loading={rejecting} disabled={!reason.trim()} onClick={handleConfirm}>
            Từ chối
          </Button>
        </Space>
      }
    >
      <div style={{ marginTop: 8 }}>
        <div style={{ marginBottom: 6, fontWeight: 500 }}>
          Lý do từ chối <span style={{ color: "#ff4d4f" }}>*</span>
        </div>
        <Input.TextArea
          rows={4}
          maxLength={1000}
          showCount
          placeholder="Nhập lý do từ chối"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
};

export default SupplementaryTaskRejectModal;
