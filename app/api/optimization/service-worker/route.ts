import { NextRequest, NextResponse } from "next/server";
import { serviceWorkerManager, generateServiceWorker, updateCacheStrategy, clearOfflineCache, getOfflineStatus } from "../../../../lib/optimization/service-worker-manager";
import { withRateLimiting } from "../../../../lib/security/rate-limiter";
import { withSecurityHeaders } from "../../../../lib/security/security-middleware";

// GET - Get service worker configuration and status
export const GET = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");

        switch (action) {
          case "config":
            return NextResponse.json({
              success: true,
              config: serviceWorkerManager.getConfig(),
            });

          case "status":
            return NextResponse.json({
              success: true,
              status: serviceWorkerManager.getStatus(),
            });

          case "offline":
            const offlineStatus = await getOfflineStatus();
            return NextResponse.json({
              success: true,
              offline: offlineStatus,
            });

          case "cache":
            const cacheInfo = await serviceWorkerManager.getCacheInfo();
            return NextResponse.json({
              success: true,
              cache: cacheInfo,
            });

          case "generate":
            const swCode = await generateServiceWorker();
            return new NextResponse(swCode, {
              headers: {
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache",
              },
            });

          default:
            return NextResponse.json({
              success: true,
              config: serviceWorkerManager.getConfig(),
              status: serviceWorkerManager.getStatus(),
            });
        }
      } catch (error) {
        console.error("Service worker API error:", error);
        return NextResponse.json(
          { error: "Failed to process service worker request" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50, // 50 requests per minute
      message: "Too many service worker requests. Please slow down.",
    }
  )
);

// POST - Update service worker configuration and cache strategies
export const POST = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action, config, strategies } = body;

        switch (action) {
          case "update-config":
            if (!config) {
              return NextResponse.json(
                { error: "Configuration is required" },
                { status: 400 }
              );
            }

            serviceWorkerManager.updateConfig(config);
            await serviceWorkerManager.regenerateServiceWorker();

            return NextResponse.json({
              success: true,
              message: "Service worker configuration updated",
              config: serviceWorkerManager.getConfig(),
            });

          case "update-strategies":
            if (!strategies) {
              return NextResponse.json(
                { error: "Cache strategies are required" },
                { status: 400 }
              );
            }

            await updateCacheStrategy(strategies);

            return NextResponse.json({
              success: true,
              message: "Cache strategies updated",
            });

          case "precache":
            const { assets } = body;
            if (!assets || !Array.isArray(assets)) {
              return NextResponse.json(
                { error: "Assets array is required" },
                { status: 400 }
              );
            }

            await serviceWorkerManager.precacheAssets(assets);

            return NextResponse.json({
              success: true,
              message: `Precached ${assets.length} assets`,
            });

          case "background-sync":
            const { syncData } = body;
            if (!syncData) {
              return NextResponse.json(
                { error: "Sync data is required" },
                { status: 400 }
              );
            }

            await serviceWorkerManager.registerBackgroundSync(syncData);

            return NextResponse.json({
              success: true,
              message: "Background sync registered",
            });

          case "push-subscription":
            const { subscription } = body;
            if (!subscription) {
              return NextResponse.json(
                { error: "Push subscription is required" },
                { status: 400 }
              );
            }

            await serviceWorkerManager.registerPushSubscription(subscription);

            return NextResponse.json({
              success: true,
              message: "Push subscription registered",
            });

          default:
            return NextResponse.json(
              { error: "Invalid action" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Service worker update error:", error);
        return NextResponse.json(
          { error: "Failed to update service worker" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
      message: "Too many service worker updates. Please slow down.",
    }
  )
);

// PUT - Install or update service worker
export const PUT = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action } = body;

        switch (action) {
          case "install":
            await serviceWorkerManager.install();
            return NextResponse.json({
              success: true,
              message: "Service worker installed",
            });

          case "update":
            await serviceWorkerManager.update();
            return NextResponse.json({
              success: true,
              message: "Service worker updated",
            });

          case "activate":
            await serviceWorkerManager.activate();
            return NextResponse.json({
              success: true,
              message: "Service worker activated",
            });

          default:
            return NextResponse.json(
              { error: "Invalid action" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Service worker installation error:", error);
        return NextResponse.json(
          { error: "Failed to install/update service worker" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      message: "Too many service worker installations. Please slow down.",
    }
  )
);

// DELETE - Clear service worker cache and unregister
export const DELETE = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") ?? "all";

        switch (type) {
          case "all":
            await serviceWorkerManager.unregister();
            await clearOfflineCache();
            break;
          case "cache":
            await clearOfflineCache();
            break;
          case "service-worker":
            await serviceWorkerManager.unregister();
            break;
          default:
            return NextResponse.json(
              { error: "Invalid clear type" },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          message: `Cleared ${type} service worker data`,
        });
      } catch (error) {
        console.error("Service worker clear error:", error);
        return NextResponse.json(
          { error: "Failed to clear service worker data" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute
      message: "Too many service worker clear requests. Please slow down.",
    }
  )
);
