import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { performanceMonitor } from "../../../../lib/monitoring/performance-monitor";
import {
  updateInventory,
  getInventoryItem,
  processOrder,
  reserveInventory,
} from "../../../../lib/realtime/inventory-tracker";
import { withRateLimiting } from "../../../../lib/security/rate-limiter";
import {
  withValidation,
  RequestValidator,
} from "../../../../lib/security/request-validator";
import { withSecurityHeaders } from "../../../../lib/security/security-middleware";

// Validation schemas
const inventoryUpdateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(1),
  operation: z.enum(["add", "subtract", "reserve", "release", "set"]),
  reason: z.string().min(1),
  orderId: z.string().optional(),
});

const orderProcessingSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(1),
  orderId: z.string().min(1),
});

const inventoryReservationSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(1),
  orderId: z.string().optional(),
});

const inventoryQuerySchema = z.object({
  productId: z.string().min(1),
});

// GET - Get inventory item
export const GET = withSecurityHeaders(
  withRateLimiting(
    withValidation(
      async (req: NextRequest, validatedData: { query?: { productId: string } }) => {
        try {
          const { productId } = validatedData.query || {};

          if (!productId) {
            return NextResponse.json(
              { error: "productId is required" },
              { status: 400 }
            );
          }

          const item = await getInventoryItem(productId);

          if (!item) {
            return NextResponse.json(
              { error: "Inventory item not found" },
              { status: 404 }
            );
          }

          // Record metric
          performanceMonitor.recordMetric({
            operation: "inventory_get_item",
            duration: 0,
            timestamp: Date.now(),
            success: true,
            metadata: {
              productId,
              found: true,
            },
          });

          return NextResponse.json({ success: true, item });
        } catch (error) {
          console.error("Inventory GET error:", error);
          return NextResponse.json(
            { error: "Failed to get inventory item" },
            { status: 500 }
          );
        }
      },
      {
        query: inventoryQuerySchema,
        maxQueryLength: 100,
        sanitizeInput: true,
        allowedMethods: ["GET"],
      }
    ),
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      message: "Too many inventory requests. Please slow down.",
    }
  )
);

// POST - Update inventory
export const POST = withSecurityHeaders(
  withRateLimiting(
    withValidation(
      async (req: NextRequest, validatedData: { body?: { productId: string; quantity: number; operation: "add" | "subtract" | "reserve" | "release" | "set"; reason: string; orderId?: string } }) => {
        try {
          const { productId, quantity, operation, reason, orderId } =
            validatedData.body || {};
          const userId = req.headers.get("x-user-id") ?? "system";

          if (!productId || !quantity || !operation || !reason) {
            return NextResponse.json(
              { error: "Missing required fields" },
              { status: 400 }
            );
          }

          const update = {
            productId,
            quantity,
            operation,
            reason,
            userId,
            orderId,
            timestamp: Date.now(),
          };

          const result = await updateInventory(update);

          if (!result) {
            return NextResponse.json(
              { error: "Failed to update inventory" },
              { status: 400 }
            );
          }

          // Record metric
          performanceMonitor.recordMetric({
            operation: "inventory_update",
            duration: 0,
            timestamp: Date.now(),
            success: true,
            metadata: {
              productId,
              operation,
              quantity,
            },
          });

          return NextResponse.json({
            success: true,
            message: "Inventory updated successfully",
            item: result,
          });
        } catch (error) {
          console.error("Inventory POST error:", error);
          return NextResponse.json(
            { error: "Failed to update inventory" },
            { status: 500 }
          );
        }
      },
      {
        body: inventoryUpdateSchema,
        maxBodySize: 1024, // 1KB
        sanitizeInput: true,
        allowedMethods: ["POST"],
      }
    ),
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 updates per minute
      message: "Too many inventory updates. Please slow down.",
    }
  )
);

// PUT - Process order (reserve and subtract inventory)
export const PUT = withSecurityHeaders(
  withRateLimiting(
    withValidation(
      async (req: NextRequest, validatedData: { body?: { productId: string; quantity: number; orderId: string } }) => {
        try {
          const { productId, quantity, orderId } = validatedData.body || {};
          const userId = req.headers.get("x-user-id") ?? "system";

          if (!productId || !quantity || !orderId) {
            return NextResponse.json(
              { error: "Missing required fields" },
              { status: 400 }
            );
          }

          // First reserve the inventory
          const reserved = await reserveInventory(
            productId,
            quantity,
            userId,
            orderId
          );

          if (!reserved) {
            return NextResponse.json(
              { error: "Failed to reserve inventory" },
              { status: 400 }
            );
          }

          // Then process the order (subtract from inventory)
          const processed = await processOrder(
            productId,
            quantity,
            userId,
            orderId
          );

          if (!processed) {
            return NextResponse.json(
              { error: "Failed to process order" },
              { status: 400 }
            );
          }

          // Get updated inventory item
          const item = await getInventoryItem(productId);

          // Record metric
          performanceMonitor.recordMetric({
            operation: "inventory_process_order",
            duration: 0,
            timestamp: Date.now(),
            success: true,
            metadata: {
              productId,
              quantity,
              orderId,
            },
          });

          return NextResponse.json({
            success: true,
            message: "Order processed successfully",
            item,
          });
        } catch (error) {
          console.error("Inventory PUT error:", error);
          return NextResponse.json(
            { error: "Failed to process order" },
            { status: 500 }
          );
        }
      },
      {
        body: orderProcessingSchema,
        maxBodySize: 1024, // 1KB
        sanitizeInput: true,
        allowedMethods: ["PUT"],
      }
    ),
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 orders per minute
      message: "Too many order processing requests. Please slow down.",
    }
  )
);

// PATCH - Reserve inventory
export const PATCH = withSecurityHeaders(
  withRateLimiting(
    withValidation(
      async (req: NextRequest, validatedData: { body?: { productId: string; quantity: number; orderId?: string } }) => {
        try {
          const { productId, quantity, orderId } = validatedData.body || {};
          const userId = req.headers.get("x-user-id") ?? "system";

          if (!productId || !quantity) {
            return NextResponse.json(
              { error: "Missing required fields" },
              { status: 400 }
            );
          }

          const reserved = await reserveInventory(
            productId,
            quantity,
            userId,
            orderId
          );

          if (!reserved) {
            return NextResponse.json(
              { error: "Failed to reserve inventory" },
              { status: 400 }
            );
          }

          // Get updated inventory item
          const item = await getInventoryItem(productId);

          // Record metric
          performanceMonitor.recordMetric({
            operation: "inventory_reserve",
            duration: 0,
            timestamp: Date.now(),
            success: true,
            metadata: {
              productId,
              quantity,
              orderId,
            },
          });

          return NextResponse.json({
            success: true,
            message: "Inventory reserved successfully",
            item,
          });
        } catch (error) {
          console.error("Inventory PATCH error:", error);
          return NextResponse.json(
            { error: "Failed to reserve inventory" },
            { status: 500 }
          );
        }
      },
      {
        body: inventoryReservationSchema,
        maxBodySize: 1024, // 1KB
        sanitizeInput: true,
        allowedMethods: ["PATCH"],
      }
    ),
    {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 15, // 15 reservations per minute
      message: "Too many inventory reservation requests. Please slow down.",
    }
  )
);
