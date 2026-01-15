import { Button, Tag, Space, Avatar, Tooltip, Typography } from "antd";
import { UserOutlined, EyeOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { AuditLogDto } from "../../../services/auditLogService";

const { Text } = Typography;

export const getHttpMethodTag = (method: string) => {
  const config: Record<string, { color: string }> = {
    GET: { color: "blue" },
    POST: { color: "green" },
    PUT: { color: "orange" },
    DELETE: { color: "red" },
    PATCH: { color: "purple" },
  };
  const c = config[method] || { color: "default" };
  return <Tag color={c.color}>{method}</Tag>;
};

export const getStatusCodeTag = (code: number | undefined) => {
  if (!code) return null;
  let color = "default";
  if (code >= 200 && code < 300) color = "green";
  else if (code >= 400 && code < 500) color = "orange";
  else if (code >= 500) color = "red";
  return <Tag color={color}>{code}</Tag>;
};

interface AuditLogColumnsProps {
  onViewDetail: (record: AuditLogDto) => void;
}

export const getAuditLogColumns = ({
  onViewDetail,
}: AuditLogColumnsProps): ColumnsType<AuditLogDto> => [
  {
    title: "Thời gian",
    dataIndex: "executionTime",
    key: "executionTime",
    width: 160,
    render: (executionTime: string) => (
      <Tooltip title={dayjs(executionTime).format("DD/MM/YYYY HH:mm:ss")}>
        <Text>{dayjs(executionTime).format("DD/MM/YYYY HH:mm")}</Text>
      </Tooltip>
    ),
    sorter: (a, b) =>
      dayjs(a.executionTime).unix() - dayjs(b.executionTime).unix(),
    defaultSortOrder: "descend",
  },
  {
    title: "Người dùng",
    key: "user",
    width: 150,
    render: (_, record) => (
      <Space>
        <Avatar size="small" icon={<UserOutlined />} />
        <Text>{record.userName || "Anonymous"}</Text>
      </Space>
    ),
  },
  {
    title: "Method",
    dataIndex: "httpMethod",
    key: "httpMethod",
    width: 90,
    render: (method: string) => (method ? getHttpMethodTag(method) : "-"),
  },
  {
    title: "URL",
    dataIndex: "url",
    key: "url",
    ellipsis: true,
    render: (url: string) => (
      <Tooltip title={url}>
        <Text>{url}</Text>
      </Tooltip>
    ),
  },
  {
    title: "Status",
    dataIndex: "httpStatusCode",
    key: "httpStatusCode",
    width: 80,
    render: (code: number) => getStatusCodeTag(code),
  },
  {
    title: "Thời gian (ms)",
    dataIndex: "executionDuration",
    key: "executionDuration",
    width: 110,
    render: (duration: number) => (
      <Text type={duration > 1000 ? "danger" : undefined}>{duration} ms</Text>
    ),
  },
  {
    title: "IP",
    dataIndex: "clientIpAddress",
    key: "clientIpAddress",
    width: 120,
    render: (ip: string) => {
      if (ip === "::1" || ip === "127.0.0.1") return "localhost";
      return ip;
    },
  },
  {
    title: "",
    key: "actions",
    width: 60,
    render: (_, record) => (
      <Button
        type="link"
        icon={<EyeOutlined />}
        onClick={() => onViewDetail(record)}
      />
    ),
  },
];
