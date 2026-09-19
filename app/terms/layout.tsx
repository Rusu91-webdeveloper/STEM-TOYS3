import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termeni și condiții | TechTots",
  description:
    "Termeni și condiții TechTots. Reguli și condiții pentru utilizarea platformei și achiziționarea produselor educaționale STEM.",
  openGraph: {
    title: "Termeni și condiții | TechTots",
    description:
      "Termeni și condiții TechTots. Reguli și condiții pentru utilizarea platformei și achiziționarea produselor educaționale STEM.",
    url: "https://www.techtots.ro/terms",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Termeni și condiții | TechTots",
    description:
      "Termeni și condiții TechTots. Reguli și condiții pentru utilizarea platformei și achiziționarea produselor educaționale STEM.",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
