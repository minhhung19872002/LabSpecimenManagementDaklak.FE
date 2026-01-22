import { Button, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "../../../components/common/Icon";
import { TestDto, TestStatus } from "../../../types/test";
import StatusTag from "../../../components/common/StatusTag";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

interface GetColumnsOptions {
  onView: (id: string) => void;
  onEdit: (record: TestDto) => void;
  onDelete: (id: string) => void;
}

const getStatusColor = (status: TestStatus): string => {
  switch (status) {
    case TestStatus.Pending:
      return "default";
    case TestStatus.Assigned:
      return "blue";
    case TestStatus.InProgress:
      return "processing";
    case TestStatus.Completed:
      return "cyan";
    case TestStatus.Reviewed:
      return "orange";
    case TestStatus.Approved:
      return "green";
    default:
      return "default";
  }
};

const getStatusText = (status: TestStatus): string => {
  switch (status) {
    case TestStatus.Pending:
      return "Chờ xử lý";
    case TestStatus.Assigned:
      return "Đã giao";
    case TestStatus.InProgress:
      return "Đang thực hiện";
    case TestStatus.Completed:
      return "Hoàn thành";
    case TestStatus.Reviewed:
      return "Đã xem xét";
    case TestStatus.Approved:
      return "Đã phê duyệt";
    default:
      return "";
  }
};

export const getTestColumns = (options: GetColumnsOptions) => {
  // Check permissions
  const canEdit = authService.hasPermission(PERMISSIONS.Tests.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.Tests.Delete);

  return [
  {
    title: "Mã phép thử",
    dataIndex: "code",
    key: "code",
    width: 180,
    fixed: "left" as const,
    sorter: (a: TestDto, b: TestDto) => a.code.localeCompare(b.code),
  },
  {
    title: "Tên phép thử",
    dataIndex: "name",
    key: "name",
    width: 200,
    ellipsis: true,
  },
  {
    title: "Mã mẫu",
    dataIndex: "specimenCode",
    key: "specimenCode",
    width: 180,
  },
  {
    title: "Phương pháp",
    dataIndex: "method",
    key: "method",
    width: 150,
    ellipsis: true,
  },
  {
    title: "Tiêu chuẩn",
    dataIndex: "standard",
    key: "standard",
    width: 180,
    ellipsis: true,
  },
  {
    title: "Người thực hiện",
    dataIndex: "assigneeName",
    key: "assigneeName",
    width: 140,
    render: (name: string) => name || "-",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 130,
    render: (status: TestStatus) => (
      <StatusTag color={getStatusColor(status)}>{getStatusText(status)}</StatusTag>
    ),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 150,
    fixed: "right" as const,
    render: (_: unknown, record: TestDto) => {
      const isLocked = record.status === TestStatus.Approved;
      const lockedReason = isLocked
        ? "Không thể chỉnh sửa phép thử đã duyệt"
        : "";
      return (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => options.onView(record.id)}
          />
          {canEdit && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => options.onEdit(record)}
              disabled={isLocked}
              title={lockedReason}
            />
          )}
          {canDelete && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => options.onDelete(record.id)}
              okText="Có"
              cancelText="Không"
              disabled={isLocked}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isLocked}
                title={lockedReason}
              />
            </Popconfirm>
          )}
        </Space>
      );
    },
  },
];
};
