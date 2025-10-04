import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  suggestion?: string;
  statusCode: number;
  retryable?: boolean;
  logLevel: "error" | "warn" | "info";
}

export class ApiErrorHandler {
  /**
   * Handle different types of errors and return appropriate API responses
   */
  static handleError(error: unknown, context?: string): NextResponse {
    const apiError = this.categorizeError(error, context);

    // Log error with appropriate level
    console[apiError.logLevel](`[${apiError.code}] ${apiError.message}`, {
      context,
      details: apiError.details,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: {
          code: apiError.code,
          message: apiError.message,
          suggestion: apiError.suggestion,
          retryable: apiError.retryable,
          ...(process.env.NODE_ENV === "development" && {
            details: apiError.details,
            stack: error instanceof Error ? error.stack : undefined,
          }),
        },
      },
      { status: apiError.statusCode }
    );
  }

  /**
   * Categorize different error types and create appropriate error responses
   */
  private static categorizeError(error: unknown, context?: string): ApiError {
    // Database errors
    if (error instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaError(error, context);
    }

    if (error instanceof PrismaClientValidationError) {
      return {
        code: "DATABASE_VALIDATION_ERROR",
        message: "Invalid data provided to database",
        details: error.message,
        suggestion: "Please check your input data and try again",
        statusCode: 400,
        retryable: false,
        logLevel: "warn",
      };
    }

    // Validation errors
    if (error instanceof ZodError) {
      return {
        code: "VALIDATION_ERROR",
        message: "Input validation failed",
        details: error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })),
        suggestion: "Please correct the highlighted fields and try again",
        statusCode: 400,
        retryable: false,
        logLevel: "info",
      };
    }

    // Network/External service errors
    if (error instanceof Error && error.message.includes("fetch")) {
      return {
        code: "NETWORK_ERROR",
        message: "Failed to connect to external service",
        details: error.message,
        suggestion: "Please check your internet connection and try again",
        statusCode: 502,
        retryable: true,
        logLevel: "warn",
      };
    }

    // Authentication errors
    if (
      error instanceof Error &&
      (error.message.includes("unauthorized") ||
        error.message.includes("unauthenticated") ||
        error.message.includes("invalid token"))
    ) {
      return {
        code: "AUTHENTICATION_ERROR",
        message: "Authentication failed",
        details: error.message,
        suggestion: "Please log in again and try your request",
        statusCode: 401,
        retryable: false,
        logLevel: "info",
      };
    }

    // Authorization errors
    if (
      error instanceof Error &&
      (error.message.includes("forbidden") ||
        error.message.includes("not allowed") ||
        error.message.includes("insufficient permissions"))
    ) {
      return {
        code: "AUTHORIZATION_ERROR",
        message: "You don't have permission to perform this action",
        details: error.message,
        suggestion:
          "Please contact your administrator if you believe this is an error",
        statusCode: 403,
        retryable: false,
        logLevel: "warn",
      };
    }

    // Rate limiting errors
    if (
      error instanceof Error &&
      (error.message.includes("rate limit") ||
        error.message.includes("too many requests"))
    ) {
      return {
        code: "RATE_LIMIT_ERROR",
        message: "Too many requests - please slow down",
        details: error.message,
        suggestion: "Please wait a moment before trying again",
        statusCode: 429,
        retryable: true,
        logLevel: "info",
      };
    }

    // File upload errors
    if (
      error instanceof Error &&
      (error.message.includes("file") || error.message.includes("upload"))
    ) {
      return {
        code: "FILE_ERROR",
        message: "File operation failed",
        details: error.message,
        suggestion: "Please check your file and try uploading again",
        statusCode: 400,
        retryable: true,
        logLevel: "warn",
      };
    }

    // Payment errors
    if (
      error instanceof Error &&
      (error.message.includes("payment") ||
        error.message.includes("stripe") ||
        error.message.includes("card"))
    ) {
      return {
        code: "PAYMENT_ERROR",
        message: "Payment processing failed",
        details: error.message,
        suggestion: "Please check your payment information and try again",
        statusCode: 402,
        retryable: true,
        logLevel: "warn",
      };
    }

    // External service errors (email, analytics, etc.)
    if (
      error instanceof Error &&
      (error.message.includes("email") ||
        error.message.includes("smtp") ||
        error.message.includes("mail"))
    ) {
      return {
        code: "EMAIL_ERROR",
        message: "Email service temporarily unavailable",
        details: error.message,
        suggestion:
          "Your request has been queued and will be processed shortly",
        statusCode: 503,
        retryable: true,
        logLevel: "error",
      };
    }

    // Generic server errors
    if (error instanceof Error) {
      return {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        details: context
          ? `Error in ${context}: ${error.message}`
          : error.message,
        suggestion:
          "Please try again in a few moments. If the problem persists, contact support.",
        statusCode: 500,
        retryable: true,
        logLevel: "error",
      };
    }

    // Unknown errors
    return {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
      details: String(error),
      suggestion:
        "Please try again. If the problem continues, contact our support team.",
      statusCode: 500,
      retryable: true,
      logLevel: "error",
    };
  }

  /**
   * Handle Prisma-specific errors with detailed mapping
   */
  private static handlePrismaError(
    error: PrismaClientKnownRequestError,
    context?: string
  ): ApiError {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const field = (error.meta?.target as string) || "field";
        return {
          code: "DUPLICATE_ENTRY",
          message: `${field} already exists`,
          details: `A record with this ${field} already exists in the database`,
          suggestion: `Please choose a different ${field} or update the existing record`,
          statusCode: 409,
          retryable: false,
          logLevel: "info",
        };

      case "P2025":
        // Record not found
        return {
          code: "NOT_FOUND",
          message: "The requested record was not found",
          details: error.message,
          suggestion: "Please check your input and try again",
          statusCode: 404,
          retryable: false,
          logLevel: "info",
        };

      case "P2028":
        // Transaction write conflict
        return {
          code: "CONCURRENT_MODIFICATION",
          message: "The record was modified by another request",
          details: "Please refresh and try again",
          suggestion: "Please refresh the page and try your changes again",
          statusCode: 409,
          retryable: true,
          logLevel: "warn",
        };

      case "P2034":
        // Transaction failed due to lock
        return {
          code: "DATABASE_LOCK",
          message: "Database operation is temporarily locked",
          details: "Another operation is currently modifying this data",
          suggestion: "Please wait a moment and try again",
          statusCode: 503,
          retryable: true,
          logLevel: "warn",
        };

      case "P1001":
        // Database connection error
        return {
          code: "DATABASE_CONNECTION_ERROR",
          message: "Database connection failed",
          details: "Unable to connect to the database server",
          suggestion: "Please try again in a few moments",
          statusCode: 503,
          retryable: true,
          logLevel: "error",
        };

      default:
        return {
          code: "DATABASE_ERROR",
          message: "Database operation failed",
          details: `Prisma error ${error.code}: ${error.message}`,
          suggestion:
            "Please try again. If the problem persists, contact support.",
          statusCode: 500,
          retryable: true,
          logLevel: "error",
        };
    }
  }

  /**
   * Create a standardized success response
   */
  static successResponse<T>(
    data: T,
    options: {
      message?: string;
      statusCode?: number;
      metadata?: any;
    } = {}
  ): NextResponse {
    const { message, statusCode = 200, metadata } = options;

    return NextResponse.json(
      {
        success: true,
        data,
        message,
        ...(metadata && { metadata }),
      },
      { status: statusCode }
    );
  }

  /**
   * Create a standardized error response for client-side validation
   */
  static validationError(
    errors: Array<{
      field: string;
      message: string;
      code?: string;
    }>,
    message = "Validation failed"
  ): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message,
          details: errors,
          suggestion: "Please correct the errors and try again",
        },
      },
      { status: 400 }
    );
  }

  /**
   * Create a retry-after response for rate limiting
   */
  static rateLimitError(
    retryAfter: number,
    message = "Too many requests"
  ): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message,
          suggestion: `Please wait ${retryAfter} seconds before trying again`,
          retryAfter,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
        },
      }
    );
  }
}
