import React from "react";
import { Modal, Form, Row, Col, Select, Input } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { UserFormData } from "../schemas";
import { Department, ROLES } from "../hooks";

interface UserFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: UseFormReturn<UserFormData>;
  departments: Department[];
  onCancel: () => void;
  onSubmit: (data: UserFormData) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  isEditing,
  form,
  departments,
  onCancel,
  onSubmit,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Modal
      title={isEditing ? "Sửa thông tin người dùng" : "Thêm người dùng mới"}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onCancel}
      okText="Lưu"
      cancelText="Hủy"
      width={600}
      centered
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tên đăng nhập"
              required
              validateStatus={errors.username ? "error" : ""}
              help={errors.username?.message}
            >
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="username"
                    disabled={isEditing}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Họ và tên"
              required
              validateStatus={errors.fullName ? "error" : ""}
              help={errors.fullName?.message}
            >
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Nguyễn Văn A" />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Email"
              required
              validateStatus={errors.email ? "error" : ""}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined />}
                    placeholder="email@example.com"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Số điện thoại">
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    prefix={<PhoneOutlined />}
                    placeholder="0905123456"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Phòng ban"
              required
              validateStatus={errors.department ? "error" : ""}
              help={errors.department?.message}
            >
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn phòng ban">
                    {departments.map((d) => (
                      <Select.Option key={d.id} value={d.name}>
                        {d.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Vai trò"
              required
              validateStatus={errors.role ? "error" : ""}
              help={errors.role?.message}
            >
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn vai trò">
                    {ROLES.map((r) => (
                      <Select.Option key={r.value} value={r.value}>
                        {r.label}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {!isEditing && (
          <Form.Item
            label="Mật khẩu"
            required={!isEditing}
            validateStatus={errors.password ? "error" : ""}
            help={errors.password?.message}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  value={field.value || ""}
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu"
                />
              )}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default UserFormModal;
