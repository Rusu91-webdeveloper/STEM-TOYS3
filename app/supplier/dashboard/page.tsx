import { Metadata } from "next";

import { SupplierDashboard } from "@/features/supplier/components/dashboard/SupplierDashboard";
import { getSupplierDashboardData } from "@/lib/supplier-auth";

export const metadata: Metadata = {
  title: "Dashboard | Supplier Portal",
  description: "Manage your products, orders, and business with TechTots",
};

export default async function SupplierDashboardPage() {
  const data = await getSupplierDashboardData();

  // If unauthorized or failed, we still render component which will show error state
  return <SupplierDashboard initialData={data} />;
}
