import { LOGIN_MESSAGES } from "../constants";
import { LoginError } from "../types";

export const getLoginErrorMessage = (err: LoginError): string => {
  if (err.status === 401) {
    return LOGIN_MESSAGES.invalidCredentials;
  }

  if (err.status === 400) {
    const errorData = err.data;
    if (errorData?.errors) {
      const errorMessages = Object.values(errorData.errors).flat().join(", ");
      return errorMessages || LOGIN_MESSAGES.invalidInput;
    }
    return (
      errorData?.message ||
      errorData?.errorMessage ||
      LOGIN_MESSAGES.invalidInput
    );
  }

  if (err.status === 423) {
    return LOGIN_MESSAGES.accountLocked;
  }

  if (!err.status) {
    return LOGIN_MESSAGES.networkError;
  }

  return LOGIN_MESSAGES.unknownError;
};