import type { Metadata } from "next";

import CommercialLandingPage from "@/components/seo/CommercialLandingPage";
import { createMetadata } from "@/lib/metadata";

const faq = [
  {
    question: "Care este diferenta dintre jucarii educative si jucarii STEM?",
    answer:
      "Jucariile educative sunt categoria mai larga. Jucariile STEM sunt o subcategorie orientata spre logica, experiment, constructie, programare si invatare aplicata.",
  },
  {
    question:
      "Ce jucarii educative aleg pentru un copil curios, dar usor plictisit?",
    answer:
      "Cele mai bune optiuni sunt cele cu feedback rapid: experimente scurte, jocuri logice, robotica entry-level si constructii cu rezultate vizibile.",
  },
  {
    question: "Pot jucariile educative sa fie si distractive?",
    answer:
      "Da. De fapt, cele mai bune produse din nisa sunt exact cele in care copilul simte ca se joaca, iar parintele vede beneficii reale de invatare.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Jucarii Educative pentru Copii | Jucarii Educative Online Romania",
  description:
    "Alege jucarii educative pentru copii care dezvolta logica, atentia, creativitatea si autonomia. Descopera selectii relevante pentru acasa, scoala si cadouri inteligente.",
  keywords: [
    "jucarii educative",
    "jucarii educative copii",
    "jucarii educative online",
    "jucarii educative Romania",
    "jocuri educative copii",
    "cadouri educative",
    "jucarii pentru invatare",
  ],
  pathWithoutLocale: "/jucarii-educative",
  canonicalUrl: "https://www.techtots.ro/jucarii-educative",
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Jucarii Educative pentru Copii",
      description:
        "Pagina comerciala pentru jucarii educative, cu rute catre selectii STEM, logica, stiinta, robotica si recomandari dupa varsta.",
      url: "https://www.techtots.ro/jucarii-educative",
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

export default function EducationalToysLandingPage() {
  return (
    <CommercialLandingPage
      eyebrow="Intentie Comerciala"
      title="Jucarii educative care fac legatura dintre joaca de zi cu zi si invatarea care conteaza"
      description="Termenul jucarii educative atrage un public foarte larg in Romania. Pagina asta filtreaza acea intentie spre selectii mai precise: STEM, varsta, logica, creativitate si cadouri cu valoare educativa reala."
      primaryCta={{
        href: "/products",
        label: "Exploreaza jucariile educative",
      }}
      secondaryCta={{ href: "/jucarii-stem", label: "Vezi selectia STEM" }}
      proofPoints={[
        "Capteaza cautari generale cu intentie comerciala mare",
        "Trimite spre subcategoriile care convertesc mai bine",
        "Sprijina cautarile pentru cadouri si recomandari pentru parinti",
      ]}
      quickFacts={[
        {
          label: "Intentie principala",
          value: "jucarii educative, jucarii educative copii, jocuri educative copii",
        },
        {
          label: "Intentii secundare",
          value: "cadouri educative, jucarii pentru invatare, jucarii educative online",
        },
        {
          label: "Pentru cine este",
          value: "Familii care stiu ca vor valoare educativa, dar nu au decis inca disciplina sau categoria.",
        },
        {
          label: "Rol in cluster",
          value: "Pagina filtreaza intentia larga si o distribuie spre STEM, logica, robotica si selectie dupa varsta.",
        },
      ]}
      guides={[
        {
          title: "Cand incepi cu termenul jucarii educative",
          description:
            "Cand utilizatorul nu cauta inca explicit STEM, dar vrea sa evite jucariile fara valoare de invatare si are nevoie de recomandari mai clare.",
        },
        {
          title: "Cum transformi intentia larga in selectie buna",
          description:
            "Separi produsele dupa ce vrei sa construiasca: logica, creativitate, atentie, autonomie sau invatare practica. Apoi trimiti spre categoria specializata.",
        },
        {
          title: "De ce aceasta pagina trebuie sa existe separat",
          description:
            "Pentru ca multi cumparatori intra in magazin prin interogari generale. Daca nu exista o pagina dedicata, intentia larga se amesteca inutil cu pagina STEM principala.",
        },
      ]}
      checklistTitle="Cum alegi jucarii educative fara sa te pierzi in optiuni"
      checklistIntro="Pagina trebuie sa raspunda intentiei comerciale largi si sa duca repede spre o selectie potrivita, nu doar spre produse etichetate vag ca educative."
      checklistItems={[
        "Clarifica daca vrei dezvoltare prin logica, stiinta, robotica sau constructii.",
        "Verifica daca produsul are activitate practica si feedback real pentru copil.",
        "Alege in functie de varsta, nu doar de titlul produsului.",
        "Foloseste huburile STEM si inteligent pentru filtrare mai fina cand intentia devine mai specifica.",
      ]}
      benefits={[
        {
          title: "Acopera publicul mai larg",
          description:
            "Nu toti cumparatorii cauta direct STEM. Multi intra prin termeni ca jucarii educative, jocuri educative sau cadouri educative.",
        },
        {
          title: "Reduce cannibalizarea",
          description:
            "Pagina separa intentia generala de intentia strict STEM si lasa fiecare cluster sa se specializeze pe propriul set de cautari.",
        },
        {
          title: "Creste sansele de descoperire in AI search",
          description:
            "Explicatiile clare despre beneficii, selectie si utilizare practica cresc sansele ca pagina sa fie citata in raspunsuri sintetice.",
        },
      ]}
      clusters={[
        {
          href: "/jucarii-stem",
          label: "Jucarii STEM",
          description:
            "Varianta specializata pentru parintii care cauta deja disciplina STEM explicit.",
        },
        {
          href: "/jucarii-inteligente",
          label: "Jucarii inteligente",
          description:
            "Buna pentru cautari legate de logica, autonomie, jocuri smart si dezvoltare cognitiva.",
        },
        {
          href: "/beneficiile-jucariilor-stem",
          label: "Beneficiile jucariilor STEM",
          description:
            "Suport informational pentru parintii care compara joaca distractiva cu joaca utila.",
        },
        {
          href: "/categories/coding-robotics",
          label: "Coding si robotica",
          description:
            "Subcategorie cu semnal educational puternic pentru tehnologie si programare.",
        },
        {
          href: "/categories/science-experiments",
          label: "Stiinta si experimente",
          description:
            "Pentru copiii care invata mai bine prin observatie, testare si curiozitate.",
        },
        {
          href: "/jucarii-stem-dupa-varsta",
          label: "Alege dupa varsta",
          description:
            "Selectie rapida pentru parintii care vor sa scape de produse nepotrivite.",
        },
      ]}
      faqs={faq}
    />
  );
}
