import React from "react";
import { Modal, Table, Button, Typography } from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import { LabTechnicianPendingTaskDto } from "../../types/laboratoryTask";

const { Text, Link } = Typography;

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
  const formatDate = (date: string | null) =>
    date ? dayjs(date).format("DD/MM/YYYY") : "-";

  // Open in new tab
  const handleOpenInNewTab = (record: LabTechnicianPendingTaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/testing/${record.id}`, "_blank");
  };

  // Get task name color based on priority
  const getTaskNameType = (record: LabTechnicianPendingTaskDto): "warning" | "danger" | "secondary" => {
    // "Có kết quả cần thực hiện lại" (Rejected) -> danger
    if (record.rejectedCount > 0) {
      return "danger";
    }
    // "Có kết quả chỉ tiêu cần gửi" (Entered) -> warning
    // "Có chỉ tiêu cần thực hiện" (Pending) -> warning
    return "warning";
  };

  const columns: ColumnsType<LabTechnicianPendingTaskDto> = [
    {
      title: "Hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      render: (text: string, record: LabTechnicianPendingTaskDto) => (
        <Link
          href={`/testing/${record.id}`}
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
      render: (text: string, record: LabTechnicianPendingTaskDto) => (
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
      render: (date: string | null) => formatDate(date),
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

export default LabTechnicianReminderModal;
