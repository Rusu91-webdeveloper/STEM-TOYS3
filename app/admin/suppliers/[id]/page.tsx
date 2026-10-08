import { Metadata } from "next";

import { AdminSupplierDetail } from "@/features/supplier/components/admin/AdminSupplierDetail";

export const metadata: Metadata = {
  title: "Date furnizor | Administrare",
  description: "Consultă și administrează datele furnizorului.",
};

interface AdminSupplierDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminSupplierDetailPage({
  params,
}: AdminSupplierDetailPageProps) {
  const { id } = await params;
  return <AdminSupplierDetail supplierId={id} />;
}
