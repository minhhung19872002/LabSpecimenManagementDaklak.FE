import { Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { ColumnsType } from "antd/es/table";
import { GroupedStandardData, StandardIndicatorDto } from "../types";

export const DEFAULT_PAGE_SIZE = 50;

// Columns cho bảng tiêu chuẩn (group level)
export const getStandardColumns = (
  handleEdit: (record: GroupedStandardData) => void,
  handleDelete: (id: string) => void,
  handleToggleActive: (id: string) => void
): ColumnsType<GroupedStandardData> => [
  {
    title: "Tên tiêu chuẩn",
    dataIndex: "name",
    key: "name",
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
          title="Bạn có chắc chắn muốn xóa tiêu chuẩn này?"
          description={
            record.indicators?.length > 0
              ? "Tiêu chuẩn này đang có chỉ tiêu. Vui lòng xóa hết chỉ tiêu trước."
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

// Columns cho bảng chỉ tiêu trong tiêu chuẩn (indicator level)
export const getIndicatorColumns = (
  handleEdit: (standardId: string, indicator: StandardIndicatorDto) => void,
  handleRemove: (standardId: string, indicatorId: string) => void,
  handleToggleActive: (standardId: string, indicatorId: string) => void
): ColumnsType<StandardIndicatorDto> => [
  {
    title: "STT",
    key: "index",
    width: 60,
    render: (_, __, index) => index + 1,
  },
  {
    title: "Tên chỉ tiêu",
    dataIndex: "indicatorName",
    key: "indicatorName",
    width: 200,
    render: (_, record) => <IndicatorName name={record.indicatorName} formattedName={record.indicatorFormattedName} />,
  },
  {
    title: "Tên phương pháp",
    key: "testMethodName",
    width: 200,
    render: (_, record) => (
      <IndicatorName name={record.testMethodName} formattedName={record.testMethodFormattedName} />
    ),
  },
  {
    title: "Đơn vị",
    dataIndex: "unit",
    key: "unit",
    width: 100,
  },
  {
    title: "Giới hạn",
    key: "limit",
    width: 150,
    render: (_, record) => {
      // If allowedLimit is null, empty, or "0", just show "0" without operator
      if (!record.allowedLimit || record.allowedLimit === "0") {
        return "0";
      }
      // Otherwise, merge with comparison operator
      return `${record.comparisonOperator || ""} ${record.allowedLimit}`.trim();
    },
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
            onClick={() => handleToggleActive(record.standardId, record.id)}
          />
        </Tooltip>
        <Tooltip title="Sửa">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.standardId, record)}
          />
        </Tooltip>
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa chỉ tiêu này khỏi tiêu chuẩn?"
          onConfirm={() => handleRemove(record.standardId, record.id)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    ),
  },
];
