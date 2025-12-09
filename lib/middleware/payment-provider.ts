import { NextRequest, NextResponse } from "next/server";
import {
  getRolloutConfig,
  getPaymentProviderForUser,
  UserContext,
} from "@/lib/utils/payment-rollout";

/**
 * Middleware to determine payment provider for each request
 * Sets headers that can be used by API routes and components
 */
export function paymentProviderMiddleware(request: NextRequest) {
  const config = getRolloutConfig();

  // Extract user context from request
  const userContext: UserContext = {
    userId: request.cookies.get("userId")?.value,
    country:
      request.cookies.get("country")?.value ||
      request.geo?.country ||
      request.headers.get("x-country")?.toString(),
    locale:
      request.cookies.get("locale")?.value ||
      request.headers.get("accept-language")?.split(",")[0]?.split("-")[0],
    email: request.cookies.get("userEmail")?.value,
    ipAddress:
      request.ip || request.headers.get("x-forwarded-for")?.split(",")[0],
  };

  // Determine payment provider
  const paymentProvider = getPaymentProviderForUser(userContext, config);

  // Create response with payment provider header
  const response = NextResponse.next();

  // Add payment provider info to headers
  response.headers.set("x-payment-provider", paymentProvider);
  response.headers.set(
    "x-rollout-percentage",
    config.gradualRolloutPercentage.toString()
  );
  response.headers.set("x-netopia-enabled", config.netopiaEnabled.toString());
  response.headers.set("x-stripe-enabled", config.stripeEnabled.toString());

  // Add user context for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    response.headers.set("x-user-context", JSON.stringify(userContext));
  }

  return response;
}

/**
 * API route helper to get payment provider from request
 */
export function getPaymentProviderFromRequest(
  request: Request
): "netopia" | "stripe" {
  // Check headers set by middleware
  const provider = request.headers.get("x-payment-provider");

  if (provider === "netopia" || provider === "stripe") {
    return provider;
  }

  // Fallback to environment default
  return process.env.PAYMENT_PROVIDER === "netopia" ? "netopia" : "stripe";
}

/**
 * Component helper to get payment provider (client-side)
 */
export function getPaymentProviderFromHeaders(): "netopia" | "stripe" {
  if (typeof window === "undefined") {
    return "stripe"; // Server-side default
  }

  // This would be set by the middleware and available in document headers
  // For now, return default - in production this would read from a global variable
  // set by the server or from local storage
  return "stripe"; // Default to Stripe while Netopia is temporarily disabled
}

/**
 * Admin API to get rollout statistics
 */
export async function getRolloutStatistics() {
  const config = getRolloutConfig();

  // In a real implementation, you would collect user data from your database
  // For now, return configuration info
  return {
    config,
    timestamp: new Date().toISOString(),
    note: "Statistics collection would be implemented with actual user data from database",
  };
}

/**
 * Admin API to update rollout configuration
 */
export async function updateRolloutConfig(
  updates: Partial<typeof getRolloutConfig>
) {
  // In production, this would update environment variables or database settings
  // For now, just validate the updates

  const currentConfig = getRolloutConfig();
  const newConfig = { ...currentConfig, ...updates };

  // Validate configuration
  if (
    newConfig.gradualRolloutPercentage < 0 ||
    newConfig.gradualRolloutPercentage > 100
  ) {
    throw new Error("Rollout percentage must be between 0 and 100");
  }

  return {
    success: true,
    config: newConfig,
    note: "In production, this would persist configuration changes",
  };
}
