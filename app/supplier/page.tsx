import { Metadata } from "next";
import { SupplierLanding } from "@/features/supplier/components/SupplierLanding";

export const metadata: Metadata = {
  title: "Become a Supplier | TechTots STEM Toys",
  description: "Join TechTots as a supplier and reach thousands of families looking for quality STEM toys. Start your partnership today.",
  keywords: "supplier, partnership, STEM toys, wholesale, B2B, TechTots",
  openGraph: {
    title: "Become a Supplier | TechTots STEM Toys",
    description: "Join TechTots as a supplier and reach thousands of families looking for quality STEM toys.",
    type: "website",
  },
};

export default function SupplierPage() {
  return <SupplierLanding />;
}
