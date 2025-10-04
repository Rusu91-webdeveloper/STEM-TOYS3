import { Metadata } from "next";

import { SupplierInvoiceManagement } from "@/components/admin/SupplierInvoiceManagement";

export const metadata: Metadata = {
  title: "Supplier Invoices | Admin Dashboard",
  description: "Manage supplier invoices and payments",
};

export default function AdminSupplierInvoicesPage() {
  return <SupplierInvoiceManagement />;
}
