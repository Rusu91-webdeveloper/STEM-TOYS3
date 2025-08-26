import { Metadata } from "next";
import { SupplierDashboard } from "@/features/supplier/components/dashboard/SupplierDashboard";

export const metadata: Metadata = {
  title: "Dashboard | Supplier Portal",
  description: "Manage your products, orders, and business with TechTots",
};

export default function SupplierDashboardPage() {
  return <SupplierDashboard />;
}
