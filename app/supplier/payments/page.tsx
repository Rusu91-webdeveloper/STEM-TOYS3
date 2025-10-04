import { Metadata } from "next";

import { SupplierPaymentHistory } from "@/features/supplier/components/payments/SupplierPaymentHistory";

export const metadata: Metadata = {
  title: "Payment History | Supplier Portal",
  description: "View your payment history and transaction details",
};

export default function SupplierPaymentsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">
          Track all your commission payments and payouts
        </p>
      </div>

      <SupplierPaymentHistory />
    </div>
  );
}
