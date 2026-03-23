import type { Metadata } from "next";

import CommercialLandingPage from "@/components/seo/CommercialLandingPage";
import { createMetadata } from "@/lib/metadata";

const faq = [
  {
    question: "Ce înseamnă jucării STEM?",
    answer:
      "Jucăriile STEM combină știința, tehnologia, ingineria și matematica în activități practice care dezvoltă logica, curiozitatea și rezolvarea de probleme.",
  },
  {
    question: "Cum aleg cele mai bune jucării STEM pentru copilul meu?",
    answer:
      "Pornești de la vârstă, nivelul de autonomie și interesul dominant al copilului: experimente, construcții, programare sau matematică aplicată.",
  },
  {
    question:
      "De ce să cumpăr jucării STEM online dintr-un magazin specializat?",
    answer:
      "Un magazin specializat filtrează mai bine produsele, explică beneficiile și te duce mai repede spre categoria potrivită, nu spre o listă generică de jucării.",
  },
  {
    question: "Jucăriile STEM sunt scumpe?",
    answer:
      "Nu neapărat. Da, multe kituri de la branduri consacrate (Fischertechnik, Thames & Kosmos, Djeco, 4M, Magblox, Cleverclixx, CreativaMente) au un preț care reflectă materialele, siguranța și durabilitatea. Merită să compari ce primești în cutie și cât rezistă la joacă repetată; la TechTots găsești și variante accesibile pentru început.",
  },
  {
    question: "Sunt sigure pentru copii mici?",
    answer:
      "Produsele noastre sunt certificate CE și conforme normelor europene pentru jucării. Respectă mereu vârsta recomandată pe ambalaj și supraveghează copiii mici acolo unde sunt piese mici sau experimente. Pentru 3–14 ani, alegerea potrivită nivelului copilului ține joaca în zona sigură și plăcută.",
  },
  {
    question:
      "Ce jucărie STEM aleg cadou dacă nu știu vârsta exactă?",
    answer:
      "Alege ceva cu interval de vârstă mai larg sau cu nivel ușor–mediu: construcții, experimente simple sau seturi creative (de ex. Djeco, 4M) prind bine la mai multe grupe de vârstă. Evită kiturile foarte tehnice sau cu montaj lung dacă nu știi câtă răbdare are copilul; poți folosi și ghidul nostru „după vârstă” ca reper.",
  },
  {
    question:
      "Copilul meu se va descurca singur sau are nevoie de ajutor adult?",
    answer:
      "Multe jucării STEM sunt făcute să le descoperiți împreună la început, apoi copilul prinde autonomie. Seturile cu pași clari, rezultat vizibil repede sau experimente scurte merg mai ușor singure; la robotică sau montaje complexe, prezența unui adult la start reduce frustrarea și încurajează perseverența.",
  },
  {
    question:
      "Ce fac dacă produsul nu e potrivit pentru copilul meu?",
    answer:
      "Poți solicita retur în termenul legal de 14 zile calendaristice, conform condițiilor din magazin (inclusiv despre costul transportului de retur la dreptul de retragere). Deschide cererea din cont sau urmează pașii din secțiunea de retururi; la produse defecte sau neconforme te ajutăm separat, conform politicii. Păstrează ambalajul cât timp testați jucăria.",
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
        "Jucării STEM pentru copii: experimente, construcții, logică și tehnologie alese pentru joacă acasă și cadouri utile.",
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
      eyebrow="Jucării STEM"
      title="Jucării STEM pentru acasă: joacă cu sens, fără plictiseală"
      description="Copilul pune întrebări, încearcă singur soluții și vede cum „merge” o idee — totul prin joacă, la nivelul lui."
      primaryCta={{ href: "/products", label: "Vezi toate produsele STEM" }}
      secondaryCta={{
        href: "/jucarii-stem-dupa-varsta",
        label: "Alege după vârstă",
      }}
      proofPoints={[
        "Alegi repede ce se potrivește vârstei",
        "Mai puțin timp pierdut, mai multă joacă utilă",
        "Comandă simplă, livrare direct la tine",
      ]}
      benefitsHeadline={{
        kicker: "Pentru părinți",
        title: "De ce TechTots?",
      }}
      benefits={[
        {
          title: "Selecție curată",
          description:
            "Nu-ți aruncăm sute de produse la întâmplare: alegem jucării STEM cu folos real la joacă, nu doar etichete la modă.",
        },
        {
          title: "Recomandări pe vârstă",
          description:
            "Găsești repede ce se potrivește copilului tău, ca să nu cumperi prea simplu sau peste puteri.",
        },
        {
          title: "Livrare rapidă",
          description:
            "Comanzi online și primești coletul repede acasă, fără să pierzi ore prin magazine.",
        },
      ]}
      quickFacts={[]}
      guidesHeadline={{
        kicker: "Întrebări reale",
        title: "Ce te frământă înainte de cumpărare",
        intro:
          "Mai jos găsești răspunsuri directe, fără teorie inutilă — genul de lucruri pe care le întreabă mulți părinți la raft sau în coșul de comenzi.",
      }}
      guides={[
        {
          title:
            "Ce vârstă minimă trebuie să aibă copilul pentru un kit STEM?",
          description:
            "Uită-te la recomandarea de pe cutie sau în descrierea produsului: acolo e intervalul potrivit. Dacă e la limită, alege varianta mai simplă — mai bine puțin ușor decât frustrare din prima zi.",
        },
        {
          title: "Cât de greu e să montezi aceste produse acasă?",
          description:
            "Majoritatea kiturilor au instrucțiuni pas cu pas; multe sunt gândite să le faceți împreună cu copilul. Dacă nu ești obișnuit cu montaj, caută seturi „gata de jucat” sau cu puține piese de asamblat.",
        },
        {
          title:
            "Dacă se plictisește repede, mai are sens o jucărie STEM?",
          description:
            "Da, dacă alegi ceva cu rezultat vizibil repede — un experiment scurt, o construcție care „se vede” sau un pas următor clar. Evită kiturile prea lungi pentru început; entuziasmul crește când vede progres în câteva minute.",
        },
      ]}
      checklistKicker="Înainte de comandă"
      checklistTitle="Mic ghid de părinte, în patru pași"
      checklistIntro="Nu e despre site, e despre cum alegi în liniște, ca să nu regreți după ce desfaci coletul."
      checklistItems={[
        "Notează vârsta copilului și cât stă concentrat pe un joc — nu cumpăra „pentru când va crește” dacă acum nu se atinge de el.",
        "Alege după ce îl tentează: roboți, experimente, construcții magnetice sau puzzle-uri logice — nu după ce e la modă în reclame.",
        "Gândește unde veți juca: ai masă liberă, spațiu pe podea sau vrei ceva compact pentru seară, după teme?",
        "Verifică dacă vrei joacă liberă sau activitate ghidată; unele seturi merg mai bine când ești lângă el la început.",
      ]}
      clusters={[
        {
          href: "/jucarii-educative",
          label: "Jucării educative",
          description:
            "Categorie largă: învățare și dezvoltare, nu doar timp liber.",
        },
        {
          href: "/jucarii-inteligente",
          label: "Jucării inteligente",
          description:
            "Provocări de logică, autonomie și jocuri care cer gândire activă.",
        },
        {
          href: "/robotica-pentru-copii",
          label: "Robotică pentru copii",
          description:
            "Kituri, programare vizuală și proiecte în care copilul vede rezultatul în mișcare.",
        },
        {
          href: "/categories/science-experiments",
          label: "Experimente științifice",
          description:
            "Seturi pentru curiozitate, descoperire și încercări practice.",
        },
        {
          href: "/categories/magnetic-building",
          label: "Construcții și inginerie",
          description:
            "Magnetice, structuri și proiecte care combină creativitatea cu spațialitatea.",
        },
        {
          href: "/ghid-educatie-stem-romania",
          label: "Ghid STEM România",
          description:
            "Context despre educație STEM în România și cum să alegi în funcție de situație.",
        },
      ]}
      faqs={faq}
    />
  );
}
