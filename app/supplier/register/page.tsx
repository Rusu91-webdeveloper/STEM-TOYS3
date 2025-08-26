import { Metadata } from "next";
import { SupplierRegistration } from "@/features/supplier/components/SupplierRegistration";

export const metadata: Metadata = {
  title: "Supplier Registration | TechTots STEM Toys",
  description: "Register as a supplier with TechTots. Complete your application to start selling STEM toys to our community.",
  robots: "noindex, nofollow", // Registration pages should not be indexed
};

export default function SupplierRegisterPage() {
  return <SupplierRegistration />;
}
