import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import OrderStatusManagement from "@/components/admin/OrderStatusManagement";

export const metadata: Metadata = {
  title: "Order Status Management | Admin Dashboard",
  description:
    "Manage order statuses, track fulfillment, and monitor order workflow",
};

export default async function OrderManagementPage() {
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
      <OrderStatusManagement />
    </div>
  );
}
