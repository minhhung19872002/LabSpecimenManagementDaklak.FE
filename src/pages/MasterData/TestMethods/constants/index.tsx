import { Tag, Space, Button, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { IndicatorName } from "../../../../components/common";
import authService from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissions";
import type { ColumnsType } from "antd/es/table";
import { TestMethodDto } from "../../../../services/masterDataService";

export const DEFAULT_PAGE_SIZE = 50;

// Columns cho bảng phương pháp (flat list)
export const getTestMethodColumns = (
  handleEdit: (record: TestMethodDto) => void,
  handleDelete: (id: string) => void,
  handleToggleActive: (id: string) => void,
): ColumnsType<TestMethodDto> => [
  {
    title: "Mã",
    dataIndex: "code",
    key: "code",
    width: 120,
    render: (code: string) => <span style={{ fontWeight: 500 }}>{code || "-"}</span>,
  },
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
    width: 160,
    render: (_, record) => {
      const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
      const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

      return (
        <Space size="small">
          {canEdit && (
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
          )}
          {canEdit && (
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
          )}
          {canDelete && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa phương pháp này?"
              onConfirm={(e) => {
                e?.stopPropagation();
                handleDelete(record.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Có"
              cancelText="Không"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </Space>
      );
    },
  },
];
