/**
 * Application-wide constants
 *
 * This file centralizes all magic numbers and commonly used values
 * to improve maintainability and reduce duplication.
 */

// =============================================================================
// TIME CONSTANTS (in milliseconds)
// =============================================================================

export const TIME = {
  // Milliseconds
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,

  // Common durations
  CACHE_DURATION: {
    SHORT: 2 * 60 * 1000, // 2 minutes
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 15 * 60 * 1000, // 15 minutes
    VERY_LONG: 60 * 60 * 1000, // 1 hour
  },

  // Timeouts
  TIMEOUT: {
    API_REQUEST: 30 * 1000, // 30 seconds
    DATABASE_QUERY: 30 * 1000, // 30 seconds
    FILE_UPLOAD: 2 * 60 * 1000, // 2 minutes
    EMAIL_SEND: 10 * 1000, // 10 seconds
  },

  // Session & Authentication
  SESSION: {
    CLEANUP_INTERVAL: 3600, // 1 hour (in seconds)
    CACHE_TIMEOUT: 300, // 5 minutes (in seconds)
    JWT_EXPIRY: 24 * 60 * 60, // 24 hours (in seconds)
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days (in seconds)
  },
} as const;

// =============================================================================
// RATE LIMITING CONSTANTS
// =============================================================================

export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: process.env.NODE_ENV === "development" ? 50 : 5, // 50 attempts in dev, 5 in production
  },

  // Password reset
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 3, // 3 attempts per hour
  },

  // Contact form
  CONTACT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 2, // 2 submissions per minute
  },

  // General API endpoints
  API: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 60, // 60 requests per minute
  },

  // Admin endpoints
  ADMIN: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 30, // 30 requests per minute
  },

  // Public content
  PUBLIC: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100, // 100 requests per minute
  },

  // Search endpoints
  SEARCH: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 20, // 20 searches per minute
  },

  // Cart operations
  CART: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 30, // 30 cart operations per minute
  },

  // Session rate limiting
  SESSION_RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100, // 100 requests per window
  },
} as const;

// =============================================================================
// PAGINATION & LIMITS
// =============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  MAX_OFFSET: 10000, // Reasonable limit for database performance
} as const;

export const CACHE_LIMITS = {
  MAX_IN_MEMORY_ITEMS: 1000,
  MAX_CACHE_ENTRIES: 100, // For product cache cleanup
  CACHE_CLEANUP_THRESHOLD: 50, // Remove this many entries when cleaning
} as const;

// =============================================================================
// SIZE & FILE LIMITS
// =============================================================================

export const FILE_SIZES = {
  // File upload limits (in bytes)
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_PRODUCT_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB

  // Bundle size limits
  MAX_CHUNK_SIZE: 244 * 1024, // 244KB
  MAX_ASYNC_REQUESTS: 30,
  MAX_INITIAL_REQUESTS: 30,

  // Compression threshold
  COMPRESSION_THRESHOLD: 1024, // 1KB minimum for compression
} as const;

export const TEXT_LIMITS = {
  // Text field lengths
  MIN_PRODUCT_NAME: 3,
  MIN_DESCRIPTION: 10,
  MAX_PRODUCT_NAME: 100,
  MAX_DESCRIPTION: 1000,
  MAX_COUPON_CODE: 50,
  MAX_SEARCH_QUERY: 200,
  MAX_ORDER_NOTES: 500,
  MAX_COMMENT_LENGTH: 2000,
  MAX_REVIEW_LENGTH: 1000,
  MAX_LOG_SIZE: 200, // For truncated logs
} as const;

// =============================================================================
// PERFORMANCE THRESHOLDS (in milliseconds)
// =============================================================================

export const PERFORMANCE_THRESHOLDS = {
  API: {
    FAST: 100,
    ACCEPTABLE: 500,
    SLOW: 1000,
  },
  DATABASE: {
    FAST: 50,
    ACCEPTABLE: 200,
    SLOW: 1000,
  },
  PAGE: {
    FAST: 1000,
    ACCEPTABLE: 3000,
    SLOW: 5000,
  },
} as const;

// =============================================================================
// DATABASE CONNECTION LIMITS
// =============================================================================

export const DATABASE = {
  CONNECTION_POOL: {
    PRODUCTION_LIMIT: 20,
    DEVELOPMENT_LIMIT: 10,
    POOL_TIMEOUT: 20 * 1000, // 20 seconds
    ACQUIRE_TIMEOUT: 60 * 1000, // 60 seconds
    CREATE_TIMEOUT: 30 * 1000, // 30 seconds
    DESTROY_TIMEOUT: 5 * 1000, // 5 seconds
    IDLE_TIMEOUT: 10 * 60 * 1000, // 10 minutes
    REAP_INTERVAL: 1000, // 1 second
    CREATE_RETRY_INTERVAL: 200, // 200ms
  },
  QUERY_TIMEOUT: 30 * 1000, // 30 seconds
} as const;

// =============================================================================
// CART & E-COMMERCE CONSTANTS
// =============================================================================

export const CART = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 100,
  MIN_ORDER_VALUE: 25, // Minimum cart value for abandonment prevention

  // Abandonment prevention
  EXIT_INTENT_DELAY: 3000, // 3 seconds
  IDLE_TIME_THRESHOLD: 5 * 60 * 1000, // 5 minutes

  // Discount thresholds
  // FREE_SHIPPING_THRESHOLD: 75, // Cart value for free shipping offer - REMOVED: Now fetched from database

  // Offer expiry times (in seconds)
  DISCOUNT_OFFER_EXPIRY: 15 * 60, // 15 minutes
  SHIPPING_OFFER_EXPIRY: 20 * 60, // 20 minutes
} as const;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

export const VALIDATION = {
  // Email & Phone
  EMAIL_MAX_LENGTH: 254,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,

  // Age ranges
  MIN_AGE: 0,
  MAX_AGE: 120,

  // Price ranges
  MIN_PRICE: 0.01,
  MAX_PRICE: 99999.99,

  // Dimensions (in cm)
  MIN_DIMENSION: 0.1,
  MAX_DIMENSION: 1000,

  // Weight (in kg)
  MIN_WEIGHT: 0.001,
  MAX_WEIGHT: 1000,

  // Stock
  MIN_STOCK: 0,
  MAX_STOCK: 999999,
} as const;

// =============================================================================
// UI & UX CONSTANTS
// =============================================================================

export const UI = {
  // Debounce delays
  SEARCH_DEBOUNCE: 300, // 300ms for search input
  INPUT_DEBOUNCE: 500, // 500ms for other inputs

  // Animation durations
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  // Loading states
  MIN_LOADING_TIME: 500, // Minimum time to show loading spinner

  // Notification timeouts
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds
  ERROR_NOTIFICATION_TIMEOUT: 8000, // 8 seconds for errors
} as const;

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// =============================================================================
// COMPRESSION SETTINGS
// =============================================================================

export const COMPRESSION = {
  LEVELS: {
    BROTLI: 6, // Good balance of compression and speed
    GZIP: 6, // Good balance of compression and speed
  },
  THRESHOLD: 1024, // 1KB minimum for compression
} as const;

// =============================================================================
// MEMORY & MONITORING
// =============================================================================

export const MONITORING = {
  MEMORY_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  PERFORMANCE_LOG_THRESHOLD: 1000, // Log operations slower than 1s
  MAX_ERROR_LOG_LENGTH: 500, // Truncate error logs
} as const;

// =============================================================================
// MOCK DATA CONSTANTS
// =============================================================================

export const MOCK_DATA = {
  RATING_MIN: 3.5,
  RATING_MAX: 5.0,
  RATING_PRECISION: 10, // For rounding (Math.round(x * 10) / 10)
} as const;

// =============================================================================
// SECURITY CONSTANTS
// =============================================================================

export const SECURITY = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  TOKEN_LENGTH: 32,
  SALT_ROUNDS: 12,

  // CSRF
  CSRF_TOKEN_LENGTH: 32,

  // Session
  SESSION_ID_LENGTH: 128,

  // API Keys
  API_KEY_LENGTH: 64,
} as const;

// =============================================================================
// EXPORT GROUPED CONSTANTS
// =============================================================================

/**
 * All application constants grouped by category
 */
export const CONSTANTS = {
  TIME,
  RATE_LIMITS,
  PAGINATION,
  CACHE_LIMITS,
  FILE_SIZES,
  TEXT_LIMITS,
  PERFORMANCE_THRESHOLDS,
  DATABASE,
  CART,
  VALIDATION,
  UI,
  HTTP_STATUS,
  COMPRESSION,
  MONITORING,
  MOCK_DATA,
  SECURITY,
} as const;

// Export everything as default for convenience
export default CONSTANTS;
