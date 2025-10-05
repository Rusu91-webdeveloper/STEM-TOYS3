import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AnalyticsHub } from "./components/AnalyticsHub";

export default async function AnalyticsPage() {
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  return <AnalyticsHub />;
}
