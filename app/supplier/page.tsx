import { Metadata } from "next";

import { SupplierLanding } from "@/features/supplier/components/SupplierLanding";
import { appConfig } from "@/lib/config/app-config";

export const metadata: Metadata = {
  title: "Devino furnizor TechTots",
  description:
    "TechTots lucrează cu furnizori din România de jucării educaționale și STEM. Scrie-ne pentru o colaborare.",
  alternates: { canonical: "https://www.techtots.ro/supplier" },
  openGraph: {
    title: "Devino furnizor TechTots",
    description: `Colaborări cu furnizori de jucării educaționale și STEM. Contact: ${appConfig.contactEmail}.`,
    type: "website",
  },
};

export default function SupplierPage() {
  return <SupplierLanding />;
}
