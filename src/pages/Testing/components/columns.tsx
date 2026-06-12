import React from "react";
import { Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import {
  TestingListDto,
  TestingStatus,
  TestingStatusLabels,
  TestingStatusColors,
} from "../../../types/testing";
import { TestRequestStatus } from "../../../types/testRequest";
import { formatDate } from "../../../utils/formatters";
import StatusTag from "../../../components/common/StatusTag";

const { Text } = Typography;

const getStatusTag = (
  status: TestingStatus,
  testRequestStatus?: TestRequestStatus,
) => {
  if (testRequestStatus === TestRequestStatus.Cancelled) {
    return (
      <StatusTag color="error" icon={<CloseCircleOutlined />}>
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
    [TestingStatus.Rejected]: <CloseCircleOutlined />,
    [TestingStatus.Completed]: <CheckCircleOutlined />,
    [TestingStatus.CannotTest]: <StopOutlined />,
  };

  return (
    <StatusTag color={color} icon={iconMap[status]}>
      {label}
    </StatusTag>
  );
};

export const getTestingColumns = (): ColumnsType<TestingListDto> => [
  {
    title: "Số hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 150,
    fixed: "left",
    render: (value: string) => value || "-",
  },
  {
    title: "Tổng mẫu",
    dataIndex: "totalSampleCount",
    key: "totalSampleCount",
    width: 100,
    align: "center",
  },
  {
    title: "Tổng CT",
    dataIndex: "totalIndicatorCount",
    key: "totalIndicatorCount",
    width: 100,
    align: "center",
  },
  {
    title: "Thử nghiệm viên",
    dataIndex: "technicianNames",
    key: "technicianNames",
    width: 180,
    ellipsis: true,
    render: (value: string) => value || "-",
  },
  {
    title: "Ngày chuyển đi",
    dataIndex: "transferDate",
    key: "transferDate",
    width: 140,
    render: (date: string) => formatDate(date),
  },
  {
    title: "Ngày YC xong",
    dataIndex: "requestCompletionDate",
    key: "requestCompletionDate",
    width: 130,
    render: (date: string, record: TestingListDto) => {
      if (!date) return "-";
      const shouldHighlight =
        record.isUrgent && record.testingStatus !== TestingStatus.Completed;
      return (
        <span
          style={{
            color: shouldHighlight ? "#ff4d4f" : undefined,
            fontWeight: shouldHighlight ? "bold" : undefined,
          }}
        >
          {formatDate(date)}
        </span>
      );
    },
  },
  {
    title: "Ngày thử nghiệm",
    dataIndex: "testDate",
    key: "testDate",
    width: 140,
    render: (date: string) =>
      date ? formatDate(date) : <Text type="secondary">Chưa đặt</Text>,
  },
  {
    title: "Trạng thái",
    dataIndex: "testingStatus",
    key: "testingStatus",
    width: 150,
    render: (status: TestingStatus, record: TestingListDto) =>
      getStatusTag(status, record.testRequestStatus),
  },
];
