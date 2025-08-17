/**
 * Standardized API error handling system
 * Provides consistent error responses, logging, and security measures
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API error codes
 */
export enum ApiErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * API Error class with standardized properties
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly metadata?: Record<string, any>;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.metadata = metadata;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined API errors for common scenarios
 */
export const ApiErrors = {
  // Authentication & Authorization
  unauthorized: (message = "Authentication required") =>
    new ApiError(ApiErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = "Insufficient permissions") =>
    new ApiError(ApiErrorCode.FORBIDDEN, message, 403),

  // Resource errors
  notFound: (resource = "Resource", id?: string) =>
    new ApiError(
      ApiErrorCode.NOT_FOUND,
      `${resource}${id ? ` with id '${id}'` : ""} not found`,
      404
    ),

  conflict: (message = "Resource already exists") =>
    new ApiError(ApiErrorCode.CONFLICT, message, 409),

  // Validation errors
  validation: (details: Record<string, string[]>) =>
    new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      "Validation failed",
      400,
      true,
      { validationErrors: details }
    ),

  invalidInput: (field: string, reason: string) =>
    new ApiError(
      ApiErrorCode.BAD_REQUEST,
      `Invalid input for '${field}': ${reason}`,
      400
    ),

  // Rate limiting
  rateLimited: (retryAfter?: number) =>
    new ApiError(
      ApiErrorCode.RATE_LIMITED,
      "Too many requests. Please try again later.",
      429,
      true,
      { retryAfter }
    ),

  // Server errors
  internal: (
    message = "Internal server error",
    metadata?: Record<string, any>
  ) => new ApiError(ApiErrorCode.INTERNAL_ERROR, message, 500, false, metadata),

  database: (operation?: string) =>
    new ApiError(
      ApiErrorCode.DATABASE_ERROR,
      `Database error${operation ? ` during ${operation}` : ""}`,
      500,
      false
    ),

  timeout: (operation = "operation") =>
    new ApiError(
      ApiErrorCode.TIMEOUT_ERROR,
      `Timeout during ${operation}`,
      504,
      true
    ),

  serviceUnavailable: (service?: string) =>
    new ApiError(
      ApiErrorCode.SERVICE_UNAVAILABLE,
      `Service${service ? ` '${service}'` : ""} temporarily unavailable`,
      503,
      true
    ),
};

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
  success: false;
}

/**
 * Success response interface
 */
interface SuccessResponse<T = any> {
  data: T;
  success: true;
  timestamp: string;
  requestId?: string;
}

/**
 * Generate request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log error with appropriate level
 */
function logError(
  error: Error | ApiError,
  requestId: string,
  context?: Record<string, any>
) {
  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  };

  if (error instanceof ApiError) {
    logData.error = {
      ...logData.error,
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      metadata: error.metadata,
    } as any;

    if (error.statusCode >= 500) {
      console.error("🚨 API SERVER ERROR:", JSON.stringify(logData, null, 2));
    } else if (error.statusCode >= 400) {
      console.warn("⚠️  API CLIENT ERROR:", JSON.stringify(logData, null, 2));
    }
  } else {
    console.error("❌ UNHANDLED ERROR:", JSON.stringify(logData, null, 2));
  }

  // In production, send to external logging service
  if (process.env.NODE_ENV === "production") {
    // Send to error tracking service (Sentry, DataDog, etc.)
    // sendToErrorTracking(logData);
  }
}

/**
 * Convert Zod errors to API validation error
 */
function handleZodError(error: ZodError): ApiError {
  const validationErrors: Record<string, string[]> = {};

  error.errors.forEach(err => {
    const path = err.path.join(".");
    if (!validationErrors[path]) {
      validationErrors[path] = [];
    }
    validationErrors[path].push(err.message);
  });

  return ApiErrors.validation(validationErrors);
}

/**
 * Convert database errors to API errors
 */
function handleDatabaseError(error: any): ApiError {
  // Prisma specific errors
  if (error.code === "P2002") {
    return ApiErrors.conflict("A record with this data already exists");
  }

  if (error.code === "P2025") {
    return ApiErrors.notFound("Record");
  }

  if (error.code === "P2003") {
    return new ApiError(
      ApiErrorCode.BAD_REQUEST,
      "Invalid reference - related record not found",
      400
    );
  }

  // Generic database error
  return ApiErrors.database();
}

/**
 * Main error handler for API routes
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, any>
): NextResponse<ErrorResponse> {
  const requestId = generateRequestId();
  let apiError: ApiError;

  // Convert different error types to ApiError
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    apiError = handleZodError(error);
  } else if (error && typeof error === "object" && "code" in error) {
    // Database or external service error
    apiError = handleDatabaseError(error);
  } else if (error instanceof Error) {
    // Generic error
    apiError = ApiErrors.internal(
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error"
    );
  } else {
    // Unknown error type
    apiError = ApiErrors.internal("An unknown error occurred");
  }

  // Log the error
  logError(apiError, requestId, context);

  // Create error response
  const errorResponse: ErrorResponse = {
    error: {
      code: apiError.code,
      message: apiError.message,
      timestamp: apiError.timestamp,
      requestId,
      ...(apiError.metadata && { details: apiError.metadata }),
    },
    success: false,
  };

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === "production" && !apiError.isOperational) {
    errorResponse.error.message = "Internal server error";
    delete errorResponse.error.details;
  }

  return NextResponse.json(errorResponse, {
    status: apiError.statusCode,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
  });
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  const requestId = generateRequestId();

  const response: SuccessResponse<T> = {
    data,
    success: true,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return NextResponse.json(response, {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
  });
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, {
        handler: handler.name,
        args: args.map((arg, index) => ({ [`arg${index}`]: arg })),
      });
    }
  };
}

/**
 * Method validation middleware
 */
export function validateMethod(allowedMethods: string[]) {
  return (request: Request) => {
    if (!allowedMethods.includes(request.method)) {
      throw new ApiError(
        ApiErrorCode.METHOD_NOT_ALLOWED,
        `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(", ")}`,
        405
      );
    }
  };
}

/**
 * Content type validation middleware
 */
export function validateContentType(expectedType: string = "application/json") {
  return (request: Request) => {
    const contentType = request.headers.get("content-type");
    if (contentType && !contentType.includes(expectedType)) {
      throw new ApiError(
        ApiErrorCode.UNSUPPORTED_MEDIA_TYPE,
        `Expected content type '${expectedType}', got '${contentType}'`,
        415
      );
    }
  };
}

/**
 * Request body size validation
 */
export function validateBodySize(maxSizeBytes: number) {
  return (request: Request) => {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      throw new ApiError(
        ApiErrorCode.PAYLOAD_TOO_LARGE,
        `Request body too large. Maximum size: ${maxSizeBytes} bytes`,
        413
      );
    }
  };
}
