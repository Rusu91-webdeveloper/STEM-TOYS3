import type { Metadata } from "next";

import CommercialLandingPage from "@/components/seo/CommercialLandingPage";
import { createMetadata } from "@/lib/metadata";

const faq = [
  {
    question:
      "Sunt prea scumpe jucăriile educative față de ce găsesc în magazine?",
    answer:
      "Prețul reflectă de obicei materialele, siguranța și cât rezistă la repetări: o jucărie la care copilul revine săptămână de săptămână îți scoate din ecuație „cumpăr din nou peste o lună”. La TechTots lucrăm cu branduri precum Fischertechnik, Thames & Kosmos, Djeco, 4M sau Magblox tocmai pentru a avea în coș variante care merită banii, nu doar ambalaj frumos. Compară ce primești în cutie și pentru ce vârstă e gândită — acolo se vede dacă merită.",
  },
  {
    question: "Cum știu că e potrivită pentru vârsta copilului meu?",
    answer:
      "Începe mereu de pe etichetă: vârsta recomandată e făcută să prevină frustrarea (prea greu) sau plictiseala (prea simplu). Urmărește și cât de mult poate lucra singur: unii copii vor autonomie din prima, alții au nevoie de un adult la început, iar asta e normal. La noi găsești produse pentru 3–14 ani; dacă ești între două variante, alege-o pe cea care îi lasă loc să crească, nu să o termine într-o după-amiază.",
  },
  {
    question:
      "Chiar se joacă copilul cu ele sau rămân în dulap după două zile?",
    answer:
      "Cel mai bun semn e o joacă cu feedback rapid: vede rezultat, poate încerca altceva, nu așteaptă jumătate de oră până „se întâmplă ceva”. Ferește-te de jucăriile care sună educative dar sunt doar o singură apăsare de buton fără sens. Când activitatea are pași clari și un rezultat vizibil — un experiment, un model care stă în picioare, un cod care face robotul să se miște — copilul revine pentru că îi dă plăcere, nu pentru că i-ai cerut tu.",
  },
  {
    question: "Cu ce sunt diferite de jucăriile „normale”, de la raft?",
    answer:
      "Jucăriile obișnuite pot fi grozave pentru relaxare; cele educative adaugă un scop practic: copilul exersează ceva concret — logică, mâini îndemânatice, răbdare, încercări repetate. Nu e vorba să înlocuiești toată joaca „de plăcere”, ci să ai în casă și variante care îl ajută să observe, să întrebe și să rezolve. Diferența se simte în timp: se vede nu doar în seara aia, ci în felul în care își ia singur inițiativa.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Jucării educative pentru copii | TechTots.ro",
  description:
    "Jucării educative pentru copii 3–14 ani: branduri precum Fischertechnik, Thames & Kosmos, Djeco, 4M, Magblox. Livrare în 1–4 zile lucrătoare în România. Alege după ce exersează copilul: știință, construcții, robotică sau matematică aplicată.",
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
      name: "Jucării educative pentru copii",
      description:
        "Jucării educative pentru copii, cu selecție pe categorii: știință și experimente, construcții și logică, robotică și programare, matematică aplicată. Livrare în România.",
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
      eyebrow="TechTots.ro"
      title="Jucării educative care îl ajută să învețe jucând"
      description="Aici găsești jucării educative alese pentru copii între 3 și 14 ani: de la experimente și construcții la robotică și matematică aplicată, de la branduri pe care te poți baza (Fischertechnik, Thames & Kosmos, Djeco, 4M, Magblox). Rămâi dacă vrei recomandări sincere, livrare în 1–4 zile lucrătoare și tot ce ai nevoie ca să alegi dintr-o dată potrivit pentru copilul tău, nu doar „educativ” pe etichetă."
      primaryCta={{
        href: "/products",
        label: "Vezi jucăriile din magazin",
      }}
      secondaryCta={{
        href: "/jucarii-stem-dupa-varsta",
        label: "Alege după vârstă",
      }}
      proofPoints={[
        "Branduri premium, testate în familii ca a ta",
        "Livrare în 1–4 zile lucrătoare, în România",
        "Vârste 3–14 ani, cu produse care țin pasul cu copilul",
      ]}
      quickFacts={[]}
      guidesHeadline={{
        kicker: "Sfaturi de părinte",
        title: "Cum alegi o jucărie cu valoare educativă reală",
        intro: "",
      }}
      guides={[
        {
          title: "Respectă vârsta, nu sloganul de pe cutie",
          description:
            "Dacă e prea sus, copilul renunță; dacă e prea jos, se plictisește. Eticheta e un reper, nu un concurs — folosește-o ca să îi lași loc să reușească fără să fie nevoie să sari peste trei capitole ca să ajungă la joacă.",
        },
        {
          title: "Caută un lucru concret de făcut, nu „activitate” generică",
          description:
            "O jucărie utilă îi arată copilului ce urmează: pune, combină, încearcă, observă. Dacă după deschidere nu știe ce are de făcut în cinci minute, probabil va cere ajutorul tău la fiecare pas — și obosește amândoi.",
        },
        {
          title: "Uită-te la materiale și la ce lasă în mână",
          description:
            "Vrei piese care se potrivesc bine, instrucțiuni clare și siguranță acolo unde sunt părți mici sau experimente. Nu trebuie să fii inginer; trebuie doar să simți că poți lăsa copilul să lucreze fără să crăpi de grijă la fiecare piesă.",
        },
        {
          title: "Întreabă-te: ce exersează aici, de fapt?",
          description:
            "Răbdare, ordine, numărare, încercări repetate, curiozitate — una dintre ele trebuie să iasă la suprafață. Dacă nu poți răspunde sincer, probabil e mai mult decor decât învățare.",
        },
      ]}
      clustersHeadline={{
        kicker: "În catalog",
        title: "Cele mai căutate categorii educative",
        intro: "",
      }}
      clusters={[
        {
          href: "/jucarii-stem",
          label: "Știință și experimente",
          description:
            "Copilul urmează pașii, pune întrebări și vede ce se întâmplă când schimbă ceva — nu doar citește despre fenomen.",
        },
        {
          href: "/jucarii-stem",
          label: "Construcții și logică",
          description:
            "Asamblează, încearcă variante și înțelege cum stă în picioare o structură — spațialitate și gândire ordonată, nu doar „legat de piese”.",
        },
        {
          href: "/robotica-pentru-copii",
          label: "Robotică și coding",
          description:
            "Leagă idei, tastează sau programează și vede efectul în mișcare: robotul răspunde la ce a hotărât el, nu la un singur buton magic.",
        },
        {
          href: "/categories/mathematics",
          label: "Matematică aplicată",
          description:
            "Numără, compară, rezolvă provocări concrete — înțelege numerele prin joc, nu prin fișe stoarse la final de săptămână.",
        },
      ]}
      faqs={faq}
    />
  );
}
