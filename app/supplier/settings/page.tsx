import { Metadata } from "next";
import { SupplierSettings } from "@/features/supplier/components/settings/SupplierSettings";

export const metadata: Metadata = {
  title: "Settings | Supplier Portal",
  description: "Manage your supplier account settings and preferences.",
  robots: "noindex, nofollow", // Settings pages should not be indexed
};

export default function SupplierSettingsPage() {
  return <SupplierSettings />;
}
