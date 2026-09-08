export interface TimelineStep {
  phase: string;
  title: string;
  description: string;
}

export interface Commitment {
  title: string;
  description: string;
  icon: string;
}

export interface DeliveryFaq {
  question: string;
  answer: string;
}

export const commitments: Commitment[] = [
  {
    title: "Livrare în 5-10 zile lucrătoare",
    description:
      "Procesăm comenzile rapid și le transmitem partenerilor noștri de livrare. Timpul exact depinde de procesarea de către furnizor și de zona de livrare.",
    icon: "⏱️",
  },
  {
    title: "Transparență completă",
    description:
      "Primești notificări la fiecare etapă: confirmare comandă, procesare de către furnizor, expediere, și livrare. Urmărește statusul în contul tău.",
    icon: "🛰️",
  },
  {
    title: "Coordonare cu furnizori",
    description:
      "Lucrăm strâns cu furnizorii noștri pentru a asigura procesare rapidă și livrare sigură. Monitorizăm fiecare comandă și te ținem la curent.",
    icon: "📦",
  },
];

export const timeline: TimelineStep[] = [
  {
    phase: "Ziua 0",
    title: "Comandă confirmată instant",
    description:
      "Primești imediat emailul de confirmare și acces la pagina ta de urmărire, unde vom publica toate actualizările despre livrare.",
  },
  {
    phase: "Ziua 1",
    title: "Pregătire inteligentă în depozit",
    description:
      "Echipa noastră pregătește coletul și verifică produsele STEM, astfel încât fiecare articol să ajungă în stare impecabilă.",
  },
  {
    phase: "Zilele 2-3",
    title: "Ridicare și scanare live",
    description:
      "Curierul desemnat preia coletul, iar statusul este actualizat automat în portalul de urmărire pentru fiecare scanare relevantă.",
  },
  {
    phase: "Zilele 4-5",
    title: "Livrare în marile orașe",
    description:
      "Monitorizăm traseul coletului și trimitem notificări proactive atunci când apar schimbări în estimarea de livrare.",
  },
  {
    phase: "Zilele 5-10",
    title: "Livrare națională",
    description:
      "Coletul ajunge la destinație. Timpul exact depinde de procesarea de către furnizor și de zona de livrare. Primești notificare când coletul este în tranzit și când ajunge.",
  },
];

export interface LogisticsPillar {
  title: string;
  summary: string;
  highlights: string[];
}

export const logisticsPillars: LogisticsPillar[] = [
  {
    title: "Coordonare cu furnizori",
    summary: "Lucrăm cu furnizori de încredere care procesează și expediază comenzile rapid.",
    highlights: [
      "Monitorizăm procesarea comenzilor de către furnizori",
      "Coordonăm expedierea și livrarea prin parteneri de curierat",
      "Comunicăm clar orice modificare a termenului estimat",
    ],
  },
  {
    title: "Transparență pentru clienți",
    summary: "Menținem clienții informați permanent despre statutul coletului.",
    highlights: [
      "Actualizăm portalul de urmărire cu fiecare etapă confirmată",
      "Trimitem notificări atunci când apar întârzieri",
      "Oferim suport dedicat pentru schimbarea detaliilor de livrare",
    ],
  },
  {
    title: "Îmbunătățire continuă",
    summary: "Colectăm feedback după livrare și optimizăm procesul pentru fiecare nouă comandă.",
    highlights: [
      "Analizăm rapoarte săptămânale privind timpul de tranzit",
      "Îmbunătățim ambalarea pentru protecția produselor educaționale",
      "Documentăm bune practici pentru livrări viitoare",
    ],
  },
];

export const faqs: DeliveryFaq[] = [
  {
    question: "Cât durează livrarea?",
    answer:
      "Livrare 1–4 zile lucrătoare cu FanCourier, după confirmarea stocului.",
  },
  {
    question: "Cum urmărim coletul în timp real?",
    answer:
      "După expediere primești un link securizat în limba română. De acolo poți verifica statusul, poți reprograma livrarea și poți solicita modificarea adresei în intervalul de 7 zile lucrătoare.",
  },
  {
    question: "Ce se întâmplă dacă nu sunt acasă?",
    answer:
      "Poți solicita redirecționarea coletului sau o nouă zi de livrare din portalul de urmărire. Echipa de suport te poate ajuta telefonic pentru a găsi soluția preferată.",
  },
  {
    question: "Livrați și în afara României?",
    answer:
      "Pentru moment livrăm doar în România. Analizăm opțiuni pentru extinderea livrărilor în Uniunea Europeană și vom anunța public când serviciul devine disponibil.",
  },
];


