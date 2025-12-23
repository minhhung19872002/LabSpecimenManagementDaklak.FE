import React from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
  TestingListDto,
} from "../../../types/testing";

const STATUS_ICONS: Record<TestingStatus, React.ReactNode> = {
  [TestingStatus.Todo]: <ClockCircleOutlined />,
  [TestingStatus.InProgress]: <SyncOutlined spin />,
  [TestingStatus.Done]: <CheckCircleOutlined />,
};

export const renderStatusTag = (status: TestingStatus) => {
  const label = TestingStatusLabels[status];
  const color = TestingStatusColors[status];
  const icon = STATUS_ICONS[status];

  return (
    <Tag color={color} icon={icon}>
      {label}
    </Tag>
  );
};

export const isTaskUrgent = (record: TestingListDto): boolean => {
  return record.isUrgent && record.testingStatus !== TestingStatus.Done;
};
