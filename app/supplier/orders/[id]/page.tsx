import { Metadata } from "next";

import { SupplierOrderDetail } from "@/features/supplier/components/orders/SupplierOrderDetail";

export const metadata: Metadata = {
  title: "Order Details | Supplier Dashboard",
  description: "View and manage order details in the TechTots supplier portal",
};

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupplierOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        <p className="text-muted-foreground">
          View and manage order #{id}
        </p>
      </div>

      <SupplierOrderDetail orderId={id} />
    </div>
  );
}
