"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printConfigSummary = exports.getServiceHealth = exports.getEnvironmentInfo = exports.getAIConfig = exports.getMonitoringConfig = exports.getSecurityConfig = exports.getCacheConfig = exports.getPerformanceConfig = exports.getEmailConfig = exports.getRedisConfig = exports.getDatabaseConfig = exports.getEnv = exports.envConfig = void 0;
const zod_1 = require("zod");
// Environment variable schemas
const DatabaseConfigSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    DIRECT_URL: zod_1.z.string().url().optional(),
    DATABASE_POOL_SIZE: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("20"),
    DATABASE_CONNECTION_TIMEOUT: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("2000"),
    DATABASE_IDLE_TIMEOUT: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("30000"),
});
const RedisConfigSchema = zod_1.z.object({
    REDIS_URL: zod_1.z.string().url().optional(),
    REDIS_TOKEN: zod_1.z.string().optional(),
    REDIS_TIMEOUT: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("5000"),
    REDIS_MAX_RETRIES: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("3"),
    REDIS_RETRY_DELAY: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("1000"),
});
const EmailConfigSchema = zod_1.z.object({
    RESEND_API_KEY: zod_1.z.string().optional(),
    BREVO_API_KEY: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().email().optional(),
    EMAIL_REPLY_TO: zod_1.z.string().email().optional(),
});
const PerformanceConfigSchema = zod_1.z.object({
    PERFORMANCE_MONITORING: zod_1.z
        .string()
        .transform(val => val === "true")
        .default("false"),
    PERFORMANCE_SAMPLE_RATE: zod_1.z
        .string()
        .transform(val => parseFloat(val))
        .default("0.1"),
    PERFORMANCE_MAX_METRICS: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("1000"),
    PERFORMANCE_RETENTION_DAYS: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("7"),
    SLOW_QUERY_THRESHOLD: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("1000"),
    CRITICAL_QUERY_THRESHOLD: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("5000"),
});
const CacheConfigSchema = zod_1.z.object({
    API_CACHING: zod_1.z
        .string()
        .transform(val => val === "true")
        .default("false"),
    API_CACHE_TTL: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("300"),
    API_CACHE_MAX_TTL: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("3600"),
    API_CACHE_STALE_WHILE_REVALIDATE: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("60"),
    API_CACHE_COMPRESSION: zod_1.z
        .string()
        .transform(val => val === "true")
        .default("false"),
});
const SecurityConfigSchema = zod_1.z.object({
    NEXTAUTH_SECRET: zod_1.z.string().min(32),
    NEXTAUTH_URL: zod_1.z.string().url(),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
});
const MonitoringConfigSchema = zod_1.z.object({
    SENTRY_DSN: zod_1.z.string().url().optional(),
    SENTRY_ENVIRONMENT: zod_1.z.string().default("development"),
    LOG_LEVEL: zod_1.z.enum(["error", "warn", "info", "debug"]).default("info"),
    ENABLE_ANALYTICS: zod_1.z
        .string()
        .transform(val => val === "true")
        .default("false"),
});
const AIConfigSchema = zod_1.z.object({
    OPENAI_API_KEY: zod_1.z.string().optional(),
    ANTHROPIC_API_KEY: zod_1.z.string().optional(),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    AI_PROVIDER: zod_1.z.enum(["openai", "anthropic", "gemini"]).default("openai"),
    AI_MODEL: zod_1.z.string().default("gpt-4"),
    AI_MAX_TOKENS: zod_1.z
        .string()
        .transform(val => parseInt(val, 10))
        .default("2000"),
    AI_TEMPERATURE: zod_1.z
        .string()
        .transform(val => parseFloat(val))
        .default("0.7"),
    AI_ENHANCEMENT_ENABLED: zod_1.z
        .string()
        .transform(val => val === "true")
        .default("true"),
});
// Combined environment schema
const EnvironmentSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(["development", "production", "test"])
        .default("development"),
    ...DatabaseConfigSchema.shape,
    ...RedisConfigSchema.shape,
    ...EmailConfigSchema.shape,
    ...PerformanceConfigSchema.shape,
    ...CacheConfigSchema.shape,
    ...SecurityConfigSchema.shape,
    ...MonitoringConfigSchema.shape,
    ...AIConfigSchema.shape,
});
// Environment configuration class
class EnvironmentConfig {
    constructor() {
        this.validated = false;
        this.config = this.loadEnvironment();
    }
    loadEnvironment() {
        const env = {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL: process.env.DATABASE_URL,
            DIRECT_URL: process.env.DIRECT_URL,
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
            API_CACHE_STALE_WHILE_REVALIDATE: process.env.API_CACHE_STALE_WHILE_REVALIDATE,
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
            // AI Configuration
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
            GEMINI_API_KEY: process.env.GEMINI_API_KEY,
            AI_PROVIDER: process.env.AI_PROVIDER,
            AI_MODEL: process.env.AI_MODEL,
            AI_MAX_TOKENS: process.env.AI_MAX_TOKENS,
            AI_TEMPERATURE: process.env.AI_TEMPERATURE,
            AI_ENHANCEMENT_ENABLED: process.env.AI_ENHANCEMENT_ENABLED,
        };
        return env;
    }
    validate() {
        if (this.validated)
            return;
        try {
            this.config = EnvironmentSchema.parse(this.config);
            this.validated = true;
            console.log("✅ Environment configuration validated successfully");
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                console.error("❌ Environment configuration validation failed:");
                error.errors.forEach(err => {
                    console.error(`  - ${err.path.join(".")}: ${err.message}`);
                });
                throw new Error("Environment configuration validation failed");
            }
            throw error;
        }
    }
    get(key) {
        if (!this.validated) {
            this.validate();
        }
        return this.config[key];
    }
    // Database configuration
    get database() {
        return {
            url: this.get("DATABASE_URL"),
            directUrl: this.get("DIRECT_URL"),
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
            apiCacheStaleWhileRevalidate: this.get("API_CACHE_STALE_WHILE_REVALIDATE"),
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
    // AI configuration
    get ai() {
        return {
            openaiApiKey: this.get("OPENAI_API_KEY"),
            anthropicApiKey: this.get("ANTHROPIC_API_KEY"),
            geminiApiKey: this.get("GEMINI_API_KEY"),
            provider: this.get("AI_PROVIDER"),
            model: this.get("AI_MODEL"),
            maxTokens: this.get("AI_MAX_TOKENS"),
            temperature: this.get("AI_TEMPERATURE"),
            enhancementEnabled: this.get("AI_ENHANCEMENT_ENABLED"),
            isConfigured: !!(this.get("OPENAI_API_KEY") ||
                this.get("ANTHROPIC_API_KEY") ||
                this.get("GEMINI_API_KEY")),
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
            ai: this.ai.isConfigured,
        };
    }
    // Print configuration summary
    printSummary() {
        console.log("🔧 Environment Configuration Summary:");
        console.log(`  Environment: ${this.environment.nodeEnv}`);
        console.log(`  Database: ${this.database.url ? "✅" : "❌"}`);
        console.log(`  Redis: ${this.redis.isConfigured ? "✅" : "❌"}`);
        console.log(`  Email: ${this.email.isConfigured ? "✅" : "❌"}`);
        console.log(`  Performance Monitoring: ${this.performance.monitoring ? "✅" : "❌"}`);
        console.log(`  API Caching: ${this.cache.apiCaching ? "✅" : "❌"}`);
        console.log(`  Monitoring: ${this.monitoring.sentryDsn ? "✅" : "❌"}`);
        console.log(`  AI Enhancement: ${this.ai.isConfigured ? "✅" : "❌"}`);
    }
}
// Export singleton instance
exports.envConfig = new EnvironmentConfig();
// Convenience exports
const getEnv = (key) => exports.envConfig.get(key);
exports.getEnv = getEnv;
const getDatabaseConfig = () => exports.envConfig.database;
exports.getDatabaseConfig = getDatabaseConfig;
const getRedisConfig = () => exports.envConfig.redis;
exports.getRedisConfig = getRedisConfig;
const getEmailConfig = () => exports.envConfig.email;
exports.getEmailConfig = getEmailConfig;
const getPerformanceConfig = () => exports.envConfig.performance;
exports.getPerformanceConfig = getPerformanceConfig;
const getCacheConfig = () => exports.envConfig.cache;
exports.getCacheConfig = getCacheConfig;
const getSecurityConfig = () => exports.envConfig.security;
exports.getSecurityConfig = getSecurityConfig;
const getMonitoringConfig = () => exports.envConfig.monitoring;
exports.getMonitoringConfig = getMonitoringConfig;
const getAIConfig = () => exports.envConfig.ai;
exports.getAIConfig = getAIConfig;
const getEnvironmentInfo = () => exports.envConfig.environment;
exports.getEnvironmentInfo = getEnvironmentInfo;
const getServiceHealth = () => exports.envConfig.getServiceHealth();
exports.getServiceHealth = getServiceHealth;
const printConfigSummary = () => exports.envConfig.printSummary();
exports.printConfigSummary = printConfigSummary;
