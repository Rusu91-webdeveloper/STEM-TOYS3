"use client";

import { PaymentMethods } from "@/features/account/components/PaymentMethods";

// Keep the former entry point without restoring the retired card-entry form.
export function SavedPaymentMethods() {
  return <PaymentMethods />;
}
