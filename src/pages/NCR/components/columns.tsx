import React from "react";
import { Button, Space, Tag, Popconfirm, Tooltip } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "../../../components/common/Icon";
import dayjs from "dayjs";
import { NCRStatus } from "../../../services/ncrService";
import { NCRDisplay, NCR_TYPES, SEVERITY_CONFIG, STATUS_CONFIG } from "../hooks";
import StatusTag from "../../../components/common/StatusTag";
import SyncStatusTag from "../../../components/common/SyncStatusTag";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

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
    render: (text: string, record: NCRDisplay) => {
      const link = (
        <a onClick={() => onView(record)}>
          <Space>
            <WarningOutlined style={{ color: "#faad14" }} />
            {text || "-"}
          </Space>
        </a>
      );
      return record.syncStatus ? (
        <Space direction="vertical" size={2}>
          {link}
          <SyncStatusTag record={record} />
        </Space>
      ) : (
        link
      );
    },
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
      return (
        <Tag style={{ backgroundColor: config?.color || "#8C8C8C", color: "#FFFFFF", border: "none", borderRadius: 18, padding: "2px 8px" }}>
          {config?.label}
        </Tag>
      );
    },
  },
  {
    title: "Mức độ",
    dataIndex: "severity",
    key: "severity",
    width: 120,
    render: (severity: number) => (
      <Tag style={{ backgroundColor: SEVERITY_CONFIG[severity]?.color || "#8C8C8C", color: "#FFFFFF", border: "none", borderRadius: 18, padding: "2px 8px" }}>
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
      <StatusTag color={STATUS_CONFIG[status]?.color} icon={getStatusIcon(status)}>
        {STATUS_CONFIG[status]?.text}
      </StatusTag>
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

      const canEdit = authService.hasPermission(PERMISSIONS.NCRs.Edit);
      const canDelete = authService.hasPermission(PERMISSIONS.NCRs.Delete);

      return (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          {canEdit && (
            <Tooltip title={isLocked ? lockedReason : "Chỉnh sửa"}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                disabled={isLocked}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="Xóa NCR?"
              onConfirm={() => onDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              disabled={isLocked}
            >
              <Tooltip title={isLocked ? lockedReason : "Xóa"}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={isLocked}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      );
    },
  },
];
