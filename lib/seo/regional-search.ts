export type SearchRouteCard = {
  href: string;
  label: string;
  description: string;
};

export type RegionalStemCity = {
  slug: string;
  city: string;
  county: string;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  proofPoints: string[];
  benefits: Array<{
    title: string;
    description: string;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
};

export const nationalCommercialRoutes: SearchRouteCard[] = [
  {
    href: "/jucarii-stem",
    label: "Jucarii STEM",
    description:
      "Pagina principala pentru intentia comerciala STEM: selectie, beneficii si rute spre categorii si varste.",
  },
  {
    href: "/jucarii-educative",
    label: "Jucarii educative",
    description:
      "Pentru parintii care cauta valoare educationala clara, nu doar divertisment.",
  },
  {
    href: "/jucarii-inteligente",
    label: "Jucarii inteligente",
    description:
      "Acopera cautarile legate de logica, autonomie, jocuri smart si invatare aplicata.",
  },
  {
    href: "/robotica-pentru-copii",
    label: "Robotica pentru copii",
    description:
      "Intrare comerciala pentru kituri de robotica, coding si jucarii programabile.",
  },
  {
    href: "/jucarii-stem-dupa-varsta",
    label: "STEM dupa varsta",
    description:
      "Ajuta familiile sa aleaga mai rapid in functie de 3-5 ani, 6-8 ani, 9-12 ani sau adolescenti.",
  },
  {
    href: "/ghid-educatie-stem-romania",
    label: "Ghid STEM Romania",
    description:
      "Pillar page informational care intareste increderea si sustine cautarile AI cu context util.",
  },
];

export const regionalStemCities: RegionalStemCity[] = [
  {
    slug: "bucuresti",
    city: "Bucuresti",
    county: "Bucuresti-Ilfov",
    title:
      "Jucarii STEM Bucuresti | Robotica, stiinta si jucarii educative pentru copii",
    description:
      "Descopera jucarii STEM in Bucuresti pentru copii curiosi: robotica, experimente, constructii si jocuri inteligente. Alege rapid dupa varsta, interes si obiectiv educational.",
    heroTitle:
      "Jucarii STEM pentru familiile din Bucuresti care cauta mai mult decat o jucarie obisnuita",
    heroDescription:
      "Pagina este construita pentru cererea comerciala din Bucuresti: parinti care compara rapid optiuni, cauta cadouri educative si vor produse care combina joaca, logica si autonomie. Legam intentia locala de categoriile si ghidurile care convertesc.",
    proofPoints: [
      "Targeteaza cautarile jucarii STEM Bucuresti si jucarii educative Bucuresti",
      "Leaga cererea urbana de paginile comerciale cu cea mai mare intentie",
      "Sustine selectie rapida pentru cadouri, scoala, afterschool si invatare acasa",
    ],
    benefits: [
      {
        title: "Pentru familii care compara rapid",
        description:
          "In Bucuresti, cautarile tind sa fie mai tranzactionale. De aceea pagina trimite direct spre STEM, robotica, selectie pe varsta si jucarii inteligente.",
      },
      {
        title: "Mai clar pentru cadouri si recomandari",
        description:
          "Parintii au nevoie de rute simple spre produse care dezvolta logica, curiozitatea si invatarea practica.",
      },
      {
        title: "Autoritate locala fara promisiuni false",
        description:
          "Nu pretindem prezenta fizica locala. Aratam clar ca magazinul livreaza national si raspunde intentiei regionale cu pagini dedicate.",
      },
    ],
    faq: [
      {
        question: "Ce jucarii STEM se cauta cel mai des in Bucuresti?",
        answer:
          "Cele mai comune intentii comerciale sunt legate de robotica pentru copii, experimente stiintifice, cadouri educative si jucarii inteligente pentru 6-12 ani.",
      },
      {
        question:
          "Cum aleg o jucarie STEM buna pentru un copil din ciclul primar?",
        answer:
          "Porneste de la varsta, nivelul de autonomie si interesul dominant: experimente, constructii, logica sau programare. Apoi filtreaza spre pagina comerciala potrivita.",
      },
      {
        question: "Are sens o pagina locala daca magazinul livreaza national?",
        answer:
          "Da. O pagina regionala buna raspunde cautarilor reale din oras si trimite rapid spre categoriile care rezolva intentia de cumparare.",
      },
    ],
  },
  {
    slug: "cluj-napoca",
    city: "Cluj-Napoca",
    county: "Cluj",
    title:
      "Jucarii STEM Cluj-Napoca | Jucarii educative, robotica si seturi de stiinta",
    description:
      "Vezi jucarii STEM pentru Cluj-Napoca: robotica, experimente, constructii magnetice si jocuri inteligente pentru copii care invata prin joaca.",
    heroTitle:
      "Jucarii STEM pentru Cluj-Napoca, unde cererea pentru invatare aplicata este deja matura",
    heroDescription:
      "Cluj-Napoca cauta puternic zone precum robotica, logica, constructii si invatare prin proiecte. Pagina conecteaza aceste cautari la rutele comerciale care aduc conversii si la ghidurile care cresc increderea.",
    proofPoints: [
      "Construita pentru cautari precum jucarii STEM Cluj si robotica pentru copii Cluj",
      "Leaga intentia educationala de selectie rapida pe categorie si varsta",
      "Intareste paginile comerciale cu cerere reala dintr-un hub tech si educational",
    ],
    benefits: [
      {
        title: "Potrivita pentru parinti orientati spre progres",
        description:
          "Publicul din Cluj raspunde bine la promisiuni clare de invatare, autonomie si joaca practica, nu la descrieri generice de produs.",
      },
      {
        title: "Buna pentru cadouri si activitati acasa",
        description:
          "Copiii interesati de stiinta, coding si constructii pot fi directionati rapid spre colectii relevante.",
      },
      {
        title: "Consolideaza semnalele tematice",
        description:
          "Cand ghidurile, produsele si huburile comerciale trimit spre pagina locala, Google intelege mai bine relevanta regionala a site-ului.",
      },
    ],
    faq: [
      {
        question:
          "Care sunt cele mai potrivite jucarii STEM pentru Cluj-Napoca?",
        answer:
          "Cele mai potrivite sunt cele care combina invatarea practica cu autonomie: robotica pentru copii, experimente stiintifice si seturi de constructie cu componenta logica.",
      },
      {
        question:
          "De unde incep daca nu stiu ce categorie se potriveste copilului?",
        answer:
          "Porneste din pagina STEM principala sau din selectie pe varsta, apoi restrange spre robotica, stiinta sau jucarii inteligente.",
      },
      {
        question: "De ce este utila o pagina dedicata pentru Cluj?",
        answer:
          "Pentru ca raspunde expresiilor de cautare regionale si distribuie autoritatea catre paginile care rezolva intentia comerciala efectiva.",
      },
    ],
  },
  {
    slug: "timisoara",
    city: "Timisoara",
    county: "Timis",
    title:
      "Jucarii STEM Timisoara | Jucarii inteligente, robotica si experimente pentru copii",
    description:
      "Exploreaza jucarii STEM in Timisoara pentru copii curiosi: kituri de robotica, stiinta, constructii si jocuri educative alese dupa intentia de invatare.",
    heroTitle:
      "Jucarii STEM pentru Timisoara, cu rute comerciale clare spre robotica, stiinta si logica",
    heroDescription:
      "Pentru Timisoara, pagina ordoneaza cererea comerciala in jurul celor mai cautate directii: jucarii inteligente, experimente practice si kituri cu componenta tehnologica puternica.",
    proofPoints: [
      "Targeteaza cautari regionale cu intentie de cumparare, nu doar trafic generic",
      "Trimite rapid spre huburile nationale care concentreaza autoritate SEO",
      "Ajuta familiile sa aleaga dupa obiectiv educational si varsta",
    ],
    benefits: [
      {
        title: "Mai usor de gasit pentru cautari smart",
        description:
          "Expresii precum jucarii inteligente Timisoara sau robotica pentru copii Timisoara capata o destinatie dedicata, nu doar un rezultat generic.",
      },
      {
        title: "Mai bine aliniata cu intentia de selectie",
        description:
          "Pagina conduce utilizatorul spre produse si categorii relevante in loc sa-l lase sa caute printr-un catalog prea larg.",
      },
      {
        title: "Utila si pentru AI search",
        description:
          "Continutul local, FAQ-ul si relatiile interne ajuta motoarele AI sa extraga mai usor context util despre oferta si destinatie.",
      },
    ],
    faq: [
      {
        question:
          "Ce ar trebui sa aleg intre robotica si experimente pentru copii?",
        answer:
          "Robotica se potriveste copiilor atrasi de interactiune, mecanisme si coding. Experimentele sunt excelente pentru curiozitate, descoperire si invatare practica.",
      },
      {
        question: "Cum aleg jucarii inteligente pentru 6-8 ani?",
        answer:
          "Cauta produse care cer logica, pasi clari si participare activa, nu doar apasarea unui buton. Selectia dupa varsta este cel mai bun punct de pornire.",
      },
      {
        question: "Ajuta o pagina regionala la ranking?",
        answer:
          "Ajuta atunci cand este conectata la pagini comerciale reale, are continut util si raspunde unei cereri regionale verificabile.",
      },
    ],
  },
  {
    slug: "iasi",
    city: "Iasi",
    county: "Iasi",
    title:
      "Jucarii STEM Iasi | Jucarii educative, seturi de stiinta si jocuri inteligente",
    description:
      "Alege jucarii STEM in Iasi pentru copii interesati de stiinta, tehnologie, constructii si gandire logica. Pagina concentreaza cele mai importante rute comerciale din nisa.",
    heroTitle:
      "Jucarii STEM pentru Iasi, organizate pe cautarile care aduc familiile mai aproape de comanda",
    heroDescription:
      "In Iasi, pagina combina intentia regionala cu huburile nationale care performeaza in nisa: STEM, educative, inteligente si selectie pe varsta. Scopul este claritatea, nu volum inutil.",
    proofPoints: [
      "Acopera cautari precum jucarii STEM Iasi si jucarii educative Iasi",
      "Leaga cererea informationala de paginile cu intentie comerciala ridicata",
      "Sustine cautarile pentru scoala, cadouri si dezvoltare acasa",
    ],
    benefits: [
      {
        title: "Mai clar pentru parinti si bunici",
        description:
          "Cine cauta un cadou educativ sau o jucarie STEM buna ajunge mai repede la pagina potrivita pentru varsta si interes.",
      },
      {
        title: "Mai bun pentru cautari long-tail",
        description:
          "Termeni regionali plus categorie sau beneficiu tind sa converteasca mai bine decat interogarile largi de tip jucarii.",
      },
      {
        title: "Mai coerent pentru indexare",
        description:
          "Sitemap-ul, homepage-ul, blogul si produsele pot impinge impreuna spre aceeasi arhitectura comerciala si regionala.",
      },
    ],
    faq: [
      {
        question: "Ce cautari merita pagini dedicate pentru Iasi?",
        answer:
          "Cele mai valoroase sunt combinatiile dintre oras si intentie comerciala: jucarii STEM Iasi, jucarii educative Iasi, jocuri inteligente copii Iasi si robotica pentru copii Iasi.",
      },
      {
        question: "Cum aleg un cadou STEM reusit?",
        answer:
          "Cel mai simplu este sa pornesti de la varsta si de la ce il atrage pe copil: constructii, experimente, logica sau robotica.",
      },
      {
        question: "De ce nu este suficienta doar pagina de produse?",
        answer:
          "Pentru ca o pagina generica nu raspunde suficient de bine nici cautarii regionale, nici intrebarii comerciale care sta in spatele ei.",
      },
    ],
  },
  {
    slug: "constanta",
    city: "Constanta",
    county: "Constanta",
    title:
      "Jucarii STEM Constanta | Jucarii educative, robotica si jocuri de logica pentru copii",
    description:
      "Vezi jucarii STEM in Constanta pentru copii care invata mai bine prin experimente, constructii, robotica si jocuri inteligente. Gasesti rute comerciale clare spre categoriile potrivite.",
    heroTitle:
      "Jucarii STEM pentru Constanta, cu selectie rapida pentru parintii care cauta invatare prin joaca",
    heroDescription:
      "Pagina aduna cererea regionala din Constanta si o directioneaza spre huburile comerciale care acopera intentiile cele mai frecvente: stiinta, robotica, selectie pe varsta si cadouri educative.",
    proofPoints: [
      "Construita pentru cautari regionale din zona Constanta",
      "Ajuta familiile sa ajunga mai repede la categoriile cu intentie ridicata",
      "Leaga cautarile locale de pagini nationale puternice si indexabile",
    ],
    benefits: [
      {
        title: "Buna pentru cautari de tip cadou + oras",
        description:
          "Cand utilizatorul cauta o jucarie STEM sau un cadou educativ in Constanta, pagina ofera context si intrari clare spre selectie.",
      },
      {
        title: "Reduce frictiunea la alegere",
        description:
          "In loc de o navigare larga prin catalog, utilizatorul primeste trasee explicite spre jucarii inteligente, STEM si robotica.",
      },
      {
        title: "Sprijina ranking-ul national",
        description:
          "Paginile regionale bine conectate pot aduce relevanta suplimentara si intaresc autoritatea tematica a intregului cluster.",
      },
    ],
    faq: [
      {
        question: "Ce fel de jucarii STEM sunt potrivite pentru inceput?",
        answer:
          "Pentru inceput functioneaza bine experimentele simple, jocurile de logica si seturile de constructie care ofera rezultate vizibile rapid.",
      },
      {
        question: "Cand are sens sa aleg robotica pentru copii?",
        answer:
          "Are sens atunci cand copilul arata interes pentru mecanisme, interactiune, constructii pas cu pas sau programare de baza.",
      },
      {
        question: "Cum ajuta aceasta pagina la SEO?",
        answer:
          "Leaga o cautare regionala concreta de pagini comerciale reale, ceea ce imbunatateste claritatea tematica pentru motoarele de cautare.",
      },
    ],
  },
];

export function getRegionalStemPath(slug: string): string {
  return `/jucarii-stem/${slug}`;
}

export function getRegionalStemCity(
  slug: string
): RegionalStemCity | undefined {
  return regionalStemCities.find(city => city.slug === slug);
}

export function getRegionalStemLinks(limit?: number): SearchRouteCard[] {
  const links = regionalStemCities.map(city => ({
    href: getRegionalStemPath(city.slug),
    label: `Jucarii STEM ${city.city}`,
    description: `Pagina regionala pentru ${city.city} care trimite spre STEM, robotica, jucarii educative si selectie pe varsta.`,
  }));

  return typeof limit === "number" ? links.slice(0, limit) : links;
}

export function getBlogCommercialRoutes(
  stemCategory?: string | null
): SearchRouteCard[] {
  const primaryRoute = {
    SCIENCE: {
      href: "/categories/science-experiments",
      label: "Experimente stiintifice",
      description:
        "Categorie cu intentie comerciala pentru copii atrasi de descoperire, observatie si joc practic.",
    },
    TECHNOLOGY: {
      href: "/robotica-pentru-copii",
      label: "Robotica pentru copii",
      description:
        "Hub comercial pentru coding, roboti si produse cu componenta tehnologica puternica.",
    },
    ENGINEERING: {
      href: "/categories/magnetic-building",
      label: "Constructii si inginerie",
      description:
        "Pentru seturi care dezvolta spatialitatea, proiectarea si rezolvarea de probleme.",
    },
    MATHEMATICS: {
      href: "/jucarii-inteligente",
      label: "Jucarii inteligente",
      description:
        "Ruta comerciala pentru logica, autonomie si jocuri care cer gandire structurata.",
    },
  }[stemCategory || ""];

  const baseRoutes = primaryRoute
    ? nationalCommercialRoutes.filter(route => route.href !== primaryRoute.href)
    : nationalCommercialRoutes;

  return primaryRoute ? [primaryRoute, ...baseRoutes.slice(0, 4)] : baseRoutes;
}
