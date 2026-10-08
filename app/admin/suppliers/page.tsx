import { Metadata } from "next";

import { AdminSupplierList } from "@/features/supplier/components/admin/AdminSupplierList";

export const metadata: Metadata = {
  title: "Furnizori | Administrare TechTots",
  description: "Gestionează furnizorii, cererile și aprobările magazinului.",
};

export default function AdminSuppliersPage() {
  return <AdminSupplierList />;
}
