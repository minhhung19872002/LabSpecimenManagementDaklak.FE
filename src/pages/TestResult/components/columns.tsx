import { Button, Space, Tag, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "../../../components/common/Icon";
import { TestResultDto, ResultApprovalStatus } from "../../../types/testResult";
import StatusTag from "../../../components/common/StatusTag";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

interface GetColumnsOptions {
  onView: (id: string) => void;
  onEdit: (record: TestResultDto) => void;
  onDelete: (id: string) => void;
}

const getApprovalStatusColor = (status: ResultApprovalStatus): string => {
  switch (status) {
    case ResultApprovalStatus.Draft:
      return "default";
    case ResultApprovalStatus.Submitted:
      return "blue";
    case ResultApprovalStatus.Step1Reviewed:
      return "cyan";
    case ResultApprovalStatus.Step2Approved:
      return "green";
    case ResultApprovalStatus.Rejected:
      return "red";
    default:
      return "default";
  }
};

const getApprovalStatusText = (status: ResultApprovalStatus): string => {
  switch (status) {
    case ResultApprovalStatus.Draft:
      return "Nháp";
    case ResultApprovalStatus.Submitted:
      return "Đã nộp";
    case ResultApprovalStatus.Step1Reviewed:
      return "Đã xem xét";
    case ResultApprovalStatus.Step2Approved:
      return "Đã phê duyệt";
    case ResultApprovalStatus.Rejected:
      return "Từ chối";
    default:
      return "";
  }
};

export const getTestResultColumns = (options: GetColumnsOptions) => {
  // Check permissions
  const canEdit = authService.hasPermission(PERMISSIONS.TestResults.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.TestResults.Delete);

  return [
  {
    title: "Mã phép thử",
    dataIndex: "testCode",
    key: "testCode",
    width: 180,
    fixed: "left" as const,
    sorter: (a: TestResultDto, b: TestResultDto) =>
      (a.testCode || "").localeCompare(b.testCode || ""),
  },
  {
    title: "Chỉ tiêu",
    dataIndex: "parameter",
    key: "parameter",
    width: 160,
  },
  {
    title: "Kết quả",
    dataIndex: "value",
    key: "value",
    width: 100,
    render: (value: string, record: TestResultDto) => (
      <span style={{ fontWeight: "bold" }}>
        {value} {record.unit}
      </span>
    ),
  },
  {
    title: "Giới hạn",
    key: "limits",
    width: 120,
    render: (_: unknown, record: TestResultDto) => {
      if (record.lowerLimit !== undefined && record.upperLimit !== undefined) {
        return `${record.lowerLimit} - ${record.upperLimit}`;
      }
      if (record.lowerLimit !== undefined) {
        return `>= ${record.lowerLimit}`;
      }
      if (record.upperLimit !== undefined) {
        return `<= ${record.upperLimit}`;
      }
      return "-";
    },
  },
  {
    title: "Đạt/Không đạt",
    dataIndex: "isPass",
    key: "isPass",
    width: 130,
    render: (isPass?: boolean) => {
      if (isPass === undefined || isPass === null) return "-";
      return isPass ? (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Đạt
        </Tag>
      ) : (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          Không đạt
        </Tag>
      );
    },
  },
  {
    title: "Người nhập",
    dataIndex: "enteredByName",
    key: "enteredByName",
    width: 140,
    render: (val: string) => val || "-",
  },
  {
    title: "Trạng thái duyệt",
    dataIndex: "approvalStatus",
    key: "approvalStatus",
    width: 140,
    render: (status: ResultApprovalStatus) => (
      <StatusTag color={getApprovalStatusColor(status)}>
        {getApprovalStatusText(status)}
      </StatusTag>
    ),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 150,
    fixed: "right" as const,
    render: (_: unknown, record: TestResultDto) => {
      const isLocked =
        record.approvalStatus === ResultApprovalStatus.Step2Approved;
      const lockedReason = isLocked
        ? "Không thể chỉnh sửa kết quả đã duyệt"
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
