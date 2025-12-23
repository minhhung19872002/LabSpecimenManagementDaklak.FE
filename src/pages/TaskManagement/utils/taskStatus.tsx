import React from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  LaboratoryTaskStatusLabels,
  LaboratoryTaskStatusColors,
} from "../../../types/laboratoryTask";
import { URGENT_DAYS_THRESHOLD } from "../constants/taskManagement.constants";

const STATUS_ICONS: Record<LaboratoryTaskStatus, React.ReactNode> = {
  [LaboratoryTaskStatus.NotAssignedMethod]: <ClockCircleOutlined />,
  [LaboratoryTaskStatus.AssignedMethod]: <CheckCircleOutlined />,
  [LaboratoryTaskStatus.Testing]: <SyncOutlined spin />,
  [LaboratoryTaskStatus.PendingApproval]: <ClockCircleOutlined />,
  [LaboratoryTaskStatus.Approved]: <CheckCircleOutlined />,
  [LaboratoryTaskStatus.ResultSent]: <SendOutlined />,
};

export const renderStatusTag = (status: LaboratoryTaskStatus) => {
  const label = LaboratoryTaskStatusLabels[status];
  const color = LaboratoryTaskStatusColors[status];
  const icon = STATUS_ICONS[status];

  return (
    <Tag color={color} icon={icon}>
      {label}
    </Tag>
  );
};

export const isTaskUrgent = (record: LaboratoryTaskDto): boolean => {
  if (!record.requestCompletionDate) return false;
  if (
    record.status === LaboratoryTaskStatus.Approved ||
    record.status === LaboratoryTaskStatus.ResultSent
  ) {
    return false;
  }
  const daysRemaining = dayjs(record.requestCompletionDate).diff(dayjs(), "day");
  return daysRemaining <= URGENT_DAYS_THRESHOLD;
};

export const canEditTask = (status: LaboratoryTaskStatus): boolean => {
  return (
    status === LaboratoryTaskStatus.NotAssignedMethod ||
    status === LaboratoryTaskStatus.AssignedMethod
  );
};

export const getLockedMessage = (status: LaboratoryTaskStatus): string => {
  switch (status) {
    case LaboratoryTaskStatus.Testing:
      return "Không thể chỉnh sửa khi đang thí nghiệm";
    case LaboratoryTaskStatus.PendingApproval:
      return "Không thể chỉnh sửa khi đang chờ duyệt";
    case LaboratoryTaskStatus.Approved:
      return "Không thể chỉnh sửa khi đã duyệt";
    case LaboratoryTaskStatus.ResultSent:
      return "Không thể chỉnh sửa khi đã gửi kết quả";
    default:
      return "";
  }
};
