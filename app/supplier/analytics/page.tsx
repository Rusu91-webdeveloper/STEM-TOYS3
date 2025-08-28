import { Metadata } from "next";
import { SupplierAnalytics } from "@/features/supplier/components/analytics/SupplierAnalytics";

export const metadata: Metadata = {
  title: "Analytics | Supplier Portal",
  description: "Product performance and sales analytics",
};

export default function SupplierAnalyticsPage() {
  return <SupplierAnalytics />;
}
