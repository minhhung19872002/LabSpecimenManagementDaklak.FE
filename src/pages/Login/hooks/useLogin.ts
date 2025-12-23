import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import { FormInstance } from "antd/es/form";
import { useLoginMutation, authHelpers } from "../../../store/api/authApi";
import { LoginFormValues } from "../types";
import { REMEMBERED_USERNAME_KEY, LOGIN_MESSAGES } from "../constants";
import { getLoginErrorMessage } from "../utils/errorHandler";

interface UseLoginOptions {
  form: FormInstance<LoginFormValues>;
}

interface UseLoginReturn {
  loading: boolean;
  error: string | null;
  clearError: () => void;
  handleSubmit: (values: LoginFormValues) => Promise<void>;
}

export const useLogin = ({ form }: UseLoginOptions): UseLoginReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [login, { isLoading: loading }] = useLoginMutation();

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
    if (authHelpers.isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: LoginFormValues) => {
      setError(null);

      try {
        const response = await login({
          userNameOrEmail: values.username,
          password: values.password,
          rememberMe: values.rememberMe,
        }).unwrap();

        if (response.success && response.accessToken) {
          // Handle remember me
          if (values.rememberMe) {
            localStorage.setItem(REMEMBERED_USERNAME_KEY, values.username);
          } else {
            localStorage.removeItem(REMEMBERED_USERNAME_KEY);
          }

          message.success(LOGIN_MESSAGES.success);

          // Store user info
          if (response.user) {
            localStorage.setItem("user_info", JSON.stringify(response.user));
          }

          navigate(from, { replace: true });
        } else if (response.errorMessage) {
          setError(response.errorMessage);
        } else {
          setError(LOGIN_MESSAGES.defaultError);
        }
      } catch (err: any) {
        console.error("Login error:", err);
        setError(getLoginErrorMessage(err));
      }
    },
    [login, navigate, from]
  );

  return {
    loading,
    error,
    clearError,
    handleSubmit,
  };
};