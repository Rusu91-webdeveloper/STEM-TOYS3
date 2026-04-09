/**
 * Local SEO Optimization for Romanian Market
 * Dominates local search results for STEM toys in Romania
 */

import { appConfig } from "@/lib/config/app-config";

export interface RomanianCity {
  name: string;
  population: number;
  region: string;
  coordinates: { lat: number; lng: number };
  searchVolume: number;
  priority: "high" | "medium" | "low";
}

/**
 * Top Romanian cities for STEM toy targeting
 */
export const ROMANIAN_CITIES: RomanianCity[] = [
  {
    name: "București",
    population: 1883425,
    region: "Muntenia", 
    coordinates: { lat: 44.4268, lng: 26.1025 },
    searchVolume: 2400,
    priority: "high"
  },
  {
    name: "Cluj-Napoca",
    population: 324576,
    region: "Transilvania",
    coordinates: { lat: 46.7712, lng: 23.6236 },
    searchVolume: 800,
    priority: "high"
  },
  {
    name: "Timișoara", 
    population: 319279,
    region: "Banat",
    coordinates: { lat: 45.7489, lng: 21.2087 },
    searchVolume: 600,
    priority: "high"
  },
  {
    name: "Iași",
    population: 290422,
    region: "Moldova",
    coordinates: { lat: 47.1585, lng: 27.6014 },
    searchVolume: 500,
    priority: "high"
  },
  {
    name: "Constanța",
    population: 283872,
    region: "Dobrogea",
    coordinates: { lat: 44.1598, lng: 28.6348 },
    searchVolume: 400,
    priority: "medium"
  },
  {
    name: "Craiova",
    population: 269506,
    region: "Oltenia", 
    coordinates: { lat: 44.3302, lng: 23.7949 },
    searchVolume: 350,
    priority: "medium"
  },
  {
    name: "Brașov",
    population: 253200,
    region: "Transilvania",
    coordinates: { lat: 45.6427, lng: 25.5887 },
    searchVolume: 450,
    priority: "medium"
  },
  {
    name: "Galați",
    population: 249432,
    region: "Moldova",
    coordinates: { lat: 45.4353, lng: 28.0080 },
    searchVolume: 200,
    priority: "low"
  },
  {
    name: "Ploiești",
    population: 201226,
    region: "Muntenia",
    coordinates: { lat: 44.9414, lng: 26.0063 },
    searchVolume: 250,
    priority: "medium"
  },
  {
    name: "Oradea",
    population: 196367,
    region: "Crișana",
    coordinates: { lat: 47.0465, lng: 21.9189 },
    searchVolume: 200,
    priority: "medium"
  }
];

/**
 * Generate local SEO schema for Romanian cities
 */
export function generateLocalBusinessSchema(city: RomanianCity) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `TechTots - Jucării STEM ${city.name}`,
    description: `Magazin online de jucării educaționale STEM pentru copiii din ${city.name} și împrejurimi. Livrare rapidă și gratuită în ${city.name}.`,
    url: `https://www.techtots.ro/${city.name.toLowerCase()}`,
    telephone: appConfig.storePhone,
    email: appConfig.contactEmail,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressRegion: city.region,
      addressCountry: "România",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: city.coordinates.lat,
      longitude: city.coordinates.lng,
    },
    areaServed: [
      {
        "@type": "City",
        name: city.name,
      },
      {
        "@type": "State",
        name: city.region,
      },
      {
        "@type": "Country", 
        name: "România",
      }
    ],
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: city.coordinates.lat,
        longitude: city.coordinates.lng,
      },
      geoRadius: "50000", // 50km radius
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Jucării STEM Certificate",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "Jucării Robotică Educațională",
            category: "Robotică STEM",
          }
        },
        {
          "@type": "Offer", 
          itemOffered: {
            "@type": "Product",
            name: "Kituri Experimente Științifice",
            category: "Științe STEM",
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product", 
            name: "Jocuri Matematice Educaționale",
            category: "Matematică STEM",
          }
        }
      ]
    },
    priceRange: "$$",
    currenciesAccepted: "RON",
    paymentAccepted: [
      "Credit Card",
      "Bank Transfer", 
      "Cash on Delivery",
      "Online Banking"
    ],
    openingHours: "Mo-Su 00:00-23:59",
    sameAs: [
      "https://www.facebook.com/TechTotsRomania",
      "https://www.instagram.com/techtots_romania/",
      "https://www.linkedin.com/company/techtots-romania"
    ],
  };
}

/**
 * Generate local landing page content
 */
export function generateLocalLandingPageContent(city: RomanianCity) {
  return {
    title: `Jucării STEM ${city.name} - Livrare Gratuită | TechTots România`,
    description: `Magazin online de jucării educaționale STEM în ${city.name}. Certificate MECTS, aliniate cu curriculumul românesc. Livrare gratuită în ${city.name} și ${city.region}.`,
    h1: `Jucării STEM pentru Copii în ${city.name}`,
    heroText: `Descoperiți cea mai mare colecție de jucării educaționale STEM pentru copiii din ${city.name}! 
              Produse certificate, aliniate cu curriculumul românesc și livrate gratuit în toată zona ${city.region}.`,
    localBenefits: [
      `Livrare gratuită în ${city.name} în 24-48 ore`,
      `Suport educațional în română pentru părinții din ${city.region}`,
      `Parteneriate cu școli din ${city.name}`,
      `Consultanță educațională locală`,
      `Evenimente STEM în ${city.name}`,
    ],
    localKeywords: [
      `jucării STEM ${city.name}`,
      `jucării educaționale ${city.name}`,
      `robotică copii ${city.name}`,
      `experimente științifice ${city.name}`,
      `magazin jucării STEM ${city.name}`,
      `livrare jucării STEM ${city.name}`,
      `educație STEM ${city.name}`,
      `activități STEM copii ${city.name}`,
    ]
  };
}

/**
 * Romanian educational institutions for link building
 */
export const ROMANIAN_EDUCATIONAL_INSTITUTIONS = [
  {
    name: "Ministerul Educației și Cercetării",
    url: "https://www.edu.ro",
    type: "government",
    authority: "very-high",
    linkOpportunity: "policy-alignment"
  },
  {
    name: "Universitatea București",
    url: "https://unibuc.ro", 
    type: "university",
    authority: "high",
    linkOpportunity: "research-partnership"
  },
  {
    name: "Universitatea Babeș-Bolyai Cluj",
    url: "https://www.ubbcluj.ro",
    type: "university", 
    authority: "high",
    linkOpportunity: "education-faculty"
  },
  {
    name: "Politehnica București",
    url: "https://upb.ro",
    type: "technical-university",
    authority: "high", 
    linkOpportunity: "STEM-programs"
  },
  {
    name: "Casa Corpului Didactic",
    url: "https://ccd.edu.ro",
    type: "teacher-training",
    authority: "medium",
    linkOpportunity: "teacher-resources"
  },
  {
    name: "Centrul Național de Politici și Evaluare în Educație", 
    url: "https://cnpee.ro",
    type: "research",
    authority: "high",
    linkOpportunity: "curriculum-research"
  }
];

/**
 * Romanian parenting and education websites for content partnerships
 */
export const ROMANIAN_PARENTING_SITES = [
  {
    name: "Mami.ro",
    url: "https://www.mami.ro",
    audience: "mothers",
    authority: "medium",
    linkOpportunity: "guest-posts"
  },
  {
    name: "Copilul.ro", 
    url: "https://www.copilul.ro",
    audience: "parents",
    authority: "medium",
    linkOpportunity: "educational-content"
  },
  {
    name: "Bebelusi.ro",
    url: "https://www.bebelusi.ro", 
    audience: "new-parents",
    authority: "low",
    linkOpportunity: "early-education"
  },
  {
    name: "Scoala9.ro",
    url: "https://scoala9.ro",
    audience: "educators",
    authority: "medium", 
    linkOpportunity: "teacher-resources"
  }
];

/**
 * Generate local SEO content for Romanian regions
 */
export function generateRegionalContent(region: string) {
  const regionalInfo = {
    "Transilvania": {
      description: "regiunea cu cea mai dezvoltată educație tehnologică",
      universities: ["UBB Cluj", "Universitatea Transilvania Brașov"],
      techHubs: ["Cluj-Napoca", "Brașov"],
      educationalFocus: "inovație și tehnologie"
    },
    "Muntenia": {
      description: "centrul educațional și administrativ al României", 
      universities: ["Universitatea București", "Politehnica București"],
      techHubs: ["București", "Ploiești"],
      educationalFocus: "cercetare și dezvoltare"
    },
    "Moldova": {
      description: "regiunea cu tradiție în educația științifică",
      universities: ["Universitatea Alexandru Ioan Cuza Iași"],
      techHubs: ["Iași", "Galați"],
      educationalFocus: "științe exacte și inginerie"
    }
  };

  return regionalInfo[region as keyof typeof regionalInfo] || {
    description: "o regiune importantă pentru educația românească",
    universities: [],
    techHubs: [],
    educationalFocus: "educație STEM"
  };
}

/**
 * Generate location-based FAQ content
 */
export function generateLocalFAQ(city: RomanianCity) {
  return [
    {
      question: `Livrați jucării STEM în ${city.name}?`,
      answer: `Da! Livrăm gratuit în ${city.name} și în toată zona ${city.region}. Comenzile plasate până la ora 14:00 sunt livrate în 24-48 ore.`
    },
    {
      question: `Aveți parteneriate cu școli din ${city.name}?`,
      answer: `Colaborăm cu mai multe instituții educaționale din ${city.name} pentru a oferi resurse STEM. Contactați-ne pentru detalii despre programele educaționale.`
    },
    {
      question: `Organizați evenimente STEM în ${city.name}?`,
      answer: `Organizăm periodic ateliere și demonstrații STEM în ${city.name}. Abonați-vă la newsletter pentru a fi anunțați despre evenimentele locale.`
    },
    {
      question: `Jucăriile sunt adaptate pentru copiii din ${city.name}?`,
      answer: `Toate produsele noastre sunt certificate pentru piața românească și aliniate cu curriculumul național. Sunt perfecte pentru copiii din ${city.name} și toată România.`
    }
  ];
}

/**
 * Generate local business citations for Romanian directories
 */
export const ROMANIAN_BUSINESS_DIRECTORIES = [
  {
    name: "Pagini Aurii",
    url: "https://www.paginiaurii.ro",
    priority: "high",
    category: "Jucării și Jocuri Educaționale"
  },
  {
    name: "Info.ro",
    url: "https://www.info.ro", 
    priority: "medium",
    category: "Magazine Online"
  },
  {
    name: "Ziare.com Business",
    url: "https://business.ziare.com",
    priority: "medium",
    category: "E-commerce"
  },
  {
    name: "Romanian Business Directory",
    url: "https://www.romanian-business-directory.com",
    priority: "low",
    category: "Educational Products"
  }
];

/**
 * Generate hreflang tags for Romanian regions
 */
export function generateRegionalHreflang(basePath: string) {
  return [
    { hreflang: "ro", href: `https://www.techtots.ro${basePath}` },
    { hreflang: "ro-RO", href: `https://www.techtots.ro${basePath}` },
    { hreflang: "en", href: `https://www.techtots.ro/en${basePath}` },
    { hreflang: "en-RO", href: `https://www.techtots.ro/en${basePath}` },
    { hreflang: "x-default", href: `https://www.techtots.ro${basePath}` },
  ];
}

/**
 * Local keyword modifiers for Romanian market
 */
export const LOCAL_KEYWORD_MODIFIERS = [
  // Geographic
  "România", "românesc", "românească", "național",
  
  // Educational system
  "curriculum românesc", "MECTS", "Ministerul Educației",
  "școală românească", "educație națională",
  
  // Cultural
  "pentru copiii români", "în limba română", 
  "tradus în română", "adaptat pentru România",
  
  // Commercial
  "livrare România", "magazin românesc", 
  "preț în lei", "plată în RON",
  
  // Quality indicators
  "certificat România", "aprobat MECTS",
  "conform standardelor românești"
];

/**
 * Generate local content variations
 */
export function generateLocalContentVariations(baseContent: string, city: RomanianCity): string {
  const localizedContent = baseContent
    .replace(/România/g, `${city.name}, România`)
    .replace(/copiii români/g, `copiii din ${city.name}`)
    .replace(/părinții români/g, `părinții din ${city.name}`)
    .replace(/livrare în România/g, `livrare gratuită în ${city.name}`)
    .replace(/magazin românesc/g, `magazin pentru ${city.name}`)
    .replace(/educația românească/g, `educația din ${city.name}`);
    
  return localizedContent;
}

/**
 * Romanian educational events calendar for content marketing
 */
export const ROMANIAN_EDUCATIONAL_CALENDAR = {
  "Ziua Educației": { date: "2025-10-05", keywords: ["educație România", "sistem educațional"] },
  "Săptămâna Științei": { date: "2025-05-15", keywords: ["științe România", "experimente copii"] },
  "Ziua Copilului": { date: "2025-06-01", keywords: ["cadouri educaționale", "jucării copii"] },
  "Începutul Anului Școlar": { date: "2025-09-15", keywords: ["rechizite STEM", "pregătire școală"] },
  "Săptămâna Digitală": { date: "2025-03-20", keywords: ["tehnologie educațională", "alfabetizare digitală"] },
  "Ziua Internațională STEM": { date: "2025-02-11", keywords: ["educație STEM", "cariere STEM"] },
};

/**
 * Generate seasonal local content
 */
export function generateSeasonalLocalContent(season: string, city: RomanianCity) {
  const seasonalContent = {
    "spring": {
      title: `Activități STEM de Primăvară pentru Copiii din ${city.name}`,
      focus: "experimente în natură, grădinărit științific, observarea naturii",
      keywords: [`STEM primăvară ${city.name}`, `activități copii primăvară ${city.name}`]
    },
    "summer": {
      title: `Tabere STEM Acasă - Ghid pentru Părinții din ${city.name}`,
      focus: "activități de vară, experimente în aer liber, proiecte vacanță",
      keywords: [`STEM vară ${city.name}`, `activități copii vară ${city.name}`]
    },
    "autumn": {
      title: `Pregătirea pentru Școală cu STEM în ${city.name}`,
      focus: "rechizite STEM, rutina de învățare, adaptarea la școală",
      keywords: [`STEM toamnă ${city.name}`, `pregătire școală ${city.name}`]
    },
    "winter": {
      title: `Cadouri STEM de Iarnă pentru Copiii din ${city.name}`,
      focus: "cadouri educaționale, activități de interior, sărbători",
      keywords: [`cadouri STEM ${city.name}`, `Crăciun STEM ${city.name}`]
    }
  };

  return seasonalContent[season as keyof typeof seasonalContent];
}
