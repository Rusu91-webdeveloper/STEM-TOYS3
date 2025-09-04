import { PublicSupplierLayout } from "@/features/supplier/components/layout/PublicSupplierLayout";
import { SupplierLayout } from "@/features/supplier/components/layout/SupplierLayout";

export default function SupplierPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicSupplierLayout>{children}</PublicSupplierLayout>;
}
