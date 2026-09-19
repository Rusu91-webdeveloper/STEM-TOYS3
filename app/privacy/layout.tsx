import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de confidențialitate | TechTots",
  description:
    "Politica de confidențialitate TechTots. Aflați cum colectăm, folosim și protejăm datele personale conform GDPR și legislației române.",
  openGraph: {
    title: "Politica de confidențialitate | TechTots",
    description:
      "Politica de confidențialitate TechTots. Aflați cum colectăm, folosim și protejăm datele personale conform GDPR și legislației române.",
    url: "https://www.techtots.ro/privacy",
    type: "website",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
