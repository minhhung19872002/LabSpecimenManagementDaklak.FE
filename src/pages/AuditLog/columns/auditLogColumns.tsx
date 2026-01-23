import { Button, Tag, Space, Avatar, Tooltip, Typography } from "antd";
import { UserOutlined, EyeOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { AuditLogDto } from "../../../services/auditLogService";

const { Text } = Typography;

export const getHttpMethodTag = (method: string) => {
  const config: Record<string, string> = {
    GET: "#1890FF",
    POST: "#52C41A",
    PUT: "#FA8C16",
    DELETE: "#F5222D",
    PATCH: "#722ED1",
  };
  const bg = config[method] || "#8C8C8C";
  return (
    <Tag
      style={{
        backgroundColor: bg,
        color: "#FFFFFF",
        border: "none",
        borderRadius: 18,
        padding: "2px 8px",
      }}
    >
      {method}
    </Tag>
  );
};

export const getStatusCodeTag = (code: number | undefined) => {
  if (!code) return null;
  let bg = "#8C8C8C";
  if (code >= 200 && code < 300) bg = "#52C41A";
  else if (code >= 400 && code < 500) bg = "#FA8C16";
  else if (code >= 500) bg = "#F5222D";
  return (
    <Tag
      style={{
        backgroundColor: bg,
        color: "#FFFFFF",
        border: "none",
        borderRadius: 18,
        padding: "2px 8px",
      }}
    >
      {code}
    </Tag>
  );
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
        <span>{dayjs(executionTime).format("DD/MM/YYYY HH:mm")}</span>
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
