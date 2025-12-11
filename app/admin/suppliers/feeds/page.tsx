import { Metadata } from "next";

import { AdminSupplierFeeds } from "@/features/supplier/components/admin/AdminSupplierFeeds";

export const metadata: Metadata = {
  title: "Supplier Feeds | Admin",
  description: "Manage supplier feeds and trigger product syncs.",
};

export default function AdminSupplierFeedsPage() {
  return <AdminSupplierFeeds />;
}
