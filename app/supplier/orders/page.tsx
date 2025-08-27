import { Metadata } from "next";
import { SupplierOrderList } from "@/features/supplier/components/orders/SupplierOrderList";

export const metadata: Metadata = {
  title: "Orders | Supplier Dashboard",
  description: "Track and manage your orders in the TechTots supplier portal",
};

export default function SupplierOrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Track and manage your product orders
        </p>
      </div>
      
      <SupplierOrderList />
    </div>
  );
}
