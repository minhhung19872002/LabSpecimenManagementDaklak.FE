import React, { useMemo } from "react";
import { Modal, Table, Button } from "antd";
import { LabTechManagerPendingTaskDto } from "../../types/laboratoryTask";
import { getLabTechManagerColumns } from "./columns";

interface LabTechManagerReminderModalProps {
  open: boolean;
  tasks: LabTechManagerPendingTaskDto[];
  onClose: () => void;
}

const LabTechManagerReminderModal: React.FC<LabTechManagerReminderModalProps> = ({
  open,
  tasks,
  onClose,
}) => {

  const handleOpenInNewTab = (record: LabTechManagerPendingTaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/tasks/${record.id}`, "_blank");
  };

  const columns = useMemo(
    () => getLabTechManagerColumns({ onOpenInNewTab: handleOpenInNewTab }),
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

export default LabTechManagerReminderModal;
