import { Button, Space, Popconfirm, Typography, Tag } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Subcontractor } from "../hooks";
import StatusTag from "../../../components/common/StatusTag";

const { Text } = Typography;

interface GetColumnsOptions {
  onView: (record: Subcontractor) => void;
  onEdit: (record: Subcontractor) => void;
  onDelete: (id: string) => void;
}

const getStatusTag = (status: string) => {
  const config: Record<string, { color: string; text: string }> = {
    active: { color: "green", text: "Đang hoạt động" },
    inactive: { color: "red", text: "Ngừng hoạt động" },
    pending: { color: "orange", text: "Chờ đánh giá" },
  };
  const statusConfig = config[status] || { color: "default", text: status };
  return <StatusTag color={statusConfig.color}>{statusConfig.text}</StatusTag>;
};

export const getSubcontractorColumns = (
  options: GetColumnsOptions
): ColumnsType<Subcontractor> => [
  {
    title: "Mã NTP",
    dataIndex: "code",
    key: "code",
    width: 100,
    fixed: "left",
  },
  {
    title: "Tên nhà thầu phụ",
    dataIndex: "name",
    key: "name",
    width: 280,
    ellipsis: true,
  },
  {
    title: "Người liên hệ",
    dataIndex: "contactPerson",
    key: "contactPerson",
    width: 150,
  },
  {
    title: "Điện thoại",
    dataIndex: "phone",
    key: "phone",
    width: 140,
  },
  {
    title: "Năng lực",
    dataIndex: "capabilities",
    key: "capabilities",
    width: 250,
    render: (caps: string[]) => (
      <Space wrap size={[0, 4]}>
        {caps.slice(0, 2).map((cap) => (
          <Tag key={cap} color="blue">
            {cap}
          </Tag>
        ))}
        {caps.length > 2 && <Tag>+{caps.length - 2}</Tag>}
      </Space>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 140,
    render: (status: string) => getStatusTag(status),
  },
  {
    title: "Hết hạn HĐ",
    dataIndex: "contractEndDate",
    key: "contractEndDate",
    width: 120,
    render: (date: string) => {
      if (!date) return "-";
      const d = dayjs(date);
      const isExpiring = d.diff(dayjs(), "month") < 3;
      return (
        <Text type={isExpiring ? "danger" : undefined}>
          {d.format("DD/MM/YYYY")}
        </Text>
      );
    },
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 150,
    fixed: "right",
    render: (_, record) => (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => options.onView(record)}
        />
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => options.onEdit(record)}
        />
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa?"
          onConfirm={() => options.onDelete(record.id)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    ),
  },
];
