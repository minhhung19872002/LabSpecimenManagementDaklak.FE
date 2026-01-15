import { Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { ColumnsType } from "antd/es/table";
import { GroupedTestMethodData, TestMethodIndicatorDto } from "../types";

export const DEFAULT_PAGE_SIZE = 50;

// Columns cho bảng phương pháp (group level)
export const getTestMethodColumns = (
  handleEdit: (record: GroupedTestMethodData) => void,
  handleDelete: (id: string) => void,
  handleToggleActive: (id: string) => void
): ColumnsType<GroupedTestMethodData> => [
  {
    title: "Tên phương pháp",
    key: "name",
    render: (_, record) => (
      <IndicatorName name={record.name} formattedName={record.formattedName} />
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    width: 100,
    render: (isActive: boolean) => (
      <Tag color={isActive ? "green" : "red"}>
        {isActive ? "Hoạt động" : "Ngừng"}
      </Tag>
    ),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 120,
    render: (_, record) => (
      <Space size="small">
        <Tooltip title={record.isActive ? "Tắt hoạt động" : "Bật hoạt động"}>
          <Button
            type="link"
            size="small"
            icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(record.id);
            }}
          />
        </Tooltip>
        <Tooltip title="Sửa">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          />
        </Tooltip>
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa phương pháp này?"
          description={
            record.indicators?.length > 0
              ? "Phương pháp này đang có chỉ tiêu. Vui lòng xóa hết chỉ tiêu trước."
              : undefined
          }
          onConfirm={(e) => {
            e?.stopPropagation();
            handleDelete(record.id);
          }}
          onCancel={(e) => e?.stopPropagation()}
          okText="Có"
          cancelText="Không"
          disabled={record.indicators?.length > 0}
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={record.indicators?.length > 0}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </Space>
    ),
  },
];

// Columns cho bảng chỉ tiêu trong phương pháp (indicator level)
export const getIndicatorColumns = (
  handleRemove: (testMethodId: string, indicatorId: string) => void
): ColumnsType<TestMethodIndicatorDto> => [
  {
    title: "STT",
    key: "index",
    width: 60,
    render: (_, __, index) => index + 1,
  },
  {
    title: "Mã chỉ tiêu",
    dataIndex: "indicatorCode",
    key: "indicatorCode",
    width: 120,
  },
  {
    title: "Tên chỉ tiêu",
    dataIndex: "indicatorName",
    key: "indicatorName",
    width: 250,
    render: (_, record) => <IndicatorName name={record.indicatorName} formattedName={record.indicatorFormattedName} />,
  },
  {
    title: "Đơn giá",
    dataIndex: "unitPrice",
    key: "unitPrice",
    width: 150,
    render: (price: number) => `${price?.toLocaleString("vi-VN")} đ`,
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    width: 100,
    render: (isActive: boolean) => (
      <Tag color={isActive ? "green" : "red"}>
        {isActive ? "Hoạt động" : "Ngừng"}
      </Tag>
    ),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 80,
    render: (_, record) => (
      <Popconfirm
        title="Bạn có chắc chắn muốn xóa chỉ tiêu này khỏi phương pháp?"
        onConfirm={() => handleRemove(record.testMethodId, record.indicatorId)}
        okText="Có"
        cancelText="Không"
      >
        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    ),
  },
];
