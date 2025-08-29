import { SupplierLayout } from "@/features/supplier/components/layout/SupplierLayout";
import { PublicSupplierLayout } from "@/features/supplier/components/layout/PublicSupplierLayout";

export default function SupplierPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicSupplierLayout>{children}</PublicSupplierLayout>;
}
