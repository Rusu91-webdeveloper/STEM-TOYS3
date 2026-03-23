import type { Metadata } from "next";

import CommercialLandingPage from "@/components/seo/CommercialLandingPage";
import { createMetadata } from "@/lib/metadata";

const faq = [
  {
    question: "De la ce vârstă are sens robotica pentru copii?",
    answer:
      "Multe kituri din magazin sunt gândite de la aproximativ 3 ani în sus, dar „robotica” în sens practic — montaj, motoraș, reguli clare de funcționare — devine confortabilă în jurul școlii mici (6–8 ani), în funcție de răbdare și de citirea instrucțiunilor. Pentru 10–14 ani apar deja proiecte mai lungi, cu pași de depanare și uneori programare mai fină. Verifică mereu recomandarea de pe cutie și nivelul de autonomie al copilului tău.",
  },
  {
    question: "E greu de montat? Trebuie să fiți doi adulți?",
    answer:
      "Depinde de kit: unele sunt gândite ca prim contact (piese mari, pași puțini), altele au șuruburi mici și manual mai stufos. Ca regulă, primele sesiuni merg mai bine cu un adult alături — nu neapărat ca să „facă el”, ci ca să organizeze pașii și să evite frustrarea. După ce copilul prinde ritmul, devine din ce în ce mai independent.",
  },
  {
    question: "Se poate face robotica fără computer sau tabletă?",
    answer:
      "Da, există kituri în care totul e fizic: construiești, pornești motorul, testezi pe masă — fără aplicație. Altele combină hardware-ul cu programare vizuală pe ecran. Dacă vrei ecran cât mai puțin, filtrează după vârstă mică și descrieri de tip „fără software obligatoriu” sau citește fișa produsului; la TechTots găsești de la modele simple la seturi mai avansate (de ex. unele linii Fischertechnik sau Thames & Kosmos, în funcție de articol).",
  },
  {
    question: "E un cadou potrivit sau riscă să stea în cutie?",
    answer:
      "E un cadou excelent dacă știi că micuțul chiar îi place să construiască și are timp liber câteva după-amiezi — nu doar o oră. Alege un nivel realist după vârstă și evită „prea mult pentru prima dată”. Un kit cu proiecte scurte și rezultat vizibil (se mișcă ceva!) are șanse mai mari să fie deschis din nou a doua zi.",
  },
  {
    question: "Ce buget e realist pentru un prim kit?",
    answer:
      "În catalogul TechTots, pentru robotică și kituri conexe vei găsi de obicei un plajă de aproximativ 99–907 lei, în funcție de mărimea setului, motor, senzori și marcă (ex. Gigo Toys / Genius Toy, Fischertechnik, Thames & Kosmos cu linia KAI, 4M Kidz Robotix). Nu e nevoie să sari direct la cel mai complex model: un prim kit potrivit contează mai mult decât prețul maxim.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Robotica pentru Copii | Roboti Educativi si Coding pentru Copii",
  description:
    "Kituri de robotică pentru copii 3–14 ani: construcție, motoare, programare vizuală. Gigo, Fischertechnik, Thames & Kosmos, 4M — de la primul robot la proiecte mai ample.",
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
      name: "Robotica pentru copii la TechTots",
      description:
        "Kituri de robotică educativă pentru copii: construire, testare și învățare practică, cu vârste între 3 și 14 ani.",
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
      eyebrow="Construcție și explorare"
      title="Robotica pentru copii: construiește, programează, vezi mișcarea"
      description="Copilul tău e fascinat de cum funcționează lucrurile? Îi place să potrivească piese, să vadă o roată care se învârte și să înțeleagă de ce merge sau de ce nu? Aici găsești kituri cu care poate construi modele care se mișcă, poate testa idei și poate învăța pas cu pas — fără presiunea de a fi „deja bun la tehnic”."
      primaryCta={{
        href: "/categories/coding-robotics",
        label: "Vezi kiturile de robotică",
      }}
      secondaryCta={{
        href: "/jucarii-stem-dupa-varsta",
        label: "Alege după vârstă",
      }}
      proofPoints={[
        "Înțelege cauză-efect: ce piese fac ca robotul să se comporte într-un fel anume.",
        "Exersează răbdarea: uneori merge din prima, uneori trebuie să încerce din nou.",
        "Are un rezultat concret — ceva ce poate arăta bunicii sau unui prieten.",
      ]}
      ageTable={{
        kicker: "Pe scurt",
        title: "De la ce vârstă începe robotica?",
        intro:
          "Nu există un singur răspuns: „robotica” poate însemna modele mari și joacă de rol la 4 ani, sau proiecte cu motoraș și instrucțiuni la 9 ani. Tabelul de mai jos e un reper, nu o regulă rigidă.",
        rows: [
          {
            ageRange: "3–5 ani",
            productType:
              "Modele pre-montate sau cu piese mari, roboți de jucărie educativi, primele vehicule cu elemente mecanice simple (ex. linii Gigo Toys / Genius Toy, seturi 4M Kidz Robotix foarte accesibile).",
            focus:
              "Pune piese la loc, împinge, trage, vede că „se leagă” ceva; exersează motricitate fină și urmărește o secvență simplă (întâi roata, apoi caroseria).",
          },
          {
            ageRange: "6–9 ani",
            productType:
              "Kituri de construcție cu motoraș, uneori senzori de bază sau ghid pas cu pas (Fischertechnik, Thames & Kosmos, 4M — în funcție de setul ales).",
            focus:
              "Învață să citească schema, să urmeze ordinea pașilor, să numească părți (ax, roț dințate) și să conecteze ideea de „instrucțiune” cu mișcarea din realitate.",
          },
          {
            ageRange: "10–14 ani",
            productType:
              "Seturi mai ample, proiecte cu mai multe variante sau programare (ex. linia KAI de la Thames & Kosmos, Fischertechnik la niveluri superioare).",
            focus:
              "Poate încerca variante (alt șasiu, altă transmisie), poate depana, poate documenta ce a schimbat și de ce — aproape de un mic proiect de laborator.",
          },
        ],
      }}
      guidesHeadline={{
        kicker: "Sfaturi practice",
        title: "Cum alegi primul kit fără să greșești",
        intro:
          "Patru repere care te scutesc de achiziția „prea grea” sau de setul care nu se potrivește stilului copilului.",
      }}
      guides={[
        {
          title: "Potrivește vârsta reală",
          description:
            "Cutia poate spune 8+, dar copilul tău preferă proiecte de 20 de minute sau sesiuni de o oră? Alege după răbdare, nu doar după număr.",
        },
        {
          title: "Un motor clar, un scop clar",
          description:
            "Primul kit e reușit dacă la final se vede mișcare sau o acțiune evidentă. Evită, la început, combinațiile cu prea mulți pași opționali.",
        },
        {
          title: "Verifică cât e „cu adultul lângă”",
          description:
            "Dacă știi că vei fi doar tu în weekend, alege manual prietenos și piese care nu cer scule exotice. Dacă copilul lucrează singur la masă, altfel stau lucrurile.",
        },
        {
          title: "Lasă loc de următorul pas",
          description:
            "Nu e nevoie să cumperi cel mai mare set din gamă. Un kit potrivit lasă loc de entuziasm pentru următorul nivel — și asta e un semn bun.",
        },
      ]}
      clusters={[
        {
          href: "/categories/coding-robotics",
          label: "Robotică și coding în catalog",
          description:
            "Toate kiturile din această zonă, cu filtre după ce ai nevoie: vârstă, tip de activitate, buget.",
        },
        {
          href: "/jucarii-inteligente",
          label: "Jucării inteligente",
          description:
            "Dacă interesul e mai mult logică și puzzle decât șuruburi și motoare, poți găsi alternative potrivite aici.",
        },
        {
          href: "/jucarii-stem",
          label: "Universul STEM",
          description:
            "Legături spre experimente, construcție și alte materii — util dacă vrei să combini robotică cu alte activități.",
        },
        {
          href: "/ghid-educatie-stem-romania",
          label: "Ghid educație STEM",
          description:
            "Context despre cum se leagă jocul de școală și ce înseamnă „STEM” în practică, pe scurt.",
        },
        {
          href: "/jucarii-stem-dupa-varsta",
          label: "Idei pe vârste",
          description:
            "Liste filtrate ca să nu citești zeci de fișe: intră pe segmentul de vârstă care vi se potrivește.",
        },
        {
          href: "/beneficiile-jucariilor-stem",
          label: "Beneficiile jocului STEM",
          description:
            "De ce merită timpul petrecut pe construit și testat — fără promisiuni exagerate, doar ce observă mulți părinți.",
        },
      ]}
      faqs={faq}
    />
  );
}
