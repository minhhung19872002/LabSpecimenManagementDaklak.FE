export interface LoginFormValues {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginError {
  status?: number;
  data?: {
    errors?: Record<string, string[]>;
    message?: string;
    errorMessage?: string;
  };
}