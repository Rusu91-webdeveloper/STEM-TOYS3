import { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { AdvancedAnalyticsDashboard } from "@/features/analytics/components/AdvancedAnalyticsDashboard";

export const metadata: Metadata = {
  title: "Advanced Analytics | Admin Dashboard",
  description:
    "Comprehensive analytics with trend analysis and automated alerts",
};

export default function AdvancedAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Quick Navigation */}
      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/admin/analytics"
          className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <BarChart3 className="h-4 w-4" />
          Analytics Hub
        </Link>
        <span className="text-muted-foreground">•</span>
        <span className="font-medium">Advanced Analytics</span>
      </div>

      <AdvancedAnalyticsDashboard />
    </div>
  );
}
