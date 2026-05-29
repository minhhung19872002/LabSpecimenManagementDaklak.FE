import React, { useCallback, useMemo } from "react";
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

  const handleOpenInNewTab = useCallback(
    (record: LabTechManagerPendingTaskDto, e: React.MouseEvent) => {
      e.stopPropagation();
      if (record.taskType === "IndicatorMethodSetup") {
        window.open("/master-data?tab=indicators", "_blank");
      } else {
        window.open(`/tasks/${record.id}`, "_blank");
      }
    },
    []
  );

  const columns = useMemo(
    () => getLabTechManagerColumns({ onOpenInNewTab: handleOpenInNewTab }),
    [handleOpenInNewTab]
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

export default LabTechManagerReminderModal;
