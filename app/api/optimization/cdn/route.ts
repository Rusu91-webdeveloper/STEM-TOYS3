import { NextRequest, NextResponse } from "next/server";
import { cdnManager, optimizeAsset, generateAssetUrl, preloadAssets, invalidateCache } from "../../../../lib/optimization/cdn-manager";
import { withRateLimiting } from "../../../../lib/security/rate-limiter";
import { withSecurityHeaders } from "../../../../lib/security/security-middleware";

// GET - Get CDN configuration and statistics
export const GET = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const path = searchParams.get("path");

        switch (action) {
          case "config":
            return NextResponse.json({
              success: true,
              config: cdnManager.getConfig(),
            });

          case "stats":
            return NextResponse.json({
              success: true,
              stats: cdnManager.getStats(),
            });

          case "url":
            if (!path) {
              return NextResponse.json(
                { error: "Asset path is required" },
                { status: 400 }
              );
            }

            const options = {
              width: searchParams.get("width") ? parseInt(searchParams.get("width")!) : undefined,
              height: searchParams.get("height") ? parseInt(searchParams.get("height")!) : undefined,
              quality: searchParams.get("quality") ? parseInt(searchParams.get("quality")!) : undefined,
              format: searchParams.get("format") || undefined,
              optimize: searchParams.get("optimize") !== "false",
            };

            const url = generateAssetUrl(path, options);
            return NextResponse.json({
              success: true,
              url,
            });

          case "optimize":
            if (!path) {
              return NextResponse.json(
                { error: "Asset path is required" },
                { status: 400 }
              );
            }

            const optimizeOptions = {
              width: searchParams.get("width") ? parseInt(searchParams.get("width")!) : undefined,
              height: searchParams.get("height") ? parseInt(searchParams.get("height")!) : undefined,
              quality: searchParams.get("quality") ? parseInt(searchParams.get("quality")!) : undefined,
              format: searchParams.get("format") || undefined,
              compress: searchParams.get("compress") !== "false",
            };

            const optimized = await optimizeAsset(path, optimizeOptions);
            return NextResponse.json({
              success: true,
              optimized,
            });

          case "health":
            const health = await cdnManager.checkHealth();
            return NextResponse.json({
              success: true,
              health,
            });

          default:
            return NextResponse.json({
              success: true,
              config: cdnManager.getConfig(),
              stats: cdnManager.getStats(),
            });
        }
      } catch (error) {
        console.error("CDN API error:", error);
        return NextResponse.json(
          { error: "Failed to process CDN request" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: "Too many CDN requests. Please slow down.",
    }
  )
);

// POST - Batch asset operations
export const POST = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action, assets, options } = body;

        switch (action) {
          case "optimize":
            if (!assets || !Array.isArray(assets)) {
              return NextResponse.json(
                { error: "Assets array is required" },
                { status: 400 }
              );
            }

            const optimizedResults = await Promise.allSettled(
              assets.map(async (asset) => {
                const optimized = await optimizeAsset(asset.path, { ...options, ...asset.options });
                return {
                  original: asset.path,
                  optimized,
                };
              })
            );

            return NextResponse.json({
              success: true,
              results: optimizedResults.map((result, index) => ({
                ...result,
                original: assets[index].path,
              })),
            });

          case "preload":
            if (!assets || !Array.isArray(assets)) {
              return NextResponse.json(
                { error: "Assets array is required" },
                { status: 400 }
              );
            }

            await preloadAssets(assets.map(asset => asset.path || asset));

            return NextResponse.json({
              success: true,
              message: `Preloaded ${assets.length} assets`,
            });

          case "upload":
            if (!assets || !Array.isArray(assets)) {
              return NextResponse.json(
                { error: "Assets array is required" },
                { status: 400 }
              );
            }

            const uploadResults = await Promise.allSettled(
              assets.map(async (asset) => {
                const uploaded = await cdnManager.uploadAsset(asset.path, asset.data, asset.options);
                return {
                  original: asset.path,
                  uploaded,
                };
              })
            );

            return NextResponse.json({
              success: true,
              results: uploadResults.map((result, index) => ({
                ...result,
                original: assets[index].path,
              })),
            });

          case "sync":
            const syncResult = await cdnManager.syncAssets();
            return NextResponse.json({
              success: true,
              sync: syncResult,
            });

          default:
            return NextResponse.json(
              { error: "Invalid action" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Batch CDN operation error:", error);
        return NextResponse.json(
          { error: "Failed to process batch CDN operation" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      message: "Too many batch CDN operations. Please slow down.",
    }
  )
);

// PUT - Update CDN configuration
export const PUT = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { config } = body;

        if (!config) {
          return NextResponse.json(
            { error: "Configuration is required" },
            { status: 400 }
          );
        }

        cdnManager.updateConfig(config);

        return NextResponse.json({
          success: true,
          message: "CDN configuration updated",
          config: cdnManager.getConfig(),
        });
      } catch (error) {
        console.error("CDN config update error:", error);
        return NextResponse.json(
          { error: "Failed to update CDN configuration" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute
      message: "Too many configuration updates. Please slow down.",
    }
  )
);

// DELETE - Invalidate CDN cache
export const DELETE = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "all";
        const path = searchParams.get("path");

        switch (type) {
          case "all":
            await invalidateCache();
            break;
          case "path":
            if (!path) {
              return NextResponse.json(
                { error: "Path is required for path invalidation" },
                { status: 400 }
              );
            }
            await invalidateCache(path);
            break;
          case "pattern":
            const pattern = searchParams.get("pattern");
            if (!pattern) {
              return NextResponse.json(
                { error: "Pattern is required for pattern invalidation" },
                { status: 400 }
              );
            }
            await invalidateCache(pattern, "pattern");
            break;
          default:
            return NextResponse.json(
              { error: "Invalid invalidation type" },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          message: `Invalidated ${type} CDN cache`,
        });
      } catch (error) {
        console.error("CDN cache invalidation error:", error);
        return NextResponse.json(
          { error: "Failed to invalidate CDN cache" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      message: "Too many cache invalidation requests. Please slow down.",
    }
  )
);
