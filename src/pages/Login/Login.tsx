import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Checkbox, message, Alert } from "antd";
import { UserOutlined, LockOutlined, WifiOutlined } from "../../components/common/Icon";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { authService, UserInfo } from "../../services/authService";
import { STORAGE_KEYS, getDefaultRouteForUser } from "../../constants";
import "./Login.css";

interface LoginFormValues {
  username: string;
  password: string;
  rememberMe?: boolean;
}

const REMEMBERED_USERNAME_KEY = "remembered_username";

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Get the return URL from location state
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if offline login is available
  const hasOfflineCredentials = authService.hasOfflineCredentials();
  const offlineUsername = authService.getOfflineUsername();

  // Load remembered username on mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY);
    if (rememberedUsername) {
      form.setFieldsValue({
        username: rememberedUsername,
        password: "",
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
            const defaultRoute = getDefaultRouteForUser(userInfo.roles);
            if (defaultRoute) {
              navigate(defaultRoute, { replace: true });
              return;
            }
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

    const credentials = {
      userNameOrEmail: values.username,
      password: values.password,
      rememberMe: values.rememberMe,
    };

    try {
      let response;
      let loginMethod: 'online' | 'offline' = 'online';

      // Always try online login first, regardless of navigator.onLine
      // navigator.onLine is unreliable in many browsers
      try {
        response = await authService.login(credentials);
      } catch (onlineErr: any) {
        // If network error (no response), try offline login as fallback
        if (!onlineErr.response && hasOfflineCredentials) {
          console.log('Online login failed, attempting offline login...');
          loginMethod = 'offline';
          response = await authService.loginOffline(credentials);
        } else {
          throw onlineErr; // Re-throw if it's not a network error
        }
      }

      // Check both success flag and accessToken
      if (response.success && response.accessToken) {
        // Handle remember me - save or remove username from localStorage
        if (values.rememberMe) {
          localStorage.setItem(REMEMBERED_USERNAME_KEY, values.username);
        } else {
          localStorage.removeItem(REMEMBERED_USERNAME_KEY);
        }

        // Show appropriate success message
        if (loginMethod === 'offline') {
          message.warning("Đăng nhập offline thành công! Một số tính năng có thể bị hạn chế.");
        } else {
          message.success("Đăng nhập thành công!");
        }

        // Store user info
        if (response.user) {
          localStorage.setItem(
            STORAGE_KEYS.USER_INFO,
            JSON.stringify(response.user),
          );
        }

        // Determine redirect path based on user permissions
        let redirectPath = from;
        if (response.user?.roles && response.user.roles.length > 0) {
          // If coming from login directly (not redirected), use permission-based route
          if (from === "/dashboard" || from === "/") {
            redirectPath = getDefaultRouteForUser(response.user.roles) || "/";
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

      // Handle offline login failure
      if (err.message === 'OFFLINE_AUTH_FAILED') {
        if (!navigator.onLine && !hasOfflineCredentials) {
          setError("Không có kết nối mạng và chưa có thông tin đăng nhập được lưu. Vui lòng kết nối mạng để đăng nhập lần đầu.");
        } else {
          setError("Tên đăng nhập hoặc mật khẩu không đúng (chế độ offline).");
        }
        return;
      }

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
              "Thông tin đăng nhập không hợp lệ.",
          );
        }
      } else if (err.response?.status === 423) {
        setError("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
      } else if (!err.response) {
        // Network error and no offline credentials
        if (hasOfflineCredentials) {
          setError("Không thể kết nối đến server. Thông tin đăng nhập không khớp với tài khoản đã lưu offline.");
        } else {
          setError("Không thể kết nối đến server. Vui lòng kết nối mạng để đăng nhập lần đầu.");
        }
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

        {/* Offline status indicator */}
        {!isOnline && (
          <Alert
            message={
              <span>
                <WifiOutlined style={{ marginRight: 8 }} />
                Chế độ Offline
                {hasOfflineCredentials && offlineUsername && (
                  <span style={{ marginLeft: 8, fontSize: 12 }}>
                    (Tài khoản đã lưu: {offlineUsername})
                  </span>
                )}
              </span>
            }
            description={
              hasOfflineCredentials
                ? "Bạn có thể đăng nhập bằng tài khoản đã lưu trước đó."
                : "Vui lòng kết nối mạng để đăng nhập lần đầu."
            }
            type={hasOfflineCredentials ? "warning" : "info"}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

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
