import React from "react";
import { Modal, Table, Button, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LabTechManagerPendingTaskDto, LaboratoryTaskStatus } from "../../types/laboratoryTask";
import { formatDate } from "../../utils/formatters";

const { Text, Link } = Typography;

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

  // Open in new tab
  const handleOpenInNewTab = (record: LabTechManagerPendingTaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/tasks/${record.id}`, "_blank");
  };

  // Get task name color based on status and deadline
  const getTaskNameType = (record: LabTechManagerPendingTaskDto): "warning" | "danger" | "secondary" => {
    if (record.status === LaboratoryTaskStatus.PendingApproval) {
      return "warning";
    }
    if (record.status === LaboratoryTaskStatus.NotAssigned) {
      return "warning";
    }
    // "Sắp tới ngày trả kết quả" - danger if <= 2 days
    if (record.daysUntilDeadline !== null && record.daysUntilDeadline <= 2) {
      return "danger";
    }
    return "warning";
  };

  const columns: ColumnsType<LabTechManagerPendingTaskDto> = [
    {
      title: "Hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      render: (text: string, record: LabTechManagerPendingTaskDto) => (
        <Link
          href={`/tasks/${record.id}`}
          target="_blank"
          onClick={(e) => handleOpenInNewTab(record, e)}
        >
          {text || "-"}
        </Link>
      ),
    },
    {
      title: "Tên công việc",
      dataIndex: "taskName",
      key: "taskName",
      render: (text: string, record: LabTechManagerPendingTaskDto) => (
        <Text
          type={getTaskNameType(record)}
          strong
        >
          {text}
        </Text>
      ),
    },
    {
      title: "Ngày chuyển giao",
      dataIndex: "transferDate",
      key: "transferDate",
      render: (date: string | null) => formatDate(date),
    },
    {
      title: "Ngày YC xong",
      dataIndex: "requestCompletionDate",
      key: "requestCompletionDate",
      render: (date: string | null, record: LabTechManagerPendingTaskDto) => {
        const formatted = formatDate(date);
        // Highlight if deadline is close (<=5 days)
        if (record.daysUntilDeadline !== null && record.daysUntilDeadline <= 5) {
          return (
            <Text type={record.daysUntilDeadline <= 2 ? "danger" : "warning"} strong>
              {formatted}
            </Text>
          );
        }
        return formatted;
      },
    },
  ];

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
