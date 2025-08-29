import { Metadata } from "next";
import { SupplierBenefits } from "@/features/supplier/components/SupplierBenefits";

export const metadata: Metadata = {
  title: "Supplier Benefits & Opportunities | TechTots STEM Toys",
  description: "Discover the benefits of becoming a TechTots supplier. Access our growing customer base, professional platform, and comprehensive support system.",
  keywords: "supplier benefits, partnership opportunities, STEM toys marketplace, supplier advantages",
  openGraph: {
    title: "Supplier Benefits & Opportunities | TechTots STEM Toys",
    description: "Benefits and opportunities for TechTots suppliers",
    type: "website",
  },
};

export default function SupplierBenefitsPage() {
  return <SupplierBenefits />;
}
