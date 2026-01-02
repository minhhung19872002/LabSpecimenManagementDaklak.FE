/**
 * Extract error message from API error response
 * API interceptor unwraps errors into response.data directly
 * Expected format: { fieldName: ["error message 1", "error message 2"] }
 */
export const getApiErrorMessage = (
  error: unknown,
  defaultMessage: string = "Có lỗi xảy ra"
): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any;
  const serverErrors = err?.response?.data;

  if (serverErrors && typeof serverErrors === "object") {
    // Get first error message from errors object
    const errorValues = Object.values(serverErrors);
    if (errorValues.length > 0) {
      const firstErrorArray = errorValues[0] as string[];
      if (Array.isArray(firstErrorArray) && firstErrorArray.length > 0) {
        return firstErrorArray[0];
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
