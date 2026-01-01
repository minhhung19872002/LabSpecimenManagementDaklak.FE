import React from "react";
import { Modal, Table, Button, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { QualityManagerPendingTaskDto, QualityManagementStatus } from "../../types/qualityManagement";
import { formatDate } from "../../utils/formatters";

const { Text, Link } = Typography;

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

  // Open in new tab - link to /quality-management
  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open("/quality-management", "_blank");
  };

  // Get task name color based on status and deadline
  const getTaskNameType = (record: QualityManagerPendingTaskDto): "warning" | "danger" | "secondary" => {
    if (record.status === QualityManagementStatus.PendingApproval) {
      return "warning";
    }
    if (record.status === QualityManagementStatus.Approved || record.status === QualityManagementStatus.PendingSignature) {
      return "warning";
    }
    // "Sắp tới ngày trả kết quả" - danger if <= 2 days
    if (record.daysUntilDeadline !== undefined && record.daysUntilDeadline <= 2) {
      return "danger";
    }
    return "warning";
  };

  const columns: ColumnsType<QualityManagerPendingTaskDto> = [
    {
      title: "Hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      render: (text: string) => (
        <Link
          href="/quality-management"
          target="_blank"
          onClick={handleOpenInNewTab}
        >
          {text || "-"}
        </Link>
      ),
    },
    {
      title: "Tên công việc",
      dataIndex: "taskName",
      key: "taskName",
      render: (text: string, record: QualityManagerPendingTaskDto) => (
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
      render: (date: string | undefined) => formatDate(date),
    },
    {
      title: "Ngày YC xong",
      dataIndex: "requestCompletionDate",
      key: "requestCompletionDate",
      render: (date: string | undefined, record: QualityManagerPendingTaskDto) => {
        const formatted = formatDate(date);
        // Highlight if deadline is close (<=5 days)
        if (record.daysUntilDeadline !== undefined && record.daysUntilDeadline <= 5) {
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

export default QualityManagerReminderModal;
