import { Metadata } from "next";
import { SupplierRevenue } from "@/features/supplier/components/revenue/SupplierRevenue";

export const metadata: Metadata = {
  title: "Revenue | Supplier Portal",
  description: "Track your earnings and revenue analytics",
};

export default function SupplierRevenuePage() {
  return <SupplierRevenue />;
}
