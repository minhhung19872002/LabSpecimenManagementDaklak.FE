import { Button, Space, Tag, Switch, Tooltip, Popconfirm, Avatar } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
  ClockCircleOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { EmployeeDto } from "../../../services/employeeService";
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
  onDelete: (id: string) => void;
  onToggleActive: (id: string, checked: boolean) => void;
  onResetPassword: (record: EmployeeDto) => void;
  roles: RoleOption[];
}

export const getEmployeeColumns = (
  options: GetColumnsOptions
): ColumnsType<EmployeeDto> => {
  const getRoleTags = (roles: string[] | string | undefined) => {
    // Handle both array (new) and string (legacy) formats
    const roleList = Array.isArray(roles) ? roles : roles ? [roles] : [];

    if (roleList.length === 0) {
      return <Tag color="default">Chưa phân quyền</Tag>;
    }

    return (
      <Space size={[0, 4]} wrap>
        {roleList.map((role) => {
          const roleConfig = options.roles.find((r) => r.value === role);
          return (
            <Tag key={role} color={roleConfig?.color || "default"}>
              {roleConfig?.label || role}
            </Tag>
          );
        })}
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
        getRoleTags(roles || record.role),
    },
    {
      title: "Loại TK",
      key: "accountType",
      width: 150,
      render: (_, record) => {
        if (!record.isTemporaryAccount) {
          return <Tag color="blue">Vĩnh viễn</Tag>;
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
                color={isExpired ? "red" : daysLeft <= 3 ? "orange" : "gold"}
                icon={<ClockCircleOutlined />}
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
          <Switch
            checked={isActive}
            onChange={(checked) => options.onToggleActive(record.id, checked)}
            checkedChildren="Hoạt động"
            unCheckedChildren="Vô hiệu"
            disabled={!canEdit}
          />
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => {
        const canEdit = authService.hasPermission(PERMISSIONS.Users.Edit);
        const canDelete = authService.hasPermission(PERMISSIONS.Users.Delete);

        return (
          <Space size="small">
            {canEdit && (
              <Tooltip title="Sửa">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => options.onEdit(record)}
                />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title="Đặt lại mật khẩu">
                <Button
                  type="link"
                  size="small"
                  icon={<KeyOutlined />}
                  onClick={() => options.onResetPassword(record)}
                />
              </Tooltip>
            )}
            {canDelete && (
              <Popconfirm
                title="Xóa nhân viên"
                description="Bạn có chắc muốn xóa nhân viên này?"
                onConfirm={() => options.onDelete(record.id)}
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
        );
      },
    },
  ];
};
