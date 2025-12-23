import React from "react";
import { Form, Input, Button, Checkbox, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { FormInstance } from "antd/es/form";
import { LoginFormValues } from "../types";
import { LOGIN_VALIDATION_RULES } from "../constants";

interface LoginFormProps {
  form: FormInstance<LoginFormValues>;
  loading: boolean;
  error: string | null;
  onSubmit: (values: LoginFormValues) => void;
  onClearError: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  form,
  loading,
  error,
  onSubmit,
  onClearError,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={onClearError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        name="login"
        onFinish={onSubmit}
        autoComplete="off"
        initialValues={{ rememberMe: false }}
      >
        <Form.Item name="username" rules={LOGIN_VALIDATION_RULES.username}>
          <Input
            prefix={<UserOutlined />}
            placeholder={t("auth.username")}
            size="large"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item name="password" rules={LOGIN_VALIDATION_RULES.password}>
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={t("auth.password")}
            size="large"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item name="rememberMe" valuePropName="checked">
          <Checkbox disabled={loading}>Ghi nhớ đăng nhập</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            {loading ? "Đang đăng nhập..." : t("common.login")}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default LoginForm;