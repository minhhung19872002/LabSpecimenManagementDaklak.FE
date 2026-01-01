import React from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
} from "../../../../types/testing";

export const getStatusTag = (status: TestingStatus) => {
  const label = TestingStatusLabels[status];
  const color = TestingStatusColors[status];

  const iconMap: Record<TestingStatus, React.ReactNode> = {
    [TestingStatus.NotStarted]: <ClockCircleOutlined />,
    [TestingStatus.InProgress]: <SyncOutlined spin />,
    [TestingStatus.PendingApproval]: <ClockCircleOutlined />,
    [TestingStatus.Rejected]: <WarningOutlined />,
    [TestingStatus.Completed]: <CheckCircleOutlined />,
  };

  return (
    <Tag
      color={color}
      icon={iconMap[status]}
      style={{ fontSize: 14, padding: "4px 12px" }}
    >
      {label}
    </Tag>
  );
};
