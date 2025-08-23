import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { performanceMonitor } from "../monitoring/performance-monitor";

export interface ValidationConfig {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  headers?: z.ZodSchema<any>;
  maxBodySize?: number; // in bytes
  maxQueryLength?: number;
  allowedMethods?: string[];
  sanitizeInput?: boolean;
  strictMode?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

class RequestValidator {
  private static instance: RequestValidator;

  private constructor() {}

  static getInstance(): RequestValidator {
    if (!RequestValidator.instance) {
      RequestValidator.instance = new RequestValidator();
    }
    return RequestValidator.instance;
  }

  private sanitizeString(input: string): string {
    if (typeof input !== "string") return input;

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, "");

    // Normalize unicode
    sanitized = sanitized.normalize("NFC");

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>]/g, "");

    return sanitized.trim();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private async validateBody(
    req: NextRequest,
    schema?: z.ZodSchema<any>,
    config?: ValidationConfig
  ): Promise<{ data: any; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];
    let data: any = null;

    try {
      // Check content length
      const contentLength = req.headers.get("content-length");
      if (contentLength && config?.maxBodySize) {
        const size = parseInt(contentLength, 10);
        if (size > config.maxBodySize) {
          errors.push({
            field: "body",
            message: `Request body too large. Maximum size: ${config.maxBodySize / 1024 / 1024}MB`,
            code: "BODY_TOO_LARGE",
          });
          return { data: null, errors };
        }
      }

      // Parse body based on content type
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const bodyText = await req.text();
        data = JSON.parse(bodyText);
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        data = Object.fromEntries(formData.entries());
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        data = Object.fromEntries(formData.entries());
      } else {
        // Try to parse as JSON by default
        try {
          const bodyText = await req.text();
          data = JSON.parse(bodyText);
        } catch {
          errors.push({
            field: "body",
            message: "Invalid request body format",
            code: "INVALID_BODY_FORMAT",
          });
          return { data: null, errors };
        }
      }

      // Sanitize input if enabled
      if (config?.sanitizeInput && data) {
        data = this.sanitizeObject(data);
      }

      // Validate with schema if provided
      if (schema) {
        const result = schema.safeParse(data);
        if (!result.success) {
          result.error.errors.forEach(error => {
            errors.push({
              field: error.path.join("."),
              message: error.message,
              code: "VALIDATION_ERROR",
            });
          });
        } else {
          data = result.data;
        }
      }
    } catch {
      return {
        data: null,
        errors: [
          {
            field: "body",
            message: "Invalid request body",
            code: "INVALID_BODY",
          },
        ],
      };
    }

    return { data, errors };
  }

  private validateQuery(
    req: NextRequest,
    schema?: z.ZodSchema<any>,
    config?: ValidationConfig
  ): { data: any; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    let data: any = null;

    try {
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());

      // Check query string length
      if (config?.maxQueryLength && url.search.length > config.maxQueryLength) {
        errors.push({
          field: "query",
          message: `Query string too long. Maximum length: ${config.maxQueryLength} characters`,
          code: "QUERY_TOO_LONG",
        });
        return { data: null, errors };
      }

      // Sanitize input if enabled
      if (config?.sanitizeInput) {
        data = this.sanitizeObject(queryParams);
      } else {
        data = queryParams;
      }

      // Validate with schema if provided
      if (schema) {
        const result = schema.safeParse(data);
        if (!result.success) {
          result.error.errors.forEach(error => {
            errors.push({
              field: `query.${error.path.join(".")}`,
              message: error.message,
              code: "VALIDATION_ERROR",
            });
          });
        } else {
          data = result.data;
        }
      }
    } catch {
      return {
        data: null,
        errors: [
          {
            field: "query",
            message: "Invalid query parameters",
            code: "INVALID_QUERY",
          },
        ],
      };
    }

    return { data, errors };
  }

  private validateHeaders(
    req: NextRequest,
    schema?: z.ZodSchema<any>,
    config?: ValidationConfig
  ): { data: any; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    let data: any = null;

    try {
      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      // Sanitize input if enabled
      if (config?.sanitizeInput) {
        data = this.sanitizeObject(headers);
      } else {
        data = headers;
      }

      // Validate with schema if provided
      if (schema) {
        const result = schema.safeParse(data);
        if (!result.success) {
          result.error.errors.forEach(error => {
            errors.push({
              field: `headers.${error.path.join(".")}`,
              message: error.message,
              code: "VALIDATION_ERROR",
            });
          });
        } else {
          data = result.data;
        }
      }
    } catch {
      return {
        data: null,
        errors: [
          {
            field: "headers",
            message: "Invalid headers",
            code: "INVALID_HEADERS",
          },
        ],
      };
    }

    return { data, errors };
  }

  private validateMethod(
    req: NextRequest,
    config?: ValidationConfig
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (config?.allowedMethods && !config.allowedMethods.includes(req.method)) {
      errors.push({
        field: "method",
        message: `Method ${req.method} not allowed. Allowed methods: ${config.allowedMethods.join(", ")}`,
        code: "METHOD_NOT_ALLOWED",
      });
    }

    return errors;
  }

  async validateRequest(
    req: NextRequest,
    config: ValidationConfig = {}
  ): Promise<{
    isValid: boolean;
    data: {
      body?: any;
      query?: any;
      headers?: any;
    };
    errors: ValidationError[];
    response?: NextResponse;
  }> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const data: any = {};

    try {
      // Validate HTTP method
      const methodErrors = this.validateMethod(req, config);
      errors.push(...methodErrors);

      // Validate headers
      if (config.headers) {
        const headerResult = this.validateHeaders(req, config.headers, config);
        errors.push(...headerResult.errors);
        if (headerResult.data) data.headers = headerResult.data;
      }

      // Validate query parameters
      if (config.query) {
        const queryResult = this.validateQuery(req, config.query, config);
        errors.push(...queryResult.errors);
        if (queryResult.data) data.query = queryResult.data;
      }

      // Validate body (only for non-GET requests)
      if (req.method !== "GET" && config.body) {
        const bodyResult = await this.validateBody(req, config.body, config);
        errors.push(...bodyResult.errors);
        if (bodyResult.data) data.body = bodyResult.data;
      }

      // Record validation performance
      performanceMonitor.recordApiRequest(
        req.method,
        req.nextUrl?.pathname || "unknown",
        Date.now() - startTime,
        errors.length > 0 ? 400 : 200,
        errors.length === 0,
        undefined,
        undefined,
        { validationErrors: errors.length }
      );

      // Return validation result
      if (errors.length > 0) {
        const response = new NextResponse(
          JSON.stringify({
            error: "Validation failed",
            message: "Request validation failed",
            errors,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        return {
          isValid: false,
          data,
          errors,
          response,
        };
      }

      return {
        isValid: true,
        data,
        errors: [],
      };
    } catch (error) {
      console.error("Request validation error:", error);

      const response = new NextResponse(
        JSON.stringify({
          error: "Validation error",
          message: "An error occurred during request validation",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {
        isValid: false,
        data,
        errors: [
          {
            field: "validation",
            message: "Internal validation error",
            code: "INTERNAL_ERROR",
          },
        ],
        response,
      };
    }
  }

  withValidation(handler: Function, config: ValidationConfig = {}) {
    return async (req: NextRequest, ...args: any[]) => {
      const validation = await this.validateRequest(req, config);

      if (!validation.isValid && validation.response) {
        return validation.response;
      }

      // Pass validated data to handler
      return handler(req, validation.data, ...args);
    };
  }

  // Common validation schemas
  static schemas = {
    // User input validation
    userInput: z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      message: z.string().min(1).max(1000),
    }),

    // Product search validation
    productSearch: z.object({
      query: z.string().min(1).max(100).optional(),
      category: z.string().min(1).max(50).optional(),
      minPrice: z.number().min(0).optional(),
      maxPrice: z.number().min(0).optional(),
      sort: z.enum(["name", "price", "rating", "created"]).optional(),
      order: z.enum(["asc", "desc"]).optional(),
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(100).optional(),
    }),

    // Cart item validation
    cartItem: z.object({
      productId: z.string().min(1),
      quantity: z.number().min(1).max(100),
      variantId: z.string().optional(),
    }),

    // Authentication validation
    login: z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }),

    // Registration validation
    register: z
      .object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z
          .string()
          .min(8)
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
          ),
        confirmPassword: z.string(),
      })
      .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }),

    // Payment validation
    payment: z.object({
      amount: z.number().min(1),
      currency: z.string().length(3),
      paymentMethodId: z.string().min(1),
      description: z.string().max(255).optional(),
    }),

    // API key validation
    apiKey: z.object({
      "x-api-key": z.string().min(1),
    }),
  };
}

export const requestValidator = RequestValidator.getInstance();
export const withValidation = (handler: Function, config?: ValidationConfig) =>
  requestValidator.withValidation(handler, config);
export const validateRequest = (req: NextRequest, config?: ValidationConfig) =>
  requestValidator.validateRequest(req, config);

// Export the class for static access
export { RequestValidator };
