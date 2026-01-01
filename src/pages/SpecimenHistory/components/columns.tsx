import { Button, Space, Tag, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  SpecimenHistoryDto,
  SpecimenStatus,
} from "../../../types/specimenHistory";

interface GetColumnsOptions {
  onView: (id: string) => void;
  onEdit: (record: SpecimenHistoryDto) => void;
  onDelete: (id: string) => void;
}

const getStatusTag = (status: SpecimenStatus) => {
  const statusConfig: Record<SpecimenStatus, { color: string; label: string }> = {
    [SpecimenStatus.Received]: { color: "blue", label: "Đã nhận" },
    [SpecimenStatus.Testing]: { color: "processing", label: "Đang thử nghiệm" },
    [SpecimenStatus.Storage]: { color: "cyan", label: "Lưu kho" },
    [SpecimenStatus.Disposal]: { color: "warning", label: "Chờ hủy" },
    [SpecimenStatus.Destroyed]: { color: "error", label: "Đã hủy" },
    [SpecimenStatus.ReturnedToCustomer]: { color: "success", label: "Đã trả khách" },
  };

  const config = statusConfig[status];
  return <Tag color={config?.color || "default"}>{config?.label || status}</Tag>;
};

export const getSpecimenHistoryColumns = (options: GetColumnsOptions) => [
  {
    title: "Mã mẫu",
    dataIndex: "specimenCode",
    key: "specimenCode",
    width: 180,
    fixed: "left" as const,
    sorter: (a: SpecimenHistoryDto, b: SpecimenHistoryDto) =>
      (a.specimenCode || "").localeCompare(b.specimenCode || ""),
  },
  {
    title: "Hành động",
    dataIndex: "action",
    key: "action",
    width: 180,
    render: (action: string) => (
      <Space>
        <HistoryOutlined />
        {action}
      </Space>
    ),
  },
  {
    title: "Vị trí",
    dataIndex: "location",
    key: "location",
    width: 180,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 140,
    render: (status: SpecimenStatus) => getStatusTag(status),
  },
  {
    title: "Người thực hiện",
    dataIndex: "performedByName",
    key: "performedByName",
    width: 140,
    render: (name: string) => name || "-",
  },
  {
    title: "Thời gian",
    dataIndex: "timestamp",
    key: "timestamp",
    width: 160,
    render: (date: string) =>
      date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    sorter: (a: SpecimenHistoryDto, b: SpecimenHistoryDto) =>
      dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
  },
  {
    title: "Nhiệt độ",
    dataIndex: "temperature",
    key: "temperature",
    width: 100,
    render: (val: number | null) => (val != null ? `${val}°C` : "-"),
  },
  {
    title: "Độ ẩm",
    dataIndex: "humidity",
    key: "humidity",
    width: 100,
    render: (val: number | null) => (val != null ? `${val}%` : "-"),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 150,
    fixed: "right" as const,
    render: (_: unknown, record: SpecimenHistoryDto) => (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => options.onView(record.id)}
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
