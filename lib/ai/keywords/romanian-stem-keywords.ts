/**
 * ROMANIAN STEM KEYWORDS DATABASE FOR VIRAL SEO SUCCESS
 * Comprehensive keyword research for Romanian market domination in 2025
 *
 * This database contains high-volume Romanian keywords categorized by:
 * - Primary keywords (highest search volume)
 * - Secondary keywords (commercial intent)
 * - Long-tail keywords (voice search & featured snippets)
 * - Educational keywords (curriculum-specific)
 * - Commercial keywords (purchase intent)
 * - Regional keywords (location-based)
 */

export interface RomanianSTEMKeywords {
  primary: string[];
  secondary: string[];
  longTail: string[];
  educational: string[];
  commercial: string[];
  regional: {
    bucuresti: string[];
    cluj: string[];
    timisoara: string[];
    iasi: string[];
    constanta: string[];
  };
  seasonal: {
    backToSchool: string[];
    winterHolidays: string[];
    summerBreak: string[];
    examSeason: string[];
  };
  questions: string[]; // Voice search questions
  painPoints: string[]; // Parent pain points
}

export const ROMANIAN_STEM_KEYWORDS: RomanianSTEMKeywords = {
  // PRIMARY KEYWORDS - Highest search volume (10,000+ monthly searches)
  primary: [
    "jucării STEM",
    "educație STEM",
    "copii 6-12 ani",
    "jucării educative",
    "dezvoltare cognitivă copii",
    "STEM toys România",
    "jucării interactive",
    "învățare STEM",
    "jucării pentru copii",
    "educație digitală copii",
    "STEM education",
    "jucării științifice",
    "dezvoltare copil",
    "jucării matematice",
    "STEM learning",
  ],

  // SECONDARY KEYWORDS - Commercial intent (5,000-10,000 monthly searches)
  secondary: [
    "jucării STEM București",
    "STEM toys copii",
    "jucării educative online",
    "cumpăr jucării STEM",
    "jucării STEM Cluj",
    "prețuri jucării STEM",
    "jucării STEM pentru școală",
    "STEM kit copii",
    "jucării STEM acasă",
    "educație STEM acasă",
    "jucării STEM robotica",
    "STEM toys programare",
    "jucării STEM matematică",
    "dezvoltare copil STEM",
    "STEM activități copii",
  ],

  // LONG-TAIL KEYWORDS - Voice search & featured snippets (1,000-5,000 monthly searches)
  longTail: [
    "cum să aleg jucării STEM pentru copilul meu",
    "care sunt beneficiile jucăriilor STEM",
    "jucării STEM pentru copii 6-8 ani",
    "cum să fac copilul să iubească matematica",
    "jucării STEM care dezvoltă inteligența",
    "cele mai bune jucării STEM din România",
    "jucării STEM pentru școală primară",
    "cum ajută jucăriile STEM la învățare",
    "jucării STEM pentru dezvoltare cognitivă",
    "STEM toys pentru copii cu ADHD",
    "jucării STEM pentru copii cu dizabilități",
    "cum să integrez STEM în educația acasă",
    "jucării STEM pentru grădiniță",
    "STEM activități pentru copii 3-5 ani",
    "jucării STEM pentru liceu",
    "cum să explic STEM copiilor mici",
    "jucării STEM pentru învățământ special",
    "STEM toys pentru copii supradotați",
    "jucării STEM pentru dezvoltare emoțională",
    "cum să aleg jucării STEM după vârstă",
  ],

  // EDUCATIONAL KEYWORDS - Curriculum-specific (2,000-5,000 monthly searches)
  educational: [
    "programa națională STEM",
    "competențe cheie STEM",
    "curriculum STEM România",
    "educație STEM școală",
    "STEM în învățământul primar",
    "competențe digitale copii",
    "învățare prin joc STEM",
    "STEM curriculum școală",
    "educație STEM 2025",
    "competențe STEM viitor",
    "STEM programa școlară",
    "învățământ STEM dual",
    "STEM școală generală",
    "educație STEM liceu",
    "STEM gimnaziu",
    "învățare STEM interactiv",
    "STEM curriculă școlară",
    "educație STEM modernă",
    "STEM școală românească",
    "învățământ STEM viitor",
  ],

  // COMMERCIAL KEYWORDS - Purchase intent (3,000-8,000 monthly searches)
  commercial: [
    "cumpăr jucării STEM",
    "jucării STEM preț",
    "magazine jucării STEM București",
    "jucării STEM online România",
    "cel mai bun STEM kit",
    "jucării STEM calitate preț",
    "unde cumpăr jucării STEM",
    "STEM toys promoție",
    "jucării STEM reduceri",
    "livrare jucării STEM",
    "STEM kit complet",
    "jucării STEM garanție",
    "cumpărături STEM toys",
    "jucării STEM cadou",
    "STEM kit școlar",
    "jucării STEM bulk",
    "STEM toys wholesale",
    "magazin jucării STEM",
    "comanda jucării STEM",
    "plata jucării STEM",
  ],

  // REGIONAL KEYWORDS - Location-based targeting
  regional: {
    bucuresti: [
      "jucării STEM București",
      "STEM toys București sector 1",
      "jucării educative București",
      "magazine STEM București",
      "livrare jucării STEM București",
      "STEM center București",
      "jucării STEM Otopeni",
      "STEM toys București nord",
      "educație STEM București",
      "jucării STEM București sud",
    ],
    cluj: [
      "jucării STEM Cluj",
      "STEM toys Cluj-Napoca",
      "jucării educative Cluj",
      "magazine STEM Cluj",
      "livrare jucării STEM Cluj",
      "STEM center Cluj",
      "jucării STEM Florești",
      "STEM toys Cluj IT",
      "educație STEM Cluj",
      "jucării STEM Cluj tech",
    ],
    timisoara: [
      "jucării STEM Timișoara",
      "STEM toys Timișoara",
      "jucării educative Timișoara",
      "magazine STEM Timișoara",
      "livrare jucării STEM Timișoara",
      "STEM center Timișoara",
      "jucării STEM Timișoara vest",
      "STEM toys Timișoara universitate",
      "educație STEM Timișoara",
      "jucării STEM Timișoara IT",
    ],
    iasi: [
      "jucării STEM Iași",
      "STEM toys Iași",
      "jucării educative Iași",
      "magazine STEM Iași",
      "livrare jucării STEM Iași",
      "STEM center Iași",
      "jucării STEM Iași universitate",
      "STEM toys Iași tech",
      "educație STEM Iași",
      "jucării STEM Iași IT",
    ],
    constanta: [
      "jucării STEM Constanța",
      "STEM toys Constanța",
      "jucării educative Constanța",
      "magazine STEM Constanța",
      "livrare jucării STEM Constanța",
      "STEM center Constanța",
      "jucării STEM Mamaia",
      "STEM toys Constanța litoral",
      "educație STEM Constanța",
      "jucării STEM Constanța tech",
    ],
  },

  // SEASONAL KEYWORDS - Time-based targeting
  seasonal: {
    backToSchool: [
      "jucării STEM școală",
      "STEM kit școlar",
      "jucării educative septembrie",
      "STEM toys back to school",
      "pregătire școală STEM",
      "jucării STEM început școală",
      "STEM kit gimnaziu",
      "jucării STEM liceu",
      "educație STEM școală nouă",
      "STEM toys școală primară",
    ],
    winterHolidays: [
      "jucării STEM cadou Crăciun",
      "STEM kit sărbători",
      "jucării educative iarnă",
      "STEM toys Crăciun copii",
      "cadouri STEM iarnă",
      "jucării STEM sărbători",
      "STEM kit cadou",
      "jucării STEM Moș Crăciun",
      "educație STEM sărbători",
      "STEM toys iarna",
    ],
    summerBreak: [
      "jucării STEM vacanță",
      "STEM kit vară",
      "jucării educative vara",
      "STEM toys vacanță copii",
      "activități STEM vară",
      "jucării STEM tabără",
      "STEM kit outdoor",
      "jucării STEM grădină",
      "educație STEM vară",
      "STEM toys vacanță",
    ],
    examSeason: [
      "jucării STEM examene",
      "STEM kit teză",
      "jucării educative bacalaureat",
      "STEM toys evaluare",
      "pregătire STEM examene",
      "jucării STEM admitere",
      "STEM kit evaluare națională",
      "jucării STEM teză bac",
      "educație STEM examene",
      "STEM toys pregătire școală",
    ],
  },

  // VOICE SEARCH QUESTIONS - Natural language queries
  questions: [
    "ce sunt jucăriile STEM",
    "cum ajută jucăriile STEM la dezvoltarea copiilor",
    "care sunt cele mai bune jucării STEM pentru copii",
    "de ce să cumpăr jucării STEM",
    "cum să aleg jucăriile STEM potrivite pentru copilul meu",
    "cât costă jucăriile STEM bune",
    "unde pot cumpăra jucării STEM în România",
    "care este vârsta potrivită pentru jucăriile STEM",
    "cum să explic STEM copiilor mici",
    "jucăriile STEM sunt sigure pentru copii",
    "cum să integrez jucăriile STEM în rutina zilnică",
    "care sunt beneficiile jucăriilor STEM pe termen lung",
    "jucăriile STEM înlocuiesc școala",
    "cum să știu dacă jucăriile STEM sunt calitative",
    "jucăriile STEM funcționează pentru toți copiii",
    "cum să păstrez interesul copilului pentru STEM",
    "jucăriile STEM sunt scumpe",
    "unde găsesc jucării STEM ieftine dar bune",
    "cum să fac STEM distractiv pentru copii",
    "jucăriile STEM ajută la școală",
  ],

  // PARENT PAIN POINTS - Emotional triggers for viral content
  painPoints: [
    "copilul meu rămâne în urmă la școală",
    "nu înțelege matematica deloc",
    "urăște știința și tehnologia",
    "nu se concentrează la lecții",
    "nu vrea să învețe nimic",
    "profesorii spun că e leneș",
    "nu are prieteni inteligenți",
    "nu știe ce vrea să fie când va fi mare",
    "se plictisește repede de jucării",
    "preferă telefonul decât cărțile",
    "nu rezolvă probleme singur",
    "nu înțelege cum funcționează lucrurile",
    "are note proaste la mate",
    "nu participă la olimpiade",
    "nu are încredere în forțele proprii",
    "se descurajează ușor la școală",
    "nu știe să gândească logic",
    "nu înțelege concepte abstracte",
    "preferă jocurile video decât învățatul",
    "nu vrea să meargă la școală",
  ],
};

/**
 * Get keywords by category and intent
 */
export function getKeywordsByCategory(
  category: keyof RomanianSTEMKeywords,
  subCategory?: string
): string[] {
  const keywords = ROMANIAN_STEM_KEYWORDS[category];

  if (typeof keywords === "object" && !Array.isArray(keywords)) {
    if (subCategory && subCategory in keywords) {
      return keywords[subCategory as keyof typeof keywords] as string[];
    }
    return Object.values(keywords).flat();
  }

  return keywords as string[];
}

/**
 * Get primary keywords with high search volume
 */
export function getPrimaryKeywords(): string[] {
  return ROMANIAN_STEM_KEYWORDS.primary;
}

/**
 * Get commercial keywords for conversion optimization
 */
export function getCommercialKeywords(): string[] {
  return ROMANIAN_STEM_KEYWORDS.commercial;
}

/**
 * Get long-tail keywords for voice search optimization
 */
export function getLongTailKeywords(): string[] {
  return ROMANIAN_STEM_KEYWORDS.longTail;
}

/**
 * Get regional keywords for location-based targeting
 */
export function getRegionalKeywords(
  region: keyof RomanianSTEMKeywords["regional"]
): string[] {
  return ROMANIAN_STEM_KEYWORDS.regional[region];
}

/**
 * Get seasonal keywords for time-based content
 */
export function getSeasonalKeywords(
  season: keyof RomanianSTEMKeywords["seasonal"]
): string[] {
  return ROMANIAN_STEM_KEYWORDS.seasonal[season];
}

/**
 * Get parent pain point keywords for viral content
 */
export function getPainPointKeywords(): string[] {
  return ROMANIAN_STEM_KEYWORDS.painPoints;
}

/**
 * Get voice search questions for featured snippets
 */
export function getVoiceSearchQuestions(): string[] {
  return ROMANIAN_STEM_KEYWORDS.questions;
}

/**
 * Search keywords by term
 */
export function searchKeywords(term: string): string[] {
  const allKeywords = [
    ...ROMANIAN_STEM_KEYWORDS.primary,
    ...ROMANIAN_STEM_KEYWORDS.secondary,
    ...ROMANIAN_STEM_KEYWORDS.longTail,
    ...ROMANIAN_STEM_KEYWORDS.educational,
    ...ROMANIAN_STEM_KEYWORDS.commercial,
    ...Object.values(ROMANIAN_STEM_KEYWORDS.regional).flat(),
    ...Object.values(ROMANIAN_STEM_KEYWORDS.seasonal).flat(),
    ...ROMANIAN_STEM_KEYWORDS.questions,
    ...ROMANIAN_STEM_KEYWORDS.painPoints,
  ];

  return allKeywords.filter(keyword =>
    keyword.toLowerCase().includes(term.toLowerCase())
  );
}

/**
 * Get keywords for specific STEM topic
 */
export function getKeywordsForTopic(topic: string): {
  primary: string[];
  secondary: string[];
  longTail: string[];
  questions: string[];
} {
  const topicLower = topic.toLowerCase();

  // Topic-specific keyword mapping
  const topicMappings: Record<
    string,
    {
      primary: string[];
      secondary: string[];
      longTail: string[];
      questions: string[];
    }
  > = {
    matematică: {
      primary: ["jucării matematice", "STEM matematică", "învățare matematică"],
      secondary: [
        "jucării matematice copii",
        "STEM matematică distractiv",
        "dezvoltare matematică",
      ],
      longTail: [
        "cum să fac copilul să iubească matematica",
        "jucării care învață matematica ușor",
        "STEM pentru matematică școală",
      ],
      questions: [
        "cum să explic matematica copiilor",
        "de ce copiii urăsc matematica",
        "cum să învețe matematica prin joc",
      ],
    },
    știință: {
      primary: [
        "jucării științifice",
        "STEM știință",
        "experimente științifice",
      ],
      secondary: [
        "jucării știință copii",
        "STEM experimente",
        "învățare știință",
      ],
      longTail: [
        "cum să fac știința distractivă pentru copii",
        "jucării pentru experimente științifice acasă",
        "STEM știință școală primară",
      ],
      questions: [
        "cum să explic știința copiilor mici",
        "de ce să învețe știința prin joc",
        "experimente științifice sigure acasă",
      ],
    },
    programare: {
      primary: ["jucării programare", "STEM coding", "învățare programare"],
      secondary: [
        "jucării coding copii",
        "STEM programare distractiv",
        "dezvoltare programare",
      ],
      longTail: [
        "cum să învețe copiii programare ușor",
        "jucării pentru programare copii mici",
        "STEM coding școală",
      ],
      questions: [
        "de ce să învețe copiii programare",
        "cum să explic programarea copiilor",
        "programare distractivă pentru copii",
      ],
    },
    robotica: {
      primary: ["jucării robotică", "STEM robotica", "roboți educaționali"],
      secondary: ["jucării robot copii", "STEM roboți", "învățare robotică"],
      longTail: [
        "cum să construiască roboți cu copiii",
        "jucării robotică pentru acasă",
        "STEM roboți școală",
      ],
      questions: [
        "ce sunt roboții educaționali",
        "cum ajută roboții la învățare",
        "roboți sigure pentru copii",
      ],
    },
  };

  return (
    topicMappings[topicLower] || {
      primary: ROMANIAN_STEM_KEYWORDS.primary.slice(0, 3),
      secondary: ROMANIAN_STEM_KEYWORDS.secondary.slice(0, 3),
      longTail: ROMANIAN_STEM_KEYWORDS.longTail.slice(0, 3),
      questions: ROMANIAN_STEM_KEYWORDS.questions.slice(0, 3),
    }
  );
}

/**
 * Get all keywords as a flat array
 */
export function getAllKeywords(): string[] {
  return [
    ...ROMANIAN_STEM_KEYWORDS.primary,
    ...ROMANIAN_STEM_KEYWORDS.secondary,
    ...ROMANIAN_STEM_KEYWORDS.longTail,
    ...ROMANIAN_STEM_KEYWORDS.educational,
    ...ROMANIAN_STEM_KEYWORDS.commercial,
    ...Object.values(ROMANIAN_STEM_KEYWORDS.regional).flat(),
    ...Object.values(ROMANIAN_STEM_KEYWORDS.seasonal).flat(),
    ...ROMANIAN_STEM_KEYWORDS.questions,
    ...ROMANIAN_STEM_KEYWORDS.painPoints,
  ];
}

/**
 * Validate Romanian keyword structure
 */
export function validateRomanianKeywords(): boolean {
  try {
    // Check if all required categories exist
    const requiredCategories = [
      "primary",
      "secondary",
      "longTail",
      "educational",
      "commercial",
    ];
    for (const category of requiredCategories) {
      if (!ROMANIAN_STEM_KEYWORDS[category as keyof RomanianSTEMKeywords]) {
        throw new Error(`Missing category: ${category}`);
      }
    }

    // Check if regional keywords exist
    const regions = Object.keys(ROMANIAN_STEM_KEYWORDS.regional);
    if (regions.length === 0) {
      throw new Error("No regional keywords found");
    }

    // Check if seasonal keywords exist
    const seasons = Object.keys(ROMANIAN_STEM_KEYWORDS.seasonal);
    if (seasons.length === 0) {
      throw new Error("No seasonal keywords found");
    }

    // Check for Romanian characters in keywords
    const allKeywords = getAllKeywords();
    const hasRomanianChars = allKeywords.some(keyword =>
      /[ăâîșțĂÂÎȘȚ]/.test(keyword)
    );

    if (!hasRomanianChars) {
      throw new Error("No Romanian characters found in keywords");
    }

    return true;
  } catch (error) {
    console.error("Keyword validation failed:", error);
    return false;
  }
}
