import React, { useState } from "react";
import { Modal, Select, Input, message } from "antd";
import {
  equipmentService,
  EquipmentStatus,
  EquipmentStatusLabels,
  ALLOWED_STATUS_TRANSITIONS,
} from "../../../services/equipmentService";

interface Props {
  open: boolean;
  currentStatus: EquipmentStatus;
  equipmentId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const UpdateStatusModal: React.FC<Props> = ({ open, currentStatus, equipmentId, onClose, onUpdated }) => {
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const allowedStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  const handleOk = async () => {
    if (selectedStatus === undefined) {
      message.warning("Vui lòng chọn trạng thái mới.");
      return;
    }

    setSaving(true);
    try {
      await equipmentService.updateStatus(equipmentId, {
        status: selectedStatus,
        notes: notes || undefined,
      });
      message.success("Cập nhật trạng thái thành công");
      onUpdated();
      handleClose();
    } catch {
      message.error("Không thể cập nhật trạng thái");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus(undefined);
    setNotes("");
    onClose();
  };

  return (
    <Modal
      title="Cập nhật trạng thái thiết bị"
      open={open}
      onOk={handleOk}
      onCancel={handleClose}
      confirmLoading={saving}
      okText="Xác nhận"
      cancelText="Hủy"
      width={460}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>Trạng thái hiện tại: {EquipmentStatusLabels[currentStatus]}</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Trạng thái mới</label>
        <Select
          value={selectedStatus}
          onChange={setSelectedStatus}
          style={{ width: "100%" }}
          placeholder="Chọn trạng thái"
          options={allowedStatuses.map((s) => ({
            value: s,
            label: EquipmentStatusLabels[s],
          }))}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 4 }}>Ghi chú</label>
        <Input.TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nhập ghi chú (không bắt buộc)"
          rows={3}
        />
      </div>
    </Modal>
  );
};

export default UpdateStatusModal;
