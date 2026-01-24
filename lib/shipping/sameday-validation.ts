import { addressSchema } from "@/lib/validations";
import { getCodThreshold, getRecipientType } from "@/lib/shipping/cod-thresholds";
import {
  calculateShippingWeights,
  resolveShippingService,
  type ShippingService,
} from "@/lib/shipping/shipping-pricing";

type AddressLike = {
  companyName?: string | null;
  cui?: string | null;
  fullName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  phone?: string | null;
};

export type SamedayValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  service: ShippingService | null;
  chargeableWeightKg: number | null;
  recipientType: "B2B" | "B2C";
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function validateSamedayOrder(input: {
  order: {
    id: string;
    paymentMethod: string;
    paymentStatus: string;
    total: number;
    codAmount?: number | null;
    shippingMethod?: string | null;
    lockerId?: string | null;
    user?: { email?: string | null } | null;
    shippingAddress?: AddressLike | null;
    billingAddress?: AddressLike | null;
  };
  shippingItems: Array<{
    quantity: number;
    weightKg?: number | null;
    dimensions?: Record<string, unknown> | null;
  }>;
}): Promise<SamedayValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const service = resolveShippingService(input.order.shippingMethod || undefined);

  if (!service) {
    errors.push("Shipping method is missing or unsupported.");
  }

  if (!input.order.shippingAddress) {
    errors.push("Shipping address is missing.");
  } else {
    const parsed = addressSchema.safeParse({
      companyName: input.order.shippingAddress.companyName || undefined,
      cui: input.order.shippingAddress.cui || undefined,
      fullName: input.order.shippingAddress.fullName || "",
      addressLine1: input.order.shippingAddress.addressLine1 || "",
      addressLine2: input.order.shippingAddress.addressLine2 || undefined,
      city: input.order.shippingAddress.city || "",
      state: input.order.shippingAddress.state || "",
      postalCode: input.order.shippingAddress.postalCode || "",
      country: input.order.shippingAddress.country || "",
      phone: input.order.shippingAddress.phone || "",
    });

    if (!parsed.success) {
      errors.push("Shipping address is incomplete or invalid.");
    }
  }

  const recipientType = getRecipientType([
    input.order.shippingAddress || undefined,
    input.order.billingAddress || undefined,
  ]);

  if (
    input.order.user?.email &&
    !EMAIL_REGEX.test(input.order.user.email)
  ) {
    warnings.push("Customer email format looks invalid.");
  }

  const codAmount = input.order.codAmount ?? input.order.total;
  if (input.order.paymentMethod === "cash_on_delivery") {
    const threshold = getCodThreshold(recipientType);
    if (codAmount > threshold) {
      errors.push(
        `COD amount exceeds threshold (${threshold.toFixed(2)} RON).`
      );
    }
  }

  const weights = calculateShippingWeights(input.shippingItems);
  const chargeableWeightKg = weights.chargeableWeightKg;

  if (service === "SAMEDAY_EASYBOX") {
    if (chargeableWeightKg > 20) {
      errors.push("Easybox is limited to 20kg chargeable weight.");
    }
    if (!input.order.lockerId) {
      errors.push("Easybox requires a locker selection.");
    }
  }

  if (weights.physicalWeightKg <= 0) {
    warnings.push("Shipping weight could not be determined from products.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    service,
    chargeableWeightKg: chargeableWeightKg || null,
    recipientType,
  };
}
