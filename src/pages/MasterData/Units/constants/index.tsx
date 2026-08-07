import { Space, Switch, Tooltip, Button, Popconfirm, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { UnitDto, UnitCategory, UnitCategoryLabels } from "../../../../services/masterDataService";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";

export const getUnitColumns = (
  handleEdit: (record: UnitDto) => void,
  handleDelete: (id: string) => void,
  handleToggleActive: (record: UnitDto) => void,
  pageIndex: number,
  pageSize: number,
): ColumnsType<UnitDto> => {
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  const columns: ColumnsType<UnitDto> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_: any, __: UnitDto, index: number) =>
        (pageIndex - 1) * pageSize + index + 1,
    },
    // {
    //   title: "ID đơn vị",
    //   dataIndex: "code",
    //   key: "code",
    //   width: 150,
    //   ellipsis: true,
    // },
    {
      title: "Phân loại",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (category: UnitCategory | null) => {
        if (category === null || category === undefined) return '-';
        return <Tag>{UnitCategoryLabels[category]}</Tag>;
      },
    },
    {
      title: "Tên đơn vị",
      dataIndex: "name",
      key: "name",
      width: 250,
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      align: "center",
      render: (isActive: boolean, record: UnitDto) => (
        <Switch
          checked={isActive}
          checkedChildren="Hoạt động"
          unCheckedChildren="Ngừng"
          onChange={() => handleToggleActive(record)}
          disabled={!canEdit}
        />
      ),
    },
  ];

  if (canEdit || canDelete) {
    columns.push({
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_: any, record: UnitDto) => (
        <Space size="small">
          {canEdit && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa đơn vị này?"
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
          )}
        </Space>
      ),
    });
  }

  return columns;
};
