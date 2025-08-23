import { NextRequest, NextResponse } from "next/server";
import { loadBalancer, addServer, removeServer, updateHealthCheck, getServerStats, setAutoScaling } from "../../../../lib/optimization/load-balancer";
import { withRateLimiting } from "../../../../lib/security/rate-limiter";
import { withSecurityHeaders } from "../../../../lib/security/security-middleware";

// GET - Get load balancer configuration and statistics
export const GET = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const serverId = searchParams.get("serverId");

        switch (action) {
          case "config":
            return NextResponse.json({
              success: true,
              config: loadBalancer.getConfig(),
            });

          case "stats":
            return NextResponse.json({
              success: true,
              stats: loadBalancer.getStats(),
            });

          case "servers":
            return NextResponse.json({
              success: true,
              servers: loadBalancer.getServers(),
            });

          case "server":
            if (!serverId) {
              return NextResponse.json(
                { error: "Server ID is required" },
                { status: 400 }
              );
            }

            const serverStats = await getServerStats(serverId);
            return NextResponse.json({
              success: true,
              server: serverStats,
            });

          case "health":
            const healthStatus = await loadBalancer.checkHealth();
            return NextResponse.json({
              success: true,
              health: healthStatus,
            });

          case "auto-scaling":
            const autoScalingStatus = loadBalancer.getAutoScalingStatus();
            return NextResponse.json({
              success: true,
              autoScaling: autoScalingStatus,
            });

          default:
            return NextResponse.json({
              success: true,
              config: loadBalancer.getConfig(),
              stats: loadBalancer.getStats(),
              servers: loadBalancer.getServers(),
            });
        }
      } catch (error) {
        console.error("Load balancer API error:", error);
        return NextResponse.json(
          { error: "Failed to process load balancer request" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: "Too many load balancer requests. Please slow down.",
    }
  )
);

// POST - Add servers and configure load balancer
export const POST = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action, servers, config } = body;

        switch (action) {
          case "add-servers":
            if (!servers || !Array.isArray(servers)) {
              return NextResponse.json(
                { error: "Servers array is required" },
                { status: 400 }
              );
            }

            const addedServers = await Promise.allSettled(
              servers.map(async (server) => {
                const added = await addServer(server);
                return {
                  server: server.id ?? server.url,
                  added,
                };
              })
            );

            return NextResponse.json({
              success: true,
              results: addedServers.map((result, index) => ({
                ...result,
                server: servers[index].id ?? servers[index].url,
              })),
            });

          case "update-config":
            if (!config) {
              return NextResponse.json(
                { error: "Configuration is required" },
                { status: 400 }
              );
            }

            loadBalancer.updateConfig(config);

            return NextResponse.json({
              success: true,
              message: "Load balancer configuration updated",
              config: loadBalancer.getConfig(),
            });

          case "set-algorithm":
            const { algorithm, options } = body;
            if (!algorithm) {
              return NextResponse.json(
                { error: "Algorithm is required" },
                { status: 400 }
              );
            }

            loadBalancer.setAlgorithm(algorithm, options);

            return NextResponse.json({
              success: true,
              message: `Load balancing algorithm set to ${algorithm}`,
            });

          case "enable-sticky-sessions":
            const { stickyConfig } = body;
            loadBalancer.enableStickySessions(stickyConfig);

            return NextResponse.json({
              success: true,
              message: "Sticky sessions enabled",
            });

          case "configure-auto-scaling":
            const { autoScalingConfig } = body;
            if (!autoScalingConfig) {
              return NextResponse.json(
                { error: "Auto-scaling configuration is required" },
                { status: 400 }
              );
            }

            await setAutoScaling(autoScalingConfig);

            return NextResponse.json({
              success: true,
              message: "Auto-scaling configured",
            });

          default:
            return NextResponse.json(
              { error: "Invalid action" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Load balancer configuration error:", error);
        return NextResponse.json(
          { error: "Failed to configure load balancer" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
      message: "Too many load balancer configurations. Please slow down.",
    }
  )
);

// PUT - Update server health checks and configuration
export const PUT = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action, serverId, healthCheck, weight } = body;

        switch (action) {
          case "update-health-check":
            if (!serverId || !healthCheck) {
              return NextResponse.json(
                { error: "Server ID and health check configuration are required" },
                { status: 400 }
              );
            }

            await updateHealthCheck(serverId, healthCheck);

            return NextResponse.json({
              success: true,
              message: `Health check updated for server ${serverId}`,
            });

          case "set-server-weight":
            if (!serverId || weight === undefined) {
              return NextResponse.json(
                { error: "Server ID and weight are required" },
                { status: 400 }
              );
            }

            loadBalancer.setServerWeight(serverId, weight);

            return NextResponse.json({
              success: true,
              message: `Weight set to ${weight} for server ${serverId}`,
            });

          case "enable-server":
            if (!serverId) {
              return NextResponse.json(
                { error: "Server ID is required" },
                { status: 400 }
              );
            }

            loadBalancer.enableServer(serverId);

            return NextResponse.json({
              success: true,
              message: `Server ${serverId} enabled`,
            });

          case "disable-server":
            if (!serverId) {
              return NextResponse.json(
                { error: "Server ID is required" },
                { status: 400 }
              );
            }

            loadBalancer.disableServer(serverId);

            return NextResponse.json({
              success: true,
              message: `Server ${serverId} disabled`,
            });

          case "scale-up":
            const { count = 1 } = body;
            const scaledUp = await loadBalancer.scaleUp(count);

            return NextResponse.json({
              success: true,
              message: `Scaled up ${scaledUp} servers`,
              scaledUp,
            });

          case "scale-down":
            const { count: scaleDownCount = 1 } = body;
            const scaledDown = await loadBalancer.scaleDown(scaleDownCount);

            return NextResponse.json({
              success: true,
              message: `Scaled down ${scaledDown} servers`,
              scaledDown,
            });

          default:
            return NextResponse.json(
              { error: "Invalid action" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Load balancer update error:", error);
        return NextResponse.json(
          { error: "Failed to update load balancer" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      message: "Too many load balancer updates. Please slow down.",
    }
  )
);

// DELETE - Remove servers and clear load balancer
export const DELETE = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "server";
        const serverId = searchParams.get("serverId");

        switch (type) {
          case "server":
            if (!serverId) {
              return NextResponse.json(
                { error: "Server ID is required" },
                { status: 400 }
              );
            }

            await removeServer(serverId);

            return NextResponse.json({
              success: true,
              message: `Server ${serverId} removed`,
            });

          case "all-servers":
            const removedCount = await loadBalancer.removeAllServers();

            return NextResponse.json({
              success: true,
              message: `Removed ${removedCount} servers`,
              removedCount,
            });

          case "auto-scaling":
            loadBalancer.disableAutoScaling();

            return NextResponse.json({
              success: true,
              message: "Auto-scaling disabled",
            });

          case "sticky-sessions":
            loadBalancer.disableStickySessions();

            return NextResponse.json({
              success: true,
              message: "Sticky sessions disabled",
            });

          default:
            return NextResponse.json(
              { error: "Invalid delete type" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Load balancer delete error:", error);
        return NextResponse.json(
          { error: "Failed to remove from load balancer" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      message: "Too many load balancer deletions. Please slow down.",
    }
  )
);
