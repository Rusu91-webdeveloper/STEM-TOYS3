import { Metadata } from "next";
import { SupplierApplicationForm } from "@/features/supplier/components/SupplierApplicationForm";

export const metadata: Metadata = {
  title: "Apply to Become a Supplier | TechTots STEM Toys",
  description: "Apply to become a TechTots supplier. Join our network of trusted STEM toy suppliers and reach thousands of families across Romania.",
  keywords: "supplier application, become supplier, STEM toys supplier, TechTots partnership",
  openGraph: {
    title: "Apply to Become a Supplier | TechTots STEM Toys",
    description: "Apply to become a TechTots supplier and start selling your STEM toys to our community.",
    type: "website",
  },
};

export default function SupplierApplyPage() {
  return <SupplierApplicationForm />;
}
