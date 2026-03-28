/**
 * Competitive Keyword Analysis for Romanian STEM Toys Market
 * Advanced keyword targeting to dominate search results
 */

export interface KeywordTarget {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  intent: "commercial" | "informational" | "navigational" | "transactional";
  priority: "high" | "medium" | "low";
  targetPage: string;
  competitorGap: boolean;
}

/**
 * High-priority Romanian STEM keywords to target
 */
export const HIGH_PRIORITY_KEYWORDS: KeywordTarget[] = [
  // Commercial intent - High conversion
  {
    keyword: "jucării STEM România",
    searchVolume: 1200,
    difficulty: 65,
    intent: "commercial",
    priority: "high",
    targetPage: "/products",
    competitorGap: true
  },
  {
    keyword: "jucării educaționale STEM copii",
    searchVolume: 800,
    difficulty: 55,
    intent: "commercial", 
    priority: "high",
    targetPage: "/products",
    competitorGap: true
  },
  {
    keyword: "robotică educațională România",
    searchVolume: 600,
    difficulty: 50,
    intent: "commercial",
    priority: "high", 
    targetPage: "/categories/robotics",
    competitorGap: true
  },

  // Long-tail commercial - Lower competition
  {
    keyword: "jucării STEM 6 ani România",
    searchVolume: 300,
    difficulty: 35,
    intent: "commercial",
    priority: "high",
    targetPage: "/jucarii-stem-dupa-varsta",
    competitorGap: true
  },
  {
    keyword: "kituri experimente științifice copii",
    searchVolume: 450,
    difficulty: 40,
    intent: "commercial",
    priority: "high",
    targetPage: "/categories/science-kits",
    competitorGap: true
  },

  // Informational - High authority building
  {
    keyword: "educație STEM România beneficii",
    searchVolume: 500,
    difficulty: 45,
    intent: "informational",
    priority: "high",
    targetPage: "/blog/beneficiile-educatiei-stem-pentru-copiii-romani",
    competitorGap: true
  },
  {
    keyword: "curriculum STEM românesc 2025",
    searchVolume: 350,
    difficulty: 40,
    intent: "informational",
    priority: "high",
    targetPage: "/ghid-educatie-stem-romania",
    competitorGap: true
  },

  // Local + Commercial
  {
    keyword: "magazin jucării STEM București",
    searchVolume: 200,
    difficulty: 30,
    intent: "commercial",
    priority: "medium",
    targetPage: "/",
    competitorGap: true
  },
  {
    keyword: "jucării STEM online România livrare",
    searchVolume: 180,
    difficulty: 25,
    intent: "commercial",
    priority: "medium", 
    targetPage: "/",
    competitorGap: true
  },

  // Educational professional
  {
    keyword: "resurse educatori STEM România",
    searchVolume: 250,
    difficulty: 35,
    intent: "informational",
    priority: "medium",
    targetPage: "/resurse-educatori",
    competitorGap: true
  },
  {
    keyword: "planuri lecție STEM primar",
    searchVolume: 150,
    difficulty: 30,
    intent: "informational",
    priority: "medium",
    targetPage: "/planuri-lectie-stem",
    competitorGap: true
  },

  // Parent-focused
  {
    keyword: "cum să aleg jucării STEM copil",
    searchVolume: 400,
    difficulty: 35,
    intent: "informational",
    priority: "high",
    targetPage: "/ghid-alegere-jucarii-stem",
    competitorGap: true
  },
  {
    keyword: "jucării STEM acasă activități",
    searchVolume: 300,
    difficulty: 30,
    intent: "informational",
    priority: "medium",
    targetPage: "/activitati-stem-acasa",
    competitorGap: true
  },

  // Brand + Product specific
  {
    keyword: "LEGO Mindstorms România preț",
    searchVolume: 120,
    difficulty: 20,
    intent: "commercial",
    priority: "medium",
    targetPage: "/products/lego-mindstorms-robot-inventor",
    competitorGap: false
  },
  {
    keyword: "Arduino kit începători România",
    searchVolume: 180,
    difficulty: 25,
    intent: "commercial",
    priority: "medium",
    targetPage: "/products/arduino-starter-kit",
    competitorGap: true
  },

  // Seasonal and trending
  {
    keyword: "cadouri educaționale STEM Crăciun",
    searchVolume: 800,
    difficulty: 45,
    intent: "commercial",
    priority: "high",
    targetPage: "/cadouri-stem-craciun",
    competitorGap: true
  },
  {
    keyword: "jucării STEM început școală",
    searchVolume: 600,
    difficulty: 40,
    intent: "commercial",
    priority: "high",
    targetPage: "/jucarii-stem-inceput-scoala",
    competitorGap: true
  },
];

/**
 * Competitor analysis data
 */
export const COMPETITOR_ANALYSIS = {
  "emag.ro": {
    strengths: ["Domain authority", "Brand recognition", "Large inventory"],
    weaknesses: ["Generic descriptions", "No educational focus", "Poor STEM categorization"],
    opportunities: ["Educational content gap", "Romanian curriculum alignment", "Expert positioning"]
  },
  "altex.ro": {
    strengths: ["Technical products", "Local presence"],
    weaknesses: ["Limited STEM focus", "No educational resources", "Poor content quality"],
    opportunities: ["STEM specialization", "Educational partnerships", "Parent resources"]
  },
  "noriel.ro": {
    strengths: ["Toy specialization", "Physical stores"],
    weaknesses: ["Limited STEM selection", "No educational context", "Outdated SEO"],
    opportunities: ["STEM expertise", "Educational authority", "Modern SEO"]
  }
};

/**
 * Generate keyword-optimized content suggestions
 */
export function generateKeywordOptimizedContent(keyword: KeywordTarget): {
  title: string;
  description: string;
  headings: string[];
  contentOutline: string[];
} {
  const { keyword: kw, intent } = keyword;

  if (intent === "commercial") {
    return {
      title: `${kw.charAt(0).toUpperCase() + kw.slice(1)} - Certificate MECTS | TechTots`,
      description: `Descoperiți ${kw} de cea mai bună calitate! Certificate MECTS, aliniate cu curriculumul românesc. Livrare rapidă în toată România.`,
      headings: [
        `Cele Mai Bune ${kw.charAt(0).toUpperCase() + kw.slice(1)}`,
        `De ce să Alegeți ${kw} de la TechTots?`,
        `Certificări și Siguranță`,
        `Ghid de Alegere După Vârstă`,
        `Opinii și Recenzii Clienți`
      ],
      contentOutline: [
        "Introducere în importanța produselor STEM",
        "Criteriile de selecție pentru produse de calitate",
        "Prezentarea colecției noastre certificate",
        "Beneficiile educaționale specifice",
        "Ghid de utilizare și activități recomandate",
        "Testimoniale și povești de succes",
        "Informații despre livrare și garanție"
      ]
    };
  } else {
    return {
      title: `${kw.charAt(0).toUpperCase() + kw.slice(1)}: Ghid Complet pentru Părinții Români`,
      description: `Tot ce trebuie să știți despre ${kw}. Ghid bazat pe cercetări științifice și aliniat cu curriculumul românesc.`,
      headings: [
        `Ce Înseamnă ${kw.charAt(0).toUpperCase() + kw.slice(1)}?`,
        `Beneficiile Dovedite Științific`, 
        `Implementarea în Contextul Românesc`,
        `Strategii Practice pentru Părinți`,
        `Resurse și Instrumente Recomandate`
      ],
      contentOutline: [
        "Definiția și importanța conceptului",
        "Cercetări și studii relevante",
        "Contextul educațional românesc",
        "Strategii de implementare acasă",
        "Resurse și produse recomandate",
        "Măsurarea progresului și rezultatelor",
        "Întrebări frecvente și răspunsuri"
      ]
    };
  }
}

/**
 * SEO content templates for different page types
 */
export const SEO_CONTENT_TEMPLATES = {
  productPage: {
    structuredContent: [
      "Descrierea detaliată a produsului",
      "Beneficiile educaționale specifice", 
      "Alinierea cu curriculumul românesc",
      "Ghid de utilizare pas cu pas",
      "Activități și proiecte recomandate",
      "Întrebări frecvente despre produs",
      "Produse complementare și accesorii"
    ],
    keywordDensity: {
      primary: "2-3%",
      secondary: "1-2%", 
      longtail: "0.5-1%"
    }
  },
  categoryPage: {
    structuredContent: [
      "Introducere în categoria de produse",
      "Beneficiile educaționale ale categoriei",
      "Ghid de alegere după vârstă",
      "Comparație între produse din categorie",
      "Activități și experimente recomandate",
      "Resurse educaționale suplimentare"
    ]
  },
  blogPost: {
    structuredContent: [
      "Introducere captivantă cu statistici",
      "Contextul românesc și relevanța locală",
      "Beneficiile dovedite științific",
      "Strategii practice de implementare",
      "Studii de caz și povești de succes",
      "Resurse și instrumente recomandate",
      "Concluzie cu call-to-action"
    ]
  }
};

/**
 * Generate semantic keyword variations
 */
export function generateSemanticKeywords(primaryKeyword: string): string[] {
  const semanticMap: Record<string, string[]> = {
    "jucării STEM": [
      "jocuri educaționale STEM",
      "produse educaționale STEM", 
      "instrumente învățare STEM",
      "materiale didactice STEM",
      "echipamente educaționale STEM"
    ],
    "educație STEM": [
      "învățământ STEM",
      "pedagogie STEM",
      "metodologie STEM", 
      "curriculum STEM",
      "formare STEM"
    ],
    "robotică educațională": [
      "robotică pentru copii",
      "kituri robotică educaționale",
      "programare robotică copii",
      "tehnologie robotică educativă",
      "învățare prin robotică"
    ]
  };

  const baseVariations = semanticMap[primaryKeyword] || [];
  
  // Add Romanian educational context
  const educationalVariations = baseVariations.map(variation => [
    `${variation} România`,
    `${variation} curriculum românesc`,
    `${variation} copii români`,
    `${variation} certificat MECTS`
  ]).flat();

  return [...baseVariations, ...educationalVariations];
}

/**
 * Local SEO keyword targeting for Romanian cities
 */
export const ROMANIAN_CITIES_KEYWORDS = [
  "jucării STEM București",
  "jucării STEM Cluj-Napoca", 
  "jucării STEM Timișoara",
  "jucării STEM Iași",
  "jucării STEM Constanța",
  "jucării STEM Craiova",
  "jucării STEM Brașov",
  "jucării STEM Galați",
  "jucării STEM Ploiești",
  "jucării STEM Oradea"
];

/**
 * Seasonal keyword opportunities
 */
export const SEASONAL_KEYWORDS = {
  "back-to-school": [
    "jucării STEM început școală",
    "pregătire școală STEM",
    "rechizite STEM copii",
    "educație STEM prima clasă"
  ],
  "christmas": [
    "cadouri STEM Crăciun",
    "jucării educaționale Crăciun",
    "idei cadouri STEM copii",
    "surprize educaționale STEM"
  ],
  "summer": [
    "activități STEM vară", 
    "tabere STEM copii",
    "experimente STEM acasă",
    "proiecte STEM vacanță"
  ],
  "easter": [
    "cadouri STEM Paște",
    "activități STEM primăvară",
    "experimente STEM natură"
  ]
};

/**
 * Generate content calendar based on keyword opportunities
 */
export function generateContentCalendar(year: number = 2025) {
  return {
    January: [
      "Planificarea educației STEM pentru noul an",
      "Rezoluții educaționale STEM pentru părinți",
      "Tendințe STEM 2025 pentru copii"
    ],
    February: [
      "Ziua Internațională a Femeilor în Știință - STEM pentru fete",
      "Activități STEM de Dragobete pentru copii",
      "Dezvoltarea creativității prin STEM"
    ],
    March: [
      "Săptămâna Științei - activități STEM acasă", 
      "Pregătirea pentru Evaluarea Națională cu STEM",
      "Primăvara și experimentele STEM în natură"
    ],
    April: [
      "Ziua Pământului - experimente STEM ecologice",
      "Activități STEM pentru vacanța de Paște",
      "Proiecte STEM pentru grădină și natură"
    ],
    May: [
      "Ziua Copilului - cadouri STEM educaționale",
      "Pregătirea pentru vacanța de vară cu STEM",
      "Proiecte STEM pentru finalul anului școlar"
    ],
    June: [
      "Activități STEM pentru vacanța mare",
      "Tabere STEM acasă - ghid pentru părinți", 
      "Experimente STEM de vară în aer liber"
    ],
    July: [
      "Proiecte STEM pentru zilele călduroase",
      "Activități STEM în călătorii și concedii",
      "Menținerea ritmului de învățare prin STEM"
    ],
    August: [
      "Pregătirea pentru noul an școlar cu STEM",
      "Rechizite și jucării STEM pentru școală",
      "Evaluarea progresului STEM din vacanță"
    ],
    September: [
      "Începutul anului școlar - integrarea STEM",
      "Rutina zilnică STEM pentru școlari",
      "Colaborarea cu profesorii pentru educația STEM"
    ],
    October: [
      "Halloween STEM - experimente înfricoșătoare",
      "Proiecte STEM de toamnă",
      "Evaluarea competențelor STEM primul trimestru"
    ],
    November: [
      "Săptămâna Educației - promovarea STEM",
      "Pregătirea pentru sărbători cu proiecte STEM",
      "Activități STEM pentru zilele scurte"
    ],
    December: [
      "Cadouri STEM pentru Crăciun - ghid complet",
      "Bilanțul anului în educația STEM",
      "Planuri STEM pentru anul următor"
    ]
  };
}

/**
 * Competitor keyword gaps - opportunities to exploit
 */
export const COMPETITOR_GAPS = [
  {
    keyword: "jucării STEM certificate MECTS",
    opportunity: "Competitors don't emphasize Romanian certification",
    strategy: "Create dedicated certification page and mention in all product descriptions"
  },
  {
    keyword: "curriculum STEM românesc aliniere",
    opportunity: "No competitor aligns products with Romanian curriculum", 
    strategy: "Create curriculum alignment guides for each product"
  },
  {
    keyword: "educație STEM acasă România ghid",
    opportunity: "No comprehensive home education guides in Romanian",
    strategy: "Create detailed parent resources and implementation guides"
  },
  {
    keyword: "dezvoltare abilități STEM copii români",
    opportunity: "Generic international content, no Romanian context",
    strategy: "Create Romania-specific child development content"
  },
  {
    keyword: "jucării STEM profesori România resurse",
    opportunity: "No educator-focused content or resources",
    strategy: "Create teacher resource center and lesson plans"
  }
];

/**
 * Generate meta descriptions optimized for CTR
 */
export function generateHighCTRMetaDescription(keyword: string, intent: string): string {
  const templates = {
    commercial: [
      `Descoperiți ${keyword} certificate MECTS! ✅ Livrare gratuită ✅ Garanție 2 ani ✅ Suport educațional în română. Comandați acum!`,
      `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} de calitate superioară! 🎓 Certificate MECTS 🚚 Livrare 24h 💰 Preț garantat cel mai bun.`,
      `TOP ${keyword} pentru copiii români! ⭐ Recenzii excelente ⭐ Certificare europeană ⭐ Ghiduri în română incluse.`
    ],
    informational: [
      `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: ghid complet 2025! 📚 Bazat pe cercetări 🎯 Context românesc 💡 Strategii practice.`,
      `Tot ce trebuie să știți despre ${keyword}! ✨ Ghid actualizat ✨ Sfaturi de experți ✨ Rezultate garantate.`,
      `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} explicat simplu! 🧠 Pentru părinți români 📖 Cu exemple practice 🎯 Rezultate măsurabile.`
    ]
  };

  const typeTemplates = templates[intent as keyof typeof templates] || templates.informational;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}

/**
 * Generate title variations for A/B testing
 */
export function generateTitleVariations(keyword: string): string[] {
  return [
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - Ghid Complet România 2025`,
    `TOP ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Certificate MECTS | TechTots`,
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Tot Ce Trebuie Să Știți în România`,
    `Ghidul Definitiv pentru ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} în România`,
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Certificate - Livrare Gratuită România`
  ];
}
