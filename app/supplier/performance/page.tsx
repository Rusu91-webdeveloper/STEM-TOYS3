import { Metadata } from "next";
import { SupplierPerformanceDashboard } from "@/features/supplier/components/performance/SupplierPerformanceDashboard";

export const metadata: Metadata = {
  title: "Performance Dashboard | Supplier Portal",
  description:
    "Track your performance metrics and identify areas for improvement",
};

export default function SupplierPerformancePage() {
  return <SupplierPerformanceDashboard />;
}
