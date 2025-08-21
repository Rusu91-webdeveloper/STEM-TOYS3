import { useTranslation } from "@/lib/i18n";

export interface ErrorInfo {
  code: string;
  message: string;
  userFriendlyMessage: string;
  retryable: boolean;
  action?: string;
}

export class CheckoutError extends Error {
  public code: string;
  public retryable: boolean;
  public action?: string;

  constructor(
    code: string,
    message: string,
    retryable = false,
    action?: string
  ) {
    super(message);
    this.name = "CheckoutError";
    this.code = code;
    this.retryable = retryable;
    this.action = action;
  }
}

export function getErrorInfo(
  error: unknown,
  t?: (key: string, fallback: string) => string
): ErrorInfo {
  // Default translation function if none provided
  const translate = t || ((key: string, fallback: string) => fallback);

  if (error instanceof CheckoutError) {
    return {
      code: error.code,
      message: error.message,
      userFriendlyMessage: translate(
        `error.title.${error.code}`,
        error.message
      ),
      retryable: error.retryable,
      action: error.action,
    };
  }

  if (error instanceof Error) {
    // Handle common error patterns
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return {
        code: "NETWORK_ERROR",
        message: error.message,
        userFriendlyMessage: translate(
          "error.networkError",
          "Connection error. Please check your internet connection and try again."
        ),
        retryable: true,
        action: "retry",
      };
    }

    if (error.message.includes("timeout")) {
      return {
        code: "TIMEOUT_ERROR",
        message: error.message,
        userFriendlyMessage: translate(
          "error.timeoutError",
          "Request timed out. Please try again."
        ),
        retryable: true,
        action: "retry",
      };
    }

    if (
      error.message.includes("unauthorized") ||
      error.message.includes("401")
    ) {
      return {
        code: "AUTH_ERROR",
        message: error.message,
        userFriendlyMessage: translate(
          "error.authError",
          "Please log in again to continue."
        ),
        retryable: false,
        action: "login",
      };
    }

    if (error.message.includes("payment") || error.message.includes("stripe")) {
      return {
        code: "PAYMENT_ERROR",
        message: error.message,
        userFriendlyMessage: translate(
          "error.paymentError",
          "Payment processing error. Please check your payment details and try again."
        ),
        retryable: true,
        action: "retry",
      };
    }

    // Default error
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
      userFriendlyMessage: translate(
        "error.unknownError",
        "An unexpected error occurred. Please try again."
      ),
      retryable: true,
      action: "retry",
    };
  }

  // Handle non-Error objects
  return {
    code: "UNKNOWN_ERROR",
    message: String(error),
    userFriendlyMessage: translate(
      "error.unknownError",
      "An unexpected error occurred. Please try again."
    ),
    retryable: true,
    action: "retry",
  };
}

export function createRetryableError(
  code: string,
  message: string,
  action?: string
): CheckoutError {
  return new CheckoutError(code, message, true, action);
}

export function createNonRetryableError(
  code: string,
  message: string,
  action?: string
): CheckoutError {
  return new CheckoutError(code, message, false, action);
}

// Common error codes
export const ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVENTORY_ERROR: "INVENTORY_ERROR",
  SETTINGS_ERROR: "SETTINGS_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;
