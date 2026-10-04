import { randomUUID } from "node:crypto";

import { Prisma, type PrismaClient } from "@prisma/client";

/** Erase account data; preserve transaction records for legal review. */
export function eraseCustomerAccount(
  db: PrismaClient,
  userId: string,
  now = new Date()
) {
  return db.$transaction(
    async tx => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          anonymized: true,
          dataArchiveStatus: true,
        },
      });
      if (!user) return { status: "not_found" as const };
      if (user.role !== "CUSTOMER") return { status: "staff_review" as const };
      const [openOrders, openReturns] = await Promise.all([
        tx.order.count({
          where: {
            userId,
            status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] },
          },
        }),
        tx.return.count({
          where: { userId, status: { notIn: ["REJECTED", "REFUNDED"] } },
        }),
      ]);
      // Delivery uses the account contact. Record open cases for human review.
      if (openOrders || openReturns) {
        const existing = await tx.consentLog.findFirst({
          where: {
            userId,
            consentType: "account_deletion_request",
            consentDetails: { path: ["status"], equals: "pending_review" },
          },
          select: { id: true },
        });
        if (!existing)
          await tx.consentLog.create({
            data: {
              userId,
              action: "WITHDRAWN",
              consentType: "account_deletion_request",
              consentGiven: false,
              consentDetails: {
                status: "pending_review",
                requestedAt: now.toISOString(),
                openOrders,
                openReturns,
              },
            },
          });
        return {
          status: "pending_review" as const,
          retained: ["open_orders_or_returns"],
        };
      }
      const scope = { userId };
      await tx.passwordResetToken.deleteMany({ where: { email: user.email } });
      await tx.twoFactor.deleteMany({ where: scope });
      await tx.paymentCard.deleteMany({ where: scope }); // Removes PAN/CVV ciphertext too.
      await tx.wishlist.deleteMany({ where: scope });
      await tx.review.deleteMany({ where: scope });
      await tx.digitalDownload.deleteMany({ where: scope });
      await tx.emailSequenceUser.deleteMany({ where: scope });
      await tx.emailEvent.deleteMany({
        where: { OR: [scope, { email: user.email }] },
      });
      await tx.newsletter.deleteMany({ where: { email: user.email } });
      await tx.address.deleteMany({
        where: {
          userId,
          shippingOrders: { none: {} },
          billingOrders: { none: {} },
        },
      });
      await tx.securityEventLog.deleteMany({ where: scope });
      await tx.consentLog.updateMany({
        where: scope,
        data: { ipAddress: null, userAgent: null },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          name: null,
          email: `deleted-${randomUUID()}@deleted.invalid`,
          password: randomUUID(),
          isActive: false,
          accountLocked: true,
          anonymized: true,
          dataArchiveStatus: "DELETED",
          phone: null,
          cnp: null,
          cui: null,
          numarCi: null,
          serieCi: null,
          eliberatDe: null,
          eliberatLa: null,
          valabilPanaLa: null,
          adresaDomiciliu: Prisma.DbNull,
          codPostal: null,
          judet: null,
          localitate: null,
          verificationToken: null,
          emailVerified: null,
          twoFactorEnabled: false,
          securityQuestions: Prisma.DbNull,
          preferences: Prisma.DbNull,
          seasonalPatterns: Prisma.DbNull,
          consentGiven: false,
          consentDate: null,
          ageGroup: null,
          educationLevel: null,
          tags: [],
          productCategoryPrefs: [],
          paymentMethodPrefs: [],
          regionalPreference: null,
          lastActivityAt: null,
          lastLoginAt: null,
          totalPageViews: 0,
          totalTimeSpent: 0,
          recommendationClicks: 0,
          wishlistSize: 0,
          avgSessionDuration: null,
          avgOrderValue: null,
          brandLoyaltyScore: null,
          churnRiskScore: null,
          lifetimeValue: 0,
          purchaseFrequency: null,
          priceSensitivity: null,
          socialEngagementScore: null,
          referralCount: 0,
          deliveryTimeExpectation: null,
          isRomanianResident: false,
          segmentUpdatedAt: null,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          lastCacheUpdate: null,
          cacheKey: null,
          cacheVersion: { increment: 1 },
          dataRetention: {
            status: "account_erased",
            appliedAt: now.toISOString(),
            retained: ["transaction_records", "minimal_request_audit"],
            policy: "legal_obligations_and_claims_review",
          },
        },
      });
      await tx.consentLog.updateMany({
        where: {
          userId,
          consentType: "account_deletion_request",
          consentDetails: { path: ["status"], equals: "pending_review" },
        },
        data: {
          consentDetails: { status: "completed", appliedAt: now.toISOString() },
        },
      });
      if (!user.anonymized || user.dataArchiveStatus !== "DELETED")
        await tx.consentLog.create({
          data: {
            userId,
            action: "WITHDRAWN",
            consentType: "account_deletion",
            consentGiven: false,
            consentDetails: {
              status: "account_erased",
              appliedAt: now.toISOString(),
              retained: ["transaction_records", "minimal_request_audit"],
            },
          },
        });
      return {
        status: "completed" as const,
        retained: ["transaction_records", "minimal_request_audit"],
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    }
  );
}
