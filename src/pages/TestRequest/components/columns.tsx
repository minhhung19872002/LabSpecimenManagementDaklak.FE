import { Button, Space, Tag, Tooltip } from "antd";
import Icon, { EditOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  TestRequestDto,
  TestRequestStatus,
  TestRequestStatusLabels,
  TestRequestStatusColors,
  canEditTestRequest,
  showActionsForTestRequest,
} from "../../../types/testRequest";
import { formatDate } from "../../../utils/formatters";
import StatusTag from "../../../components/common/StatusTag";

interface GetColumnsOptions {
  onEdit: (record: TestRequestDto) => void;
  /** Có quyền chỉnh sửa theo Permission Matrix (BP Giao nhận, Admin) */
  canEditPermission?: boolean;
}

const getStatusTag = (status: TestRequestStatus) => {
  const label = TestRequestStatusLabels[status] || status.toString();
  const color = TestRequestStatusColors[status] || "default";
  return <StatusTag color={color}>{label}</StatusTag>;
};

const getSubContractTag = (subContractName?: string) => {
  const tag = (
    <Tag
      // inline-flex: bỏ vertical-align -0.125em mặc định của bootstrap-icons để icon canh giữa với chữ
      icon={<Icon name="bank" style={{ display: "inline-flex" }} />}
      style={{
        backgroundColor: "#DB2777",
        color: "#FFFFFF",
        border: "none",
        borderRadius: 999,
        padding: "2px 8px",
        margin: 0,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      Thầu phụ
    </Tag>
  );
  // Có tên đơn vị thầu phụ thì hiện khi rê chuột
  return subContractName ? <Tooltip title={subContractName}>{tag}</Tooltip> : tag;
};

export const getTestRequestColumns = (
  options: GetColumnsOptions,
): ColumnsType<TestRequestDto> => [
  {
    title: "Số hợp đồng",
    dataIndex: "contractNumber",
    key: "contractNumber",
    width: 170,
    fixed: "left",
    render: (value: string, record: TestRequestDto) => {
      const contractCell = record.sampleTypeSubContract ? (
        <Space size={6} align="center" wrap={false}>
          <span>{value || "-"}</span>
          {getSubContractTag(record.subContract)}
        </Space>
      ) : (
        value || "-"
      );
      return record.syncStatus ? (
        <Space direction="vertical" size={2}>
          {contractCell}
          {record.syncStatus === "failed" ? (
            <Tooltip title={record.syncError}>
              <Tag color="error" data-testid="sync-status-tag">Lỗi đồng bộ</Tag>
            </Tooltip>
          ) : (
            <Tag color="warning" data-testid="sync-status-tag">Chờ đồng bộ</Tag>
          )}
        </Space>
      ) : (
        contractCell
      );
    },
    sorter: (a, b) =>
      (a.contractNumber || "").localeCompare(b.contractNumber || ""),
  },
  {
    title: "Ngày HĐ",
    dataIndex: "contractDate",
    key: "contractDate",
    width: 130,
    render: (date: string) => formatDate(date),
    sorter: (a, b) => dayjs(a.contractDate).unix() - dayjs(b.contractDate).unix(),
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
      const showActions = showActionsForTestRequest(record.status);

      // Nếu không có quyền theo Permission Matrix, ẩn luôn cột thao tác
      if (!canEditByPermission) {
        return null;
      }

      if (!showActions) {
        return null;
      }

      return (
        <Space size="small" style={{ display: "flex", justifyContent: "center" }}>
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
        </Space>
      );
    },
  },
];
