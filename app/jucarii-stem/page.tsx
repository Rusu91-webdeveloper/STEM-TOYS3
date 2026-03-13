import type { Metadata } from "next";

import CommercialLandingPage from "@/components/seo/CommercialLandingPage";
import { createMetadata } from "@/lib/metadata";

const faq = [
  {
    question: "Ce inseamna jucarii STEM?",
    answer:
      "Jucariile STEM combina stiinta, tehnologia, ingineria si matematica in activitati practice care dezvolta logica, curiozitatea si rezolvarea de probleme.",
  },
  {
    question: "Cum aleg cele mai bune jucarii STEM pentru copilul meu?",
    answer:
      "Pornesti de la varsta, nivelul de autonomie si interesul dominant al copilului: experimente, constructii, coding sau matematica aplicata.",
  },
  {
    question:
      "De ce sa cumpar jucarii STEM online dintr-un magazin specializat?",
    answer:
      "Un magazin specializat filtreaza mai bine produsele, explica beneficiile educationale si te trimite mai rapid spre categoria potrivita, nu doar spre o lista generica de jucarii.",
  },
];

export const metadata: Metadata = createMetadata({
  title:
    "Jucarii STEM Romania | Jucarii STEM pentru Copii si Cadouri Educative",
  description:
    "Descopera jucarii STEM in Romania pentru copii curiosi: robotica, stiinta, constructii, logica si invatare prin joc. Alege rapid dupa varsta, interes si obiectiv educational.",
  keywords: [
    "jucarii STEM",
    "jucarii STEM Romania",
    "jucarii stem copii",
    "jucarii STEM online",
    "jucarii STEM educative",
    "cele mai bune jucarii STEM",
    "cadouri STEM copii",
  ],
  pathWithoutLocale: "/jucarii-stem",
  canonicalUrl: "https://www.techtots.ro/jucarii-stem",
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Jucarii STEM Romania",
      description:
        "Pagina comerciala principala pentru jucarii STEM, cu selectii dupa varsta, disciplina si obiectiv educational.",
      url: "https://www.techtots.ro/jucarii-stem",
      inLanguage: "ro",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Acasa",
          item: "https://www.techtots.ro/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Jucarii STEM",
          item: "https://www.techtots.ro/jucarii-stem",
        },
      ],
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

export default function StemToysLandingPage() {
  return (
    <CommercialLandingPage
      eyebrow="Hub Comercial STEM"
      title="Jucarii STEM pentru copiii care invata mai bine cand construiesc, experimenteaza si descopera"
      description="Aceasta pagina concentreaza intentia comerciala principala din nisa: jucarii STEM. Din ea trimitem autoritate spre varste, categorii si ghiduri care raspund rapid la cautarile cu cea mai mare valoare pentru magazin."
      primaryCta={{ href: "/products", label: "Vezi toate produsele STEM" }}
      secondaryCta={{
        href: "/jucarii-stem-dupa-varsta",
        label: "Alege dupa varsta",
      }}
      proofPoints={[
        "Intrare principala pentru cautarile jucarii STEM Romania",
        "Selectie dupa varsta, robotica, stiinta si invatare aplicata",
        "Leaga intentia comerciala de ghiduri si categorii reale",
      ]}
      benefits={[
        {
          title: "Mai putina confuzie la selectie",
          description:
            "Parintele nu vede doar un catalog mare. Vede rute clare spre jucaria potrivita pentru varsta, interes si nivel de autonomie.",
        },
        {
          title: "Mai multe semnale comerciale",
          description:
            "Pagina acopera termeni tranzactionali, comparativi si informationali strans legati de intentia de cumparare.",
        },
        {
          title: "Mai multa autoritate tematica",
          description:
            "Cand homepage-ul, categoriile, ghidurile si produsele trimit aici si primesc link inapoi, site-ul devine mai coerent pentru Google si AI search.",
        },
      ]}
      clusters={[
        {
          href: "/jucarii-educative",
          label: "Jucarii educative",
          description:
            "Pentru cautari axate pe invatare, dezvoltare si recomandari pentru parinti.",
        },
        {
          href: "/jucarii-inteligente",
          label: "Jucarii inteligente",
          description:
            "Pentru cautari care asociaza inteligenta, logica, autonomie si jocuri smart.",
        },
        {
          href: "/robotica-pentru-copii",
          label: "Robotica pentru copii",
          description:
            "Pentru programare, roboți, kituri interactive si produse cu componenta tehnologica puternica.",
        },
        {
          href: "/categories/science-experiments",
          label: "Experimente stiintifice",
          description:
            "Colectie pentru curiozitate, descoperire si joaca practica orientata spre stiinta.",
        },
        {
          href: "/categories/magnetic-building",
          label: "Constructii si inginerie",
          description:
            "Seturi pentru creativitate, spatialitate, rezolvarea de probleme si proiecte concrete.",
        },
        {
          href: "/ghid-educatie-stem-romania",
          label: "Ghid STEM Romania",
          description:
            "Pillar page informational care sprijina cautarile educationale si semnalele E-E-A-T.",
        },
      ]}
      faqs={faq}
    />
  );
}
