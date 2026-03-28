export type SearchRouteCard = {
  href: string;
  label: string;
  description: string;
};

export type RegionalStemCity = {
  slug: string;
  city: string;
  county: string;
  /** Meta title — format: Jucarii STEM [Oras] | TechTots — Livrare 1-3 zile */
  title: string;
  /** Meta description — 145-158 chars, includes keyword "jucarii stem [oras]" */
  description: string;
  /** H1 shown on the page */
  heroTitle: string;
  /** Local intro paragraph — 100-120 words, unique per city */
  heroDescription: string;
  /** ~50-word delivery info paragraph */
  deliveryInfo: string;
  /** 3 short proof bullets shown in the hero card */
  proofPoints: string[];
  /** 3 "De ce TechTots" benefit cards */
  benefits: Array<{ title: string; description: string }>;
  /** 2 city-specific FAQ items */
  faq: Array<{ question: string; answer: string }>;
};

export const nationalCommercialRoutes: SearchRouteCard[] = [
  {
    href: "/jucarii-stem",
    label: "Jucarii STEM",
    description:
      "Start pentru jucării STEM: joacă cu sens, potrivire după vârstă și linkuri către categorii.",
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
    title: "Jucarii STEM Bucuresti | TechTots — Livrare 1-3 zile",
    description:
      "Jucarii STEM Bucuresti cu livrare 1-3 zile. Selectie curata pe varste: robotica, experimente si constructii de la branduri premium europene. Alege rapid.",
    heroTitle:
      "Jucarii STEM Bucuresti — selectie curata pe varste, livrare 1-3 zile",
    heroDescription:
      "In Bucuresti, scolile si liceele cu traditie — de la profil real la mate-info — atrag an de an familii care pun accent pe performanta si pe concursuri scolare. Orasul gazduieste etape nationale de olimpiade si competitii STEM, iar universitatile tehnice si politehnica raman puncte de referinta pentru tinerii pasionati de inginerie si stiinta. In acest context, jucariile STEM ajuta parintii sa sustina acasa ceea ce copiii exerseaza la scoala: logica, experimente si curiozitate practica. Pentru familiile din Bucuresti, care navigheaza intre scoala, activitati extrascolare si timp liber de calitate, un magazin online cu produse alese pe varste si obiective educative poate face diferenta intre un cadou si un obiect care ii tine pe copii concentrati si mandri de ce construiesc.",
    deliveryInfo:
      "Comenzile catre Bucuresti sunt livrate prin curier, de obicei in 1-3 zile lucratoare, in functie de momentul plasarii si de disponibilitatea stocului. Poti opta si pentru ridicare din punct Easybox acolo unde reteaua acopera zona ta, pentru flexibilitate dupa programul de la birou sau de la scoala.",
    proofPoints: [
      "Selectie curata — produse alese pentru claritate pedagogica",
      "Branduri premium europene — calitate aliniata cu standardele capitalei",
      "Suport la alegere — recomandari pe varsta si tip de activitate",
    ],
    benefits: [
      {
        title: "Selectie curata",
        description:
          "Produse alese pentru claritate pedagogica, nu pentru aglomerarea catalogului cu mii de articole greu de filtrat.",
      },
      {
        title: "Branduri premium europene",
        description:
          "Calitate materiale si design aliniat cu standardele pe care familiile din capitala le asociaza cu investitii pe termen lung in educatie.",
      },
      {
        title: "Suport la alegere",
        description:
          "Recomandari pe varsta si pe tip de activitate, utile cand timpul e limitat si vrei un cadou sau o completare la ce invata copilul la scoala.",
      },
    ],
    faq: [
      {
        question: "Livrati in Bucuresti in aceeasi zi?",
        answer:
          "In general, livrarea standard este in 1-3 zile lucratoare. Livrarea in aceeasi zi nu este garantata; daca ai nevoie urgenta, verifica disponibilitatea si termenul comunicat la finalizarea comenzii sau contacteaza suportul inainte de plata.",
      },
      {
        question:
          "Am copil la profil matematica-informatica sau pasionat de robotica — gasesc kituri potrivite nivelului?",
        answer:
          "Da: poti filtra dupa varsta si tip de activitate (constructie, logica, experimente) si poti cere clarificari pentru alinierea la ce urmeaza la concursuri sau la cerintele de acasa.",
      },
    ],
  },
  {
    slug: "cluj-napoca",
    city: "Cluj-Napoca",
    county: "Cluj",
    title: "Jucarii STEM Cluj-Napoca | TechTots — Livrare 1-3 zile",
    description:
      "Jucarii STEM Cluj-Napoca cu livrare 1-3 zile. Kituri de robotica, experimente si constructii cu selectie curata pe varste si branduri premium europene.",
    heroTitle:
      "Jucarii STEM Cluj-Napoca — selectie curata pe varste, livrare 1-3 zile",
    heroDescription:
      "Cluj-Napoca se leaga puternic de universitate si de mediul academic: familiile din zona sunt obisnuite cu ideea ca invatarea nu se opreste la clasa. Liceele cu profil real si traditia competitiilor scolare din Transilvania fac din oras un loc unde curiozitatea pentru stiinta si tehnologie e cultivata constant. Cultura locala pune pret pe argumentatie, proiecte si lucru in echipa — valori pe care jucariile STEM le transpun in joaca: ipoteze, incercari, corectii si bucuria unui rezultat vizibil. Pentru parintii din Cluj, care isi doresc cadouri utile si coerente cu mediul educational al orasului, jucariile STEM sunt o extensie fireasca a interesului pentru invatare activa, nu doar pentru ecran sau jucarii zgomotoase.",
    deliveryInfo:
      "Livram prin curier in Cluj-Napoca, cu estimare 1-3 zile lucratoare. Easybox poate fi o varianta practica pentru studenti, parinti aflati intre campus, serviciu si activitatile copiilor, evitand cozi la ghiseu cand programul e incarcat.",
    proofPoints: [
      "Selectie curata — mai putin zgomot comercial, mai mult sens educational",
      "Branduri premium europene — durabilitate si siguranta garantate",
      "Recomandari pe varsta — pentru familii cu asteptari academice ridicate",
    ],
    benefits: [
      {
        title: "Selectie curata",
        description:
          "Mai putin zgomot comercial, mai mult sens pentru obiective educative reale.",
      },
      {
        title: "Branduri premium europene",
        description:
          "Aliniere cu asteptarile fata de durabilitate si siguranta ale familiilor cu background academic.",
      },
      {
        title: "Recomandari pe varsta",
        description:
          "Ajutor la alegere cand vrei ceva serios, potrivit si pentru familii cu preocupari educationale clare.",
      },
    ],
    faq: [
      {
        question: "Livrati in Cluj-Napoca in aceeasi zi?",
        answer:
          "Nu ne angajam la livrare in aceeasi zi; termenul tipic este 1-3 zile lucratoare. Pentru urgente, confirma disponibilitatea produsului si termenul afisat la checkout.",
      },
      {
        question:
          "Recomandati produse potrivite si pentru familii unde un parinte lucreaza in IT sau cercetare?",
        answer:
          "Da: poti orienta achizitia spre kituri si seturi care cultiva structurare, rezolvare de probleme si experiment controlat — utile acasa, indiferent de domeniul profesional al parintilor.",
      },
    ],
  },
  {
    slug: "timisoara",
    city: "Timisoara",
    county: "Timis",
    title: "Jucarii STEM Timisoara | TechTots — Livrare 1-3 zile",
    description:
      "Jucarii STEM Timisoara cu livrare 1-3 zile. Robotica, experimente si seturi cu scop educativ clar. Selectie curata pe varste si branduri premium europene.",
    heroTitle:
      "Jucarii STEM Timisoara — selectie curata pe varste, livrare 1-3 zile",
    heroDescription:
      "Timisoara are o traditie de politehnica si inginerie si un profil urban deschis spre inovatie si cooperare europeana. In scoli si licee, proiectele practice si interesul pentru tehnologie sunt adesea parte din identitatea educationala a zonei. Fara a promite cifre, se observa in comunitate aprecierea pentru invatarea aplicata: sa vezi cum iese un mecanism, un circuit sau un model. Jucariile STEM se potrivesc acestui spirit: transforma principii abstracte in obiecte pe care copilul le manipuleaza, testeaza si imbunatateste. Pentru familiile din Timisoara, care isi doresc timp de calitate si o legatura clara intre joaca si competente utile mai tarziu, un magazin cu produse filtrate profesionist reduce riscul de a cumpara inca o jucarie si creste sansa de a cumpara un instrument de invatare.",
    deliveryInfo:
      "Comenzile spre Timisoara ajung prin curier, de regula in 1-3 zile lucratoare. Unde exista acoperire, Easybox poate fi aleasa pentru ridicare dupa program, util mai ales cand ai deplasari scurte intre cartiere sau cand nu e cineva acasa la intervalul curierului.",
    proofPoints: [
      "Selectie curata — focus pe seturi cu scop educativ clar",
      "Branduri premium europene — calitate consistenta pentru uz repetat",
      "Recomandari pe varsta — sprijin rapid pentru parinti ocupati",
    ],
    benefits: [
      {
        title: "Selectie curata",
        description:
          "Focus pe seturi cu scop educativ clar, nu pe volume mari de articole slab diferentiate.",
      },
      {
        title: "Branduri premium europene",
        description:
          "Consistenta calitativa potrivita pentru cadouri si pentru folosit repetat acasa.",
      },
      {
        title: "Recomandari pe varsta",
        description:
          "Sprijin pentru parinti ocupati care vor rapid o varianta potrivita nivelului copilului.",
      },
    ],
    faq: [
      {
        question: "Livrati in Timisoara in aceeasi zi?",
        answer:
          "Livrarea standard este 1-3 zile lucratoare. Livrarea in aceeasi zi nu este standard; verifica termenul din cos si mesajele de disponibilitate la finalizarea comenzii.",
      },
      {
        question:
          "Sunt potrivite produsele pentru copii care merg la cercuri de stiinta sau ateliere locale?",
        answer:
          "Da: poti alege kituri care completeaza interesul pentru experiment si constructie; daca ai un obiectiv anume (mecanica, electricitate simpla, logica), poti cere orientare inainte de comanda.",
      },
    ],
  },
  {
    slug: "iasi",
    city: "Iasi",
    county: "Iasi",
    title: "Jucarii STEM Iasi | TechTots — Livrare 1-3 zile",
    description:
      "Jucarii STEM Iasi cu livrare 1-3 zile. Kituri educative, robotica si experimente cu selectie curata pe varste. Branduri premium europene, alegere usoara.",
    heroTitle:
      "Jucarii STEM Iasi — selectie curata pe varste, livrare 1-3 zile",
    heroDescription:
      "Iasul poarta amprenta unui centru universitar vechi si a unei comunitati care leaga traditia culturala de performanta scolara. Liceele cu profil real si interesul pentru olimpiade si concursuri sunt parte din peisajul educational al Moldovei, iar familiile investesc adesea in pregatire suplimentara si in obiecte care sustin disciplina si curiozitatea. In acest cadru, jucariile STEM nu sunt doar divertisment: sunt un mod de a exersa acasa rigoarea si bucuria unei solutii gasite singur. Pentru parintii din Iasi, care cauta cadouri cu sens si care vor sa evite kitsch-ul, un catalog cu selectie pedagogica ajuta la alinierea dintre ce isi doreste copilul si ce il ajuta cu adevarat.",
    deliveryInfo:
      "Livram in Iasi prin curier, cu estimare 1-3 zile lucratoare. Ridicarea Easybox poate fi utila daca locuiesti in zone cu acces mai dificil la anumite intervale sau daca preferi sa nu depinzi de prezenta la usa in timpul zilei.",
    proofPoints: [
      "Selectie curata — mai putine variante de umplut, mai multe cu scop clar",
      "Branduri premium europene — incredere in materiale pentru uz repetat",
      "Recomandari pe varsta — cadou potrivit si impresionant pentru familie",
    ],
    benefits: [
      {
        title: "Selectie curata",
        description:
          "Mai putine variante de umplut, mai multe variante cu scop clar.",
      },
      {
        title: "Branduri premium europene",
        description:
          "Incredere in materiale si instructiuni pentru uz repetat acasa.",
      },
      {
        title: "Recomandari pe varsta",
        description:
          "Utile cand vrei un cadou care sa fie si potrivit, si impresionant pentru familia extinsa.",
      },
    ],
    faq: [
      {
        question: "Livrati in Iasi in aceeasi zi?",
        answer:
          "Nu garantam livrarea in aceeasi zi; in mod obisnuit livrarea este in 1-3 zile lucratoare. Pentru termene stranse, verifica disponibilitatea produsului si mesajele din procesul de comanda.",
      },
      {
        question:
          "Potrivite pentru familii care vor sa sustina pregatirea la matematica sau informatica fara presiune excesiva?",
        answer:
          "Da: poti opta pentru activitati care dezvolta gandirea logica si lucrul pas cu pas, ca alternativa sanatoasa la excesul de ecran, pastrand totusi legatura cu disciplinele scolare.",
      },
    ],
  },
  {
    slug: "constanta",
    city: "Constanta",
    county: "Constanta",
    title: "Jucarii STEM Constanta | TechTots — Livrare 1-3 zile",
    description:
      "Jucarii STEM Constanta cu livrare 1-3 zile. Robotica, experimente si constructii cu selectie curata pe varste. Branduri premium europene, livrare prin curier.",
    heroTitle:
      "Jucarii STEM Constanta — selectie curata pe varste, livrare 1-3 zile",
    heroDescription:
      "La Constanta, ritmul orasului portuar si turistic se imbina cu scoli si licee unde performanta scolara ramane importanta pentru multe familii. Apropierea de mare aduce adesea deschidere catre domenii precum geografie aplicata, biologie in sens popular si curiozitate fata de cum functioneaza lumea — de la mecanisme simple la fenomene observabile. Jucariile STEM pot ancora aceasta curiozitate in experimente si constructii concrete, utile mai ales in sezoanele cand timpul petrecut in interior creste sau cand vrei alternative la divertisment pasiv. Pentru parintii din Constanta, care cauta cadouri practice pentru copii cu program incarcat intre scoala si activitati, un magazin cu produse alese pe varste reduce incertitudinea si sustine invatarea prin joaca.",
    deliveryInfo:
      "Livram prin curier catre Constanta, de obicei in 1-3 zile lucratoare. In zone turistice sau in perioade aglomerate, Easybox poate fi o solutie stabila pentru ridicare cand intervalul curierului nu coincide cu prezenta acasa.",
    proofPoints: [
      "Selectie curata — mai simplu de ales fara categorii aglomerate",
      "Branduri premium europene — calitate rezistenta pentru cadouri",
      "Recomandari pe varsta — ajutor rapid pentru orice nivel scolar",
    ],
    benefits: [
      {
        title: "Selectie curata",
        description:
          "Mai simplu de ales cand nu vrei sa pierzi ore prin categorii aglomerate si slab diferentiate.",
      },
      {
        title: "Branduri premium europene",
        description:
          "Potrivit pentru cadouri de calitate, rezistente la uz si sigure pentru copii.",
      },
      {
        title: "Recomandari pe varsta",
        description:
          "Ajutor rapid cand achizitia e pentru un copil pe care il vezi mai rar sau pentru un nivel scolar anume.",
      },
    ],
    faq: [
      {
        question: "Livrati in Constanta in aceeasi zi?",
        answer:
          "Livrarea in aceeasi zi nu este garantata; termenul tipic este 1-3 zile lucratoare. In sezon sau in weekenduri aglomerate, confirma termenul afisat la finalizarea comenzii.",
      },
      {
        question:
          "Produse potrivite si pentru familii care vor sa lege joaca de curiozitatea despre natura sau fenomene observabile?",
        answer:
          "Da: poti orienta spre seturi cu experimente, explorare si activitati practice care cultiva observatia si explicatia simpla, fara a inlocui materialele scolare oficiale.",
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
    description: `Selectie curata de jucarii STEM in ${city.city} cu livrare 1-3 zile. Branduri premium europene, recomandate pe varste.`,
  }));

  return typeof limit === "number" ? links.slice(0, limit) : links;
}

export function getBlogCommercialRoutes(
  stemCategory?: string | null
): SearchRouteCard[] {
  const primaryRoute = {
    SCIENCE: {
      href: "/jucarii-stem",
      label: "Jucarii STEM",
      description:
        "Ruta comerciala larga pentru copii atrasi de descoperire, observatie si joc practic.",
    },
    TECHNOLOGY: {
      href: "/robotica-pentru-copii",
      label: "Robotica pentru copii",
      description:
        "Hub comercial pentru coding, roboti si produse cu componenta tehnologica puternica.",
    },
    ENGINEERING: {
      href: "/jucarii-stem",
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
