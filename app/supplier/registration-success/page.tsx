import { Metadata } from "next";
import { SupplierRegistrationSuccess } from "@/features/supplier/components/SupplierRegistrationSuccess";

export const metadata: Metadata = {
  title: "Application Submitted | TechTots STEM Toys",
  description: "Thank you for your supplier application. We'll review your information and get back to you within 5-7 business days.",
  keywords: "supplier application submitted, application confirmation, TechTots supplier",
  openGraph: {
    title: "Application Submitted | TechTots STEM Toys",
    description: "Your supplier application has been submitted successfully",
    type: "website",
  },
};

export default function SupplierRegistrationSuccessPage() {
  return <SupplierRegistrationSuccess />;
}
