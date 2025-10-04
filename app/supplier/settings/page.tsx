import { Metadata } from "next";

import { SupplierSettings } from "@/features/supplier/components/settings/SupplierSettings";
import { getSupplierSettingsData } from "@/lib/supplier-auth";

// Force dynamic rendering since we use headers() in getSupplierSettingsData
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account Settings | Supplier Portal",
  description: "Manage your account settings and business information",
};

export default async function SupplierSettingsPage() {
  const data = await getSupplierSettingsData();

  return <SupplierSettings initialData={data} />;
}
