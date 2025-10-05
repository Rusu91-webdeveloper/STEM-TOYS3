import { Suspense } from "react";
import { PaymentRolloutManager } from "@/features/admin/payments/components/PaymentRolloutManager";

export default function PaymentRolloutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">Loading...</div>
        }
      >
        <PaymentRolloutManager />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: "Payment Rollout Management | Admin",
  description:
    "Manage Netopia vs Stripe payment provider rollout configuration",
};
