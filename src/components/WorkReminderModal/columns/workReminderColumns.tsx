import React from "react";
import { Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SampleReceiverPendingTaskDto, TestRequestStatus } from "../../../types/testRequest";
import { formatDate } from "../../../utils/formatters";

const { Text, Link } = Typography;

interface WorkReminderColumnsOptions {
  onOpenInNewTab: (record: SampleReceiverPendingTaskDto, e: React.MouseEvent) => void;
}

export const getWorkReminderColumns = (
  options: WorkReminderColumnsOptions
): ColumnsType<SampleReceiverPendingTaskDto> => [
  {
    title: "Hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    render: (text: string, record: SampleReceiverPendingTaskDto) => (
      <Link
        href={`/test-requests/${record.id}`}
        target="_blank"
        onClick={(e) => options.onOpenInNewTab(record, e)}
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
        type={record.status === TestRequestStatus.New ? "warning" : "secondary"}
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
