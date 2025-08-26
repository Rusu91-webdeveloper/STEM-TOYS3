import { SupplierLayout } from "@/features/supplier/components/layout/SupplierLayout";

export default function SupplierPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SupplierLayout>{children}</SupplierLayout>;
}
