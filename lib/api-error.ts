import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";

// Define error types
export type ErrorType =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR";

// Generic error response structure sent to clients
interface ErrorResponse {
  error: {
    code: ErrorType;
    message: string;
    status: number;
    requestId?: string;
    // Only included in validation errors
    fields?: Record<string, string>;
  };
}

// Error mapping
const ERROR_DETAILS: Record<
  ErrorType,
  { status: number; defaultMessage: string }
> = {
  BAD_REQUEST: {
    status: 400,
    defaultMessage: "The request could not be processed due to invalid input.",
  },
  UNAUTHORIZED: {
    status: 401,
    defaultMessage: "Authentication is required to access this resource.",
  },
  FORBIDDEN: {
    status: 403,
    defaultMessage: "You do not have permission to access this resource.",
  },
  NOT_FOUND: {
    status: 404,
    defaultMessage: "The requested resource was not found.",
  },
  CONFLICT: {
    status: 409,
    defaultMessage:
      "The request conflicts with the current state of the resource.",
  },
  VALIDATION_ERROR: {
    status: 422,
    defaultMessage: "The provided data failed validation checks.",
  },
  SERVER_ERROR: {
    status: 500,
    defaultMessage:
      "An unexpected error occurred while processing your request.",
  },
};

/**
 * Generate a unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  type: ErrorType,
  customMessage?: string,
  details?: any,
  validationErrors?: Record<string, string>
): NextResponse<ErrorResponse> {
  const requestId = generateRequestId();
  const errorDetails = ERROR_DETAILS[type];

  // For client-facing message, use custom message if provided, otherwise use default
  const clientMessage = customMessage || errorDetails.defaultMessage;

  // Log detailed error information server-side
  logger.error(`API Error [${requestId}]: ${type}`, {
    message: customMessage || errorDetails.defaultMessage,
    details,
    validationErrors,
  });

  // Return sanitized response to client
  const response: ErrorResponse = {
    error: {
      code: type,
      message: clientMessage,
      status: errorDetails.status,
      requestId,
    },
  };

  // Only include validation field errors if present
  if (type === "VALIDATION_ERROR" && validationErrors) {
    response.error.fields = validationErrors;
  }

  return NextResponse.json(response, { status: errorDetails.status });
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse<ErrorResponse> {
  // Format field errors for client consumption
  const fieldErrors: Record<string, string> = {};

  error.errors.forEach((err) => {
    // Get the field path (e.g., "email" or "user.address.street")
    const fieldPath = err.path.join(".");
    // Use the error message
    fieldErrors[fieldPath] = err.message;
  });

  return createErrorResponse(
    "VALIDATION_ERROR",
    "Validation failed. Please check your input and try again.",
    error,
    fieldErrors
  );
}

/**
 * Handle unexpected errors
 */
export function handleUnexpectedError(
  error: unknown
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    "SERVER_ERROR",
    undefined, // Use default generic message for clients
    error // Log detailed error information server-side
  );
}

/**
 * Helper for bad request errors
 */
export function badRequest(
  message?: string,
  details?: any
): NextResponse<ErrorResponse> {
  return createErrorResponse("BAD_REQUEST", message, details);
}

/**
 * Helper for unauthorized errors
 */
export function unauthorized(
  message?: string,
  details?: any
): NextResponse<ErrorResponse> {
  return createErrorResponse("UNAUTHORIZED", message, details);
}

/**
 * Helper for forbidden errors
 */
export function forbidden(
  message?: string,
  details?: any
): NextResponse<ErrorResponse> {
  return createErrorResponse("FORBIDDEN", message, details);
}

/**
 * Helper for not found errors
 */
export function notFound(
  message?: string,
  details?: any
): NextResponse<ErrorResponse> {
  return createErrorResponse("NOT_FOUND", message, details);
}

/**
 * Helper for conflict errors
 */
export function conflict(
  message?: string,
  details?: any
): NextResponse<ErrorResponse> {
  return createErrorResponse("CONFLICT", message, details);
}

/**
 * Safe wrapper for API route handlers
 */
export function withErrorHandling(
  handler: Function
): (req: Request, ...args: any[]) => Promise<NextResponse> {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error);
      }

      return handleUnexpectedError(error);
    }
  };
}
