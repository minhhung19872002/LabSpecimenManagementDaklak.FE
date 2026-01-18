import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  Typography,
  Radio,
  message,
} from "antd";
import {
  KeyOutlined,
  LockOutlined,
} from "../../../components/common/Icon";
import { employeeService, EmployeeDto } from "../../../services/employeeService";

const { Text } = Typography;

// Password validation regex patterns
const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasDigit = /[0-9]/;
const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

interface ResetPasswordModalProps {
  open: boolean;
  employee: EmployeeDto | null;
  onCancel: () => void;
  onSuccess: (email: string, isManual: boolean) => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  open,
  employee,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordMode, setPasswordMode] = useState<"auto" | "manual">("auto");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPasswordMode("auto");
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    if (!employee) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const isManualPassword = passwordMode === "manual";

      await employeeService.resetPassword(employee.id, {
        useManualPassword: isManualPassword,
        password: isManualPassword ? values.password : undefined,
        confirmPassword: isManualPassword ? values.confirmPassword : undefined,
      });

      onSuccess(employee.email, isManualPassword);
    } catch (error: unknown) {
      console.error("Error resetting password:", error);

      // Parse error message from API response
      let errorMessage = "Không thể đặt lại mật khẩu. Vui lòng thử lại.";

      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: Record<string, string[]> | { message?: string } } }).response;
        const errorData = response?.data;

        if (errorData) {
          if (typeof errorData === "object" && !("message" in errorData)) {
            const errors = errorData as Record<string, string[]>;
            const allMessages: string[] = [];

            Object.values(errors).forEach((messages) => {
              if (Array.isArray(messages)) {
                allMessages.push(...messages);
              }
            });

            if (allMessages.length > 0) {
              errorMessage = allMessages.join(". ");
            }
          } else if ("message" in errorData && errorData.message) {
            errorMessage = String(errorData.message);
          }
        }
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: unknown, value: string) => {
    if (passwordMode !== "manual") {
      return Promise.resolve();
    }
    if (!value) {
      return Promise.reject(new Error("Vui lòng nhập mật khẩu"));
    }
    if (value.length < 6) {
      return Promise.reject(new Error("Mật khẩu phải có ít nhất 6 ký tự"));
    }
    if (!hasUppercase.test(value)) {
      return Promise.reject(new Error("Mật khẩu phải có ít nhất 1 chữ hoa"));
    }
    if (!hasLowercase.test(value)) {
      return Promise.reject(new Error("Mật khẩu phải có ít nhất 1 chữ thường"));
    }
    if (!hasDigit.test(value)) {
      return Promise.reject(new Error("Mật khẩu phải có ít nhất 1 chữ số"));
    }
    if (!hasSpecialChar.test(value)) {
      return Promise.reject(new Error("Mật khẩu phải có ít nhất 1 ký tự đặc biệt"));
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = (_: unknown, value: string) => {
    if (passwordMode !== "manual") {
      return Promise.resolve();
    }
    if (!value) {
      return Promise.reject(new Error("Vui lòng xác nhận mật khẩu"));
    }
    const password = form.getFieldValue("password");
    if (value !== password) {
      return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={`Đặt lại mật khẩu - ${employee?.fullName || ""}`}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="Đặt lại mật khẩu"
      cancelText="Hủy"
      confirmLoading={loading}
      centered
      width={500}
    >
      <Form form={form} layout="vertical">
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
                Chọn cách đặt lại mật khẩu
              </Text>
            }
            style={{ marginBottom: 24 }}
          >
            <Radio.Group
              value={passwordMode}
              onChange={(e) => {
                setPasswordMode(e.target.value);
                form.resetFields(["password", "confirmPassword"]);
              }}
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
                    Hệ thống sẽ tạo mật khẩu mới ngẫu nhiên và gửi đến email nhân viên
                  </Text>
                </div>
              </Radio>
              <Radio value="manual">
                <div>
                  <div>Nhập mật khẩu thủ công</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Bạn tự nhập mật khẩu mới và thông báo cho nhân viên
                  </Text>
                </div>
              </Radio>
            </Radio.Group>
          </Form.Item>

          {passwordMode === "manual" && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Mật khẩu mới"
                  rules={[{ validator: validatePassword }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Nhập mật khẩu mới"
                    autoComplete="new-password"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  rules={[{ validator: validateConfirmPassword }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Xác nhận mật khẩu"
                    autoComplete="new-password"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                </Text>
              </Col>
            </Row>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default ResetPasswordModal;
