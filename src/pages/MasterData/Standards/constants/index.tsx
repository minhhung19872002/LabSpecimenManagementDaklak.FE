import { Button, Space, Tag, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "../../../../components/common/Icon";
import { IndicatorName } from "../../../../components/common";
import type { ColumnsType } from "antd/es/table";
import { GroupedStandardData, StandardIndicatorDto } from "../types";
import { authService } from "../../../../services/authService";
import { PERMISSIONS } from "../../../../constants/permissionMapping";

export const DEFAULT_PAGE_SIZE = 50;

// Comparison operators for single limit
export const COMPARISON_OPERATORS = [
  { value: "≤", label: "≤" },
  { value: "≥", label: "≥" },
  { value: "<", label: "<" },
  { value: ">", label: ">" },
  { value: "=", label: "=" },
  { value: "range", label: "Khoảng" },
];

// Operators for lower bound (range)
export const LOWER_OPERATORS = [
  { value: ">", label: ">" },
  { value: "≥", label: "≥" },
];

// Operators for upper bound (range)
export const UPPER_OPERATORS = [
  { value: "<", label: "<" },
  { value: "≤", label: "≤" },
];

// Helper function to convert operator symbols for display
export const convertOperatorSymbol = (op?: string): string => {
  if (!op) return "";
  switch (op) {
    case "<=":
      return "≤";
    case ">=":
      return "≥";
    default:
      return op;
  }
};

// Columns cho bảng tiêu chuẩn (group level)
export const getStandardColumns = (
  handleEdit: (record: GroupedStandardData) => void,
  handleDelete: (id: string) => void,
  handleToggleActive: (id: string) => void,
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
    render: (_, record) => {
      const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
      const canDelete = authService.hasPermission(
        PERMISSIONS.MasterData.Delete,
      );

      return (
        <Space size="small">
          {canEdit && (
            <Tooltip
              title={record.isActive ? "Tắt hoạt động" : "Bật hoạt động"}
            >
              <Button
                type="link"
                size="small"
                icon={
                  record.isActive ? <StopOutlined /> : <CheckCircleOutlined />
                }
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
          )}
        </Space>
      );
    },
  },
];

// Extended type with position flags for tree line rendering (used in columns)
export interface StandardIndicatorWithPosition extends StandardIndicatorDto {
  _isFirstSub?: boolean;
  _isLastSub?: boolean;
}

// Columns cho bảng chỉ tiêu trong tiêu chuẩn (indicator level)
export const getIndicatorColumns = (
  handleEdit: (standardId: string, indicator: StandardIndicatorDto) => void,
  handleRemove: (standardId: string, indicatorId: string) => void,
  handleToggleActive: (standardId: string, indicatorId: string) => void,
): ColumnsType<StandardIndicatorWithPosition> => [
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
    render: (code, record) => {
      // Don't show code for sub-indicators
      if (record.parentIndicatorId) return null;
      return <span style={{ fontWeight: 500 }}>{code}</span>;
    },
  },
  {
    title: "Tên chỉ tiêu",
    dataIndex: "indicatorName",
    key: "indicatorName",
    width: 200,
    render: (_, record) => {
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
            name={record.indicatorName}
            formattedName={record.indicatorFormattedName}
          />
        </div>
      );
    },
  },
  {
    title: "Tên phương pháp",
    key: "testMethodName",
    width: 200,
    render: (_, record) => (
      <IndicatorName
        name={record.testMethodName}
        formattedName={record.testMethodFormattedName}
      />
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
    width: 180,
    render: (_, record) => {
      const isSubIndicator = !!record.parentIndicatorId;

      // Range case: both lowerLimit and upperLimit have values
      if (record.lowerLimit && record.upperLimit) {
        const lower = convertOperatorSymbol(record.lowerOperator) || ">";
        const upper = convertOperatorSymbol(record.upperOperator) || "<";
        return `${lower} ${record.lowerLimit} và ${upper} ${record.upperLimit}`;
      }

      // Single limit with value
      if (record.allowedLimit && record.allowedLimit !== "0") {
        const op = convertOperatorSymbol(record.comparisonOperator);
        return `${op} ${record.allowedLimit}`.trim();
      }

      // allowedLimit is "0"
      if (record.allowedLimit === "0") {
        return "0";
      }

      // No limit values:
      // - Sub-indicators: show "0" as default
      // - Parent indicators: leave empty (limits are on sub-indicators)
      if (isSubIndicator) {
        return "0";
      }

      return null;
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
    render: (_, record) => {
      const canEdit = authService.hasPermission(PERMISSIONS.MasterData.Edit);
      const canDelete = authService.hasPermission(
        PERMISSIONS.MasterData.Delete,
      );
      const isSubIndicator = !!record.parentIndicatorId;

      return (
        <Space size="small">
          {canEdit && (
            <Tooltip
              title={record.isActive ? "Tắt hoạt động" : "Bật hoạt động"}
            >
              <Button
                type="link"
                size="small"
                icon={
                  record.isActive ? <StopOutlined /> : <CheckCircleOutlined />
                }
                onClick={() => handleToggleActive(record.standardId, record.id)}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record.standardId, record)}
              />
            </Tooltip>
          )}
          {/* Only show delete button for parent indicators, not sub-indicators */}
          {canDelete && !isSubIndicator && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa chỉ tiêu này khỏi tiêu chuẩn?"
              onConfirm={() => handleRemove(record.standardId, record.id)}
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
          )}
        </Space>
      );
    },
  },
];
