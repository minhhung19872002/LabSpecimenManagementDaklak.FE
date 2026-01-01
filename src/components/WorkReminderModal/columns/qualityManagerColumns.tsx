import React from "react";
import { Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { QualityManagerPendingTaskDto, QualityManagementStatus } from "../../../types/qualityManagement";
import { formatDate } from "../../../utils/formatters";

const { Text, Link } = Typography;

interface QualityManagerColumnsOptions {
  onOpenInNewTab: (e: React.MouseEvent) => void;
}

const getTaskNameType = (
  record: QualityManagerPendingTaskDto
): "warning" | "danger" | "secondary" => {
  if (record.status === QualityManagementStatus.PendingApproval) {
    return "warning";
  }
  if (record.status === QualityManagementStatus.Approved || record.status === QualityManagementStatus.PendingSignature) {
    return "warning";
  }
  if (record.daysUntilDeadline !== undefined && record.daysUntilDeadline <= 2) {
    return "danger";
  }
  return "warning";
};

export const getQualityManagerColumns = (
  options: QualityManagerColumnsOptions
): ColumnsType<QualityManagerPendingTaskDto> => [
  {
    title: "Hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    render: (text: string) => (
      <Link
        href="/quality-management"
        target="_blank"
        onClick={options.onOpenInNewTab}
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
