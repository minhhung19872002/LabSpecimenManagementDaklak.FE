/**
 * Extract error message from API error response
 * API interceptor unwraps errors into response.data directly
 *
 * Handles multiple formats:
 * 1. Validation errors: { fieldName: ["error message 1", "error message 2"] }
 * 2. Direct message: { message: "error message" }
 * 3. String message: "error message"
 */
export const getApiErrorMessage = (
  error: unknown,
  defaultMessage: string = "Có lỗi xảy ra"
): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any;
  const responseData = err?.response?.data;

  if (!responseData) {
    return defaultMessage;
  }

  // Handle string response directly
  if (typeof responseData === "string") {
    return responseData;
  }

  if (typeof responseData === "object") {
    // Check for direct message property
    if (responseData.message && typeof responseData.message === "string") {
      return responseData.message;
    }

    // Handle validation errors format: { fieldName: ["error message"] }
    const errorValues = Object.values(responseData);
    for (const value of errorValues) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return defaultMessage;
};

/**
 * Get all error messages from API error response
 * Returns an array of all error messages
 */
export const getAllApiErrorMessages = (error: unknown): string[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any;
  const serverErrors = err?.response?.data;
  const messages: string[] = [];

  if (serverErrors && typeof serverErrors === "object") {
    const errorValues = Object.values(serverErrors);
    for (const errorArray of errorValues) {
      if (Array.isArray(errorArray)) {
        messages.push(...errorArray);
      }
    }
  }

  return messages;
};
