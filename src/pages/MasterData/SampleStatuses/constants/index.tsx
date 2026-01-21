import { Button, Space, Tag, Popconfirm, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { SampleConditionDto } from "../types";

export const getConditionColumns = (
  handleEdit: (record: SampleConditionDto) => void,
  handleDelete: (id: string) => void,
  handleToggleActive: (record: SampleConditionDto) => void
): ColumnsType<SampleConditionDto> => [
  {
    title: "Tên tình trạng",
    dataIndex: "name",
    key: "name",
    width: 250,
    ellipsis: true,
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
    render: (description: string | undefined) => description || "-",
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    width: 120,
    render: (isActive: boolean) => (
      <Tag color={isActive ? "green" : "red"}>
        {isActive ? "Hoạt động" : "Ngừng"}
      </Tag>
    ),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 150,
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="Sửa">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Tooltip>
        <Tooltip title={record.isActive ? "Hủy kích hoạt" : "Kích hoạt"}>
          <Button
            type="link"
            size="small"
            icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleActive(record)}
            style={{ color: record.isActive ? "#faad14" : "#52c41a" }}
          />
        </Tooltip>
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa tình trạng mẫu này?"
          onConfirm={() => handleDelete(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Tooltip title="Xóa">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  },
];
