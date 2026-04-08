import type { Metadata } from "next";

import CommercialLandingPage from "@/components/seo/CommercialLandingPage";
import { createMetadata } from "@/lib/metadata";

const faq = [
  {
    question: "Ce inseamna jucarii inteligente?",
    answer:
      "In cautarile comerciale, jucarii inteligente descrie de obicei produse care stimuleaza logica, tehnologia, autonomia, creativitatea si rezolvarea de probleme.",
  },
  {
    question: "Sunt jucariile inteligente doar electronice?",
    answer:
      "Nu. Pot fi si jocuri de logica, constructii, puzzle-uri avansate sau kituri STEM fara ecran, atata timp cat cer gandire activa si feedback real.",
  },
  {
    question: "Ce tip de copil raspunde bine la jucarii inteligente?",
    answer:
      "Copiii curiosi, cei care pun multe intrebari, cei care se plictisesc usor de jucariile pasive si cei care prefera provocari, mecanisme si experiment.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Jucarii Inteligente pentru Copii | Jucarii Smart si STEM Romania",
  description:
    "Descopera jucarii inteligente pentru copii: jocuri de logica, robotica, constructii, stiinta si activitati smart care dezvolta gandirea si autonomia.",
  keywords: [
    "jucarii inteligente",
    "jucarii inteligente copii",
    "jucarii smart copii",
    "jucarii care dezvolta inteligenta",
    "jocuri logice copii",
    "jucarii de inteligenta",
    "jucarii smart Romania",
  ],
  pathWithoutLocale: "/jucarii-inteligente",
  canonicalUrl: "https://www.techtots.ro/jucarii-inteligente",
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Jucarii Inteligente pentru Copii",
      description:
        "Hub comercial pentru jucarii inteligente, jocuri logice, produse smart si selectii STEM cu accent pe gandire si autonomie.",
      url: "https://www.techtots.ro/jucarii-inteligente",
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

export default function SmartToysLandingPage() {
  return (
    <CommercialLandingPage
      eyebrow="Jucării pentru minți active"
      title="Jucarii inteligente pentru copii care vor mai mult decat lumini si sunete"
      description="Multi parinti cauta jucarii inteligente atunci cand vor produse care provoaca mintea copilului. Pagina asta captureaza exact acel tip de cautare si o trimite spre logica, robotica, STEM si jocuri care chiar construiesc abilitati."
      primaryCta={{
        href: "/products",
        label: "Descopera jucariile inteligente",
      }}
      secondaryCta={{
        href: "/robotica-pentru-copii",
        label: "Vezi robotica pentru copii",
      }}
      proofPoints={[
        "Selecție atentă de jucării care stimulează gândirea, logica și autonomia copilului.",
        "Capteaza cautari smart, logice, STEM si cognitive",
        "Functioneaza bine pentru cautari Google si raspunsuri AI rezumative",
      ]}
      quickFacts={[]}
      guides={[
        {
          title: "Cum alegi o jucărie cu adevărat inteligentă",
          description:
            "De cele mai multe ori nu inseamna doar ecran sau senzor. Inseamna jocuri si kituri care cer gandire activa, decizii, strategie, observatie si progres.",
        },
        {
          title: "Cum deosebesti o jucarie smart de una zgomotoasa",
          description:
            "Cauta produse care il fac pe copil sa construiasca, sa anticipeze, sa corecteze si sa inteleaga un rezultat. Asta creeaza valoare educativa si motive reale de recomandare.",
        },
        {
          title: "Unde trimite pagina dupa selectie",
          description:
            "Daca intentia devine tehnica, ruta naturala este robotica. Daca se duce spre gandire si provocari, merg mai bine logica, constructiile si selectia STEM pe varsta.",
        },
      ]}
      checklistTitle="Semnale bune pentru o jucarie inteligenta"
      checklistIntro="Câteva criterii care te ajută să alegi jucăria potrivită pentru copilul tău."
      checklistItems={[
        "Produsul cere participare activa, nu doar reactie la lumini sau sunete.",
        "Exista o progresie clara: pasi, provocari, constructie sau experiment.",
        "Copilul primeste feedback real si poate corecta singur.",
        "Pagina finala de selectie ar trebui sa fie STEM, robotica sau logica, in functie de interes.",
      ]}
      benefits={[
        {
          title: "Semnal mai bun pentru cautari moderne",
          description:
            "Jucăriile inteligente combină tehnologia cu învățarea activă — perfecte pentru copiii curioși și independenți.",
        },
        {
          title: "Pod intre educativ si tehnologic",
          description:
            "Pagina face legatura dintre jucarii educative clasice si robotica, coding sau jocuri logice mai avansate.",
        },
        {
          title: "Mai usor de recomandat de AI tools",
          description:
            "Cand explici clar ce inseamna inteligent in contextul jocului, instrumentele AI pot extrage mai usor raspunsuri utile pentru utilizatori.",
        },
      ]}
      clusters={[
        {
          href: "/robotica-pentru-copii",
          label: "Robotica pentru copii",
          description:
            "Pentru copiii fascinati de tehnologie, miscari, senzori si jocuri programabile.",
        },
        {
          href: "/robotica-pentru-copii",
          label: "Coding si jucarii programabile",
          description:
            "Hub dedicat pentru cautari de coding, programare vizuala si roboți educaționali.",
        },
        {
          href: "/jucarii-stem",
          label: "Jucarii STEM",
          description: "Cea mai completă selecție de jucării STEM din România.",
        },
        {
          href: "/jucarii-educative",
          label: "Jucarii educative",
          description:
            "Pentru cautari mai generale care se pot transforma in selectie smart si logica.",
        },
        {
          href: "/beneficiile-jucariilor-stem",
          label: "Beneficii educationale",
          description:
            "Ajuta parintii sa inteleaga de ce produsele inteligente sunt mai valoroase decat divertismentul pasiv.",
        },
        {
          href: "/jucarii-stem-dupa-varsta",
          label: "Filtru dupa varsta",
          description:
            "Reduce frictiunea atunci cand parintele cauta provocarea potrivita pentru nivelul copilului.",
        },
      ]}
      faqs={faq}
    />
  );
}
