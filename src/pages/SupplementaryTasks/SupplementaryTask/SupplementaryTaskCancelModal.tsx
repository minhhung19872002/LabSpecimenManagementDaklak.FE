import React from "react";
import { Button, Modal, Space, Typography } from "antd";
import { SupplementaryTaskDto } from "../../../services/supplementaryTaskService";

export interface SupplementaryTaskCancelModalProps {
  open: boolean;
  item?: SupplementaryTaskDto;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const SupplementaryTaskCancelModal: React.FC<SupplementaryTaskCancelModalProps> = ({
  open,
  item,
  loading,
  onConfirm,
  onClose,
}) => (
  <Modal
    open={open}
    title="Xác nhận hủy công việc"
    width={440}
    centered
    onCancel={onClose}
    footer={
      <Space>
        <Button onClick={onClose}>Đóng</Button>
        <Button danger type="primary" loading={loading} onClick={onConfirm}>
          Hủy công việc
        </Button>
      </Space>
    }
  >
    <Typography.Text>
      Bạn có chắc muốn hủy công việc{" "}
      <Typography.Text strong>"{item?.title}"</Typography.Text>?
      <br />
      Hành động này không thể hoàn tác.
    </Typography.Text>
  </Modal>
);

export default SupplementaryTaskCancelModal;
