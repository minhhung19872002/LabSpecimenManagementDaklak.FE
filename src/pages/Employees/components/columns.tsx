import { Button, Space, Tag, Switch, Tooltip, Avatar } from "antd";
import {
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
  ClockCircleOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { EmployeeDto } from "../../../services/employeeService";
import type { OfflineSyncInfo } from "../../../services/offline/createOfflineService";
import SyncStatusTag from "../../../components/common/SyncStatusTag";
import dayjs from "dayjs";
import { authService } from "../../../services/authService";
import { PERMISSIONS } from "../../../constants/permissionMapping";

interface RoleOption {
  value: string;
  label: string;
  color: string;
}

interface GetColumnsOptions {
  onEdit: (record: EmployeeDto) => void;
  onToggleActive: (id: string, checked: boolean) => void;
  onResetPassword: (record: EmployeeDto) => void;
  onViewRoles: (record: EmployeeDto) => void;
  onAddSchedule?: (record: EmployeeDto) => void;
  roles: RoleOption[];
}

const UNSYNCED_TOOLTIP = "Nhân viên chưa đồng bộ lên máy chủ";

export const getEmployeeColumns = (
  options: GetColumnsOptions,
): ColumnsType<EmployeeDto & OfflineSyncInfo> => {
  const getRoleTags = (
    roles: string[] | string | undefined,
    record: EmployeeDto,
  ) => {
    // Handle both array (new) and string (legacy) formats
    const roleList = Array.isArray(roles) ? roles : roles ? [roles] : [];

    if (roleList.length === 0) {
      return (
        <Tag
          style={{
            backgroundColor: "#8C8C8C",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 18,
            padding: "2px 8px",
          }}
        >
          Chưa phân quyền
        </Tag>
      );
    }

    const visibleRoles = roleList.slice(0, 2);
    const remaining = roleList.length - 2;

    return (
      <Space size={[0, 4]} wrap>
        {visibleRoles.map((role) => {
          const roleConfig = options.roles.find((r) => r.value === role);
          return (
            <Tag
              key={role}
              style={{
                backgroundColor: roleConfig?.color || "#8C8C8C",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 18,
                padding: "2px 8px",
              }}
            >
              {roleConfig?.label || role}
            </Tag>
          );
        })}
        {remaining > 0 && (
          <Tag
            style={{ cursor: "pointer", borderRadius: 18, padding: "2px 8px" }}
            onClick={(e) => {
              e.stopPropagation();
              options.onViewRoles(record);
            }}
          >
            +{remaining}
          </Tag>
        )}
      </Space>
    );
  };

  return [
    {
      title: "Nhân viên",
      key: "employee",
      width: 250,
      fixed: "left",
      render: (_, record) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: record.isActive ? "#1890ff" : "#d9d9d9" }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.fullName}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              @{record.username}
            </div>
            <SyncStatusTag record={record} />
          </div>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      render: (email: string) => (
        <Space>
          <MailOutlined style={{ color: "#1890ff" }} />
          <span style={{ fontSize: 13 }}>{email}</span>
        </Space>
      ),
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 130,
      render: (phone: string) => (
        <Space>
          <PhoneOutlined style={{ color: "#52c41a" }} />
          {phone || "-"}
        </Space>
      ),
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
      width: 150,
    },
    {
      title: "Chức vụ",
      dataIndex: "position",
      key: "position",
      width: 140,
    },
    {
      title: "Nhóm quyền",
      dataIndex: "roles",
      key: "roles",
      width: 180,
      render: (roles: string[] | string | undefined, record) =>
        getRoleTags(roles || record.role, record),
    },
    {
      title: "Loại TK",
      key: "accountType",
      width: 150,
      render: (_, record) => {
        if (!record.isTemporaryAccount) {
          return (
            <Tag
              style={{
                backgroundColor: "#1890FF",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 18,
                padding: "2px 8px",
              }}
            >
              Vĩnh viễn
            </Tag>
          );
        }

        const expirationDate = record.accountExpirationDate
          ? dayjs(record.accountExpirationDate)
          : null;
        const isExpired = record.isExpired;
        const daysLeft = expirationDate
          ? expirationDate.diff(dayjs(), "day")
          : 0;

        return (
          <Tooltip
            title={
              expirationDate
                ? `Hết hạn: ${expirationDate.format("DD/MM/YYYY")}`
                : "Không có ngày hết hạn"
            }
          >
            <Space direction="vertical" size={0}>
              <Tag
                icon={<ClockCircleOutlined />}
                style={{
                  backgroundColor: isExpired
                    ? "#F5222D"
                    : daysLeft <= 3
                      ? "#FA8C16"
                      : "#FAAD14",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 18,
                  padding: "2px 8px",
                }}
              >
                {isExpired
                  ? "Đã hết hạn"
                  : daysLeft <= 0
                    ? "Hết hạn hôm nay"
                    : `Còn ${daysLeft} ngày`}
              </Tag>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive: boolean, record) => {
        const canEdit = authService.hasPermission(PERMISSIONS.Users.Edit);
        return (
          <Tooltip title={record._isUnsyncedCreate ? UNSYNCED_TOOLTIP : undefined}>
            <Switch
              checked={isActive}
              onChange={(checked) => options.onToggleActive(record.id, checked)}
              checkedChildren="Hoạt động"
              unCheckedChildren="Vô hiệu"
              disabled={!canEdit || record._isUnsyncedCreate}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => {
        const canEdit = authService.hasPermission(PERMISSIONS.Users.Edit);
        const canGrantTemp = authService.hasPermission(PERMISSIONS.TemporaryAccess.Create);
        // Bản ghi tạo offline chưa có tài khoản trên server → các thao tác gọi API trực tiếp đều chưa dùng được
        const unsynced = Boolean(record._isUnsyncedCreate);

        return (
          <Space size="small">
            {canGrantTemp && options.onAddSchedule && (
              <Tooltip title={unsynced ? UNSYNCED_TOOLTIP : "Cấp quyền tạm thời"}>
                <Button
                  type="link"
                  size="small"
                  disabled={unsynced}
                  icon={<ClockCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    options.onAddSchedule!(record);
                  }}
                />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title={unsynced ? UNSYNCED_TOOLTIP : "Sửa"}>
                <Button
                  type="link"
                  size="small"
                  disabled={unsynced}
                  icon={<EditOutlined />}
                  onClick={() => options.onEdit(record)}
                />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title={unsynced ? UNSYNCED_TOOLTIP : "Đặt lại mật khẩu"}>
                <Button
                  type="link"
                  size="small"
                  disabled={unsynced}
                  icon={<KeyOutlined />}
                  onClick={() => options.onResetPassword(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];
};
