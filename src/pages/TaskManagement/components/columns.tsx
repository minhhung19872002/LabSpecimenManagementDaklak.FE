import React from "react";
import { Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  SendOutlined,
  CloseCircleOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  LaboratoryTaskDto,
  LaboratoryTaskStatus,
  LaboratoryTaskStatusLabels,
  LaboratoryTaskStatusColors,
} from "../../../types/laboratoryTask";
import { TestRequestStatus } from "../../../types/testRequest";
import { formatDate } from "../../../utils/formatters";
import StatusTag from "../../../components/common/StatusTag";
import { isTaskNearDeadline } from "../utils";

const { Text } = Typography;

interface GetColumnsOptions {
  onDelete: (id: string) => void;
  /** Có quyền xóa theo Permission Matrix (chỉ QLKT) */
  canDeletePermission?: boolean;
}

const getStatusTag = (
  status: LaboratoryTaskStatus,
  testRequestStatus?: TestRequestStatus,
) => {
  if (testRequestStatus === TestRequestStatus.Cancelled) {
    return (
      <StatusTag color="error" icon={<CloseCircleOutlined />}>
        Hủy bỏ yêu cầu
      </StatusTag>
    );
  }

  const label = LaboratoryTaskStatusLabels[status];
  const color = LaboratoryTaskStatusColors[status];

  const iconMap: Record<LaboratoryTaskStatus, React.ReactNode> = {
    [LaboratoryTaskStatus.UnderEvaluation]: <ClockCircleOutlined />,
    [LaboratoryTaskStatus.WaitingCustomerResponse]: <ClockCircleOutlined />,
    [LaboratoryTaskStatus.PartialAccepted]: <CheckCircleOutlined />,
    [LaboratoryTaskStatus.FullyAccepted]: <CheckCircleOutlined />,
    [LaboratoryTaskStatus.TestingRejected]: <CloseCircleOutlined />,
    [LaboratoryTaskStatus.Assigned]: <CheckCircleOutlined />,
    [LaboratoryTaskStatus.InProgress]: <SyncOutlined spin />,
    [LaboratoryTaskStatus.WaitingApproval]: <ClockCircleOutlined />,
    [LaboratoryTaskStatus.Approved]: <CheckCircleOutlined />,
    [LaboratoryTaskStatus.Rejected]: <CloseCircleOutlined />,
    [LaboratoryTaskStatus.SentToQuality]: <SendOutlined />,
    [LaboratoryTaskStatus.WaitingSharedSample]: <ClockCircleOutlined />,
  };

  return (
    <StatusTag color={color} icon={iconMap[status]}>
      {label}
    </StatusTag>
  );
};

export const getTaskManagementColumns = (
  _options: GetColumnsOptions,
): ColumnsType<LaboratoryTaskDto> => [
  {
    title: "Số hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 150,
    fixed: "left",
    render: (value: string) => value || "-",
  },
  {
    title: "Tổng số mẫu",
    dataIndex: "totalSampleCount",
    key: "totalSampleCount",
    width: 120,
    align: "center",
  },
  {
    title: "Quản lý kỹ thuật",
    dataIndex: "technicalManagerName",
    key: "technicalManagerName",
    width: 180,
    render: (value: string) => value || "-",
  },
  {
    title: "Ngày gửi khoa phòng",
    dataIndex: "transferDate",
    key: "transferDate",
    width: 160,
    render: (date: string, record: LaboratoryTaskDto) => {
      if (!date) return "-";
      const d = dayjs(date);
      const daysSinceTransfer = dayjs().diff(d, "day");
      const shouldHighlight =
        daysSinceTransfer >= 2 &&
        record.status === LaboratoryTaskStatus.UnderEvaluation;
      return (
        <span
          style={{
            color: shouldHighlight ? "#fa8c16" : undefined,
            fontWeight: shouldHighlight ? "bold" : undefined,
          }}
        >
          {d.format("DD/MM/YYYY")}
        </span>
      );
    },
  },
  {
    title: "Ngày YC xong",
    dataIndex: "requestCompletionDate",
    key: "requestCompletionDate",
    width: 130,
    render: (date: string, record: LaboratoryTaskDto) => {
      if (!date) return "-";
      const d = dayjs(date);
      // Cùng điều kiện với highlight dòng đỏ (4 trạng thái BA, ≤ 7 ngày)
      const isUrgent = isTaskNearDeadline(record);
      return (
        <span
          style={{
            color: isUrgent ? "#cf1322" : undefined,
            fontWeight: isUrgent ? "bold" : undefined,
          }}
        >
          {d.format("DD/MM/YYYY")}
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
    dataIndex: "status",
    key: "status",
    width: 180,
    render: (status: LaboratoryTaskStatus, record: LaboratoryTaskDto) =>
      getStatusTag(status, record.testRequestStatus),
  },
  // {
  //   title: "Thao tác",
  //   key: "action",
  //   width: 100,
  //   fixed: "right",
  //   render: (_: unknown, record: LaboratoryTaskDto) => {
  //     // Check permission - nếu không có quyền xóa, ẩn luôn cột thao tác
  //     const canDeleteByPermission = options.canDeletePermission !== false;
  //     if (!canDeleteByPermission) {
  //       return null;
  //     }

  //     const canEdit =
  //       record.status === LaboratoryTaskStatus.UnderEvaluation ||
  //       record.status === LaboratoryTaskStatus.FullyAccepted ||
  //       record.status === LaboratoryTaskStatus.PartialAccepted ||
  //       record.status === LaboratoryTaskStatus.Assigned;

  //     const lockedReason = getLockedMessage(record.status);

  //     return (
  //       <Space size="small">
  //         {/* <Tooltip title={!canEdit ? lockedReason : "Xóa"}>
  //           <Button
  //             type="text"
  //             size="small"
  //             danger
  //             icon={<DeleteOutlined />}
  //             onClick={() => options.onDelete(record.id)}
  //             disabled={!canEdit}
  //           />
  //         </Tooltip> */}
  //       </Space>
  //     );
  //   },
  // },
];
