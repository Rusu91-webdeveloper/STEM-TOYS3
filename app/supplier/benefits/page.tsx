import { Metadata } from "next";

import { SupplierLanding } from "@/features/supplier/components/SupplierLanding";

export const metadata: Metadata = {
  title: "Devino furnizor TechTots",
  description:
    "TechTots lucrează cu furnizori din România de jucării educaționale și STEM.",
  alternates: { canonical: "https://www.techtots.ro/supplier" },
};

export default function SupplierBenefitsPage() {
  return <SupplierLanding />;
}
