import { z } from "zod";

export const createPaymentIntentRequestSchema = z.object({
  amount: z.number().int().positive(),
  paymentIntentId: z.string().optional(),
  checkoutAttemptId: z.string().min(1).optional(),
  currency: z.string().optional(),
  guestEmail: z.string().optional(),
  checkoutContext: z
    .object({
      items: z.array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
          isBook: z.boolean().optional(),
          selectedLanguage: z.string().optional(),
        })
      ),
      shippingMethodId: z.string().optional(),
      couponCode: z.string().nullable().optional(),
      paymentMethod: z.string().optional(),
      recipientType: z.enum(["B2B", "B2C"]).optional(),
      phone: z.string().optional(),
    })
    .optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});
