import { Metadata } from "next";

import { AdvancedAnalyticsDashboard } from "@/features/analytics/components/AdvancedAnalyticsDashboard";

export const metadata: Metadata = {
  title: "Advanced Analytics | Admin Dashboard",
  description:
    "Comprehensive analytics with trend analysis and automated alerts",
};

export default function AdvancedAnalyticsPage() {
  return <AdvancedAnalyticsDashboard />;
}
