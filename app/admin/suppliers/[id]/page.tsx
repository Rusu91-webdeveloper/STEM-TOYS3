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

export default function AdminSupplierDetailPage({ params }: AdminSupplierDetailPageProps) {
  return <AdminSupplierDetail supplierId={params.id} />;
}
