import { Button, Space, Tag, Popconfirm, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { GroupedCategoryData, SpecimenTypeWithKey } from "../types";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";

export const getCategoryColumns = (
  handleEdit: (record: GroupedCategoryData) => void,
  handleDelete: (id: string) => void,
  handleToggleActive: (record: GroupedCategoryData) => void
): ColumnsType<GroupedCategoryData> => [
  {
    title: "Tên danh mục",
    dataIndex: "name",
    key: "name",
    width: 250,
    ellipsis: true,
    render: (name: string, record) => (
      <Space style={{ maxWidth: "100%" }}>
        <Tooltip title={name}>
          <span
            style={{
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 150,
              display: "inline-block",
            }}
          >
            {name}
          </span>
        </Tooltip>
        <Tag color="blue">{record.specimenTypeCount || record.specimenTypes?.length || 0} loại mẫu</Tag>
      </Space>
    ),
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
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
    render: (_, record) => {
      if (record.id === "uncategorized") {
        return <span style={{ color: "#999" }}>-</span>;
      }

      const canEdit = authService.hasPermission(PERMISSIONS.SampleTypeCategories.Edit);
      const canDelete = authService.hasPermission(PERMISSIONS.SampleTypeCategories.Delete);

      return (
        <Space size="small">
          {canEdit && (
            <>
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
              <Tooltip title={record.isActive ? "Hủy kích hoạt" : "Kích hoạt"}>
                <Button
                  type="link"
                  size="small"
                  icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(record);
                  }}
                  style={{ color: record.isActive ? "#faad14" : "#52c41a" }}
                />
              </Tooltip>
            </>
          )}
          {canDelete && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa danh mục này?"
              description="Chỉ có thể xóa nếu không còn loại mẫu bên trong."
              onConfirm={(e) => {
                e?.stopPropagation();
                handleDelete(record.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Tooltip title="Xóa">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      );
    },
  },
];

export const getSpecimenTypeColumns = (): ColumnsType<SpecimenTypeWithKey> => [
  {
    title: "Mã",
    dataIndex: "code",
    key: "code",
    width: 100,
  },
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
    ellipsis: true,
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
];
