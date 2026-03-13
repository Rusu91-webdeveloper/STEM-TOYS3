import type { Metadata } from "next";

import CommercialLandingPage from "@/components/seo/CommercialLandingPage";
import { createMetadata } from "@/lib/metadata";

const faq = [
  {
    question: "Ce robotica pentru copii este potrivita pentru inceput?",
    answer:
      "Pentru inceput merg cel mai bine kiturile cu feedback imediat, programare vizuala, componente clare si proiecte scurte pe care copilul le poate finaliza repede.",
  },
  {
    question: "La ce varsta poate incepe un copil robotica?",
    answer:
      "Depinde de produs, dar multe kituri entry-level functioneaza bine de la 6-8 ani, iar pentru 9-12 ani poti urca spre sisteme mai complexe si proiecte pe mai multe etape.",
  },
  {
    question: "Este robotica buna doar pentru copiii foarte tehnici?",
    answer:
      "Nu. Robotica ii ajuta si pe copiii creativi sau practici, pentru ca imbina jocul, constructia, logica, testarea si satisfactia de a vedea produsul in miscare.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Robotica pentru Copii | Roboti Educativi si Coding pentru Copii",
  description:
    "Alege robotica pentru copii cu kituri potrivite pentru acasa: roboti educativi, jucarii programabile, coding vizual si proiecte STEM pentru varste diferite.",
  keywords: [
    "robotica pentru copii",
    "jucarii robotica copii",
    "roboti educativi",
    "coding pentru copii",
    "jucarii programabile",
    "robotica educationala",
    "roboti pentru copii Romania",
  ],
  pathWithoutLocale: "/robotica-pentru-copii",
  canonicalUrl: "https://www.techtots.ro/robotica-pentru-copii",
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Robotica pentru Copii",
      description:
        "Pagina comerciala pentru robotica educationala, coding si roboti programabili pentru copii.",
      url: "https://www.techtots.ro/robotica-pentru-copii",
      inLanguage: "ro",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(item => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
});

export default function RoboticsLandingPage() {
  return (
    <CommercialLandingPage
      eyebrow="Robotica si Coding"
      title="Robotica pentru copii care vor sa construiasca, sa programeze si sa vada ideile in miscare"
      description="Aceasta este pagina comerciala pentru cautarile de robotica, roboti educativi, coding si jucarii programabile. Leaga intentia foarte clara de cumparare de subcategoria cu cea mai mare relevanta tehnologica din magazin."
      primaryCta={{
        href: "/categories/coding-robotics",
        label: "Vezi robotica si coding",
      }}
      secondaryCta={{
        href: "/jucarii-stem-copii-6-8-ani",
        label: "Optiuni pentru 6-8 ani",
      }}
      proofPoints={[
        "Capteaza cautari de robotica educationala cu intentie puternica",
        "Leaga robotica de coding, constructie si invatare practica",
        "Sustine atat parintii, cat si cautarile pentru cadouri sau scoala",
      ]}
      benefits={[
        {
          title: "Intentie comerciala foarte clara",
          description:
            "Cine cauta robotica pentru copii are deja un interes puternic pentru produse tehnologice si este aproape de selectie.",
        },
        {
          title: "Conecteaza produsul cu rezultatul",
          description:
            "Pagina explica de ce robotica nu este doar distractie tech, ci si logica, planificare, perseverenta si rezolvare de probleme.",
        },
        {
          title: "Mutare naturala spre categorie si produse",
          description:
            "Este o pagina de intrare ideala spre categoria coding-robotics si spre produsele cu valoare mai mare din catalog.",
        },
      ]}
      clusters={[
        {
          href: "/categories/coding-robotics",
          label: "Categoria coding si robotica",
          description:
            "Principala destinatie comerciala pentru produse programabile si roboti educativi.",
        },
        {
          href: "/jucarii-inteligente",
          label: "Jucarii inteligente",
          description:
            "Extensie naturala pentru cautari de logica, autonomie si produse smart.",
        },
        {
          href: "/jucarii-stem",
          label: "Jucarii STEM",
          description:
            "Hub-ul principal care conecteaza robotica de restul universului STEM din magazin.",
        },
        {
          href: "/ghid-educatie-stem-romania",
          label: "Ghid STEM Romania",
          description:
            "Context educational mai larg pentru parintii care vor sa inteleaga traseul de invatare.",
        },
        {
          href: "/jucarii-stem-dupa-varsta",
          label: "Alege dupa varsta",
          description:
            "Ajuta la filtrarea rapida a kiturilor de robotica in functie de maturitatea copilului.",
        },
        {
          href: "/beneficiile-jucariilor-stem",
          label: "Beneficiile jocului STEM",
          description:
            "Arata de ce produsele de robotica au impact real in dezvoltarea copilului.",
        },
      ]}
      faqs={faq}
    />
  );
}
