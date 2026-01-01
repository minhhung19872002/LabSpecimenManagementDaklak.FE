import React, { useMemo } from "react";
import { Modal, Table, Button } from "antd";
import { QualityManagerPendingTaskDto } from "../../types/qualityManagement";
import { getQualityManagerColumns } from "./columns";

interface QualityManagerReminderModalProps {
  open: boolean;
  tasks: QualityManagerPendingTaskDto[];
  onClose: () => void;
}

const QualityManagerReminderModal: React.FC<QualityManagerReminderModalProps> = ({
  open,
  tasks,
  onClose,
}) => {

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open("/quality-management", "_blank");
  };

  const columns = useMemo(
    () => getQualityManagerColumns({ onOpenInNewTab: handleOpenInNewTab }),
    []
  );

  return (
    <Modal
      title="Nhắc nhở công việc"
      open={open}
      onCancel={onClose}
      width={800}
      centered
      footer={
        <Button onClick={onClose}>Đóng</Button>
      }
    >
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        pagination={false}
        size="middle"
        locale={{ emptyText: "Không có công việc cần thực hiện" }}
      />
    </Modal>
  );
};

export default QualityManagerReminderModal;
