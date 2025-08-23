import { z } from "zod";

// Environment variable schemas
const DatabaseConfigSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("20"),
  DATABASE_CONNECTION_TIMEOUT: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("2000"),
  DATABASE_IDLE_TIMEOUT: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("30000"),
});

const RedisConfigSchema = z.object({
  REDIS_URL: z.string().url().optional(),
  REDIS_TOKEN: z.string().optional(),
  REDIS_TIMEOUT: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("5000"),
  REDIS_MAX_RETRIES: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("3"),
  REDIS_RETRY_DELAY: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("1000"),
});

const EmailConfigSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
});

const PerformanceConfigSchema = z.object({
  PERFORMANCE_MONITORING: z
    .string()
    .transform(val => val === "true")
    .default("false"),
  PERFORMANCE_SAMPLE_RATE: z
    .string()
    .transform(val => parseFloat(val))
    .default("0.1"),
  PERFORMANCE_MAX_METRICS: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("1000"),
  PERFORMANCE_RETENTION_DAYS: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("7"),
  SLOW_QUERY_THRESHOLD: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("1000"),
  CRITICAL_QUERY_THRESHOLD: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("5000"),
});

const CacheConfigSchema = z.object({
  API_CACHING: z
    .string()
    .transform(val => val === "true")
    .default("false"),
  API_CACHE_TTL: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("300"),
  API_CACHE_MAX_TTL: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("3600"),
  API_CACHE_STALE_WHILE_REVALIDATE: z
    .string()
    .transform(val => parseInt(val, 10))
    .default("60"),
  API_CACHE_COMPRESSION: z
    .string()
    .transform(val => val === "true")
    .default("false"),
});

const SecurityConfigSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const MonitoringConfigSchema = z.object({
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  ENABLE_ANALYTICS: z
    .string()
    .transform(val => val === "true")
    .default("false"),
});

// Combined environment schema
const EnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  ...DatabaseConfigSchema.shape,
  ...RedisConfigSchema.shape,
  ...EmailConfigSchema.shape,
  ...PerformanceConfigSchema.shape,
  ...CacheConfigSchema.shape,
  ...SecurityConfigSchema.shape,
  ...MonitoringConfigSchema.shape,
});

// Environment configuration class
class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: z.infer<typeof EnvironmentSchema>;
  private validated = false;

  private constructor() {
    this.config = this.loadEnvironment();
  }

  static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private loadEnvironment(): z.infer<typeof EnvironmentSchema> {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,
      DATABASE_CONNECTION_TIMEOUT: process.env.DATABASE_CONNECTION_TIMEOUT,
      DATABASE_IDLE_TIMEOUT: process.env.DATABASE_IDLE_TIMEOUT,
      REDIS_URL: process.env.REDIS_URL,
      REDIS_TOKEN: process.env.REDIS_TOKEN,
      REDIS_TIMEOUT: process.env.REDIS_TIMEOUT,
      REDIS_MAX_RETRIES: process.env.REDIS_MAX_RETRIES,
      REDIS_RETRY_DELAY: process.env.REDIS_RETRY_DELAY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      BREVO_API_KEY: process.env.BREVO_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
      PERFORMANCE_MONITORING: process.env.PERFORMANCE_MONITORING,
      PERFORMANCE_SAMPLE_RATE: process.env.PERFORMANCE_SAMPLE_RATE,
      PERFORMANCE_MAX_METRICS: process.env.PERFORMANCE_MAX_METRICS,
      PERFORMANCE_RETENTION_DAYS: process.env.PERFORMANCE_RETENTION_DAYS,
      SLOW_QUERY_THRESHOLD: process.env.SLOW_QUERY_THRESHOLD,
      CRITICAL_QUERY_THRESHOLD: process.env.CRITICAL_QUERY_THRESHOLD,
      API_CACHING: process.env.API_CACHING,
      API_CACHE_TTL: process.env.API_CACHE_TTL,
      API_CACHE_MAX_TTL: process.env.API_CACHE_MAX_TTL,
      API_CACHE_STALE_WHILE_REVALIDATE:
        process.env.API_CACHE_STALE_WHILE_REVALIDATE,
      API_CACHE_COMPRESSION: process.env.API_CACHE_COMPRESSION,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      SENTRY_DSN: process.env.SENTRY_DSN,
      SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
      LOG_LEVEL: process.env.LOG_LEVEL,
      ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
    };

    return env as z.infer<typeof EnvironmentSchema>;
  }

  validate(): void {
    if (this.validated) return;

    try {
      this.config = EnvironmentSchema.parse(this.config);
      this.validated = true;
      console.log("✅ Environment configuration validated successfully");
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Environment configuration validation failed:");
        error.errors.forEach(err => {
          console.error(`  - ${err.path.join(".")}: ${err.message}`);
        });
        throw new Error("Environment configuration validation failed");
      }
      throw error;
    }
  }

  get<K extends keyof z.infer<typeof EnvironmentSchema>>(
    key: K
  ): z.infer<typeof EnvironmentSchema>[K] {
    if (!this.validated) {
      this.validate();
    }
    return this.config[key];
  }

  // Database configuration
  get database() {
    return {
      url: this.get("DATABASE_URL"),
      poolSize: this.get("DATABASE_POOL_SIZE"),
      connectionTimeout: this.get("DATABASE_CONNECTION_TIMEOUT"),
      idleTimeout: this.get("DATABASE_IDLE_TIMEOUT"),
    };
  }

  // Redis configuration
  get redis() {
    return {
      url: this.get("REDIS_URL"),
      token: this.get("REDIS_TOKEN"),
      timeout: this.get("REDIS_TIMEOUT"),
      maxRetries: this.get("REDIS_MAX_RETRIES"),
      retryDelay: this.get("REDIS_RETRY_DELAY"),
      isConfigured: !!(this.get("REDIS_URL") && this.get("REDIS_TOKEN")),
    };
  }

  // Email configuration
  get email() {
    return {
      resendApiKey: this.get("RESEND_API_KEY"),
      brevoApiKey: this.get("BREVO_API_KEY"),
      from: this.get("EMAIL_FROM"),
      replyTo: this.get("EMAIL_REPLY_TO"),
      isConfigured: !!(this.get("RESEND_API_KEY") || this.get("BREVO_API_KEY")),
    };
  }

  // Performance configuration
  get performance() {
    return {
      monitoring: this.get("PERFORMANCE_MONITORING"),
      sampleRate: this.get("PERFORMANCE_SAMPLE_RATE"),
      maxMetrics: this.get("PERFORMANCE_MAX_METRICS"),
      retentionDays: this.get("PERFORMANCE_RETENTION_DAYS"),
      slowQueryThreshold: this.get("SLOW_QUERY_THRESHOLD"),
      criticalQueryThreshold: this.get("CRITICAL_QUERY_THRESHOLD"),
    };
  }

  // Cache configuration
  get cache() {
    return {
      apiCaching: this.get("API_CACHING"),
      apiCacheTTL: this.get("API_CACHE_TTL"),
      apiCacheMaxTTL: this.get("API_CACHE_MAX_TTL"),
      apiCacheStaleWhileRevalidate: this.get(
        "API_CACHE_STALE_WHILE_REVALIDATE"
      ),
      apiCacheCompression: this.get("API_CACHE_COMPRESSION"),
    };
  }

  // Security configuration
  get security() {
    return {
      nextAuthSecret: this.get("NEXTAUTH_SECRET"),
      nextAuthUrl: this.get("NEXTAUTH_URL"),
      googleClientId: this.get("GOOGLE_CLIENT_ID"),
      googleClientSecret: this.get("GOOGLE_CLIENT_SECRET"),
      stripeSecretKey: this.get("STRIPE_SECRET_KEY"),
      stripeWebhookSecret: this.get("STRIPE_WEBHOOK_SECRET"),
    };
  }

  // Monitoring configuration
  get monitoring() {
    return {
      sentryDsn: this.get("SENTRY_DSN"),
      sentryEnvironment: this.get("SENTRY_ENVIRONMENT"),
      logLevel: this.get("LOG_LEVEL"),
      enableAnalytics: this.get("ENABLE_ANALYTICS"),
    };
  }

  // Environment info
  get environment() {
    return {
      nodeEnv: this.get("NODE_ENV"),
      isDevelopment: this.get("NODE_ENV") === "development",
      isProduction: this.get("NODE_ENV") === "production",
      isTest: this.get("NODE_ENV") === "test",
    };
  }

  // Service health check
  getServiceHealth() {
    return {
      database: !!this.get("DATABASE_URL"),
      redis: this.redis.isConfigured,
      email: this.email.isConfigured,
      performance: this.get("PERFORMANCE_MONITORING"),
      caching: this.get("API_CACHING"),
      monitoring: !!this.get("SENTRY_DSN"),
    };
  }

  // Print configuration summary
  printSummary(): void {
    console.log("🔧 Environment Configuration Summary:");
    console.log(`  Environment: ${this.environment.nodeEnv}`);
    console.log(`  Database: ${this.database.url ? "✅" : "❌"}`);
    console.log(`  Redis: ${this.redis.isConfigured ? "✅" : "❌"}`);
    console.log(`  Email: ${this.email.isConfigured ? "✅" : "❌"}`);
    console.log(
      `  Performance Monitoring: ${this.performance.monitoring ? "✅" : "❌"}`
    );
    console.log(`  API Caching: ${this.cache.apiCaching ? "✅" : "❌"}`);
    console.log(`  Monitoring: ${this.monitoring.sentryDsn ? "✅" : "❌"}`);
  }
}

// Export singleton instance
export const envConfig = EnvironmentConfig.getInstance();

// Convenience exports
export const getEnv = (key: keyof z.infer<typeof EnvironmentSchema>) =>
  envConfig.get(key);
export const getDatabaseConfig = () => envConfig.database;
export const getRedisConfig = () => envConfig.redis;
export const getEmailConfig = () => envConfig.email;
export const getPerformanceConfig = () => envConfig.performance;
export const getCacheConfig = () => envConfig.cache;
export const getSecurityConfig = () => envConfig.security;
export const getMonitoringConfig = () => envConfig.monitoring;
export const getEnvironmentInfo = () => envConfig.environment;
export const getServiceHealth = () => envConfig.getServiceHealth();
export const printConfigSummary = () => envConfig.printSummary();
