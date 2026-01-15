import { Button, Space, Tag, Switch, Tooltip, Popconfirm, Avatar } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
} from "../../../components/common/Icon";
import type { ColumnsType } from "antd/es/table";
import { EmployeeDto } from "../../../services/employeeService";

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
  resetPasswordLoadingId: string | null;
  roles: RoleOption[];
}

export const getEmployeeColumns = (
  options: GetColumnsOptions
): ColumnsType<EmployeeDto> => {
  const getRoleTag = (role: string) => {
    const roleConfig = options.roles.find((r) => r.value === role);
    return (
      <Tag color={roleConfig?.color || "default"}>
        {roleConfig?.label || role}
      </Tag>
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
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => options.onToggleActive(record.id, checked)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Vô hiệu"
        />
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => options.onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Đặt lại mật khẩu">
            <Button
              type="link"
              size="small"
              icon={<KeyOutlined />}
              loading={options.resetPasswordLoadingId === record.id}
              onClick={() => options.onResetPassword(record)}
            />
          </Tooltip>
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
        </Space>
      ),
    },
  ];
};
