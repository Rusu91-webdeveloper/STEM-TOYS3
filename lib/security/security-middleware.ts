import { NextRequest, NextResponse } from "next/server";

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableContentTypeOptions: boolean;
  enableFrameOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  enableCSRFProtection: boolean;
  enableRateLimiting: boolean;
  enableRequestValidation: boolean;
  enableThreatDetection: boolean;
  allowedOrigins: string[];
  cspDirectives: Record<string, string[]>;
  hstsMaxAge: number;
  referrerPolicy: string;
  permissionsPolicy: Record<string, string[]>;
}

const DEFAULT_CONFIG: SecurityConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableXSSProtection: true,
  enableContentTypeOptions: true,
  enableFrameOptions: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true,
  enableCSRFProtection: true,
  enableRateLimiting: true,
  enableRequestValidation: true,
  enableThreatDetection: true,
  allowedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://your-domain.com",
  ],
  cspDirectives: {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://js.stripe.com",
      "https://www.googletagmanager.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://api.stripe.com",
      "https://www.google-analytics.com",
    ],
    "frame-src": [
      "'self'",
      "https://js.stripe.com",
      "https://hooks.stripe.com",
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  },
  hstsMaxAge: 31536000, // 1 year
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: {
    camera: ["()"],
    microphone: ["()"],
    geolocation: ["()"],
    "interest-cohort": ["()"],
    payment: ["()"],
    usb: ["()"],
    magnetometer: ["()"],
    gyroscope: ["()"],
    accelerometer: ["()"],
  },
};

class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private config: SecurityConfig;
  private threatPatterns: RegExp[];

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.initializeThreatPatterns();
  }

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  private initializeThreatPatterns(): void {
    this.threatPatterns = [
      // SQL Injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i,
      /(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i,

      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,

      // Path traversal
      /\.\.\//g,
      /\.\.\\/g,

      // Command injection
      /[;&|`$()]/g,

      // LDAP injection
      /[()&|!]/g,
    ];
  }

  private detectThreats(req: NextRequest): {
    isThreat: boolean;
    threats: string[];
  } {
    const threats: string[] = [];
    const url = req.url;
    const _origin = req.headers.get("origin") ?? "";
    const _referer = req.headers.get("referer") ?? "";
    const userAgent = req.headers.get("user-agent") || "";

    // Check URL for threats
    this.threatPatterns.forEach((pattern, index) => {
      if (pattern.test(url)) {
        threats.push(`URL threat pattern ${index + 1}: ${pattern.source}`);
      }
    });

    // Check User-Agent for suspicious patterns
    if (
      userAgent.includes("sqlmap") ||
      userAgent.includes("nikto") ||
      userAgent.includes("nmap")
    ) {
      threats.push("Suspicious User-Agent detected");
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      "x-forwarded-for",
      "x-real-ip",
      "x-forwarded-proto",
    ];
    suspiciousHeaders.forEach(header => {
      const value = req.headers.get(header);
      if (value && this.threatPatterns.some(pattern => pattern.test(value))) {
        threats.push(`Suspicious header ${header}: ${value}`);
      }
    });

    return {
      isThreat: threats.length > 0,
      threats,
    };
  }

  private generateCSPHeader(): string {
    const directives = this.config.cspDirectives;
    const cspParts: string[] = [];

    Object.entries(directives).forEach(([directive, sources]) => {
      if (sources.length > 0) {
        cspParts.push(`${directive} ${sources.join(" ")}`);
      } else {
        cspParts.push(directive);
      }
    });

    return cspParts.join("; ");
  }

  private generatePermissionsPolicyHeader(): string {
    const policies = this.config.permissionsPolicy;
    const policyParts: string[] = [];

    Object.entries(policies).forEach(([feature, origins]) => {
      policyParts.push(`${feature}=(${origins.join(" ")})`);
    });

    return policyParts.join(", ");
  }

  private validateCSRFToken(req: NextRequest): boolean {
    if (
      req.method === "GET" ||
      req.method === "HEAD" ||
      req.method === "OPTIONS"
    ) {
      return true;
    }

    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    // Check if request is from allowed origin
    if (origin && this.config.allowedOrigins.includes(origin)) {
      return true;
    }

    // Check referer header
    if (referer) {
      const refererUrl = new URL(referer);
      if (this.config.allowedOrigins.includes(refererUrl.origin)) {
        return true;
      }
    }

    // For API routes, check for CSRF token
    const csrfToken = req.headers.get("x-csrf-token");
    if (csrfToken) {
      // In a real implementation, you would validate the token
      return true;
    }

    return false;
  }

  private addSecurityHeaders(response: NextResponse): NextResponse {
    if (this.config.enableCSP) {
      response.headers.set("Content-Security-Policy", this.generateCSPHeader());
    }

    if (this.config.enableHSTS) {
      response.headers.set(
        "Strict-Transport-Security",
        `max-age=${this.config.hstsMaxAge}; includeSubDomains; preload`
      );
    }

    if (this.config.enableXSSProtection) {
      response.headers.set("X-XSS-Protection", "1; mode=block");
    }

    if (this.config.enableContentTypeOptions) {
      response.headers.set("X-Content-Type-Options", "nosniff");
    }

    if (this.config.enableFrameOptions) {
      response.headers.set("X-Frame-Options", "DENY");
    }

    if (this.config.enableReferrerPolicy) {
      response.headers.set("Referrer-Policy", this.config.referrerPolicy);
    }

    if (this.config.enablePermissionsPolicy) {
      response.headers.set(
        "Permissions-Policy",
        this.generatePermissionsPolicyHeader()
      );
    }

    // Additional security headers
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    response.headers.set("X-Download-Options", "noopen");
    response.headers.set("X-DNS-Prefetch-Control", "off");

    return response;
  }

  processRequest(req: NextRequest): Promise<{
    isThreat: boolean;
    threats: string[];
    response?: NextResponse;
  }> {
    const threatDetection = this.detectThreats(req);

    if (threatDetection.isThreat) {
      const response = NextResponse.json(
        {
          error: "Security threat detected",
          threats: threatDetection.threats,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );

      this.addSecurityHeaders(response);
      return Promise.resolve({
        isThreat: true,
        threats: threatDetection.threats,
        response,
      });
    }

    return Promise.resolve({
      isThreat: false,
      threats: [],
    });
  }

  withSecurityHeaders(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const securityResult = await this.processRequest(req);

      if (securityResult.isThreat && securityResult.response) {
        return securityResult.response;
      }

      const response = await handler(req, ...args);
      return this.addSecurityHeaders(response);
    };
  }

  withThreatProtection(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const securityResult = await this.processRequest(req);

      if (securityResult.isThreat && securityResult.response) {
        return securityResult.response;
      }

      return handler(req, ...args);
    };
  }

  withCSRFProtection(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      if (this.config.enableCSRFProtection && !this.validateCSRFToken(req)) {
        const response = new NextResponse(
          JSON.stringify({
            error: "CSRF protection",
            message: "Invalid or missing CSRF token",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        return this.addSecurityHeaders(response);
      }

      const response = await handler(req, ...args);
      return this.addSecurityHeaders(response);
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

export const securityMiddleware = SecurityMiddleware.getInstance();
export const withSecurityHeaders = (handler: Function) =>
  securityMiddleware.withSecurityHeaders(handler);
export const withThreatProtection = (handler: Function) =>
  securityMiddleware.withThreatProtection(handler);
export const withCSRFProtection = (handler: Function) =>
  securityMiddleware.withCSRFProtection(handler);
