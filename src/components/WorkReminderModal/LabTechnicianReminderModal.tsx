import React, { useMemo } from "react";
import { Modal, Table, Button } from "antd";
import { LabTechnicianPendingTaskDto } from "../../types/laboratoryTask";
import { getLabTechnicianColumns } from "./columns";

interface LabTechnicianReminderModalProps {
  open: boolean;
  tasks: LabTechnicianPendingTaskDto[];
  onClose: () => void;
}

const LabTechnicianReminderModal: React.FC<LabTechnicianReminderModalProps> = ({
  open,
  tasks,
  onClose,
}) => {

  const handleOpenInNewTab = (record: LabTechnicianPendingTaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/testing/${record.id}`, "_blank");
  };

  const columns = useMemo(
    () => getLabTechnicianColumns({ onOpenInNewTab: handleOpenInNewTab }),
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
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        },
      }}
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

export default LabTechnicianReminderModal;
