import {
  RETURN_POLICY_COD_RTO_RO,
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
  RETURN_WINDOW_LABEL_RO,
} from "@/lib/returns/policy";

export const FAQ_ITEMS = [
  {
    question: "Jucăriile STEM îi ajută pe copii?",
    answer:
      "Jucăriile STEM pot încuraja curiozitatea, explorarea, rezolvarea de probleme și învățarea prin încercare. Rezultatele diferă de la un copil la altul, iar noi nu promitem creșteri ale notelor sau procente de performanță.",
  },
  {
    question: "Cum aleg o jucărie potrivită vârstei copilului?",
    answer:
      "Verifică vârsta indicată de producător pe ambalaj și avertismentele produsului. Dacă un filtru sau o descriere de pe site diferă de ambalaj, urmează informația de pe ambalaj. Ia în calcul și interesul copilului, nivelul său de îndemânare și nevoia de supraveghere.",
  },
  {
    question: "Ce standarde de siguranță au produsele?",
    answer:
      "Jucăriile comercializate în Uniunea Europeană trebuie să respecte cerințele aplicabile și să poarte marcajul CE. Menționăm EN71 sau ASTM numai când standardul este declarat de producător ori apare în documentația produsului. Respectă întotdeauna instrucțiunile, limitele de vârstă și avertismentele de pe ambalaj.",
  },
  {
    question: "La ce se pot aștepta părinții de la o jucărie STEM?",
    answer:
      "La o activitate practică prin care copilul poate construi, observa, testa și pune întrebări. Experiența depinde de produs, de vârsta copilului și de implicarea adultului; nu garantăm rezultate școlare sau un anumit nivel de interes.",
  },
  {
    question: "Cum funcționează returul?",
    answer: `Pentru comenzile eligibile încheiate la distanță, poți solicita retragerea în termen de ${RETURN_WINDOW_LABEL_RO}. ${RETURN_POLICY_CUSTOMER_PAYS_RO} ${RETURN_POLICY_SELLER_PAYS_RO}`,
  },
  {
    question:
      "Ce se întâmplă dacă refuz sau nu ridic o comandă cu plata ramburs?",
    answer: `${RETURN_POLICY_COD_RTO_RO} Dreptul de retragere în termen de ${RETURN_WINDOW_LABEL_RO} se aplică după primirea unei comenzi eligibile și este diferit de refuzul sau neridicarea coletului.`,
  },
  {
    question: "În cât timp se livrează comenzile?",
    answer:
      "Pentru produsele confirmate în stoc, termenul obișnuit de livrare este de 1–4 zile lucrătoare, prin FanCourier. Detaliile de expediere sunt comunicate după procesarea comenzii.",
  },
] as const;

export const FAQ_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
