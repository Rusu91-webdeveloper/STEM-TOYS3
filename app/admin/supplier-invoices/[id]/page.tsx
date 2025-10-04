import { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupplierInvoiceDetail } from "@/components/admin/SupplierInvoiceDetail";

interface SupplierInvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SupplierInvoiceDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Invoice ${id} | Admin Dashboard`,
    description: "View and manage supplier invoice details",
  };
}

export default async function SupplierInvoiceDetailPage({
  params,
}: SupplierInvoiceDetailPageProps) {
  const { id } = await params;

  return (
    <SupplierInvoiceDetail
      invoiceId={id}
      onBack={() => redirect("/admin/supplier-invoices")}
    />
  );
}
