/**
 * Payment Provider Rollout Management
 *
 * This module handles gradual rollout of Netopia payments vs Stripe payments
 * based on user segmentation and rollout percentages.
 */

export interface RolloutConfig {
  netopiaEnabled: boolean;
  stripeEnabled: boolean;
  gradualRolloutPercentage: number;
  rolloutStrategy: "percentage" | "user_id" | "country" | "locale";
  targetCountries: string[];
  targetLocales: string[];
}

export interface UserContext {
  userId?: string;
  country?: string;
  locale?: string;
  email?: string;
  ipAddress?: string;
}

/**
 * Get the default rollout configuration from environment variables
 */
export function getRolloutConfig(): RolloutConfig {
  const netopiaFlag = process.env.NEXT_PUBLIC_NETOPIA_ENABLED;
  const stripeFlag = process.env.NEXT_PUBLIC_STRIPE_ENABLED;

  return {
    // Netopia temporarily disabled unless explicitly re-enabled
    netopiaEnabled: netopiaFlag === "true",
    // Stripe is primary; disable only if explicitly turned off
    stripeEnabled: stripeFlag !== "false",
    gradualRolloutPercentage: parseInt(
      process.env.GRADUAL_ROLLOUT_PERCENTAGE || "0"
    ),
    rolloutStrategy: (process.env.ROLLOUT_STRATEGY as any) || "percentage",
    targetCountries: (process.env.TARGET_COUNTRIES || "RO").split(","),
    targetLocales: (process.env.TARGET_LOCALES || "ro,ro-RO").split(","),
  };
}

/**
 * Determine if a user should see Netopia payment options
 */
export function shouldShowNetopia(
  userContext: UserContext,
  config: RolloutConfig = getRolloutConfig()
): boolean {
  // If Netopia is not enabled globally, don't show it
  if (!config.netopiaEnabled) {
    return false;
  }

  // Always show Netopia for Romanian users (full rollout for target market)
  if (isRomanianUser(userContext)) {
    return true;
  }

  // Apply gradual rollout for other users based on strategy
  return shouldIncludeInRollout(userContext, config);
}

/**
 * Check if user is from Romania (primary target market)
 */
export function isRomanianUser(userContext: UserContext): boolean {
  const { country, locale } = userContext;

  return (
    country === "RO" ||
    country === "Romania" ||
    locale === "ro" ||
    locale === "ro-RO" ||
    locale?.startsWith("ro") ||
    false
  );
}

/**
 * Apply rollout strategy to determine if user should be included
 */
function shouldIncludeInRollout(
  userContext: UserContext,
  config: RolloutConfig
): boolean {
  const { rolloutStrategy, gradualRolloutPercentage } = config;

  switch (rolloutStrategy) {
    case "percentage":
      return shouldIncludeByPercentage(userContext, gradualRolloutPercentage);

    case "user_id":
      return shouldIncludeByUserId(userContext, gradualRolloutPercentage);

    case "country":
      return shouldIncludeByCountry(userContext, config);

    case "locale":
      return shouldIncludeByLocale(userContext, config);

    default:
      return false;
  }
}

/**
 * Percentage-based rollout using user ID hash
 */
function shouldIncludeByPercentage(
  userContext: UserContext,
  percentage: number
): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  // Use user ID or email to create consistent hash for percentage rollout
  const identifier = userContext.userId || userContext.email || "anonymous";

  // Simple hash function for consistent user bucketing
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Get positive hash value and convert to percentage (0-100)
  const positiveHash = Math.abs(hash);
  const userPercentage = positiveHash % 100;

  return userPercentage < percentage;
}

/**
 * User ID-based rollout (deterministic based on user ID ranges)
 */
function shouldIncludeByUserId(
  userContext: UserContext,
  percentage: number
): boolean {
  if (!userContext.userId) return false;

  // Extract numeric part from user ID (assuming format like "user_123")
  const numericId = parseInt(userContext.userId.replace(/\D/g, "")) || 0;

  // Use modulo to determine inclusion
  return numericId % 100 < percentage;
}

/**
 * Country-based rollout
 */
function shouldIncludeByCountry(
  userContext: UserContext,
  config: RolloutConfig
): boolean {
  if (!userContext.country) return false;

  return config.targetCountries.includes(userContext.country);
}

/**
 * Locale-based rollout
 */
function shouldIncludeByLocale(
  userContext: UserContext,
  config: RolloutConfig
): boolean {
  if (!userContext.locale) return false;

  return config.targetLocales.some(
    targetLocale =>
      userContext.locale?.startsWith(targetLocale) ||
      userContext.locale === targetLocale
  );
}

/**
 * Get payment provider for user based on rollout configuration
 */
export function getPaymentProviderForUser(
  userContext: UserContext,
  config: RolloutConfig = getRolloutConfig()
): "netopia" | "stripe" {
  if (shouldShowNetopia(userContext, config)) {
    return "netopia";
  }

  if (config.stripeEnabled) {
    return "stripe";
  }

  if (config.netopiaEnabled) {
    return "netopia";
  }

  // Fallback to Stripe to avoid routing users to a disabled Netopia flow
  return "stripe";
}

/**
 * Get rollout statistics for monitoring
 */
export function getRolloutStats(
  users: UserContext[],
  config: RolloutConfig = getRolloutConfig()
) {
  const stats = {
    totalUsers: users.length,
    romanianUsers: 0,
    netopiaUsers: 0,
    stripeUsers: 0,
    rolloutPercentage: config.gradualRolloutPercentage,
  };

  for (const user of users) {
    if (isRomanianUser(user)) {
      stats.romanianUsers++;
    }

    const provider = getPaymentProviderForUser(user, config);
    if (provider === "netopia") {
      stats.netopiaUsers++;
    } else {
      stats.stripeUsers++;
    }
  }

  return {
    ...stats,
    netopiaPercentage:
      stats.totalUsers > 0 ? (stats.netopiaUsers / stats.totalUsers) * 100 : 0,
    stripePercentage:
      stats.totalUsers > 0 ? (stats.stripeUsers / stats.totalUsers) * 100 : 0,
  };
}

/**
 * Middleware function to add payment provider to request context
 */
export function withPaymentProvider(handler: any) {
  return async (request: Request, context?: any) => {
    const config = getRolloutConfig();

    // Extract user context from request (cookies, headers, etc.)
    const userContext: UserContext = {
      userId: request.headers.get("x-user-id") || undefined,
      country: request.headers.get("x-country") || undefined,
      locale:
        request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ||
        undefined,
      email: request.headers.get("x-user-email") || undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] || undefined,
    };

    const paymentProvider = getPaymentProviderForUser(userContext, config);

    // Add to request context
    const enhancedContext = {
      ...context,
      paymentProvider,
      userContext,
      rolloutConfig: config,
    };

    return handler(request, enhancedContext);
  };
}

/**
 * React hook for client-side rollout decisions
 */
export function usePaymentRollout() {
  // This would be implemented as a React hook for client-side usage
  // For now, return the config for client-side decisions
  return {
    config: getRolloutConfig(),
    shouldShowNetopia: (userContext: UserContext) =>
      shouldShowNetopia(userContext),
    isRomanianUser: (userContext: UserContext) => isRomanianUser(userContext),
  };
}
