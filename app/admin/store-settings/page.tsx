import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import StoreSettingsManagement from "@/components/admin/StoreSettingsManagement";

export const metadata: Metadata = {
  title: "Store Settings Management | Admin Dashboard",
  description:
    "Configure and manage your store settings, security, and backups",
};

export default async function StoreSettingsPage() {
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
      <StoreSettingsManagement />
    </div>
  );
}
