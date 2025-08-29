import { Metadata } from "next";
import { SupplierSupport } from "@/features/supplier/components/support/SupplierSupport";

export const metadata: Metadata = {
  title: "Support | Supplier Portal",
  description: "Create and manage support tickets",
};

export default function SupplierSupportPage() {
  return <SupplierSupport />;
}
