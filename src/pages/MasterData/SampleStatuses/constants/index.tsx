import { Button, Space, Tag, Popconfirm, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "../../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { SampleConditionDto } from "../types";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";
import MasterDataHistoryButton from "../../../../components/common/MasterDataHistory/MasterDataHistoryButton";

export const getConditionColumns = (
  handleEdit: (record: SampleConditionDto) => void,
  handleDelete: (id: string) => void,
  handleToggleActive: (record: SampleConditionDto) => void
): ColumnsType<SampleConditionDto> => {
  // Check permissions
  const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
  const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

  const columns: ColumnsType<SampleConditionDto> = [
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
  ];

  // Cột thao tác luôn hiển thị (Lịch sử) + Sửa/Xóa theo quyền
  columns.push({
      title: "Thao tác",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <MasterDataHistoryButton
            entityType="sampleConditions"
            entityId={record.id}
            title={record.name}
          />
          {canEdit && (
            <>
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
            </>
          )}
          {canDelete && (
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
          )}
        </Space>
      ),
    });

  return columns;
};
