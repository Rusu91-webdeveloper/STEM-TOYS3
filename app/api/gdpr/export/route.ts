import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/authorization";

/**
 * GET /api/gdpr/export - Export user's personal data (GDPR right to data portability)
 */
export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    const userId = session.user.id;

    // Gather all user data for export
    const exportData = await gatherUserDataForExport(userId);

    // Create a comprehensive export object
    const userDataExport = {
      exportDate: new Date().toISOString(),
      userId: userId,
      personalData: exportData,
      metadata: {
        gdprCompliant: true,
        exportFormat: "JSON",
        dataController: "TechTots SRL",
        dataControllerContact: "privacy@techtots.com",
        retentionPolicy: "7 years from last activity",
      },
    };

    // Log the export action for GDPR compliance
    await db.consentLog.create({
      data: {
        userId,
        action: "GRANTED", // Export is a form of data access
        consentType: "data_export",
        consentGiven: true,
        consentDetails: {
          exportType: "gdpr_data_portability",
          exportFormat: "json",
          exportedAt: new Date().toISOString(),
        },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json(userDataExport, {
      headers: {
        "Content-Disposition": `attachment; filename="gdpr-export-${userId}-${new Date().toISOString().split("T")[0]}.json"`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Internal server error during data export" },
      { status: 500 }
    );
  }
});

/**
 * Gather all user-related data for GDPR export
 */
async function gatherUserDataForExport(userId: string) {
  const [
    user,
    addresses,
    orders,
    reviews,
    wishlist,
    digitalDownloads,
    emailEvents,
    consentLogs,
    paymentCards,
    returns,
  ] = await Promise.all([
    // Basic user profile
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        consentGiven: true,
        consentDate: true,
        dataRetention: true,
        anonymized: true,
        tenantId: true,
        organizationId: true,
      },
    }),

    // Addresses
    db.address.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        fullName: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    // Orders
    db.order.findMany({
      where: { userId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        subtotal: true,
        tax: true,
        shippingCost: true,
        discountAmount: true,
        couponCode: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        notes: true,
        shippingAddressId: true,
        billingAddressId: true,
        createdAt: true,
        updatedAt: true,
        deliveredAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Reviews
    db.review.findMany({
      where: { userId },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        productId: true,
        orderItemId: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Wishlist
    db.wishlist.findMany({
      where: { userId },
      select: {
        id: true,
        productId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Digital downloads
    db.digitalDownload.findMany({
      where: { userId },
      select: {
        id: true,
        orderItemId: true,
        digitalFileId: true,
        downloadToken: true,
        expiresAt: true,
        downloadedAt: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Email events
    db.emailEvent.findMany({
      where: { userId },
      select: {
        id: true,
        email: true,
        eventType: true,
        campaignId: true,
        sequenceId: true,
        templateId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Consent logs
    db.consentLog.findMany({
      where: { userId },
      select: {
        id: true,
        action: true,
        consentType: true,
        consentGiven: true,
        consentDetails: true,
        validUntil: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // Payment cards (anonymized)
    db.paymentCard.findMany({
      where: { userId },
      select: {
        id: true,
        cardholderName: true,
        lastFourDigits: true,
        expiryMonth: true,
        expiryYear: true,
        cardType: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    // Returns
    db.return.findMany({
      where: { userId },
      select: {
        id: true,
        orderId: true,
        orderItemId: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    profile: user,
    addresses,
    orders,
    reviews,
    wishlist,
    digitalDownloads,
    emailEvents,
    consentLogs,
    paymentCards,
    returns,
  };
}
