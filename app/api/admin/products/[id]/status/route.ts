import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const updateStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await context.params;
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, reason } = parsed.data;

    const existing = await db.product.findUnique({
      where: { id: productId },
      include: { supplier: { include: { user: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await db.product.update({
      where: { id: productId },
      data: { status },
    });

    // Invalidate all product-related caches when product is approved
    if (status === "APPROVED") {
      try {
        const { invalidateCachePattern } = await import("@/lib/cache");
        const { revalidateTag, revalidatePath } = await import("next/cache");

        // Clear Redis cache with proper wildcard patterns
        await invalidateCachePattern("products*");
        await invalidateCachePattern("product:*");
        await invalidateCachePattern("category*");

        // Clear Next.js cache
        revalidateTag("products");
        revalidateTag("categories");
        revalidatePath("/products");
        revalidatePath("/");

        console.log(
          `✅ Cache invalidated for approved product: ${existing.name}`
        );
      } catch (cacheError) {
        console.error("Failed to invalidate cache:", cacheError);
        // Don't fail the entire operation if cache invalidation fails
      }
    }

    // Notify supplier on approval/rejection
    try {
      const { sendEmailViaUnifiedSystem } = await import(
        "@/lib/email/migration-helper"
      );
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const supplierEmail = existing.supplier?.user?.email || undefined;
      if (supplierEmail) {
        if (status === "APPROVED") {
          await sendEmailViaUnifiedSystem({
            to: supplierEmail,
            subject: `Your product was approved: ${existing.name}`,
            html: `
              <p>Your product <strong>${existing.name}</strong> has been <strong>approved</strong> and is now visible in the store.</p>
              <p><a href="${siteUrl}/products/${existing.slug}">View Product</a> · <a href="${siteUrl}/supplier/products">Manage Products</a></p>
            `,
            text: `Your product ${existing.name} was approved and is now live. ${siteUrl}/products/${existing.slug}`,
          });
        } else if (status === "REJECTED") {
          await sendEmailViaUnifiedSystem({
            to: supplierEmail,
            subject: `Your product was rejected: ${existing.name}`,
            html: `
              <p>Your product <strong>${existing.name}</strong> has been <strong>rejected</strong>.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
              <p>You can update and resubmit from your dashboard: <a href="${siteUrl}/supplier/products">Supplier Products</a></p>
            `,
            text: `Your product ${existing.name} was rejected.${reason ? ` Reason: ${reason}` : ""} Update it at ${siteUrl}/supplier/products`,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send product status email", emailError);
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Error updating product status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
