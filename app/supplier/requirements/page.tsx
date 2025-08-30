import { Metadata } from "next";
import { SupplierRequirements } from "@/features/supplier/components/SupplierRequirements";

export const metadata: Metadata = {
  title: "Supplier Requirements 2025 | TechTots STEM Toys",
  description:
    "2025 requirements for becoming a TechTots supplier. EU-based suppliers with 7-day shipping, premium quality standards, and full compliance.",
  keywords:
    "supplier requirements 2025, EU suppliers, fast shipping, quality standards, STEM toys supplier, European e-commerce",
  openGraph: {
    title: "Supplier Requirements 2025 | TechTots STEM Toys",
    description:
      "2025 requirements for premium STEM toy suppliers with fast European shipping",
    type: "website",
  },
};

export default function SupplierRequirementsPage() {
  return <SupplierRequirements />;
}
