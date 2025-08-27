import { Metadata } from "next";
import { AdminSupplierDetail } from "@/features/supplier/components/admin/AdminSupplierDetail";

export const metadata: Metadata = {
  title: "Supplier Details | Admin Dashboard",
  description: "View and manage supplier application details",
};

interface AdminSupplierDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminSupplierDetailPage({
  params,
}: AdminSupplierDetailPageProps) {
  const { id } = await params;
  return <AdminSupplierDetail supplierId={id} />;
}
