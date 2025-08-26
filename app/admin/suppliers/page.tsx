import { Metadata } from "next";
import { AdminSupplierList } from "@/features/supplier/components/admin/AdminSupplierList";

export const metadata: Metadata = {
  title: "Supplier Management | Admin Dashboard",
  description: "Manage supplier applications, approvals, and status updates",
};

export default function AdminSuppliersPage() {
  return <AdminSupplierList />;
}
