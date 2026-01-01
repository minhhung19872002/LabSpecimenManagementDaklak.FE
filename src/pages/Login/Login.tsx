import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Checkbox, message, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { authService, UserInfo } from "../../services/authService";
import { PATH_ROUTES, ROLES, STORAGE_KEYS } from "../../constants";
import "./Login.css";

interface LoginFormValues {
  username: string;
  password: string;
  rememberMe?: boolean;
}

const REMEMBERED_USERNAME_KEY = "remembered_username";

// Role-based default routes
const getDefaultRouteByRole = (roles: string[]): string => {
  // Check roles in order of priority
  if (roles.includes(ROLES.ADMIN)) {
    return PATH_ROUTES.dashboard;
  }
  if (roles.includes(ROLES.QUALITY_MANAGER)) {
    return PATH_ROUTES.dashboard;
  }
  if (roles.includes(ROLES.LAB_TECHNICAL_MANAGER)) {
    return PATH_ROUTES.dashboard;
  }
  if (roles.includes(ROLES.SAMPLE_RECEIVER)) {
    return PATH_ROUTES.testRequests.index;
  }
  if (roles.includes(ROLES.LAB_TECHNICIAN)) {
    return PATH_ROUTES.testing.index;
  }
  // Default fallback
  return PATH_ROUTES.dashboard;
};

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the return URL from location state
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  // Load remembered username on mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY);
    if (rememberedUsername) {
      form.setFieldsValue({
        username: rememberedUsername,
        password: "1q2w3E*",
        rememberMe: true,
      });
    }
  }, [form]);

  // Redirect if already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      // Get user info from localStorage to determine correct redirect
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (storedUser) {
        try {
          const userInfo: UserInfo = JSON.parse(storedUser);
          if (userInfo.roles && userInfo.roles.length > 0) {
            const defaultRoute = getDefaultRouteByRole(userInfo.roles);
            navigate(defaultRoute, { replace: true });
            return;
          }
        } catch {
          // Ignore parsing errors
        }
      }
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login({
        userNameOrEmail: values.username,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      // Check both success flag and accessToken
      if (response.success && response.accessToken) {
        // Handle remember me - save or remove username from localStorage
        if (values.rememberMe) {
          localStorage.setItem(REMEMBERED_USERNAME_KEY, values.username);
        } else {
          localStorage.removeItem(REMEMBERED_USERNAME_KEY);
        }

        message.success("Đăng nhập thành công!");
        // Store user info
        if (response.user) {
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));
        }

        // Determine redirect path based on user role
        let redirectPath = from;
        if (response.user?.roles && response.user.roles.length > 0) {
          // If coming from login directly (not redirected), use role-based route
          if (from === "/dashboard" || from === "/") {
            redirectPath = getDefaultRouteByRole(response.user.roles);
          }
        }

        // Navigate to the appropriate page based on role
        navigate(redirectPath, { replace: true });
      } else if (response.errorMessage) {
        setError(response.errorMessage);
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Login error:", err);

      // Handle different error cases
      if (err.response?.status === 401) {
        setError("Tên đăng nhập hoặc mật khẩu không đúng.");
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData?.errors) {
          const errorMessages = Object.values(errorData.errors)
            .flat()
            .join(", ");
          setError(errorMessages || "Thông tin đăng nhập không hợp lệ.");
        } else {
          setError(
            errorData?.message ||
              errorData?.errorMessage ||
              "Thông tin đăng nhập không hợp lệ."
          );
        }
      } else if (err.response?.status === 423) {
        setError("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
      } else if (!err.response) {
        setError(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
        );
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h1>{t("common.appName")}</h1>
        <h2>{t("common.login")}</h2>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ rememberMe: false }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập!" },
              { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("auth.username")}
              size="large"
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
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
      </Card>
    </div>
  );
};

export default Login;
