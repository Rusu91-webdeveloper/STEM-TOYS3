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
      quickFacts={[
        {
          label: "Intentie principala",
          value: "jucarii STEM, jucarii STEM copii, jucarii STEM Romania",
        },
        {
          label: "Intentii secundare",
          value: "cadouri STEM, kituri STEM, jocuri logica si robotica pentru copii",
        },
        {
          label: "Pentru cine este",
          value: "Parinti care vor sa ajunga rapid la o selectie relevanta, nu la un catalog generic.",
        },
        {
          label: "Ce sustine",
          value: "Hub-ul distribuie autoritate spre varsta, categorii, ghiduri si pagini regionale cu cerere reala.",
        },
      ]}
      guides={[
        {
          title: "Cand merita sa alegi direct pagina STEM",
          description:
            "Atunci cand stii deja ca vrei produse cu componenta de logica, experiment, constructie sau tehnologie. Pagina aceasta este punctul cel mai bun de intrare pentru comparare rapida.",
        },
        {
          title: "Cum separi STEM de simplul divertisment",
          description:
            "Produsele bune cer participare activa: copilul construieste, testeaza, ordoneaza pasi, observa rezultate si rezolva probleme, nu doar apasa pe un buton.",
        },
        {
          title: "Cum folosesti pagina ca parinte",
          description:
            "Pornesti din hub, alegi ruta potrivita dupa varsta sau interes, apoi cobori spre categoria care rezolva cel mai bine contextul de acasa, cadou sau scoala.",
        },
      ]}
      checklistTitle="Ce sa verifici inainte sa alegi o jucarie STEM"
      checklistIntro="Pentru cautarile comerciale largi, viteza de selectie conteaza. Lista de mai jos reduce frictiunea si te trimite mai repede spre pagina potrivita."
      checklistItems={[
        "Porneste de la varsta si nivelul de autonomie al copilului.",
        "Decide daca interesul principal este robotica, stiinta, constructii sau logica.",
        "Verifica daca produsul este bun pentru joaca acasa, cadou sau activitati ghidate.",
        "Foloseste paginile suport pentru varsta si categorii atunci cand rezultatele sunt prea largi.",
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
