import React from "react";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  StopOutlined,
} from "../../../../components/common/Icon";
import {
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
} from "../../../../types/testing";
import { TestRequestStatus } from "../../../../types/testRequest";
import StatusTag from "../../../../components/common/StatusTag";

export const getStatusTag = (
  status: TestingStatus,
  testRequestStatus?: TestRequestStatus,
) => {
  if (testRequestStatus === TestRequestStatus.Cancelled) {
    return (
      <StatusTag
        color="error"
        icon={<StopOutlined />}
        style={{ fontSize: 14, padding: "2px 10px" }}
      >
        Hủy bỏ yêu cầu
      </StatusTag>
    );
  }

  const label = TestingStatusLabels[status];
  const color = TestingStatusColors[status];

  const iconMap: Record<TestingStatus, React.ReactNode> = {
    [TestingStatus.NotStarted]: <ClockCircleOutlined />,
    [TestingStatus.InProgress]: <SyncOutlined spin />,
    [TestingStatus.PendingApproval]: <ClockCircleOutlined />,
    [TestingStatus.Rejected]: <WarningOutlined />,
    [TestingStatus.Completed]: <CheckCircleOutlined />,
    [TestingStatus.CannotTest]: <StopOutlined />,
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
