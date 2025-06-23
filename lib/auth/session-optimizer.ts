/**
 * Session validation optimization utilities for STEM-TOYS2
 */

import { logger } from "../logger";
import { cache } from "../cache";
// Optional JWT support - install jsonwebtoken if needed
let jwt: any;
try {
  jwt = require('jsonwebtoken');
} catch {
  // JWT not available - will skip JWT validation
}

// Session optimization configuration
export interface SessionOptimizationConfig {
  enabled: boolean;
  cacheTimeout: number; // seconds
  jwtVerifyCache: boolean;
  backgroundRefresh: boolean;
  parallelValidation: boolean;
  skipDatabaseForJWT: boolean;
  sessionCleanupInterval: number;
}

// Default configuration
const defaultConfig: SessionOptimizationConfig = {
  enabled: process.env.NODE_ENV === 'production',
  cacheTimeout: 300, // 5 minutes
  jwtVerifyCache: true,
  backgroundRefresh: true,
  parallelValidation: true,
  skipDatabaseForJWT: true,
  sessionCleanupInterval: 3600 // 1 hour
};

// Session cache keys
const CACHE_KEYS = {
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USER: (userId: string) => `user:${userId}`,
  JWT_VERIFY: (token: string) => `jwt:${token.slice(-8)}`, // Use last 8 chars as key
  PERMISSIONS: (userId: string) => `permissions:${userId}`,
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`
};

// Session validation statistics
interface SessionStats {
  cacheHits: number;
  cacheMisses: number;
  databaseQueries: number;
  jwtVerifications: number;
  averageResponseTime: number;
  errors: number;
}

// Optimized session validator
export class SessionOptimizer {
  private config: SessionOptimizationConfig;
  private stats: SessionStats = {
    cacheHits: 0,
    cacheMisses: 0,
    databaseQueries: 0,
    jwtVerifications: 0,
    averageResponseTime: 0,
    errors: 0
  };
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<SessionOptimizationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    if (this.config.enabled) {
      logger.info('Session optimization enabled', {
        cacheTimeout: this.config.cacheTimeout,
        skipDatabaseForJWT: this.config.skipDatabaseForJWT,
        backgroundRefresh: this.config.backgroundRefresh
      });
      
      this.startCleanupInterval();
    }
  }

  /**
   * Optimized session validation without blocking database calls
   */
  async validateSession(sessionToken: string, options: {
    requireFresh?: boolean;
    includePermissions?: boolean;
    allowStale?: boolean;
  } = {}): Promise<{
    valid: boolean;
    user?: any;
    session?: any;
    permissions?: string[];
    fromCache: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();
    const { requireFresh = false, includePermissions = false, allowStale = true } = options;

    try {
      // Try JWT-only validation first (fastest)
      if (this.config.skipDatabaseForJWT && this.isJWT(sessionToken)) {
        const jwtResult = await this.validateJWTSession(sessionToken, includePermissions);
        if (jwtResult.valid) {
          const responseTime = Date.now() - startTime;
          this.updateStats('success', responseTime, true);
          return { ...jwtResult, responseTime };
        }
      }

      // Try cache lookup (second fastest)
      if (!requireFresh) {
        const cacheResult = await this.validateCachedSession(sessionToken, includePermissions);
        if (cacheResult.valid) {
          const responseTime = Date.now() - startTime;
          this.updateStats('success', responseTime, true);
          return { ...cacheResult, responseTime };
        }
      }

      // Fall back to database validation (slowest)
      const dbResult = await this.validateDatabaseSession(sessionToken, includePermissions);
      const responseTime = Date.now() - startTime;
      
      // Cache the result for future use
      if (dbResult.valid && dbResult.session) {
        await this.cacheSessionData(dbResult.session, dbResult.user, dbResult.permissions);
      }

      this.updateStats('success', responseTime, false);
      return { ...dbResult, responseTime };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.stats.errors++;
      logger.error('Session validation failed', { error, sessionToken: sessionToken.slice(-8) });
      
      // If stale cache is allowed, try to return cached data
      if (allowStale) {
        const staleResult = await this.getStaleSession(sessionToken);
        if (staleResult.valid) {
          logger.warn('Using stale session data due to error', { sessionToken: sessionToken.slice(-8) });
          return { ...staleResult, responseTime };
        }
      }

      return {
        valid: false,
        fromCache: false,
        responseTime
      };
    }
  }

  /**
   * Validate JWT session without database lookup
   */
  private async validateJWTSession(token: string, includePermissions: boolean = false): Promise<{
    valid: boolean;
    user?: any;
    session?: any;
    permissions?: string[];
    fromCache: boolean;
  }> {
    try {
      // Check JWT verification cache
      if (this.config.jwtVerifyCache) {
        const cacheKey = CACHE_KEYS.JWT_VERIFY(token);
        const cached = await cache.get(cacheKey);
        if (cached) {
          this.stats.cacheHits++;
          return { ...cached, fromCache: true };
        }
      }

      // Verify JWT
      const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT secret not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      this.stats.jwtVerifications++;

      const result = {
        valid: true,
        user: {
          id: decoded.sub || decoded.userId,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role || 'user'
        },
        session: {
          id: decoded.jti || token.slice(-8),
          userId: decoded.sub || decoded.userId,
          expiresAt: new Date(decoded.exp * 1000)
        },
        permissions: decoded.permissions || [],
        fromCache: false
      };

      // Cache the JWT verification result
      if (this.config.jwtVerifyCache) {
        const cacheKey = CACHE_KEYS.JWT_VERIFY(token);
        await cache.set(cacheKey, result, 900); // 15 minutes
      }

      return result;

         } catch (error) {
       logger.debug('JWT validation failed', { error: (error as Error).message });
       return { valid: false, fromCache: false };
     }
  }

  /**
   * Validate session using cached data
   */
  private async validateCachedSession(sessionToken: string, includePermissions: boolean = false): Promise<{
    valid: boolean;
    user?: any;
    session?: any;
    permissions?: string[];
    fromCache: boolean;
  }> {
    try {
      const sessionKey = CACHE_KEYS.SESSION(sessionToken);
      const cachedSession = await cache.get(sessionKey);

      if (!cachedSession) {
        this.stats.cacheMisses++;
        return { valid: false, fromCache: false };
      }

      this.stats.cacheHits++;

      // Get user data from cache
      const userKey = CACHE_KEYS.USER(cachedSession.userId);
      const cachedUser = await cache.get(userKey);

      let permissions: string[] = [];
      if (includePermissions && cachedSession.userId) {
        const permissionsKey = CACHE_KEYS.PERMISSIONS(cachedSession.userId);
        permissions = await cache.get(permissionsKey) || [];
      }

      return {
        valid: true,
        user: cachedUser,
        session: cachedSession,
        permissions,
        fromCache: true
      };

    } catch (error) {
      logger.error('Cache session validation failed', { error });
      return { valid: false, fromCache: false };
    }
  }

  /**
   * Validate session using database (fallback)
   */
  private async validateDatabaseSession(sessionToken: string, includePermissions: boolean = false): Promise<{
    valid: boolean;
    user?: any;
    session?: any;
    permissions?: string[];
    fromCache: boolean;
  }> {
    this.stats.databaseQueries++;
    
    try {
      // Import prisma dynamically to avoid circular dependencies
      const { prisma } = await import('../db');

      // Query session with user data
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              emailVerified: true,
              isActive: true
            }
          }
        }
      });

      if (!session || session.expires < new Date()) {
        return { valid: false, fromCache: false };
      }

      let permissions: string[] = [];
      if (includePermissions && session.user) {
        // Get user permissions if needed
        const userPermissions = await prisma.userPermission.findMany({
          where: { userId: session.user.id },
          select: { permission: true }
        });
        permissions = userPermissions.map(p => p.permission);
      }

      return {
        valid: true,
        user: session.user,
        session: {
          id: session.id,
          userId: session.userId,
          expiresAt: session.expires
        },
        permissions,
        fromCache: false
      };

    } catch (error) {
      logger.error('Database session validation failed', { error });
      return { valid: false, fromCache: false };
    }
  }

  /**
   * Cache session data
   */
  private async cacheSessionData(session: any, user: any, permissions?: string[]): Promise<void> {
    try {
      const sessionKey = CACHE_KEYS.SESSION(session.sessionToken || session.id);
      const userKey = CACHE_KEYS.USER(session.userId);

      await Promise.all([
        cache.set(sessionKey, session, this.config.cacheTimeout),
        cache.set(userKey, user, this.config.cacheTimeout),
        permissions && cache.set(CACHE_KEYS.PERMISSIONS(session.userId), permissions, this.config.cacheTimeout)
      ].filter(Boolean));

    } catch (error) {
      logger.error('Failed to cache session data', { error });
    }
  }

  /**
   * Get stale session data for fallback
   */
  private async getStaleSession(sessionToken: string): Promise<{
    valid: boolean;
    user?: any;
    session?: any;
    permissions?: string[];
    fromCache: boolean;
  }> {
    try {
      // Try to get any cached data, even if expired
      const sessionKey = CACHE_KEYS.SESSION(sessionToken);
      const staleSession = await cache.get(sessionKey, { allowStale: true });

      if (staleSession) {
        const userKey = CACHE_KEYS.USER(staleSession.userId);
        const staleUser = await cache.get(userKey, { allowStale: true });

        return {
          valid: true,
          user: staleUser,
          session: staleSession,
          fromCache: true
        };
      }

      return { valid: false, fromCache: false };
    } catch (error) {
      return { valid: false, fromCache: false };
    }
  }

  /**
   * Background session refresh
   */
  async refreshSessionInBackground(sessionToken: string): Promise<void> {
    if (!this.config.backgroundRefresh) return;

    // Don't await this - let it run in background
    setImmediate(async () => {
      try {
        await this.validateSession(sessionToken, { requireFresh: true });
        logger.debug('Background session refresh completed', { 
          sessionToken: sessionToken.slice(-8) 
        });
      } catch (error) {
        logger.error('Background session refresh failed', { error });
      }
    });
  }

  /**
   * Batch session validation for multiple tokens
   */
  async validateMultipleSessions(sessionTokens: string[]): Promise<Array<{
    token: string;
    valid: boolean;
    user?: any;
    session?: any;
  }>> {
    if (!this.config.parallelValidation) {
      // Sequential validation
      const results: Array<any> = [];
      for (const token of sessionTokens) {
        const result = await this.validateSession(token);
        results.push({ token, ...result });
      }
      return results;
    }

    // Parallel validation
    const validationPromises = sessionTokens.map(async (token) => {
      const result = await this.validateSession(token);
      return { token, ...result };
    });

    return Promise.all(validationPromises);
  }

  /**
   * Check if token is a JWT
   */
  private isJWT(token: string): boolean {
    return token.split('.').length === 3;
  }

  /**
   * Update performance statistics
   */
  private updateStats(type: 'success' | 'error', responseTime: number, fromCache: boolean): void {
    if (type === 'success') {
      if (fromCache) {
        this.stats.cacheHits++;
      } else {
        this.stats.cacheMisses++;
      }
    }

    // Update average response time
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Start cleanup interval for expired cache entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      // Trigger cache cleanup
      cache.cleanup?.();
      logger.debug('Session cache cleanup completed');
    }, this.config.sessionCleanupInterval * 1000);
  }

  /**
   * Get session optimization statistics
   */
  getStats(): SessionStats & {
    cacheHitRatio: number;
    dbQueryRatio: number;
  } {
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRatio = totalRequests > 0 ? this.stats.cacheHits / totalRequests : 0;
    const dbQueryRatio = totalRequests > 0 ? this.stats.databaseQueries / totalRequests : 0;

    return {
      ...this.stats,
      cacheHitRatio: Math.round(cacheHitRatio * 100) / 100,
      dbQueryRatio: Math.round(dbQueryRatio * 100) / 100
    };
  }

  /**
   * Invalidate session cache
   */
  async invalidateSession(sessionToken: string): Promise<void> {
    try {
      const sessionKey = CACHE_KEYS.SESSION(sessionToken);
      const cachedSession = await cache.get(sessionKey);
      
      if (cachedSession) {
        const userKey = CACHE_KEYS.USER(cachedSession.userId);
        const permissionsKey = CACHE_KEYS.PERMISSIONS(cachedSession.userId);
        
        await Promise.all([
          cache.delete(sessionKey),
          cache.delete(userKey),
          cache.delete(permissionsKey)
        ]);
      }
    } catch (error) {
      logger.error('Failed to invalidate session cache', { error });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create singleton instance
export const sessionOptimizer = new SessionOptimizer();

// Convenience functions
export async function validateOptimizedSession(
  sessionToken: string,
  options?: Parameters<SessionOptimizer['validateSession']>[1]
) {
  return sessionOptimizer.validateSession(sessionToken, options);
}

export async function invalidateSessionCache(sessionToken: string) {
  return sessionOptimizer.invalidateSession(sessionToken);
}

export function getSessionStats() {
  return sessionOptimizer.getStats();
}

// Rate limiting utilities
export class SessionRateLimiter {
  private config = {
    windowMs: 60000, // 1 minute
    maxRequests: 100, // per window
    keyGenerator: (identifier: string) => `rate_limit:session:${identifier}`
  };

  async checkRateLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    try {
      const key = this.config.keyGenerator(identifier);
      const current = await cache.get(key) || { count: 0, resetTime: Date.now() + this.config.windowMs };

      if (Date.now() > current.resetTime) {
        // Reset window
        current.count = 1;
        current.resetTime = Date.now() + this.config.windowMs;
      } else {
        current.count++;
      }

      await cache.set(key, current, Math.ceil(this.config.windowMs / 1000));

      return {
        allowed: current.count <= this.config.maxRequests,
        remaining: Math.max(0, this.config.maxRequests - current.count),
        resetTime: new Date(current.resetTime)
      };
    } catch (error) {
      logger.error('Rate limit check failed', { error });
      return { allowed: true, remaining: this.config.maxRequests, resetTime: new Date() };
    }
  }
}

export const sessionRateLimiter = new SessionRateLimiter(); 