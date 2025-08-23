import { NextRequest, NextResponse } from "next/server";

import {
  withPerformanceMonitoring,
  withCaching,
  withErrorHandling,
} from "../../../lib/middleware/api-middleware";
import { performanceMonitor } from "../../../lib/monitoring/performance-monitor";
import { redisCache } from "../../../lib/redis-enhanced";
import {
  withRateLimiting,
  withAuthRateLimiting,
} from "../../../lib/security/rate-limiter";
import {
  withValidation,
  RequestValidator,
} from "../../../lib/security/request-validator";
import {
  withSecurityHeaders,
  withThreatProtection,
  withCSRFProtection,
} from "../../../lib/security/security-middleware";

// Validation schema for the secure example endpoint
const secureExampleSchema = RequestValidator.schemas.userInput;

// Combined middleware with all security and reliability features
const secureHandler = withPerformanceMonitoring(
  withCaching(
    withErrorHandling(
      withSecurityHeaders(
        withThreatProtection(
          withCSRFProtection(
            withAuthRateLimiting(
              withValidation(
                async (req: NextRequest, validatedData: any) => {
                  const startTime = Date.now();

                  try {
                    // Simulate some processing time
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Example of database operation with monitoring
                    const dbResult =
                      await performanceMonitor.withDatabaseMonitoring(
                        "secure_example_query",
                        async () => {
                          // Simulate database query
                          await new Promise(resolve => setTimeout(resolve, 50));
                          return {
                            success: true,
                            data: "Database operation completed",
                          };
                        },
                        { operation: "secure_example", userId: "example" }
                      );

                    // Example of cache operation
                    const cacheKey = `secure_example:${Date.now()}`;
                    await redisCache.set(
                      cacheKey,
                      { timestamp: Date.now(), data: validatedData },
                      300
                    );

                    // Record successful operation
                    performanceMonitor.recordApiRequest(
                      req.method,
                      req.nextUrl?.pathname || "unknown",
                      Date.now() - startTime,
                      200,
                      true,
                      JSON.stringify({ success: true }).length,
                      undefined,
                      {
                        operation: "secure_example",
                        validatedData: validatedData.body,
                        cacheKey,
                      }
                    );

                    return NextResponse.json({
                      success: true,
                      message: "Secure operation completed successfully",
                      data: {
                        input: validatedData.body,
                        timestamp: new Date().toISOString(),
                        cacheKey,
                        dbResult: dbResult.success,
                        performance: {
                          totalTime: Date.now() - startTime,
                          cacheEnabled: true,
                          securityEnabled: true,
                          monitoringEnabled: true,
                        },
                      },
                      security: {
                        rateLimited: true,
                        validated: true,
                        threatProtected: true,
                        csrfProtected: true,
                        headersSecured: true,
                      },
                    });
                  } catch (error) {
                    // Record error
                    performanceMonitor.recordApiRequest(
                      req.method,
                      req.nextUrl?.pathname || "unknown",
                      Date.now() - startTime,
                      500,
                      false,
                      undefined,
                      error instanceof Error ? error.message : "Unknown error",
                      { operation: "secure_example_error" }
                    );

                    throw error;
                  }
                },
                {
                  body: secureExampleSchema,
                  maxBodySize: 1024 * 1024, // 1MB
                  sanitizeInput: true,
                  allowedMethods: ["POST"],
                }
              )
            )
          )
        )
      )
    ),
    300 // 5 minutes cache
  )
);

// Export the secure handler
export const POST = secureHandler;

// GET endpoint for testing (with different rate limiting)
export const GET = withPerformanceMonitoring(
  withCaching(
    withErrorHandling(
      withSecurityHeaders(
        withThreatProtection(
          withRateLimiting(
            async (req: NextRequest) => {
              const startTime = Date.now();

              try {
                // Simulate processing
                await new Promise(resolve => setTimeout(resolve, 50));

                // Get cache stats
                const cacheStats = await redisCache.healthCheck();

                // Record successful operation
                performanceMonitor.recordApiRequest(
                  req.method,
                  req.nextUrl?.pathname || "unknown",
                  Date.now() - startTime,
                  200,
                  true,
                  undefined,
                  undefined,
                  { operation: "secure_example_get" }
                );

                return NextResponse.json({
                  success: true,
                  message: "Secure GET operation completed",
                  data: {
                    timestamp: new Date().toISOString(),
                    cacheStatus: cacheStats.status,
                    performance: {
                      totalTime: Date.now() - startTime,
                      cacheEnabled: true,
                      securityEnabled: true,
                      monitoringEnabled: true,
                    },
                  },
                  security: {
                    rateLimited: true,
                    threatProtected: true,
                    headersSecured: true,
                  },
                });
              } catch (error) {
                // Record error
                performanceMonitor.recordApiRequest(
                  req.method,
                  req.nextUrl?.pathname || "unknown",
                  Date.now() - startTime,
                  500,
                  false,
                  undefined,
                  error instanceof Error ? error.message : "Unknown error",
                  { operation: "secure_example_get_error" }
                );

                throw error;
              }
            },
            {
              windowMs: 60 * 1000, // 1 minute
              maxRequests: 30, // 30 requests per minute
              message: "Too many GET requests. Please slow down.",
            }
          )
        )
      )
    ),
    60 // 1 minute cache
  )
);

// Health check endpoint
export function OPTIONS(_req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token",
    },
  });
}
