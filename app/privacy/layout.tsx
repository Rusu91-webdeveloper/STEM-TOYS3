import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de confidențialitate | TechTots",
  description:
    "Politica de confidențialitate TechTots: WEBIRA REM S.R.L., scopurile prelucrării, destinatarii datelor, durata păstrării și opțiunile tale.",
  openGraph: {
    title: "Politica de confidențialitate | TechTots",
    description:
      "Politica de confidențialitate TechTots: operatorul, destinatarii datelor, durata păstrării și opțiunile tale.",
    url: "https://www.techtots.ro/privacy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Politica de confidențialitate | TechTots",
    description:
      "Politica de confidențialitate TechTots: operatorul, destinatarii datelor, durata păstrării și opțiunile tale.",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
