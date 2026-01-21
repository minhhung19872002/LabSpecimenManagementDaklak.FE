import React from "react";
import { Button, Space, Tag, Tooltip, Badge } from "antd";
import Icon, {
  FilePdfOutlined,
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  MailOutlined,
  QrcodeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
  AuditOutlined,
} from "../../../components/common/Icon";
import { ReportDisplay, getStatusConfig } from "../hooks";
import StatusTag from "../../../components/common/StatusTag";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

interface ColumnActions {
  onPreview: (record: ReportDisplay) => void;
  onShowQR: (record: ReportDisplay) => void;
  onExportPDF: (record: ReportDisplay) => void;
  onPrint: (record: ReportDisplay) => void;
  onSendEmail: (record: ReportDisplay) => void;
  onSubmitForApproval: (record: ReportDisplay) => void;
  onApprove: (record: ReportDisplay) => void;
  onIssue: (record: ReportDisplay) => void;
  workflowLoading: boolean;
}

const getStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case "Draft":
    case "PendingApproval":
      return <ClockCircleOutlined />;
    case "Approved":
    case "Issued":
      return <CheckCircleOutlined />;
    default:
      return null;
  }
};

export const getReportColumns = ({
  onPreview,
  onShowQR,
  onExportPDF,
  onPrint,
  onSendEmail,
  onSubmitForApproval,
  onApprove,
  onIssue,
  workflowLoading,
}: ColumnActions) => [
  {
    title: "Số báo cáo",
    dataIndex: "reportNumber",
    key: "reportNumber",
    width: 180,
    fixed: "left" as const,
    render: (text: string, record: ReportDisplay) => (
      <a onClick={() => onPreview(record)}>
        <Space>
          <FilePdfOutlined style={{ color: "#cf1322" }} />
          {text}
        </Space>
      </a>
    ),
  },
  {
    title: "Yêu cầu",
    dataIndex: "requestNumber",
    key: "requestNumber",
    width: 180,
  },
  {
    title: "Khách hàng",
    dataIndex: "customerName",
    key: "customerName",
    width: 250,
    ellipsis: true,
  },
  {
    title: "Mẫu thử",
    dataIndex: "specimenName",
    key: "specimenName",
    width: 220,
    ellipsis: true,
  },
  {
    title: "Số phép thử",
    dataIndex: "testCount",
    key: "testCount",
    width: 100,
    align: "center" as const,
    render: (count: number) => (
      <Badge count={count} style={{ backgroundColor: "#1890ff" }} />
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) => {
      const config = getStatusConfig(status);
      return (
        <StatusTag color={config.color} icon={getStatusIcon(status)}>
          {config.text}
        </StatusTag>
      );
    },
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 110,
  },
  {
    title: "QR",
    key: "qrCode",
    width: 60,
    align: "center" as const,
    render: (_: unknown, record: ReportDisplay) =>
      record.status === "Approved" || record.status === "Issued" ? (
        <Tooltip title="Click để xem mã QR">
          <Button
            type="text"
            icon={<QrcodeOutlined style={{ fontSize: 20, color: "#1890ff" }} />}
            onClick={() => onShowQR(record)}
          />
        </Tooltip>
      ) : (
        <span style={{ color: "#d9d9d9" }}>-</span>
      ),
  },
  {
    title: "Email",
    dataIndex: "emailSent",
    key: "emailSent",
    width: 100,
    render: (sent: boolean) =>
      sent ? (
        <Tag color="green" icon={<MailOutlined />}>
          Đã gửi
        </Tag>
      ) : (
        <Tag color="default">Chưa gửi</Tag>
      ),
  },
  {
    title: "Quy trình",
    key: "workflow",
    width: 140,
    render: (_: unknown, record: ReportDisplay) => {
      const canEdit = authService.hasPermission(PERMISSIONS.Reports.Edit);
      const canApprove = authService.hasPermission(PERMISSIONS.Reports.Approve);

      if (record.status === "Draft" && canEdit) {
        return (
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={() => onSubmitForApproval(record)}
            loading={workflowLoading}
          >
            Gửi duyệt
          </Button>
        );
      }
      if (record.status === "PendingApproval" && canApprove) {
        return (
          <Button
            type="primary"
            size="small"
            icon={<AuditOutlined />}
            onClick={() => onApprove(record)}
            loading={workflowLoading}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Duyệt
          </Button>
        );
      }
      if (record.status === "Approved" && canApprove) {
        return (
          <Button
            type="primary"
            size="small"
            icon={<Icon name="send-check" />}
            onClick={() => onIssue(record)}
            loading={workflowLoading}
            style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
          >
            Phát hành
          </Button>
        );
      }
      if (record.status === "Issued") {
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Hoàn tất
          </Tag>
        );
      }
      return null;
    },
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 160,
    fixed: "right" as const,
    render: (_: unknown, record: ReportDisplay) => {
      const canExport = authService.hasPermission(PERMISSIONS.Reports.Export);
      const canSend = authService.hasPermission(PERMISSIONS.Reports.Send);

      return (
        <Space>
          <Tooltip title="Xem">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onPreview(record)}
            />
          </Tooltip>
          {canExport && (
            <Tooltip title="Xuất PDF">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => onExportPDF(record)}
                disabled={record.status !== "Approved" && record.status !== "Issued"}
              />
            </Tooltip>
          )}
          {canExport && (
            <Tooltip title="In">
              <Button
                type="text"
                icon={<PrinterOutlined />}
                onClick={() => onPrint(record)}
                disabled={record.status !== "Approved" && record.status !== "Issued"}
              />
            </Tooltip>
          )}
          {canSend && (
            <Tooltip title="Gửi email">
              <Button
                type="text"
                icon={<MailOutlined />}
                onClick={() => onSendEmail(record)}
                disabled={record.status !== "Approved" && record.status !== "Issued"}
              />
            </Tooltip>
          )}
        </Space>
      );
    },
  },
];
