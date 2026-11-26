import { Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { ColumnsType } from "antd/es/table";
import { IndicatorDto } from "../types";
import { UNGROUPED_NAME } from "../../../../utils/indicatorGroups";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";
import MasterDataHistoryButton from "../../../../components/common/MasterDataHistory/MasterDataHistoryButton";

export const getIndicatorColumns = (
  handleEditIndicator: (indicator: IndicatorDto) => void,
  handleToggleActive: (id: string) => void,
  handleDeleteIndicator: (id: string) => void
): ColumnsType<IndicatorDto> => [
  {
    title: "Tên chỉ tiêu",
    key: "name",
    width: 250,
    render: (_, record) => (
      <IndicatorName
        name={record.name}
        formattedName={record.formattedName}
      />
    ),
  },
  {
    title: "Nhóm",
    dataIndex: "indicatorGroupName",
    key: "indicatorGroupName",
    width: 200,
    render: (groupName: string | null | undefined, record) =>
      record.indicatorGroupId && groupName ? (
        groupName
      ) : (
        <span style={{ color: "#bfbfbf" }}>{UNGROUPED_NAME}</span>
      ),
  },
  {
    title: "Khoa phòng",
    dataIndex: "laboratoryName",
    key: "laboratoryName",
    width: 150,
    render: (laboratoryName: string | undefined) => laboratoryName || "-",
  },
  {
    title: "Chỉ tiêu phụ",
    key: "subIndicatorCount",
    width: 120,
    align: "center",
    render: (_, record) => {
      const count = record.subIndicators?.length ?? 0;
      return count > 0 ? (
        <Tag color="blue">{count}</Tag>
      ) : (
        <span style={{ color: "#bfbfbf" }}>0</span>
      );
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
    width: 180,
    render: (_, record) => {
      const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
      const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

      return (
        <Space size="small">
          <MasterDataHistoryButton
            entityType="indicators"
            entityId={record.id}
            title={record.name}
          />
          {canEdit && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditIndicator(record)}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title={record.isActive ? "Tắt hoạt động" : "Bật hoạt động"}>
              <Button
                type="link"
                size="small"
                icon={
                  record.isActive ? <StopOutlined /> : <CheckCircleOutlined />
                }
                onClick={() => handleToggleActive(record.id)}
              />
            </Tooltip>
          )}
          {canDelete && (
            record.canDelete ? (
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa?"
                onConfirm={() => handleDeleteIndicator(record.id)}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            ) : (
              <Tooltip title="Không thể xóa vì đã được sử dụng">
                <Button
                  type="link"
                  size="small"
                  disabled
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            )
          )}
        </Space>
      );
    },
  },
];
