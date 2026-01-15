import React from "react";
import { Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { LabTechnicianPendingTaskDto } from "../../../types/laboratoryTask";
import { formatDate } from "../../../utils/formatters";

const { Text, Link } = Typography;

interface LabTechnicianColumnsOptions {
  onOpenInNewTab: (
    record: LabTechnicianPendingTaskDto,
    e: React.MouseEvent
  ) => void;
}

const getTaskNameType = (
  record: LabTechnicianPendingTaskDto
): "warning" | "danger" | "secondary" => {
  if (record.rejectedCount > 0) {
    return "danger";
  }
  return "warning";
};

export const getLabTechnicianColumns = (
  options: LabTechnicianColumnsOptions
): ColumnsType<LabTechnicianPendingTaskDto> => [
  {
    title: "Hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    render: (text: string, record: LabTechnicianPendingTaskDto) => (
      <Link onClick={(e) => options.onOpenInNewTab(record, e)}>
        {text || "-"}
      </Link>
    ),
  },
  {
    title: "Tên công việc",
    dataIndex: "taskName",
    key: "taskName",
    render: (text: string, record: LabTechnicianPendingTaskDto) => (
      <Text type={getTaskNameType(record)} strong>
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
