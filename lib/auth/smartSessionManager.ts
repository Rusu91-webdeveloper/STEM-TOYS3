/**
 * Smart Session Management System
 * Reduces excessive validation calls and provides user control over authentication behavior
 */

export interface AuthPreferences {
  autoLogin: boolean; // Whether to automatically log in users
  persistSession: boolean; // Whether to persist session across browser restarts
  validationFrequency: "minimal" | "normal" | "frequent"; // How often to validate sessions
  redirectBehavior: "aggressive" | "smart" | "manual"; // How to handle auth redirects
}

export interface SessionState {
  isValid: boolean;
  lastValidated: number;
  validationAttempts: number;
  userId?: string;
  error?: string;
}

const AUTH_PREFERENCES_KEY = "nextcommerce_auth_preferences";
const SESSION_STATE_KEY = "nextcommerce_session_state";

// Default preferences for better UX
const DEFAULT_AUTH_PREFERENCES: AuthPreferences = {
  autoLogin: false, // Disabled by default - user choice
  persistSession: true, // Keep sessions but don't auto-login
  validationFrequency: "normal", // Balanced validation
  redirectBehavior: "smart", // Smart redirects without loops
};

// Validation intervals based on frequency setting
const VALIDATION_INTERVALS = {
  minimal: 15 * 60 * 1000, // 15 minutes
  normal: 10 * 60 * 1000, // 10 minutes
  frequent: 5 * 60 * 1000, // 5 minutes
};

// Global state management
let globalSessionState: SessionState | null = null;
let validationInProgress = false;
let validationPromise: Promise<boolean> | null = null;

/**
 * Get user's authentication preferences
 */
export function getAuthPreferences(): AuthPreferences {
  if (typeof window === "undefined") return DEFAULT_AUTH_PREFERENCES;

  try {
    const stored = localStorage.getItem(AUTH_PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_AUTH_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to parse auth preferences:", error);
  }

  return DEFAULT_AUTH_PREFERENCES;
}

/**
 * Save user's authentication preferences
 */
export function setAuthPreferences(
  preferences: Partial<AuthPreferences>
): void {
  if (typeof window === "undefined") return;

  const current = getAuthPreferences();
  const updated = { ...current, ...preferences };

  try {
    localStorage.setItem(AUTH_PREFERENCES_KEY, JSON.stringify(updated));

    // Apply preferences immediately
    if (!updated.persistSession) {
      clearSessionState();
    }

    console.log("🔐 Auth preferences updated:", updated);
  } catch (error) {
    console.error("Failed to save auth preferences:", error);
  }
}

/**
 * Get current session state
 */
export function getSessionState(): SessionState | null {
  if (globalSessionState) return globalSessionState;

  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem(SESSION_STATE_KEY);
    if (stored) {
      globalSessionState = JSON.parse(stored);
      return globalSessionState;
    }
  } catch (error) {
    console.error("Failed to parse session state:", error);
  }

  return null;
}

/**
 * Update session state
 */
export function setSessionState(state: Partial<SessionState>): void {
  const current = getSessionState() || {
    isValid: false,
    lastValidated: 0,
    validationAttempts: 0,
  };

  globalSessionState = { ...current, ...state };

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        SESSION_STATE_KEY,
        JSON.stringify(globalSessionState)
      );
    } catch (error) {
      console.error("Failed to save session state:", error);
    }
  }
}

/**
 * Clear session state
 */
export function clearSessionState(): void {
  globalSessionState = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(SESSION_STATE_KEY);
      localStorage.removeItem("loginLoopCount");
    } catch (error) {
      console.error("Failed to clear session state:", error);
    }
  }
}

/**
 * Check if session needs validation based on preferences
 */
export function shouldValidateSession(userId?: string): boolean {
  if (!userId) return false;

  const preferences = getAuthPreferences();
  const sessionState = getSessionState();

  // If validation is in progress, don't start another
  if (validationInProgress) return false;

  // Check if we've validated recently based on frequency setting
  if (sessionState?.lastValidated) {
    const interval = VALIDATION_INTERVALS[preferences.validationFrequency];
    const timeSinceValidation = Date.now() - sessionState.lastValidated;

    if (timeSinceValidation < interval) {
      return false;
    }
  }

  // Limit validation attempts to prevent spam
  if (sessionState?.validationAttempts && sessionState.validationAttempts > 5) {
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - sessionState.lastValidated < oneHour) {
      return false;
    }
  }

  return true;
}

/**
 * Smart session validation with deduplication
 */
export async function validateSessionSmart(userId: string): Promise<boolean> {
  // Return existing promise if validation is already in progress
  if (validationPromise) {
    return validationPromise;
  }

  // Check if we should skip validation
  if (!shouldValidateSession(userId)) {
    const sessionState = getSessionState();
    return sessionState?.isValid ?? true;
  }

  validationInProgress = true;

  validationPromise = (async () => {
    try {
      const sessionState = getSessionState() || {
        isValid: false,
        lastValidated: 0,
        validationAttempts: 0,
      };

      // Update validation attempt
      setSessionState({
        validationAttempts: sessionState.validationAttempts + 1,
        lastValidated: Date.now(),
      });

      // Create abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/api/auth/validate-session", {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const data = await response.json();
      const isValid = data.valid;

      // Update session state
      setSessionState({
        isValid,
        userId,
        error: isValid ? undefined : data.reason,
      });

      console.log(
        `🔐 Session validation result: ${isValid ? "valid" : "invalid"}`
      );
      return isValid;
    } catch (error) {
      console.warn("Session validation failed:", error);

      // FIXED: Don't assume valid when database is unavailable
      // Instead, be more strict about session validity
      const isAbortError =
        error instanceof Error && error.name === "AbortError";
      const isDatabaseError =
        error instanceof Error &&
        (error.message.includes(
          "Environment variable not found: DATABASE_URL"
        ) ||
          error.message.includes("PrismaClientInitializationError") ||
          error.message.includes("database") ||
          error.message.includes("DATABASE_URL"));

      // If it's a database configuration error, invalidate the session
      if (isDatabaseError) {
        console.error("🚨 Database not configured - invalidating session");
        setSessionState({
          isValid: false,
          error: "Database not configured",
        });
        return false;
      }

      // Only assume valid for network timeouts, not database errors
      const assumeValid = isAbortError;

      setSessionState({
        isValid: assumeValid,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return assumeValid;
    } finally {
      validationInProgress = false;
      validationPromise = null;
    }
  })();

  return validationPromise;
}

/**
 * Check if should perform auto-login redirect
 */
export function shouldAutoRedirect(pathname: string): boolean {
  const preferences = getAuthPreferences();

  // Never auto-redirect if disabled
  if (!preferences.autoLogin) return false;

  // Don't redirect on auth pages
  if (pathname.startsWith("/auth/")) return false;

  // Check redirect behavior
  switch (preferences.redirectBehavior) {
    case "manual":
      return false;
    case "aggressive":
      return true;
    case "smart":
      // Smart redirects avoid loops and respect user intent
      const isLoop = checkRedirectLoop();
      return !isLoop;
    default:
      return false;
  }
}

/**
 * Check for redirect loops
 */
function checkRedirectLoop(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const loopCount = parseInt(localStorage.getItem("loginLoopCount") || "0");
    const now = Date.now();
    const lastCheck = parseInt(localStorage.getItem("lastLoopCheck") || "0");

    // Reset counter if it's been more than 5 minutes
    if (now - lastCheck > 5 * 60 * 1000) {
      localStorage.setItem("loginLoopCount", "0");
      localStorage.setItem("lastLoopCheck", now.toString());
      return false;
    }

    // Update loop count
    if (loopCount > 0) {
      localStorage.setItem("loginLoopCount", (loopCount + 1).toString());
    }

    localStorage.setItem("lastLoopCheck", now.toString());

    // Consider it a loop if we've redirected 3+ times in 5 minutes
    return loopCount >= 3;
  } catch (error) {
    return false;
  }
}

/**
 * Smart cookie management
 */
export function clearAuthCookies(): void {
  if (typeof window === "undefined") return;

  const authCookies = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Secure-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "next-auth.pkce.code_verifier",
    "__Host-next-auth.csrf-token",
  ];

  authCookies.forEach(cookieName => {
    // Clear with multiple path/domain combinations
    const paths = ["/", "/auth", "/account", "/checkout"];
    const domains = ["", `.${window.location.hostname}`];

    paths.forEach(path => {
      domains.forEach(domain => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=${path}; domain=${domain}; secure; samesite=lax`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=${path}; domain=${domain}`;
      });
    });
  });

  // Clear session state
  clearSessionState();

  console.log("🧹 Auth cookies cleared");
}

/**
 * Development helper for clearing all auth data
 */
export function devClearAllAuthData(): void {
  if (typeof window === "undefined") return;

  try {
    // Clear preferences and state
    localStorage.removeItem(AUTH_PREFERENCES_KEY);
    sessionStorage.removeItem(SESSION_STATE_KEY);
    localStorage.removeItem("loginLoopCount");
    localStorage.removeItem("lastLoopCheck");

    // Clear cookies
    clearAuthCookies();

    // Clear global state
    globalSessionState = null;

    console.log("🧹 All auth data cleared for development");
  } catch (error) {
    console.error("Failed to clear auth data:", error);
  }
}

/**
 * Get auth system status for debugging
 */
export function getAuthSystemStatus() {
  const preferences = getAuthPreferences();
  const sessionState = getSessionState();

  return {
    preferences,
    sessionState,
    validationInProgress,
    timestamp: Date.now(),
  };
}

// Expose dev helper globally in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).devClearAuth = devClearAllAuthData;
  (window as any).authStatus = getAuthSystemStatus;
  console.log("🛠️ Auth dev helpers available: devClearAuth(), authStatus()");
}
