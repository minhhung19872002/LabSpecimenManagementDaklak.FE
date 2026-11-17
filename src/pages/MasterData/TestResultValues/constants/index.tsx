import { Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
} from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { ColumnsType } from "antd/es/table";
import { GroupedTestResultValueData, TestResultValueIndicatorDto } from "../types";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";
import MasterDataHistoryButton from "../../../../components/common/MasterDataHistory/MasterDataHistoryButton";

export const DEFAULT_PAGE_SIZE = 50;

// Columns for main test result value table
export const getTestResultValueColumns = (
  handleEdit: (record: GroupedTestResultValueData) => void,
  handleDelete: (id: string) => void
): ColumnsType<GroupedTestResultValueData> => [
  {
    title: "Mã",
    dataIndex: "code",
    key: "code",
    width: 150,
  },
  {
    title: "Tên kết quả",
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
    title: "Số chỉ tiêu",
    dataIndex: "indicatorCount",
    key: "indicatorCount",
    width: 100,
    render: (count: number) => count || 0,
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
    width: 130,
    render: (_, record) => {
      const canEdit = authService.hasPermission(PERMISSIONS.TestResultValues.Edit);
      const canDelete = authService.hasPermission(PERMISSIONS.TestResultValues.Delete);

      return (
        <Space size="small">
          <MasterDataHistoryButton
            entityType="testResultValues"
            entityId={record.id}
            title={record.name}
          />
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
              title="Bạn có chắc chắn muốn xóa kết quả này?"
              description={
                record.indicatorCount > 0
                  ? "Kết quả này đang có chỉ tiêu. Vui lòng xóa hết chỉ tiêu trước."
                  : undefined
              }
              onConfirm={(e) => {
                e?.stopPropagation();
                handleDelete(record.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Có"
              cancelText="Không"
              disabled={record.indicatorCount > 0}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record.indicatorCount > 0}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </Space>
      );
    },
  },
];

// Columns for nested indicator table
// User requested: checkbox, STT, Nền mẫu, Tên chỉ tiêu, Trạng thái, Thao tác
export const getIndicatorColumns = (
  handleRemove: (testResultValueId: string, indicatorId: string, specimenTypeId: string) => void,
  handleToggleActive: (testResultValueId: string, indicatorId: string, specimenTypeId: string) => void
): ColumnsType<TestResultValueIndicatorDto> => [
  {
    title: "STT",
    key: "index",
    width: 60,
    render: (_, __, index) => index + 1,
  },
  {
    title: "Nền mẫu",
    dataIndex: "specimenTypeName",
    key: "specimenTypeName",
    width: 180,
    render: (name: string, record) => (
      <span>
        {record.specimenTypeCode} - {name}
      </span>
    ),
  },
  {
    title: "Tên chỉ tiêu",
    dataIndex: "indicatorName",
    key: "indicatorName",
    render: (_, record) => (
      <IndicatorName name={record.indicatorName} formattedName={record.indicatorFormattedName} />
    ),
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
        onClick={() => handleToggleActive(record.testResultValueId, record.indicatorId, record.specimenTypeId)}
      >
        {isActive ? "Hoạt động" : "Ngừng"}
      </Tag>
    ),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 80,
    render: (_, record) => {
      const canDelete = authService.hasPermission(PERMISSIONS.TestResultValues.Delete);

      if (!canDelete) {
        return null;
      }

      return (
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa chỉ tiêu này?"
          onConfirm={() => handleRemove(record.testResultValueId, record.indicatorId, record.specimenTypeId)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      );
    },
  },
];
