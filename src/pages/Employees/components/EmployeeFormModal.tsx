import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Select,
  Input,
  Switch,
  Typography,
  Radio,
  Steps,
  Button,
  DatePicker,
} from "antd";
import { Controller, UseFormReturn } from "react-hook-form";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
  LockOutlined,
  ClockCircleOutlined,
} from "../../../components/common/Icon";
import dayjs from "dayjs";
import { EmployeeFormData } from "../schemas";
import { Department, POSITION_OPTIONS } from "../hooks";

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
    watch,
    trigger,
    formState: { errors },
  } = form;

  const [currentStep, setCurrentStep] = useState(0);
  const passwordMode = watch("passwordMode");
  const isTemporaryAccount = watch("isTemporaryAccount");

  // Reset step when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = async () => {
    // Validate step 1 fields
    const isValid = await trigger([
      "username",
      "fullName",
      "email",
      "departmentId",
    ]);
    if (isValid) {
      setCurrentStep(1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(0);
  };

  const handleCancel = () => {
    setCurrentStep(0);
    onCancel();
  };

  // For editing mode, submit directly without steps
  const handleOk = () => {
    if (isEditing) {
      handleSubmit(onSubmit)();
    } else if (currentStep === 0) {
      handleNext();
    } else {
      handleSubmit(onSubmit)();
    }
  };

  const getOkText = () => {
    if (isEditing) return "Cập nhật";
    return currentStep === 0 ? "Tiếp theo" : "Tạo nhân viên";
  };

  return (
    <Modal
      title={isEditing ? "Chỉnh sửa thông tin nhân viên" : "Thêm nhân viên mới"}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={getOkText()}
      cancelText={currentStep === 1 && !isEditing ? "Quay lại" : "Hủy"}
      confirmLoading={modalLoading}
      centered
      width={700}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          overflowX: "hidden",
        },
      }}
      footer={
        isEditing ? undefined : (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {currentStep === 1 && (
                <Button onClick={handlePrev}>Quay lại</Button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" onClick={handleOk} loading={modalLoading}>
                {getOkText()}
              </Button>
            </div>
          </div>
        )
      }
    >
      {!isEditing && (
        <Steps
          current={currentStep}
          size="small"
          style={{ marginBottom: 24 }}
          items={[
            { title: "Thông tin nhân viên" },
            { title: "Thiết lập mật khẩu" },
          ]}
        />
      )}

      <Form layout="vertical">
        {/* Step 1: Employee Info (or all fields for editing) */}
        {(currentStep === 0 || isEditing) && (
          <>
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
                        disabled={isEditing}
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

            {/* Temporary Account Settings */}
            <div
              style={{
                background: "#fafafa",
                padding: 16,
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        Tài khoản tạm thời
                      </span>
                    }
                    style={{ marginBottom: isTemporaryAccount ? 16 : 0 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <Controller
                        name="isTemporaryAccount"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            checkedChildren="Có"
                            unCheckedChildren="Không"
                          />
                        )}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Tài khoản sẽ tự động vô hiệu hóa khi hết hạn
                      </Text>
                    </div>
                  </Form.Item>
                </Col>
                {isTemporaryAccount && (
                  <Col span={12}>
                    <Form.Item
                      label="Ngày hết hạn"
                      required
                      validateStatus={
                        errors.accountExpirationDate ? "error" : ""
                      }
                      help={errors.accountExpirationDate?.message}
                      style={{ marginBottom: 0 }}
                    >
                      <Controller
                        name="accountExpirationDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            {...field}
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(date) =>
                              field.onChange(
                                date ? date.endOf("day").toDate() : null,
                              )
                            }
                            format="DD/MM/YYYY"
                            disabledDate={(current) =>
                              current && current < dayjs().startOf("day")
                            }
                            placeholder="Chọn ngày hết hạn"
                            style={{ width: "100%" }}
                          />
                        )}
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </div>
          </>
        )}

        {/* Step 2: Password Setup (only for creating) */}
        {currentStep === 1 && !isEditing && (
          <div
            style={{
              background: "#f5f5f5",
              padding: 24,
              borderRadius: 8,
            }}
          >
            <Form.Item
              label={
                <Text strong>
                  <KeyOutlined style={{ marginRight: 8 }} />
                  Chọn cách thiết lập mật khẩu
                </Text>
              }
              style={{ marginBottom: 24 }}
            >
              <Controller
                name="passwordMode"
                control={control}
                render={({ field }) => (
                  <Radio.Group
                    {...field}
                    value={field.value || "auto"}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <Radio value="auto">
                      <div>
                        <div>Tự động tạo và gửi email</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Hệ thống sẽ tạo mật khẩu ngẫu nhiên và gửi đến email
                          nhân viên
                        </Text>
                      </div>
                    </Radio>
                    <Radio value="manual">
                      <div>
                        <div>Nhập mật khẩu thủ công</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Bạn tự nhập mật khẩu và thông báo cho nhân viên
                        </Text>
                      </div>
                    </Radio>
                  </Radio.Group>
                )}
              />
            </Form.Item>

            {passwordMode === "manual" && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Mật khẩu"
                    required
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
                          placeholder="Nhập mật khẩu"
                          autoComplete="new-password"
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Xác nhận mật khẩu"
                    required
                    validateStatus={errors.confirmPassword ? "error" : ""}
                    help={errors.confirmPassword?.message}
                  >
                    <Controller
                      name="confirmPassword"
                      control={control}
                      render={({ field }) => (
                        <Input.Password
                          {...field}
                          value={field.value || ""}
                          prefix={<LockOutlined />}
                          placeholder="Xác nhận mật khẩu"
                        />
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ
                    thường, số và ký tự đặc biệt.
                  </Text>
                </Col>
              </Row>
            )}
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default EmployeeFormModal;
