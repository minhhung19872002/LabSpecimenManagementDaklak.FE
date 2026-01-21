import React, { useMemo } from "react";
import { Modal, Table, Button } from "antd";
import { SampleReceiverPendingTaskDto } from "../../types/testRequest";
import { getWorkReminderColumns } from "./columns";

interface WorkReminderModalProps {
  open: boolean;
  tasks: SampleReceiverPendingTaskDto[];
  onClose: () => void;
}

const WorkReminderModal: React.FC<WorkReminderModalProps> = ({
  open,
  tasks,
  onClose,
}) => {

  const handleOpenInNewTab = (record: SampleReceiverPendingTaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/test-requests/${record.id}`, "_blank");
  };

  const columns = useMemo(
    () => getWorkReminderColumns({ onOpenInNewTab: handleOpenInNewTab }),
    []
  );

  return (
    <Modal
      title="Công việc cần thực hiện"
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

export default WorkReminderModal;
