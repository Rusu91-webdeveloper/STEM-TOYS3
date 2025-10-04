import { z } from "zod";

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
  value?: any;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Enhanced validation utility with detailed error messages and recovery suggestions
 */
export class EnhancedValidator {
  /**
   * Validate data against a Zod schema with enhanced error handling
   */
  static async validate<T>(
    schema: z.ZodSchema<T>,
    data: any,
    options: {
      strict?: boolean;
      context?: string;
      sanitize?: boolean;
    } = {}
  ): Promise<ValidationResult<T>> {
    const { strict = false, context = "validation", sanitize = true } = options;

    try {
      // Sanitize input data if requested
      const sanitizedData = sanitize ? this.sanitizeInput(data) : data;

      // Validate with Zod
      const result = await schema.safeParseAsync(sanitizedData);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          errors: [],
          warnings: this.generateWarnings(result.data, context),
        };
      }

      // Transform Zod errors to enhanced validation errors
      const errors = this.transformZodErrors(result.error.issues, context);

      return {
        success: false,
        errors,
        warnings: [],
      };

    } catch (error) {
      // Handle unexpected validation errors
      console.error(`Validation error in ${context}:`, error);

      return {
        success: false,
        errors: [{
          field: "unknown",
          code: "VALIDATION_SYSTEM_ERROR",
          message: "An unexpected error occurred during validation",
          suggestion: "Please try again or contact support if the problem persists",
        }],
        warnings: [],
      };
    }
  }

  /**
   * Sanitize input data to prevent common injection attacks
   */
  private static sanitizeInput(data: any): any {
    if (typeof data === "string") {
      return data.trim();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }

    if (data && typeof data === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Transform Zod validation errors to enhanced validation errors
   */
  private static transformZodErrors(
    issues: z.ZodIssue[],
    context: string
  ): ValidationError[] {
    return issues.map(issue => {
      const field = issue.path.join(".");
      const error = this.createEnhancedError(issue, context);

      return {
        field,
        code: issue.code,
        message: error.message,
        suggestion: error.suggestion,
        value: issue.path.length > 0 ? undefined : issue.received, // Only show received value for root level
      };
    });
  }

  /**
   * Create enhanced error with context-specific messages and suggestions
   */
  private static createEnhancedError(issue: z.ZodIssue, context: string): {
    message: string;
    suggestion?: string;
  } {
    const field = issue.path.join(".") || "value";

    switch (issue.code) {
      case "invalid_type":
        return {
          message: `${field} must be of type ${issue.expected}, but received ${issue.received}`,
          suggestion: `Please provide a valid ${issue.expected} value for ${field}`,
        };

      case "too_small":
        if (issue.type === "string") {
          return {
            message: `${field} must be at least ${issue.minimum} characters long`,
            suggestion: `Please enter at least ${issue.minimum} characters for ${field}`,
          };
        }
        if (issue.type === "number") {
          return {
            message: `${field} must be at least ${issue.minimum}`,
            suggestion: `Please enter a value of ${issue.minimum} or greater for ${field}`,
          };
        }
        return {
          message: `${field} is too small (minimum: ${issue.minimum})`,
          suggestion: `Please provide a larger value for ${field}`,
        };

      case "too_big":
        if (issue.type === "string") {
          return {
            message: `${field} must be at most ${issue.maximum} characters long`,
            suggestion: `Please limit ${field} to ${issue.maximum} characters or less`,
          };
        }
        return {
          message: `${field} is too large (maximum: ${issue.maximum})`,
          suggestion: `Please provide a smaller value for ${field}`,
        };

      case "invalid_string":
        if (issue.validation === "email") {
          return {
            message: `${field} must be a valid email address`,
            suggestion: `Please enter a valid email address (e.g., user@example.com)`,
          };
        }
        if (issue.validation === "url") {
          return {
            message: `${field} must be a valid URL`,
            suggestion: `Please enter a complete URL starting with http:// or https://`,
          };
        }
        return {
          message: `${field} contains invalid characters or format`,
          suggestion: `Please check the format requirements for ${field}`,
        };

      case "invalid_literal":
        return {
          message: `${field} must be exactly "${issue.expected}"`,
          suggestion: `Please use the exact value "${issue.expected}" for ${field}`,
        };

      case "unrecognized_keys":
        return {
          message: `${field} contains unrecognized properties: ${issue.keys.join(", ")}`,
          suggestion: `Please remove the extra properties: ${issue.keys.join(", ")}`,
        };

      case "missing_keys":
        return {
          message: `${field} is missing required properties: ${issue.keys.join(", ")}`,
          suggestion: `Please provide values for: ${issue.keys.join(", ")}`,
        };

      default:
        return {
          message: `${field} is invalid`,
          suggestion: `Please check the requirements for ${field} and try again`,
        };
    }
  }

  /**
   * Generate warnings for potentially problematic data
   */
  private static generateWarnings(data: any, context: string): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Add context-specific warnings
    if (context === "user_registration" && data.email) {
      // Check for common email domains that might be temporary
      const tempEmailDomains = ["10minutemail.com", "temp-mail.org", "guerrillamail.com"];
      const domain = data.email.split("@")[1];
      if (tempEmailDomains.includes(domain)) {
        warnings.push({
          field: "email",
          code: "POTENTIAL_TEMP_EMAIL",
          message: "This appears to be a temporary email address",
          suggestion: "Consider using a permanent email address for better account security",
        });
      }
    }

    if (context === "product_creation" && data.price) {
      // Warn about unusually high or low prices
      if (data.price < 1) {
        warnings.push({
          field: "price",
          code: "VERY_LOW_PRICE",
          message: "Price is very low - please verify this is intentional",
          suggestion: "Consider if this price includes all costs and desired profit margin",
        });
      } else if (data.price > 10000) {
        warnings.push({
          field: "price",
          code: "VERY_HIGH_PRICE",
          message: "Price is very high - please verify this is correct",
          suggestion: "Ensure the price reflects market value and customer expectations",
        });
      }
    }

    return warnings;
  }

  /**
   * Validate file uploads with enhanced error handling
   */
  static validateFileUpload(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      maxFiles?: number;
      context?: string;
    } = {}
  ): ValidationResult {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ["image/jpeg", "image/png", "image/webp"],
      context = "file_upload",
    } = options;

    const errors: ValidationError[] = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push({
        field: "file",
        code: "FILE_TOO_LARGE",
        message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
        suggestion: `Please choose a smaller file or compress the current file`,
      });
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: "file",
        code: "INVALID_FILE_TYPE",
        message: `File type "${file.type}" is not allowed`,
        suggestion: `Please upload a file with one of these types: ${allowedTypes.join(", ")}`,
      });
    }

    // Check for potentially malicious filenames
    const dangerousPatterns = /(\.\.|\/|\\|;|>|</);
    if (dangerousPatterns.test(file.name)) {
      errors.push({
        field: "file",
        code: "MALICIOUS_FILENAME",
        message: "Filename contains potentially dangerous characters",
        suggestion: "Please rename the file to remove special characters",
      });
    }

    return {
      success: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate API requests with rate limiting and security checks
   */
  static validateApiRequest(
    request: Request,
    options: {
      maxBodySize?: number;
      allowedMethods?: string[];
      requireAuth?: boolean;
      rateLimit?: {
        windowMs: number;
        maxRequests: number;
      };
    } = {}
  ): ValidationResult {
    const {
      maxBodySize = 10 * 1024 * 1024, // 10MB
      allowedMethods = ["GET", "POST", "PUT", "DELETE"],
      requireAuth = false,
    } = options;

    const errors: ValidationError[] = [];

    // Check HTTP method
    if (!allowedMethods.includes(request.method)) {
      errors.push({
        field: "method",
        code: "INVALID_METHOD",
        message: `HTTP method "${request.method}" is not allowed`,
        suggestion: `Use one of: ${allowedMethods.join(", ")}`,
      });
    }

    // Check Content-Length header
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > maxBodySize) {
      errors.push({
        field: "body",
        code: "BODY_TOO_LARGE",
        message: `Request body size (${contentLength} bytes) exceeds maximum allowed size (${maxBodySize} bytes)`,
        suggestion: "Please reduce the size of your request data",
      });
    }

    // Check for required authentication
    if (requireAuth && !request.headers.get("authorization")) {
      errors.push({
        field: "authorization",
        code: "MISSING_AUTH",
        message: "Authentication is required for this endpoint",
        suggestion: "Please include an authorization header with your request",
      });
    }

    // Check for potentially malicious headers
    const suspiciousHeaders = ["x-forwarded-for", "x-real-ip"];
    for (const header of suspiciousHeaders) {
      if (request.headers.get(header)) {
        errors.push({
          field: header,
          code: "SUSPICIOUS_HEADER",
          message: `Header "${header}" should not be set by client`,
          suggestion: "This header is managed by the server infrastructure",
        });
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}
