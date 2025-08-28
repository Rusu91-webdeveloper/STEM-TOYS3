import { Metadata } from "next";
import { SupplierInvoicesPage } from "@/features/supplier/components/invoices/SupplierInvoicesPage";

export const metadata: Metadata = {
  title: "Invoices | Supplier Portal",
  description: "View and manage your invoices",
};

export default function Page() {
  return <SupplierInvoicesPage />;
}
