import { Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedSpecimenTypeData, SpecimenTypeIndicatorDto } from "../types";

export const DEFAULT_PAGE_SIZE = 50;

// Columns cho bảng loại mẫu (group level) - Không có STT và Mã
export const getSpecimenTypeColumns = (
  handleEdit: (record: GroupedSpecimenTypeData) => void,
  handleDelete: (id: string) => void
): ColumnsType<GroupedSpecimenTypeData> => [
  {
    title: "Tên loại mẫu",
    dataIndex: "name",
    key: "name",
    width: 200,
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    key: "description",
    ellipsis: {
      showTitle: false,
    },
    render: (description: string | undefined) => (
      <Tooltip placement="topLeft" title={description}>
        {description || "-"}
      </Tooltip>
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
    width: 100,
    render: (_, record) => (
      <Space size="small">
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
          title="Bạn có chắc chắn muốn xóa loại mẫu này?"
          description={
            record.indicators?.length > 0
              ? "Loại mẫu này đang có chỉ tiêu. Vui lòng xóa hết chỉ tiêu trước."
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

// Columns cho bảng chỉ tiêu trong loại mẫu (indicator level)
export const getIndicatorColumns = (
  handleRemove: (specimenTypeId: string, indicatorId: string) => void,
  handleToggleActive: (specimenTypeId: string, indicatorId: string) => void
): ColumnsType<SpecimenTypeIndicatorDto> => [
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
  },
  {
    title: "Nhóm chỉ tiêu",
    dataIndex: "indicatorGroupName",
    key: "indicatorGroupName",
    width: 200,
    render: (groupName: string | undefined) => groupName || "-",
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    width: 100,
    render: (isActive: boolean, record) => (
      <Tag
        color={isActive ? "green" : "red"}
        style={{ cursor: "pointer" }}
        onClick={() => handleToggleActive(record.specimenTypeId, record.indicatorId)}
      >
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
        title="Bạn có chắc chắn muốn xóa chỉ tiêu này khỏi loại mẫu?"
        onConfirm={() => handleRemove(record.specimenTypeId, record.indicatorId)}
        okText="Có"
        cancelText="Không"
      >
        <Button type="link" size="small" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    ),
  },
];
