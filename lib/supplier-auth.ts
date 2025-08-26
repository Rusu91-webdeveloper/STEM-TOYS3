"use server";

import { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Get the current supplier profile for the authenticated user
 * @param session The current user session
 * @returns Supplier profile or null if not found/not a supplier
 */
export async function getCurrentSupplier(session?: Session | null) {
  try {
    const currentSession = session || await auth();
    
    if (!currentSession?.user?.id) {
      return null;
    }

    const supplier = await db.supplier.findUnique({
      where: { userId: currentSession.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          }
        }
      }
    });

    return supplier;
  } catch (error) {
    logger.error("Error getting current supplier:", error);
    return null;
  }
}

/**
 * Check if the current user is an approved supplier
 * @param session The current user session
 * @returns True if user is an approved supplier
 */
export async function isApprovedSupplier(session?: Session | null): Promise<boolean> {
  try {
    const supplier = await getCurrentSupplier(session);
    return supplier?.status === "APPROVED";
  } catch (error) {
    logger.error("Error checking approved supplier status:", error);
    return false;
  }
}

/**
 * Check if the current user is a supplier (any status)
 * @param session The current user session
 * @returns True if user is a supplier
 */
export async function isSupplier(session?: Session | null): Promise<boolean> {
  try {
    const supplier = await getCurrentSupplier(session);
    return !!supplier;
  } catch (error) {
    logger.error("Error checking supplier status:", error);
    return false;
  }
}

/**
 * Get supplier status for the current user
 * @param session The current user session
 * @returns Supplier status or null if not a supplier
 */
export async function getSupplierStatus(session?: Session | null) {
  try {
    const supplier = await getCurrentSupplier(session);
    return supplier?.status || null;
  } catch (error) {
    logger.error("Error getting supplier status:", error);
    return null;
  }
}

/**
 * Validate supplier access for protected routes
 * @param session The current user session
 * @param requireApproved Whether to require approved status (default: true)
 * @returns Object with validation result and supplier data
 */
export async function validateSupplierAccess(
  session?: Session | null,
  requireApproved: boolean = true
) {
  try {
    const currentSession = session || await auth();
    
    if (!currentSession?.user?.id) {
      return {
        isValid: false,
        supplier: null,
        error: "Not authenticated"
      };
    }

    const supplier = await getCurrentSupplier(currentSession);
    
    if (!supplier) {
      return {
        isValid: false,
        supplier: null,
        error: "Not a supplier"
      };
    }

    if (requireApproved && supplier.status !== "APPROVED") {
      return {
        isValid: false,
        supplier,
        error: `Supplier not approved. Status: ${supplier.status}`
      };
    }

    return {
      isValid: true,
      supplier,
      error: null
    };
  } catch (error) {
    logger.error("Error validating supplier access:", error);
    return {
      isValid: false,
      supplier: null,
      error: "Internal error"
    };
  }
}

/**
 * Get supplier dashboard data
 * @param session The current user session
 * @returns Dashboard data for the supplier
 */
export async function getSupplierDashboardData(session?: Session | null) {
  try {
    const validation = await validateSupplierAccess(session, true);
    
    if (!validation.isValid) {
      return null;
    }

    const supplier = validation.supplier!;

    // Get basic stats
    const [productCount, orderCount, totalRevenue] = await Promise.all([
      db.product.count({
        where: { supplierId: supplier.id }
      }),
      db.supplierOrder.count({
        where: { supplierId: supplier.id }
      }),
      db.supplierOrder.aggregate({
        where: { 
          supplierId: supplier.id,
          status: { in: ["DELIVERED", "COMPLETED"] }
        },
        _sum: { supplierRevenue: true }
      })
    ]);

    // Get recent orders
    const recentOrders = await db.supplierOrder.findMany({
      where: { supplierId: supplier.id },
      include: {
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
            status: true
          }
        },
        product: {
          select: {
            name: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    return {
      supplier,
      stats: {
        productCount,
        orderCount,
        totalRevenue: totalRevenue._sum.supplierRevenue || 0
      },
      recentOrders
    };
  } catch (error) {
    logger.error("Error getting supplier dashboard data:", error);
    return null;
  }
}
