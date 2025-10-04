import { Metadata } from "next";

import { SupplierInvoiceManagement } from "@/features/supplier/components/invoices/SupplierInvoiceManagement";

export const metadata: Metadata = {
  title: "Invoices | Supplier Portal",
  description: "View and manage your invoices and payment history",
};

export default function SupplierInvoicesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">
          Track your commission payments and invoice history
        </p>
      </div>

      <SupplierInvoiceManagement />
    </div>
  );
}
