import React from "react";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WarningOutlined,
} from "../../../../components/common/Icon";
import {
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
} from "../../../../types/testing";
import StatusTag from "../../../../components/common/StatusTag";

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
    <StatusTag
      color={color}
      icon={iconMap[status]}
      style={{ fontSize: 14, padding: "2px 10px" }}
    >
      {label}
    </StatusTag>
  );
};
