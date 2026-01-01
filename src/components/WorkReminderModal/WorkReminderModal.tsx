import React from "react";
import { Modal, Table, Button, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SampleReceiverPendingTaskDto, TestRequestStatus } from "../../types/testRequest";
import { formatDate } from "../../utils/formatters";

const { Text, Link } = Typography;

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

  // Open in new tab
  const handleOpenInNewTab = (record: SampleReceiverPendingTaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/test-requests/${record.id}`, "_blank");
  };

  const columns: ColumnsType<SampleReceiverPendingTaskDto> = [
    {
      title: "Hợp đồng",
      dataIndex: "contractNumber",
      key: "contractNumber",
      render: (text: string, record: SampleReceiverPendingTaskDto) => (
        <Link
          href={`/test-requests/${record.id}`}
          target="_blank"
          onClick={(e) => handleOpenInNewTab(record, e)}
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Tên công việc",
      dataIndex: "taskName",
      key: "taskName",
      render: (text: string, record: SampleReceiverPendingTaskDto) => (
        <Text
          type={record.status === TestRequestStatus.Pending ? "warning" : "secondary"}
          strong
        >
          {text}
        </Text>
      ),
    },
    {
      title: "Ngày chuyển giao",
      dataIndex: "pendingDate",
      key: "pendingDate",
      render: (date: string | null) => formatDate(date),
    },
    {
      title: "Ngày YC xong",
      dataIndex: "expectedCompletionDate",
      key: "expectedCompletionDate",
      render: (date: string | null) => formatDate(date),
    },
  ];

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
