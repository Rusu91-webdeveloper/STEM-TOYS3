import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/authorization";

/**
 * DELETE /api/gdpr/delete - Delete/anonymize user data (GDPR right to be forgotten)
 */
export const DELETE = withAuth(async (request: NextRequest, session) => {
  try {
    const userId = session.user.id;

    // Check if this is a confirmed deletion request
    const body = await request.json();
    const { confirmDeletion, reason } = body;

    if (!confirmDeletion) {
      return NextResponse.json(
        { error: "Deletion must be explicitly confirmed" },
        { status: 400 }
      );
    }

    // Log the deletion request
    await db.consentLog.create({
      data: {
        userId,
        action: "WITHDRAWN",
        consentType: "data_deletion",
        consentGiven: false,
        consentDetails: {
          deletionType: "gdpr_right_to_be_forgotten",
          reason: reason || "User requested data deletion",
          requestedAt: new Date().toISOString(),
        },
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent"),
      },
    });

    // Start the data anonymization/deletion process
    const result = await anonymizeUserData(userId);

    return NextResponse.json({
      message: "Data deletion request processed successfully",
      result,
      note: "Your data has been anonymized and will be permanently deleted within 30 days as per GDPR requirements.",
    });
  } catch (error) {
    console.error("Error processing data deletion request:", error);
    return NextResponse.json(
      { error: "Internal server error during data deletion" },
      { status: 500 }
    );
  }
});

/**
 * Anonymize user data instead of deleting it (for audit and legal purposes)
 * This satisfies GDPR requirements while maintaining data integrity
 */
async function anonymizeUserData(userId: string) {
  const anonymizedData = {
    name: "[DELETED]",
    email: `[DELETED-${userId}@deleted.local]`,
    phone: null,
    anonymized: true,
    updatedAt: new Date(),
  };

  // Perform anonymization in a transaction
  const result = await db.$transaction(async tx => {
    // 1. Anonymize basic user profile
    const userUpdate = await tx.user.update({
      where: { id: userId },
      data: {
        ...anonymizedData,
        // Keep essential fields for audit purposes
        consentGiven: false,
        dataRetention: {
          deletedAt: new Date().toISOString(),
          deletionReason: "GDPR right to be forgotten",
          retentionPeriod: "30_days_then_permanent_deletion",
        },
      },
      select: {
        id: true,
        anonymized: true,
        dataRetention: true,
        updatedAt: true,
      },
    });

    // 2. Anonymize addresses
    await tx.address.updateMany({
      where: { userId },
      data: {
        name: "[DELETED]",
        fullName: "[DELETED]",
        addressLine1: "[DELETED]",
        addressLine2: "[DELETED]",
        city: "[DELETED]",
        state: "[DELETED]",
        postalCode: "00000",
        phone: null,
      },
    });

    // 3. Anonymize reviews
    await tx.review.updateMany({
      where: { userId },
      data: {
        title: "[DELETED]",
        content: "[DELETED - User requested data removal]",
      },
    });

    // 4. Anonymize returns
    await tx.return.updateMany({
      where: { userId },
      data: {
        details: "[DELETED - User requested data removal]",
      },
    });

    // 5. Anonymize digital downloads
    await tx.digitalDownload.updateMany({
      where: { userId },
      data: {
        ipAddress: "[DELETED]",
        userAgent: "[DELETED]",
      },
    });

    // 6. Anonymize email events
    await tx.emailEvent.updateMany({
      where: { userId },
      data: {
        email: `[DELETED-${userId}@deleted.local]`,
      },
    });

    // 7. Anonymize payment cards
    await tx.paymentCard.updateMany({
      where: { userId },
      data: {
        cardholderName: "[DELETED]",
        lastFourDigits: "0000",
      },
    });

    // 8. Create deletion audit log
    const auditLog = await tx.consentLog.create({
      data: {
        userId,
        action: "WITHDRAWN",
        consentType: "account_deletion",
        consentGiven: false,
        consentDetails: {
          deletionType: "full_anonymization",
          anonymizedFields: [
            "name",
            "email",
            "phone",
            "addresses",
            "reviews",
            "returns",
            "digital_downloads",
            "email_events",
            "payment_cards",
          ],
          permanentDeletionScheduled: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days
        },
      },
    });

    return {
      userUpdate,
      auditLog,
      anonymizedFields: [
        "personal_info",
        "addresses",
        "reviews",
        "returns",
        "digital_downloads",
        "email_events",
        "payment_cards",
      ],
    };
  });

  return result;
}
