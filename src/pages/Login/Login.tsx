import React from "react";
import { Form, Card } from "antd";
import { useTranslation } from "react-i18next";
import { useLogin } from "./hooks/useLogin";
import { LoginFormValues } from "./types";
import LoginForm from "./components/LoginForm";
import "./Login.css";

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<LoginFormValues>();
  const { loading, error, clearError, handleSubmit } = useLogin({ form });

  return (
    <div className="login-container">
      <Card className="login-card">
        <h1>{t("common.appName")}</h1>
        <h2>{t("common.login")}</h2>

        <LoginForm
          form={form}
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          onClearError={clearError}
        />
      </Card>
    </div>
  );
};

export default Login;