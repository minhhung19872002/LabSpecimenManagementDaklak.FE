import { Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { ColumnsType } from "antd/es/table";
import { IndicatorDto, IndicatorGroupDto, GroupedIndicatorData } from "../types";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";

export const getIndicatorColumns = (
  handleEditIndicator: (indicator: IndicatorDto) => void,
  handleToggleActive: (id: string) => void,
  handleDeleteIndicator: (id: string) => void
): ColumnsType<IndicatorDto> => [
  {
    title: "STT",
    key: "index",
    width: 60,
    render: (_, __, index) => index + 1,
  },
  {
    title: "Mã",
    dataIndex: "code",
    key: "code",
    width: 100,
    render: (code, record) => {
      // Don't show code for sub-indicators
      if (record.parentIndicatorId) return null;
      return <span style={{ fontWeight: 500 }}>{code}</span>;
    },
  },
  {
    title: "Tên chỉ tiêu",
    key: "name",
    width: 250,
    render: (_, record: any) => {
      const isSubIndicator = !!record.parentIndicatorId;
      const isFirstSub = record._isFirstSub || false;
      const isLastSub = record._isLastSub || false;

      return (
        <div
          className={`indicator-name-wrapper ${isSubIndicator ? "has-tree-line" : ""} ${isFirstSub ? "is-first-sub" : ""} ${isLastSub ? "is-last-sub" : ""}`}
          style={{
            paddingLeft: isSubIndicator ? 24 : 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <IndicatorName
            name={record.name}
            formattedName={record.formattedName}
          />
        </div>
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
    width: 150,
    render: (_, record) => {
      const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
      const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

      return (
        <Space size="small">
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

export const getGroupColumns = (
  handleEditGroup: (group: IndicatorGroupDto) => void,
  handleDeleteGroup: (id: string) => void
): ColumnsType<GroupedIndicatorData> => [
  {
    title: "Tên nhóm",
    dataIndex: "name",
    key: "name",
    width: 250,
  },
  {
    title: "Khoa phòng thực hiện",
    dataIndex: "laboratoryName",
    key: "laboratoryName",
    width: 180,
    render: (laboratoryName: string | undefined) => laboratoryName || "-",
  },
  {
    title: "Số chỉ tiêu",
    dataIndex: "indicatorCount",
    key: "indicatorCount",
    width: 120,
    render: (_, record) => record.indicators.length,
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
    render: (_, record) => {
      const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
      const canDelete = authService.hasPermission(PERMISSIONS.MasterData.Delete);

      return (
        <Space size="small">
          {canEdit && (
            <Tooltip title="Sửa nhóm">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditGroup(record)}
              />
            </Tooltip>
          )}
          {canDelete && (
            record.indicators.length === 0 ? (
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa nhóm này?"
                onConfirm={() => handleDeleteGroup(record.id)}
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
              <Tooltip title="Không thể xóa nhóm có chứa chỉ tiêu">
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
