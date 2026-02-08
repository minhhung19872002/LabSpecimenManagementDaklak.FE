/**
 * Extract first error message from an errors object
 * Format: { fieldName: ["error message 1", "error message 2"] }
 */
const extractFirstErrorFromObject = (obj: unknown): string | null => {
  if (!obj || typeof obj !== "object") return null;

  const values = Object.values(obj);
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return value[0];
    }
  }
  return null;
};

/**
 * Extract error message from API error response
 * API interceptor unwraps errors into response.data directly
 *
 * Handles multiple formats:
 * 1. Validation errors: { fieldName: ["error message 1", "error message 2"] }
 * 2. Wrapped errors: { errors: { fieldName: ["error message"] } }
 * 3. Direct message: { message: "error message" }
 * 4. String message: "error message"
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

    // Check for nested errors object: { errors: { fieldName: ["..."] } }
    if (responseData.errors && typeof responseData.errors === "object") {
      const errorMsg = extractFirstErrorFromObject(responseData.errors);
      if (errorMsg) return errorMsg;
    }

    // Handle validation errors format: { fieldName: ["error message"] }
    const errorMsg = extractFirstErrorFromObject(responseData);
    if (errorMsg) return errorMsg;
  }

  return defaultMessage;
};

/**
 * Extract all error messages from an errors object
 */
const extractAllErrorsFromObject = (obj: unknown): string[] => {
  const messages: string[] = [];
  if (!obj || typeof obj !== "object") return messages;

  const values = Object.values(obj);
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          messages.push(item);
        }
      }
    }
  }
  return messages;
};

/**
 * Get all error messages from API error response
 * Returns an array of all error messages
 */
export const getAllApiErrorMessages = (error: unknown): string[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any;
  const responseData = err?.response?.data;

  if (!responseData || typeof responseData !== "object") {
    return [];
  }

  // Check for nested errors object: { errors: { fieldName: ["..."] } }
  if (responseData.errors && typeof responseData.errors === "object") {
    return extractAllErrorsFromObject(responseData.errors);
  }

  // Handle direct format: { fieldName: ["..."] }
  return extractAllErrorsFromObject(responseData);
};
