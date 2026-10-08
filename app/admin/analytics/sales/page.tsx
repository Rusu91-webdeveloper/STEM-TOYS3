import { redirect } from "next/navigation";

import { OwnerDashboard } from "@/app/admin/components/owner-dashboard";
import { auth } from "@/lib/auth";

export default async function SalesAnalyticsPage() {
  const session = await auth();
  if (!session?.user)
    redirect("/auth/login?callbackUrl=/admin/analytics/sales");
  if (session.user.role !== "ADMIN") redirect("/admin");
  return <OwnerDashboard report />;
}
