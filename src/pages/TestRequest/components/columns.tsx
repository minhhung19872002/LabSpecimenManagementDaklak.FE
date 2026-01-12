import { Button, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  TestRequestDto,
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
  canEditTestRequest,
  canDeleteTestRequest,
  showActionsForTestRequest,
} from "../../../types/testRequest";
import { formatDate } from "../../../utils/formatters";
import StatusTag from "../../../components/common/StatusTag";

interface GetColumnsOptions {
  onEdit: (record: TestRequestDto) => void;
  onDelete: (id: string) => void;
  /** Có quyền chỉnh sửa/xóa theo Permission Matrix (BP Giao nhận, Admin) */
  canEditPermission?: boolean;
}

const getStatusTag = (status: TestRequestStatus) => {
  const label = TestRequestStatusLabels[status] || status.toString();
  const color = TestRequestStatusColors[status] || "default";
  return <StatusTag color={color}>{label}</StatusTag>;
};

export const getTestRequestColumns = (
  options: GetColumnsOptions
): ColumnsType<TestRequestDto> => [
  {
    title: "Số hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 140,
    fixed: "left",
    render: (value: string) => value || "-",
    sorter: (a, b) =>
      (a.contractNumber || "").localeCompare(b.contractNumber || ""),
  },
  {
    title: "Ngày yêu cầu",
    dataIndex: "requestDate",
    key: "requestDate",
    width: 130,
    render: (date: string) => formatDate(date),
    sorter: (a, b) =>
      dayjs(a.requestDate).unix() - dayjs(b.requestDate).unix(),
  },
  {
    title: "Ngày hoàn thành dự kiến",
    dataIndex: "expectedCompletionDate",
    key: "expectedCompletionDate",
    width: 180,
    render: (date: string) => formatDate(date),
  },
  {
    title: "Tên CS/DN",
    dataIndex: "customerName",
    key: "customerName",
    width: 200,
    ellipsis: true,
  },
  {
    title: "Người liên hệ",
    dataIndex: "contactPerson",
    key: "contactPerson",
    width: 150,
    ellipsis: true,
  },
  {
    title: "Điện thoại",
    dataIndex: "phone",
    key: "phone",
    width: 130,
  },
  {
    title: "Số mẫu",
    dataIndex: "totalSampleCount",
    key: "totalSampleCount",
    width: 80,
    align: "center" as const,
    render: (value: number) => value || 0,
  },
  {
    title: "Tổng tiền",
    dataIndex: "totalCost",
    key: "totalCost",
    width: 120,
    align: "right" as const,
    render: (value: number) =>
      value ? `${value.toLocaleString("vi-VN")}đ` : "-",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 140,
    fixed: "right" as const,
    render: (status: TestRequestStatus) => getStatusTag(status),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 80,
    fixed: "right",
    render: (_: unknown, record: TestRequestDto) => {
      // Check cả status và permission
      const canEditByStatus = canEditTestRequest(record.status);
      const canEditByPermission = options.canEditPermission !== false; // default true for backward compatibility
      const canEdit = canEditByStatus && canEditByPermission;
      const canDelete = canDeleteTestRequest(record.status) && canEditByPermission;
      const showActions = showActionsForTestRequest(record.status);

      // Nếu không có quyền theo Permission Matrix, ẩn luôn cột thao tác
      if (!canEditByPermission) {
        return null;
      }

      if (!showActions) {
        return null;
      }

      return (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => options.onEdit(record)}
            disabled={!canEdit}
            title={
              !canEdit ? "Không thể chỉnh sửa ở trạng thái này" : "Chỉnh sửa"
            }
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => options.onDelete(record.id)}
            okText="Có"
            cancelText="Không"
            disabled={!canDelete}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDelete}
              title={!canDelete ? "Không thể xóa ở trạng thái này" : "Xóa"}
            />
          </Popconfirm>
        </Space>
      );
    },
  },
];
