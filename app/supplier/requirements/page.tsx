import { Metadata } from "next";
import { SupplierRequirements } from "@/features/supplier/components/SupplierRequirements";

export const metadata: Metadata = {
  title: "Supplier Requirements & Guidelines | TechTots STEM Toys",
  description: "Learn about the requirements and guidelines for becoming a TechTots supplier. Understand our quality standards, EU compliance, and application process.",
  keywords: "supplier requirements, quality standards, EU compliance, STEM toys supplier guidelines",
  openGraph: {
    title: "Supplier Requirements & Guidelines | TechTots STEM Toys",
    description: "Requirements and guidelines for becoming a TechTots supplier",
    type: "website",
  },
};

export default function SupplierRequirementsPage() {
  return <SupplierRequirements />;
}
