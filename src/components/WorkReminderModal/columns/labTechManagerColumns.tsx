import React from "react";
import { Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LabTechManagerPendingTaskDto, LaboratoryTaskStatus } from "../../../types/laboratoryTask";
import { formatDate } from "../../../utils/formatters";

const { Text, Link } = Typography;

interface LabTechManagerColumnsOptions {
  onOpenInNewTab: (record: LabTechManagerPendingTaskDto, e: React.MouseEvent) => void;
}

const getTaskNameType = (
  record: LabTechManagerPendingTaskDto
): "warning" | "danger" | "secondary" => {
  if (record.status === LaboratoryTaskStatus.PendingApproval) {
    return "warning";
  }
  if (record.status === LaboratoryTaskStatus.NotAssigned) {
    return "warning";
  }
  if (record.daysUntilDeadline !== null && record.daysUntilDeadline <= 2) {
    return "danger";
  }
  return "warning";
};

export const getLabTechManagerColumns = (
  options: LabTechManagerColumnsOptions
): ColumnsType<LabTechManagerPendingTaskDto> => [
  {
    title: "Hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    render: (text: string, record: LabTechManagerPendingTaskDto) => (
      <Link
        href={`/tasks/${record.id}`}
        target="_blank"
        onClick={(e) => options.onOpenInNewTab(record, e)}
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
