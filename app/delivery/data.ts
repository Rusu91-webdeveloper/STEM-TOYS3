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
    title: "Maximum 7 zile lucrătoare",
    description:
      "Monitorizăm fiecare colet prin AI logistics. Dacă depășim 7 zile lucrătoare, îți oferim transport gratuit la următoarea comandă.",
    icon: "⏱️",
  },
  {
    title: "24/7 transparență",
    description:
      "Dashboard-ul de urmărire arată starea livrării în timp real, cu dovezi foto la predare și semnătură digitală conform standardelor 2025.",
    icon: "🛰️",
  },
  {
    title: "Coordonare logistică activă",
    description:
      "Analizăm zilnic timpii de livrare și ajustăm fluxurile astfel încât să păstrăm termenul maxim de 7 zile lucrătoare pentru fiecare comandă.",
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
    phase: "Zilele 6-7",
    title: "Livrare națională garantată",
    description:
      "Ne asigurăm că livrarea nu depășește 7 zile lucrătoare. Dacă întâmpinăm întârzieri, activăm garanția de transport gratuit pentru următoarea comandă.",
  },
];

export interface LogisticsPillar {
  title: string;
  summary: string;
  highlights: string[];
}

export const logisticsPillars: LogisticsPillar[] = [
  {
    title: "Planificare națională unitară",
    summary: "Gestionăm livrările în toate regiunile din România cu un termen maxim de 7 zile lucrătoare.",
    highlights: [
      "Evaluăm constant partenerii de curierat disponibili",
      "Alocăm rute în funcție de zona de livrare și de volum",
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
    question: "Ce înseamnă „maximum 7 zile lucrătoare”?",
    answer:
      "Termenul se calculează din prima zi lucrătoare după confirmarea comenzii. Weekend-urile și sărbătorile legale nu sunt incluse, iar estimarea exactă este confirmată la momentul expedierii.",
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


