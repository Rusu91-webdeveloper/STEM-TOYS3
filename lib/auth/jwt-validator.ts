/**
 * High-performance JWT validation utilities for STEM-TOYS2
 * Validates tokens without database calls for maximum speed
 */

import { logger } from "../logger";
import { cache } from "../cache";

// JWT validation configuration
export interface JWTConfig {
  enabled: boolean;
  secret: string;
  issuer?: string;
  audience?: string;
  algorithm: string;
  cacheResults: boolean;
  cacheTTL: number;
  allowedClockTolerance: number;
}

// JWT payload interface
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name?: string;
  role: string;
  permissions?: string[];
  iat: number; // Issued at
  exp: number; // Expires at
  iss?: string; // Issuer
  aud?: string; // Audience
  jti?: string; // JWT ID
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
  fromCache: boolean;
  responseTime: number;
}

// Default configuration
const defaultConfig: Partial<JWTConfig> = {
  enabled: true,
  algorithm: 'HS256',
  cacheResults: true,
  cacheTTL: 900, // 15 minutes
  allowedClockTolerance: 60 // 60 seconds
};

// High-performance JWT validator
export class JWTValidator {
  private config: JWTConfig;
  private stats = {
    validations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    averageTime: 0
  };

  constructor(config: Partial<JWTConfig>) {
    this.config = {
      ...defaultConfig,
      ...config,
      secret: config.secret || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ''
    } as JWTConfig;

    if (!this.config.secret) {
      logger.warn('JWT secret not configured - JWT validation disabled');
      this.config.enabled = false;
    }

    if (this.config.enabled) {
      logger.info('JWT validator initialized', {
        algorithm: this.config.algorithm,
        cacheEnabled: this.config.cacheResults,
        cacheTTL: this.config.cacheTTL
      });
    }
  }

  /**
   * Validate JWT token without database calls
   */
  async validateToken(token: string, options: {
    skipCache?: boolean;
    requireClaims?: string[];
  } = {}): Promise<ValidationResult> {
    const startTime = Date.now();
    this.stats.validations++;

    if (!this.config.enabled) {
      return {
        valid: false,
        error: 'JWT validation disabled',
        fromCache: false,
        responseTime: Date.now() - startTime
      };
    }

    try {
      // Check cache first (if enabled)
      if (this.config.cacheResults && !options.skipCache) {
        const cached = await this.getCachedResult(token);
        if (cached) {
          this.stats.cacheHits++;
          return {
            ...cached,
            responseTime: Date.now() - startTime
          };
        }
        this.stats.cacheMisses++;
      }

      // Validate token structure
      if (!this.isValidJWTStructure(token)) {
        const result: ValidationResult = {
          valid: false,
          error: 'Invalid JWT structure',
          fromCache: false,
          responseTime: Date.now() - startTime
        };
        return result;
      }

      // Parse and validate JWT
      const payload = await this.parseAndValidateJWT(token);
      
      // Additional claims validation
      if (options.requireClaims) {
        const missingClaims = this.validateRequiredClaims(payload, options.requireClaims);
        if (missingClaims.length > 0) {
          const result: ValidationResult = {
            valid: false,
            error: `Missing required claims: ${missingClaims.join(', ')}`,
            fromCache: false,
            responseTime: Date.now() - startTime
          };
          return result;
        }
      }

      const result: ValidationResult = {
        valid: true,
        payload,
        fromCache: false,
        responseTime: Date.now() - startTime
      };

      // Cache the result
      if (this.config.cacheResults) {
        await this.cacheResult(token, result);
      }

      this.updateStats(Date.now() - startTime);
      return result;

    } catch (error) {
      this.stats.errors++;
      const result: ValidationResult = {
        valid: false,
        error: (error as Error).message || 'JWT validation failed',
        fromCache: false,
        responseTime: Date.now() - startTime
      };

      logger.debug('JWT validation failed', { 
        error: (error as Error).message,
        token: token.slice(-8)
      });

      return result;
    }
  }

  /**
   * Parse and validate JWT without external libraries
   */
  private async parseAndValidateJWT(token: string): Promise<JWTPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header
    const header = JSON.parse(this.base64UrlDecode(headerB64));
    if (header.alg !== this.config.algorithm) {
      throw new Error(`Unsupported algorithm: ${header.alg}`);
    }

    // Decode payload
    const payload = JSON.parse(this.base64UrlDecode(payloadB64)) as JWTPayload;

    // Verify signature
    const expectedSignature = await this.generateSignature(headerB64 + '.' + payloadB64);
    if (signatureB64 !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Validate timestamps
    const now = Math.floor(Date.now() / 1000);
    const tolerance = this.config.allowedClockTolerance;

    if (payload.exp && payload.exp < (now - tolerance)) {
      throw new Error('Token expired');
    }

    if (payload.iat && payload.iat > (now + tolerance)) {
      throw new Error('Token issued in the future');
    }

    // Validate issuer if configured
    if (this.config.issuer && payload.iss !== this.config.issuer) {
      throw new Error('Invalid issuer');
    }

    // Validate audience if configured
    if (this.config.audience && payload.aud !== this.config.audience) {
      throw new Error('Invalid audience');
    }

    return payload;
  }

  /**
   * Generate HMAC signature for JWT
   */
  private async generateSignature(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.secret);
    const messageData = encoder.encode(data);

    // Use Web Crypto API if available (browser/modern Node.js)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      return this.base64UrlEncode(new Uint8Array(signature));
    }

    // Fallback for older environments
    const crypto_node = require('crypto');
    const hmac = crypto_node.createHmac('sha256', this.config.secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest());
  }

  /**
   * Check if token has valid JWT structure
   */
  private isValidJWTStructure(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Validate required claims
   */
  private validateRequiredClaims(payload: JWTPayload, requiredClaims: string[]): string[] {
    const missing: string[] = [];
    
    for (const claim of requiredClaims) {
      if (!(claim in payload) || payload[claim as keyof JWTPayload] === undefined) {
        missing.push(claim);
      }
    }
    
    return missing;
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = str.length % 4;
    if (padding) {
      str += '='.repeat(4 - padding);
    }
    
    if (typeof atob !== 'undefined') {
      return atob(str);
    }
    
    // Node.js fallback
    return Buffer.from(str, 'base64').toString('utf-8');
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(buffer: Uint8Array | Buffer): string {
    let base64: string;
    
    if (typeof btoa !== 'undefined') {
      base64 = btoa(String.fromCharCode(...buffer));
    } else {
      base64 = Buffer.from(buffer).toString('base64');
    }
    
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Cache validation result
   */
  private async cacheResult(token: string, result: ValidationResult): Promise<void> {
    try {
      const cacheKey = `jwt_validation:${token.slice(-8)}`;
      const cacheData = {
        valid: result.valid,
        payload: result.payload,
        error: result.error,
        fromCache: true,
        cachedAt: Date.now()
      };
      
      await cache.set(cacheKey, cacheData, this.config.cacheTTL);
    } catch (error) {
      logger.warn('Failed to cache JWT validation result', { error });
    }
  }

  /**
   * Get cached validation result
   */
  private async getCachedResult(token: string): Promise<Omit<ValidationResult, 'responseTime'> | null> {
    try {
      const cacheKey = `jwt_validation:${token.slice(-8)}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        // Check if cached result is still valid based on token expiry
        if (cached.payload?.exp) {
          const now = Math.floor(Date.now() / 1000);
          if (cached.payload.exp < now) {
            // Token expired, remove from cache
            await cache.delete(cacheKey);
            return null;
          }
        }
        
        return cached;
      }
      
      return null;
    } catch (error) {
      logger.warn('Failed to get cached JWT validation result', { error });
      return null;
    }
  }

  /**
   * Update performance statistics
   */
  private updateStats(responseTime: number): void {
    const totalValidations = this.stats.validations;
    this.stats.averageTime = 
      (this.stats.averageTime * (totalValidations - 1) + responseTime) / totalValidations;
  }

  /**
   * Extract user information from valid JWT
   */
  extractUserInfo(payload: JWTPayload): {
    id: string;
    email: string;
    name?: string;
    role: string;
    permissions: string[];
  } {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions || []
    };
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(payload: JWTPayload, permission: string): boolean {
    return payload.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(payload: JWTPayload, roles: string[]): boolean {
    return roles.includes(payload.role);
  }

  /**
   * Get validation statistics
   */
  getStats() {
    const cacheHitRatio = this.stats.validations > 0 
      ? this.stats.cacheHits / this.stats.validations 
      : 0;

    return {
      ...this.stats,
      cacheHitRatio: Math.round(cacheHitRatio * 100) / 100,
      enabled: this.config.enabled
    };
  }

  /**
   * Create a new JWT token (for testing/development)
   */
  async createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number = 3600): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      iss: this.config.issuer,
      aud: this.config.audience
    };

    const header = {
      alg: this.config.algorithm,
      typ: 'JWT'
    };

    const headerB64 = this.base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = this.base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
    const signature = await this.generateSignature(headerB64 + '.' + payloadB64);

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanup(): Promise<void> {
    // This would typically be handled by the cache implementation
    logger.debug('JWT cache cleanup completed');
  }
}

// Create default instance
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
export const jwtValidator = new JWTValidator({
  secret: jwtSecret || '',
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE
});

// Convenience functions
export async function validateJWT(token: string, options?: Parameters<JWTValidator['validateToken']>[1]) {
  return jwtValidator.validateToken(token, options);
}

export function extractUserFromJWT(payload: JWTPayload) {
  return jwtValidator.extractUserInfo(payload);
}

export function checkJWTPermission(payload: JWTPayload, permission: string) {
  return jwtValidator.hasPermission(payload, permission);
}

export function checkJWTRole(payload: JWTPayload, roles: string[]) {
  return jwtValidator.hasAnyRole(payload, roles);
}

export function getJWTStats() {
  return jwtValidator.getStats();
} 