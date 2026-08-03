import React from "react";
import { Button, Space, Tag, Tooltip } from "antd";
import { HistoryOutlined, WarningOutlined, AuditOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  QualityManagementTaskDto,
  QualityManagementStatus,
  QualityManagementStatusLabels,
  QualityManagementStatusColors,
  QualityTaskType,
} from "../../../types/qualityManagement";
import StatusTag from "../../../components/common/StatusTag";
import { getStatusColor } from "../../../components/common/statusColors";

interface GetColumnsOptions {
  onViewHistory: (record: QualityManagementTaskDto, e: React.MouseEvent) => void;
  onViewChangeApproval: (record: QualityManagementTaskDto, e: React.MouseEvent) => void;
}

const getStatusTag = (status: QualityManagementStatus) => (
  <StatusTag color={QualityManagementStatusColors[status]}>
    {QualityManagementStatusLabels[status]}
  </StatusTag>
);

const isUrgent = (record: QualityManagementTaskDto): boolean => {
  if (!record.requestCompletionDate) return false;
  // Không cảnh báo urgent nếu đã HandedOver (hoàn thành)
  if (record.status === QualityManagementStatus.HandedOver) return false;
  const daysRemaining = dayjs(record.requestCompletionDate).diff(dayjs(), "day");
  return daysRemaining <= 2;
};

export const getQualityManagementColumns = (
  options: GetColumnsOptions
): ColumnsType<QualityManagementTaskDto> => [
  {
    title: "Số hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 150,
    fixed: "left" as const,
    render: (text: string, record: QualityManagementTaskDto) => (
      <Space>
        <span style={{ fontWeight: 500 }}>{text}</span>
        {record.taskType === QualityTaskType.ChangeApproval && (
          <Tag style={{ backgroundColor: "#FA8C16", color: "#FFFFFF", border: "none", borderRadius: 18, padding: "2px 8px", fontSize: 10 }}>Thay đổi</Tag>
        )}
      </Space>
    ),
  },
  {
    title: "Tổng số mẫu",
    dataIndex: "totalSampleCount",
    key: "totalSampleCount",
    width: 100,
    align: "center" as const,
  },
  {
    title: "Tổng số chỉ tiêu",
    dataIndex: "totalIndicatorCount",
    key: "totalIndicatorCount",
    width: 120,
    align: "center" as const,
    render: (total: number, record: QualityManagementTaskDto) => {
      const pending = record.pendingApprovalIndicatorCount ?? 0;
      const approved = record.approvedIndicatorCount ?? 0;
      const showPending =
        pending > 0 ||
        record.status === QualityManagementStatus.PendingApproval;
      const showApproved =
        record.status === QualityManagementStatus.PendingPublish ||
        record.status === QualityManagementStatus.PartialPublished ||
        record.status === QualityManagementStatus.FullyPublished;

      if (!showPending && !showApproved) {
        return total;
      }

      const current = showPending ? pending : approved;
      const colorStatus = showApproved
        ? QualityManagementStatus.FullyPublished
        : QualityManagementStatus.PendingApproval;
      const color = getStatusColor(QualityManagementStatusColors[colorStatus]);
      const label = showApproved && showPending
        ? "chỉ tiêu chờ QLCL duyệt"
        : showPending
          ? "chỉ tiêu chờ duyệt"
          : record.status === QualityManagementStatus.PendingPublish
            ? "chỉ tiêu chờ phát hành"
            : "chỉ tiêu đã phát hành";

      return (
        <Tooltip title={`${current} ${label} / ${total} tổng`}>
          <span>
            <span style={{ color, fontWeight: 600 }}>
              {current}
            </span>
            <span style={{ color: "#999" }}> / {total}</span>
          </span>
        </Tooltip>
      );
    },
  },
  {
    title: "Khoa phòng",
    dataIndex: "laboratoryNames",
    key: "laboratoryNames",
    width: 200,
    ellipsis: true,
  },
  {
    title: "Ngày chuyển đi",
    dataIndex: "transferDate",
    key: "transferDate",
    width: 120,
    render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
  },
  {
    title: "Ngày YC xong",
    dataIndex: "requestCompletionDate",
    key: "requestCompletionDate",
    width: 120,
    render: (date: string, record: QualityManagementTaskDto) => {
      if (!date) return "-";
      const formatted = dayjs(date).format("DD/MM/YYYY");
      if (isUrgent(record)) {
        return (
          <span style={{ color: "#ff4d4f", fontWeight: 500 }}>
            <WarningOutlined style={{ marginRight: 4 }} />
            {formatted}
          </span>
        );
      }
      return formatted;
    },
  },
  {
    title: "Ngày gửi KQ",
    dataIndex: "creationTime",
    key: "creationTime",
    width: 120,
    render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 140,
    fixed: "right" as const,
    render: (status: QualityManagementStatus) => getStatusTag(status),
  },
  {
    title: "Ngày phát hành BC",
    dataIndex: "latestApprovalDate",
    key: "latestApprovalDate",
    width: 140,
    render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 100,
    fixed: "right" as const,
    align: "center" as const,
    render: (_: unknown, record: QualityManagementTaskDto) => (
      <Space size="small">
        {record.taskType === QualityTaskType.ChangeApproval && (
          <Button
            type="text"
            icon={<AuditOutlined />}
            onClick={(e) => options.onViewChangeApproval(record, e)}
            title="Xem xét thay đổi"
          />
        )}
        <Button
          type="text"
          icon={<HistoryOutlined />}
          onClick={(e) => options.onViewHistory(record, e)}
          title="Xem lịch sử"
        />
      </Space>
    ),
  },
];
