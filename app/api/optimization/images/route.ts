import { NextRequest, NextResponse } from "next/server";
import {
  imageOptimizer,
  optimizeImage,
  generateResponsiveImage,
  preloadImages,
  getImageMetadata,
} from "../../../../lib/optimization/image-optimizer";
import { withRateLimiting } from "../../../../lib/security/rate-limiter";
import { withSecurityHeaders } from "../../../../lib/security/security-middleware";

// GET - Get image optimization configuration and statistics
export const GET = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");
        const src = searchParams.get("src");

        switch (action) {
          case "config":
            return NextResponse.json({
              success: true,
              config: imageOptimizer.getConfig(),
            });

          case "stats":
            return NextResponse.json({
              success: true,
              stats: imageOptimizer.getOptimizationStats(),
            });

          case "metadata":
            if (!src) {
              return NextResponse.json(
                { error: "Image source is required" },
                { status: 400 }
              );
            }

            const metadata = await getImageMetadata(src);
            return NextResponse.json({
              success: true,
              metadata,
            });

          case "optimize":
            if (!src) {
              return NextResponse.json(
                { error: "Image source is required" },
                { status: 400 }
              );
            }

            const options = {
              width: searchParams.get("width")
                ? parseInt(searchParams.get("width")!)
                : undefined,
              height: searchParams.get("height")
                ? parseInt(searchParams.get("height")!)
                : undefined,
              quality: searchParams.get("quality")
                ? parseInt(searchParams.get("quality")!)
                : undefined,
              format: searchParams.get("format") ?? undefined,
              lazy: searchParams.get("lazy") === "true",
              priority: searchParams.get("priority") === "true",
            };

            const optimized = await optimizeImage(src, options);
            return NextResponse.json({
              success: true,
              optimized,
            });

          case "responsive":
            if (!src) {
              return NextResponse.json(
                { error: "Image source is required" },
                { status: 400 }
              );
            }

            const responsiveOptions = {
              aspectRatio: searchParams.get("aspectRatio")
                ? parseFloat(searchParams.get("aspectRatio")!)
                : undefined,
              maxWidth: searchParams.get("maxWidth")
                ? parseInt(searchParams.get("maxWidth")!)
                : undefined,
              lazy: searchParams.get("lazy") !== "false",
              priority: searchParams.get("priority") === "true",
            };

            const responsive = await generateResponsiveImage(
              src,
              responsiveOptions
            );
            return NextResponse.json({
              success: true,
              responsive,
            });

          default:
            return NextResponse.json({
              success: true,
              config: imageOptimizer.getConfig(),
              stats: imageOptimizer.getOptimizationStats(),
            });
        }
      } catch (error) {
        console.error("Image optimization API error:", error);
        return NextResponse.json(
          { error: "Failed to process image optimization request" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50, // 50 requests per minute
      message: "Too many image optimization requests. Please slow down.",
    }
  )
);

// POST - Batch image optimization
export const POST = withSecurityHeaders(
  withRateLimiting(
    async (req: NextRequest) => {
      try {
        const body = await req.json();
        const { action, images, options } = body;

        switch (action) {
          case "optimize":
            if (!images || !Array.isArray(images)) {
              return NextResponse.json(
                { error: "Images array is required" },
                { status: 400 }
              );
            }

            const optimizedResults = await Promise.allSettled(
              images.map(async image => {
                const optimized = await optimizeImage(image.src, {
                  ...options,
                  ...(image.options ?? {}),
                });
                return {
                  original: image.src,
                  optimized,
                };
              })
            );

            return NextResponse.json({
              success: true,
              results: optimizedResults.map((result, index) => ({
                ...result,
                original: images[index].src,
              })),
            });

          case "responsive":
            if (!images || !Array.isArray(images)) {
              return NextResponse.json(
                { error: "Images array is required" },
                { status: 400 }
              );
            }

            const responsiveResults = await Promise.allSettled(
              images.map(async image => {
                const responsive = await generateResponsiveImage(image.src, {
                  ...options,
                  ...(image.options ?? {}),
                });
                return {
                  original: image.src,
                  responsive,
                };
              })
            );

            return NextResponse.json({
              success: true,
              results: responsiveResults.map((result, index) => ({
                ...result,
                original: images[index].src,
              })),
            });

          case "preload":
            if (!images || !Array.isArray(images)) {
              return NextResponse.json(
                { error: "Images array is required" },
                { status: 400 }
              );
            }

            await preloadImages(images.map(img => img.src ?? img));

            return NextResponse.json({
              success: true,
              message: `Preloaded ${images.length} images`,
            });

          case "metadata":
            if (!images || !Array.isArray(images)) {
              return NextResponse.json(
                { error: "Images array is required" },
                { status: 400 }
              );
            }

            const metadataResults = await Promise.allSettled(
              images.map(async image => {
                const metadata = await getImageMetadata(image.src ?? image);
                return {
                  src: image.src ?? image,
                  metadata,
                };
              })
            );

            return NextResponse.json({
              success: true,
              results: metadataResults.map((result, index) => ({
                ...result,
                src: images[index].src || images[index],
              })),
            });

          default:
            return NextResponse.json(
              { error: "Invalid action" },
              { status: 400 }
            );
        }
      } catch (error) {
        console.error("Batch image optimization error:", error);
        return NextResponse.json(
          { error: "Failed to process batch image optimization" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
      message: "Too many batch optimization requests. Please slow down.",
    }
  )
);

// PUT - Update image optimization configuration
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

        imageOptimizer.updateConfig(config);

        return NextResponse.json({
          success: true,
          message: "Image optimization configuration updated",
          config: imageOptimizer.getConfig(),
        });
      } catch (error) {
        console.error("Image optimization config update error:", error);
        return NextResponse.json(
          { error: "Failed to update image optimization configuration" },
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

// DELETE - Clear image optimization cache
export const DELETE = withSecurityHeaders(
  withRateLimiting(
    (req: NextRequest) => {
      try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") ?? "all";

        switch (type) {
          case "all":
            imageOptimizer.clearCache();
            break;
          case "metadata":
            // Clear metadata cache only
            break;
          default:
            return NextResponse.json(
              { error: "Invalid cache type" },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          message: `Cleared ${type} image optimization cache`,
        });
      } catch (error) {
        console.error("Image optimization cache clear error:", error);
        return NextResponse.json(
          { error: "Failed to clear image optimization cache" },
          { status: 500 }
        );
      }
    },
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3, // 3 requests per minute
      message: "Too many cache clear requests. Please slow down.",
    }
  )
);
