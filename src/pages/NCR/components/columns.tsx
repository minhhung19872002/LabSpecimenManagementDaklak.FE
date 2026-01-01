import React from "react";
import { Button, Space, Tag, Popconfirm } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { NCRStatus } from "../../../services/ncrService";
import { NCRDisplay, NCR_TYPES, SEVERITY_CONFIG, STATUS_CONFIG } from "../hooks";

interface ColumnActions {
  onView: (record: NCRDisplay) => void;
  onEdit: (record: NCRDisplay) => void;
  onDelete: (id: string) => void;
}

const getStatusIcon = (status: number): React.ReactNode => {
  switch (status) {
    case NCRStatus.Open:
      return <ExclamationCircleOutlined />;
    case NCRStatus.InProgress:
      return <ClockCircleOutlined />;
    case NCRStatus.Resolved:
    case NCRStatus.Closed:
      return <CheckCircleOutlined />;
    default:
      return <ExclamationCircleOutlined />;
  }
};

export const getNCRColumns = ({ onView, onEdit, onDelete }: ColumnActions) => [
  {
    title: "Mã NCR",
    dataIndex: "ncrNumber",
    key: "ncrNumber",
    width: 180,
    fixed: "left" as const,
    render: (text: string, record: NCRDisplay) => (
      <a onClick={() => onView(record)}>
        <Space>
          <WarningOutlined style={{ color: "#faad14" }} />
          {text}
        </Space>
      </a>
    ),
  },
  {
    title: "Tiêu đề",
    dataIndex: "title",
    key: "title",
    width: 200,
    ellipsis: true,
  },
  {
    title: "Loại",
    dataIndex: "type",
    key: "type",
    width: 140,
    render: (type: number) => {
      const config = NCR_TYPES.find((t) => t.value === type);
      return <Tag color={config?.color}>{config?.label}</Tag>;
    },
  },
  {
    title: "Mức độ",
    dataIndex: "severity",
    key: "severity",
    width: 120,
    render: (severity: number) => (
      <Tag color={SEVERITY_CONFIG[severity]?.color}>
        {SEVERITY_CONFIG[severity]?.text}
      </Tag>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 130,
    render: (status: number) => (
      <Tag color={STATUS_CONFIG[status]?.color} icon={getStatusIcon(status)}>
        {STATUS_CONFIG[status]?.text}
      </Tag>
    ),
  },
  {
    title: "Phòng ban",
    dataIndex: "department",
    key: "department",
    width: 140,
  },
  {
    title: "Hạn xử lý",
    dataIndex: "dueDate",
    key: "dueDate",
    width: 120,
    render: (date: string, record: NCRDisplay) => {
      const isOverdue =
        record.status !== NCRStatus.Closed && dayjs(date).isBefore(dayjs());
      return (
        <span style={{ color: isOverdue ? "#cf1322" : undefined }}>
          {dayjs(date).format("DD/MM/YYYY")}
        </span>
      );
    },
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 120,
    fixed: "right" as const,
    render: (_: unknown, record: NCRDisplay) => {
      const isLocked =
        record.status === NCRStatus.Closed ||
        record.status === NCRStatus.Cancelled;
      const lockedReason =
        record.status === NCRStatus.Closed
          ? "Không thể chỉnh sửa NCR đã đóng"
          : record.status === NCRStatus.Cancelled
          ? "Không thể chỉnh sửa NCR đã hủy"
          : "";
      return (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            disabled={isLocked}
            title={lockedReason}
          />
          <Popconfirm
            title="Xóa NCR?"
            onConfirm={() => onDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            disabled={isLocked}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={isLocked}
              title={lockedReason}
            />
          </Popconfirm>
        </Space>
      );
    },
  },
];
