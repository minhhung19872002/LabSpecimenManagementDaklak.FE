import { Button, Space, Tag, Switch, Popconfirm, Avatar, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
} from "../../../components/common/Icon";
import { UserDto } from "../../../services/userService";
import { ROLES } from "../hooks";

interface ColumnActions {
  onEdit: (record: UserDto) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, checked: boolean) => void;
  onResetPassword: (record: UserDto) => void;
}

export const getUserColumns = ({
  onEdit,
  onDelete,
  onToggleActive,
  onResetPassword,
}: ColumnActions) => [
  {
    title: "Người dùng",
    key: "user",
    render: (_: unknown, record: UserDto) => (
      <Space>
        <Avatar
          icon={<UserOutlined />}
          style={{ backgroundColor: record.isActive ? "#1890ff" : "#d9d9d9" }}
        />
        <div>
          <div style={{ fontWeight: 500 }}>{record.fullName}</div>
          <div style={{ fontSize: 12, color: "#666" }}>@{record.username}</div>
        </div>
      </Space>
    ),
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (email: string) => (
      <Space>
        <MailOutlined style={{ color: "#1890ff" }} />
        {email}
      </Space>
    ),
  },
  {
    title: "Điện thoại",
    dataIndex: "phone",
    key: "phone",
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
  },
  {
    title: "Vai trò",
    dataIndex: "role",
    key: "role",
    render: (role: string) => {
      const roleConfig = ROLES.find((r) => r.value === role);
      return <Tag color={roleConfig?.color || "default"}>{roleConfig?.label || role}</Tag>;
    },
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    render: (isActive: boolean, record: UserDto) => (
      <Switch
        checked={isActive}
        onChange={(checked) => onToggleActive(record.id, checked)}
        checkedChildren="Hoạt động"
        unCheckedChildren="Vô hiệu"
      />
    ),
  },
  {
    title: "Đăng nhập cuối",
    dataIndex: "lastLogin",
    key: "lastLogin",
    render: (text: string) => (
      <span style={{ color: "#666", fontSize: 12 }}>{text || "-"}</span>
    ),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 120,
    fixed: "right" as const,
    render: (_: unknown, record: UserDto) => (
      <Space size="small">
        <Tooltip title="Sửa">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
        </Tooltip>
        <Tooltip title="Đặt lại mật khẩu">
          <Button
            type="text"
            size="small"
            icon={<LockOutlined />}
            onClick={() => onResetPassword(record)}
          />
        </Tooltip>
        <Popconfirm
          title="Xóa người dùng"
          description="Bạn có chắc muốn xóa người dùng này?"
          onConfirm={() => onDelete(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Tooltip title="Xóa">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  },
];
