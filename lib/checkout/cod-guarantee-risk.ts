import { db } from "@/lib/db";

export interface CodGuaranteeUserStats {
  priorOrderCount: number;
  priorCodRtoCount: number;
}

export async function getCodGuaranteeUserStats(
  userId: string
): Promise<CodGuaranteeUserStats> {
  const codPaymentMethods = ["cash_on_delivery", "cod"];

  const [priorOrderCount, priorCodRtoCount] = await Promise.all([
    db.order.count({
      where: {
        userId,
      },
    }),
    db.order.count({
      where: {
        userId,
        paymentMethod: { in: codPaymentMethods },
        OR: [
          {
            status: "CANCELLED",
            paymentStatus: { in: ["FAILED", "PENDING"] },
          },
          {
            notes: { contains: "COD REJECTED" },
          },
          {
            notes: { contains: "COD Guarantee captured" },
          },
        ],
      },
    }),
  ]);

  return {
    priorOrderCount,
    priorCodRtoCount,
  };
}
