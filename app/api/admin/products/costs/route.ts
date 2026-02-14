import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { invalidateCachePattern } from "@/lib/cache";
import {
  validateCostUpdateRequest,
  validateUnitEconomicsRequest,
} from "@/lib/validations/unit-economics";

export const PUT = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const body = await request.json();
      const validatedRequest = validateCostUpdateRequest(body);

      // Check if product exists
      const existingProduct = await db.product.findUnique({
        where: { id: validatedRequest.productId },
        select: { id: true, name: true },
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Update product costs
      const updatedProduct = await db.product.update({
        where: { id: validatedRequest.productId },
        data: {
          ...validatedRequest.costs,
        },
        select: {
          id: true,
          name: true,
          costPrice: true,
          importDuties: true,
          shippingCost: true,
          storageCost: true,
          packagingCost: true,
          laborCost: true,
          qualityControlCost: true,
          paymentProcessingFee: true,
          customerServiceCost: true,
          operationalOverhead: true,
          updatedAt: true,
        },
      });

      // Update marketing costs if provided
      if (validatedRequest.marketingCosts) {
        const today = new Date();
        const existing = await db.marketingCost.findFirst({
          where: {
            productId: validatedRequest.productId,
            date: today,
          },
        });
        const totalCost =
          (validatedRequest.marketingCosts.googleAdsCost || 0) +
          (validatedRequest.marketingCosts.facebookAdsCost || 0) +
          (validatedRequest.marketingCosts.seoCost || 0) +
          (validatedRequest.marketingCosts.influencerCost || 0);

        if (existing) {
          await db.marketingCost.update({
            where: { id: existing.id },
            data: {
              ...validatedRequest.marketingCosts,
              totalMarketingCost: totalCost,
            },
          });
        } else {
          await db.marketingCost.create({
            data: {
              productId: validatedRequest.productId,
              date: today,
              googleAdsCost: validatedRequest.marketingCosts.googleAdsCost || 0,
              facebookAdsCost: validatedRequest.marketingCosts.facebookAdsCost || 0,
              seoCost: validatedRequest.marketingCosts.seoCost || 0,
              influencerCost: validatedRequest.marketingCosts.influencerCost || 0,
              totalMarketingCost: totalCost,
              notes: validatedRequest.marketingCosts.notes,
            },
          });
        }
      }

      // Invalidate relevant caches
      await invalidateCachePattern(
        `unit-economics:*${validatedRequest.productId}*`
      );
      await invalidateCachePattern("unit-economics:*");

      return NextResponse.json({
        success: true,
        message: "Product costs updated successfully",
        data: updatedProduct,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating product costs:", error);

      // Handle validation errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Invalid request parameters")) {
        return NextResponse.json(
          {
            error: "Invalid request parameters",
            details: error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update product costs" },
        { status: 500 }
      );
    }
  },
  { limit: 30, windowMs: 10 * 60 * 1000 } // Rate limiting for cost updates
);

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const searchParams = request.nextUrl.searchParams;
      const productId = searchParams.get("productId");

      if (!productId) {
        return NextResponse.json(
          { error: "Product ID is required" },
          { status: 400 }
        );
      }

      // Get product with cost data
      const product = await db.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          costPrice: true,
          importDuties: true,
          shippingCost: true,
          storageCost: true,
          packagingCost: true,
          laborCost: true,
          qualityControlCost: true,
          paymentProcessingFee: true,
          customerServiceCost: true,
          operationalOverhead: true,
          marketingCosts: {
            orderBy: { date: "desc" },
            take: 30, // Last 30 days of marketing costs
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("Error fetching product costs:", error);
      return NextResponse.json(
        { error: "Failed to fetch product costs" },
        { status: 500 }
      );
    }
  },
  { limit: 50, windowMs: 10 * 60 * 1000 } // Rate limiting for cost retrieval
);
