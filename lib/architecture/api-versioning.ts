import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export type ApiVersion = "v1" | "v2" | "v3";

export interface VersionedHandler {
  version: ApiVersion;
  handler: (
    request: NextRequest,
    context?: any
  ) => Promise<NextResponse> | NextResponse;
  deprecated?: boolean;
  deprecationDate?: Date;
  sunsetDate?: Date;
  description?: string;
}

export interface ApiVersionInfo {
  version: ApiVersion;
  status: "active" | "deprecated" | "sunset";
  deprecationDate?: Date;
  sunsetDate?: Date;
  description?: string;
  changes?: string[];
}

/**
 * API Version Manager
 * Handles version routing, deprecation warnings, and backward compatibility
 */
export class ApiVersionManager {
  private handlers = new Map<string, Map<ApiVersion, VersionedHandler>>();
  private defaultVersion: ApiVersion = "v1";
  private supportedVersions: Set<ApiVersion> = new Set(["v1", "v2", "v3"]);

  constructor(defaultVersion: ApiVersion = "v1") {
    this.defaultVersion = defaultVersion;
  }

  /**
   * Register a versioned handler
   */
  register(
    endpoint: string,
    version: ApiVersion,
    handler: VersionedHandler["handler"],
    options: Omit<VersionedHandler, "version" | "handler"> = {}
  ): this {
    if (!this.handlers.has(endpoint)) {
      this.handlers.set(endpoint, new Map());
    }

    const versionedHandler: VersionedHandler = {
      version,
      handler,
      ...options,
    };

    this.handlers.get(endpoint)!.set(version, versionedHandler);

    logger.debug("API handler registered", {
      endpoint,
      version,
      deprecated: options.deprecated,
      sunsetDate: options.sunsetDate,
    });

    return this;
  }

  /**
   * Handle a versioned API request
   */
  async handle(
    endpoint: string,
    request: NextRequest,
    context?: any
  ): Promise<NextResponse> {
    const requestedVersion = this.extractVersion(request);
    const endpointHandlers = this.handlers.get(endpoint);

    if (!endpointHandlers) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    // Find the appropriate handler
    const handler = this.findHandler(endpointHandlers, requestedVersion);
    if (!handler) {
      return NextResponse.json(
        {
          error: "API version not supported",
          supportedVersions: Array.from(this.supportedVersions),
          requestedVersion,
        },
        { status: 400 }
      );
    }

    // Check if version is sunset
    if (handler.sunsetDate && new Date() > handler.sunsetDate) {
      return NextResponse.json(
        {
          error: "API version has been sunset",
          version: handler.version,
          sunsetDate: handler.sunsetDate,
          upgradeInstructions: `Please upgrade to a supported API version`,
        },
        { status: 410 } // Gone
      );
    }

    // Create response
    let response: NextResponse;
    try {
      response = await handler.handler(request, context);
    } catch (error) {
      logger.error("Versioned API handler error", {
        endpoint,
        version: handler.version,
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Add version headers and deprecation warnings
    response = this.addVersionHeaders(response, handler, requestedVersion);

    // Log API usage
    this.logApiUsage(endpoint, handler.version, request);

    return response;
  }

  /**
   * Extract API version from request
   */
  private extractVersion(request: NextRequest): ApiVersion {
    // Check Accept header first (e.g., "application/vnd.api+json;version=2")
    const acceptHeader = request.headers.get("accept");
    if (acceptHeader) {
      const versionMatch = acceptHeader.match(/version=(\w+)/);
      if (versionMatch) {
        const version = `v${versionMatch[1]}` as ApiVersion;
        if (this.supportedVersions.has(version)) {
          return version;
        }
      }
    }

    // Check X-API-Version header
    const versionHeader = request.headers.get("x-api-version");
    if (versionHeader) {
      const version = versionHeader.startsWith("v")
        ? (versionHeader as ApiVersion)
        : (`v${versionHeader}` as ApiVersion);
      if (this.supportedVersions.has(version)) {
        return version;
      }
    }

    // Check query parameter
    const url = new URL(request.url);
    const versionParam = url.searchParams.get("version");
    if (versionParam) {
      const version = versionParam.startsWith("v")
        ? (versionParam as ApiVersion)
        : (`v${versionParam}` as ApiVersion);
      if (this.supportedVersions.has(version)) {
        return version;
      }
    }

    // Check URL path (e.g., /api/v2/products)
    const pathMatch = request.url.match(/\/api\/(v\d+)\//);
    if (pathMatch) {
      const version = pathMatch[1] as ApiVersion;
      if (this.supportedVersions.has(version)) {
        return version;
      }
    }

    return this.defaultVersion;
  }

  /**
   * Find the best handler for the requested version
   */
  private findHandler(
    handlers: Map<ApiVersion, VersionedHandler>,
    requestedVersion: ApiVersion
  ): VersionedHandler | null {
    // Try exact match first
    if (handlers.has(requestedVersion)) {
      return handlers.get(requestedVersion)!;
    }

    // Fall back to latest available version that's <= requested version
    const availableVersions = Array.from(handlers.keys()).sort().reverse();
    const requestedVersionNumber = parseInt(requestedVersion.replace("v", ""));

    for (const version of availableVersions) {
      const versionNumber = parseInt(version.replace("v", ""));
      if (versionNumber <= requestedVersionNumber) {
        return handlers.get(version)!;
      }
    }

    // Fall back to default version
    return handlers.get(this.defaultVersion) || null;
  }

  /**
   * Add version-related headers to response
   */
  private addVersionHeaders(
    response: NextResponse,
    handler: VersionedHandler,
    requestedVersion: ApiVersion
  ): NextResponse {
    // Add version header
    response.headers.set("X-API-Version", handler.version);

    // Add deprecation warning if applicable
    if (handler.deprecated) {
      response.headers.set("Deprecation", "true");

      if (handler.deprecationDate) {
        response.headers.set(
          "Deprecation-Date",
          handler.deprecationDate.toISOString()
        );
      }

      if (handler.sunsetDate) {
        response.headers.set("Sunset", handler.sunsetDate.toUTCString());
      }

      // Add warning header (RFC 7234)
      const warningMessage = `299 - "API version ${handler.version} is deprecated"`;
      response.headers.set("Warning", warningMessage);
    }

    // Add version mismatch warning if versions don't match
    if (requestedVersion !== handler.version) {
      const warningMessage = `299 - "Requested version ${requestedVersion} not available, using ${handler.version}"`;
      response.headers.set("Warning", warningMessage);
    }

    return response;
  }

  /**
   * Log API usage for analytics
   */
  private logApiUsage(
    endpoint: string,
    version: ApiVersion,
    request: NextRequest
  ): void {
    logger.info("API usage", {
      endpoint,
      version,
      method: request.method,
      userAgent: request.headers.get("user-agent"),
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get information about all API versions
   */
  getVersionInfo(): ApiVersionInfo[] {
    const versionInfo: Map<ApiVersion, ApiVersionInfo> = new Map();

    // Initialize with supported versions
    for (const version of this.supportedVersions) {
      versionInfo.set(version, {
        version,
        status: "active",
        changes: [],
      });
    }

    // Update with handler information
    for (const [endpoint, handlers] of this.handlers) {
      for (const [version, handler] of handlers) {
        const info = versionInfo.get(version);
        if (info) {
          if (handler.deprecated) {
            info.status = "deprecated";
            info.deprecationDate = handler.deprecationDate;
            info.sunsetDate = handler.sunsetDate;
          }

          if (handler.sunsetDate && new Date() > handler.sunsetDate) {
            info.status = "sunset";
          }

          if (handler.description) {
            info.description = handler.description;
          }
        }
      }
    }

    return Array.from(versionInfo.values()).sort((a, b) =>
      a.version.localeCompare(b.version)
    );
  }

  /**
   * Mark a version as deprecated
   */
  deprecateVersion(
    endpoint: string,
    version: ApiVersion,
    deprecationDate: Date,
    sunsetDate?: Date
  ): void {
    const endpointHandlers = this.handlers.get(endpoint);
    if (endpointHandlers && endpointHandlers.has(version)) {
      const handler = endpointHandlers.get(version)!;
      handler.deprecated = true;
      handler.deprecationDate = deprecationDate;
      if (sunsetDate) {
        handler.sunsetDate = sunsetDate;
      }

      logger.info("API version deprecated", {
        endpoint,
        version,
        deprecationDate,
        sunsetDate,
      });
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Record<string, any> {
    return {
      totalEndpoints: this.handlers.size,
      supportedVersions: Array.from(this.supportedVersions),
      defaultVersion: this.defaultVersion,
      endpointVersions: Array.from(this.handlers.entries()).map(
        ([endpoint, handlers]) => ({
          endpoint,
          versions: Array.from(handlers.keys()),
          deprecated: Array.from(handlers.values())
            .filter(h => h.deprecated)
            .map(h => h.version),
        })
      ),
    };
  }
}

/**
 * Global API version manager instance
 */
export const apiVersionManager = new ApiVersionManager("v1");

/**
 * Helper function to create versioned API route handlers
 */
export function createVersionedHandler(
  endpoint: string,
  handlers: Partial<Record<ApiVersion, VersionedHandler["handler"]>>,
  options: Partial<
    Record<ApiVersion, Omit<VersionedHandler, "version" | "handler">>
  > = {}
) {
  // Register all handlers
  for (const [version, handler] of Object.entries(handlers)) {
    if (handler) {
      apiVersionManager.register(
        endpoint,
        version as ApiVersion,
        handler,
        options[version as ApiVersion] || {}
      );
    }
  }

  // Return unified handler
  return async (request: NextRequest, context?: any) => {
    return apiVersionManager.handle(endpoint, request, context);
  };
}

/**
 * Migration helper for API version transitions
 */
export class ApiMigrationHelper {
  /**
   * Create a migration wrapper that transforms data between versions
   */
  static createMigration<TFrom, TTo>(
    fromVersion: ApiVersion,
    toVersion: ApiVersion,
    transformer: (data: TFrom) => TTo
  ) {
    return {
      fromVersion,
      toVersion,
      transform: transformer,
    };
  }

  /**
   * Apply migrations to data
   */
  static applyMigrations<T>(
    data: T,
    fromVersion: ApiVersion,
    toVersion: ApiVersion,
    migrations: ReturnType<typeof ApiMigrationHelper.createMigration>[]
  ): T {
    let currentData = data;
    let currentVersion = fromVersion;

    // Find and apply migration chain
    while (currentVersion !== toVersion) {
      const migration = migrations.find(m => m.fromVersion === currentVersion);
      if (!migration) {
        throw new Error(
          `No migration path found from ${currentVersion} to ${toVersion}`
        );
      }

      currentData = migration.transform(currentData) as T;
      currentVersion = migration.toVersion;
    }

    return currentData;
  }
}
