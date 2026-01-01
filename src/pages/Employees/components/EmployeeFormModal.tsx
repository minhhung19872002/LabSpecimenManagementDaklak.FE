import React from "react";
import { Modal, Form, Row, Col, Select, Input, Switch, Typography } from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { EmployeeFormData } from "../schemas";
import { Department, ROLE_OPTIONS, POSITION_OPTIONS } from "../hooks";

const { Text } = Typography;

interface EmployeeFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: UseFormReturn<EmployeeFormData>;
  departments: Department[];
  modalLoading: boolean;
  onCancel: () => void;
  onSubmit: (data: EmployeeFormData) => void;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  open,
  isEditing,
  form,
  departments,
  modalLoading,
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
      title={isEditing ? "Chỉnh sửa thông tin nhân viên" : "Thêm nhân viên mới"}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onCancel}
      okText={isEditing ? "Cập nhật" : "Tạo nhân viên"}
      cancelText="Hủy"
      confirmLoading={modalLoading}
      centered
      width={700}
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
                    placeholder="nguyen.van.a"
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
                    placeholder="email@labdaklak.vn"
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
              validateStatus={errors.departmentId ? "error" : ""}
              help={errors.departmentId?.message}
            >
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn phòng ban">
                    {departments.map((d) => (
                      <Select.Option key={d.id} value={d.id}>
                        {d.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Chức vụ">
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || undefined}
                    placeholder="Chọn chức vụ"
                    allowClear
                  >
                    {POSITION_OPTIONS.map((p) => (
                      <Select.Option key={p} value={p}>
                        {p}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Vai trò hệ thống"
              required
              validateStatus={errors.role ? "error" : ""}
              help={errors.role?.message}
            >
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Chọn vai trò">
                    {ROLE_OPTIONS.map((r) => (
                      <Select.Option key={r.value} value={r.value}>
                        {r.label}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Trạng thái">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Vô hiệu"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {!isEditing && (
          <div
            style={{
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 6,
              marginTop: 8,
            }}
          >
            <Text type="secondary">
              <KeyOutlined style={{ marginRight: 8 }} />
              Mật khẩu sẽ được tạo tự động và gửi đến email nhân viên đã cung
              cấp.
            </Text>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default EmployeeFormModal;
