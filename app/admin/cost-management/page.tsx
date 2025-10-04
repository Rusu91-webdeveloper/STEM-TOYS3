import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import ProductCostManagement from "@/components/admin/ProductCostManagement";

export const metadata: Metadata = {
  title: "Product Cost Management | Admin Dashboard",
  description:
    "Analyze product costs, optimize pricing, and maximize profitability",
};

export default async function ProductCostManagementPage() {
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="container mx-auto py-6">
      <ProductCostManagement />
    </div>
  );
}
