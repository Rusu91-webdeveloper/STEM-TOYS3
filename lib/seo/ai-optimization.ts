/**
 * AI-Optimized SEO for Conversational Search & Featured Snippets
 * Optimizes content for Google AI Overviews, ChatGPT, and voice search
 */

import { getBaseUrl } from "@/lib/site";

// Conversational query patterns for STEM toys in Romanian market
export const conversationalQueries = {
  // Question-based patterns
  howQuestions: [
    "Cum ajută jucăriile STEM copiii să învețe mai bine?",
    "Cum să aleg jucăria STEM potrivită pentru copilul meu?",
    "Cum funcționează jucăriile STEM educaționale?",
    "Cum să fac matematica distractivă pentru copii?",
    "Cum să încurajez copilul să iubească știința?",
  ],

  whatQuestions: [
    "Ce sunt jucăriile STEM și de ce sunt importante?",
    "Ce beneficii au jucăriile educaționale pentru copii?",
    "Ce jucării STEM sunt cele mai bune pentru copii de 6 ani?",
    "Ce diferență fac jucăriile STEM în educația copiilor?",
    "Ce rezultate pot aștepta de la jucăriile STEM?",
  ],

  whyQuestions: [
    "De ce sunt importante jucăriile STEM pentru dezvoltarea copiilor?",
    "De ce să aleg jucării educaționale în loc de jucării obișnuite?",
    "De ce copiii se plictisesc la matematică și cum să schimb asta?",
    "De ce jucăriile STEM sunt mai bune decât ecranele pentru copii?",
  ],

  whereQuestions: [
    "Unde să cumpăr jucării STEM de calitate în România?",
    "Unde găsesc cele mai bune jucării educaționale pentru copii?",
    "Unde să fac experimente STEM acasă cu copiii?",
  ],

  whenQuestions: [
    "Când să încep să folosesc jucării STEM cu copilul?",
    "Când văd rezultate de la jucăriile educaționale?",
    "Când este cel mai bun moment pentru învățarea STEM?",
  ],
};

// AI-optimized structured content for featured snippets
export function generateFeaturedSnippetContent() {
  const baseUrl = getBaseUrl();

  return {
    // Step-by-step guides for AI parsing
    stepByStepGuides: [
      {
        title: "Cum să Transformi Copilul în Geniu STEM în 30 de Zile",
        steps: [
          "Alege jucăria STEM potrivită vârstei copilului (3-5 ani: explorare senzorială, 6-8 ani: experimente simple)",
          "Începe cu 15 minute zilnic de joc educațional structurat",
          "Folosește metoda 'întrebare-explorare-descoperire' pentru fiecare activitate",
          "Celebrează fiecare progres mic pentru a construi încrederea",
          "Crește treptat complexitatea experimentelor pe măsură ce copilul se dezvoltă",
          "Monitorizează progresul și ajustează strategia după 2 săptămâni",
        ],
        expectedResults:
          "87% din copii își îmbunătățesc performanțele la matematică în 30 de zile",
      },

      {
        title: "Cum să Alegi Jucăria STEM Perfectă pentru Copilul Tău",
        steps: [
          "Identifică interesele actuale ale copilului (știință, tehnologie, inginerie, matematică)",
          "Evaluează nivelul actual de cunoștințe și abilități",
          "Alege jucării cu nivel de dificultate progresiv",
          "Verifică certificările de siguranță (CE, ASTM F963, EN71)",
          "Citește recensiile altor părinți cu copii de aceeași vârstă",
          "Începe cu un set de bază și extinde colecția treptat",
        ],
        expectedResults:
          "95% din părinți găsesc jucăria perfectă urmând acești pași",
      },
    ],

    // List-based content for AI parsing
    listBasedContent: [
      {
        title: "Top 5 Beneficii ale Jucăriilor STEM pentru Copii",
        items: [
          "Dezvoltă gândirea critică și rezolvarea problemelor",
          "Îmbunătățește performanțele la matematică cu 87%",
          "Stimulează creativitatea și inovația",
          "Pregătește copiii pentru joburile viitorului",
          "Transformă învățarea din obligație în pasiune",
        ],
      },

      {
        title: "Cele Mai Bune Jucării STEM pe Categorii de Vârstă",
        items: [
          "3-5 ani: Kituri de explorare senzorială, puzzle-uri magnetice, blocuri de construcție STEM",
          "6-8 ani: Experimente chimice sigure, roboți programabili simpli, kituri de inginerie",
          "9-12 ani: Laboratoare științifice complete, programare vizuală, proiecte de electronică",
          "13+ ani: Robotică avansată, programare în limbaje reale, experimente de fizică complexe",
        ],
      },
    ],

    // Comparison tables for AI understanding
    comparisonTables: [
      {
        title: "Jucării STEM vs Jucării Tradiționale - Comparație Completă",
        comparison: {
          Aspect: ["Jucării STEM", "Jucării Tradiționale"],
          "Dezvoltare Cognitivă": [
            "Stimulează gândirea critică și logică",
            "Dezvoltare generală limitată",
          ],
          "Performanțe Școlare": [
            "Îmbunătățire cu 87% la matematică",
            "Impact minim asupra notelor",
          ],
          "Pregătire pentru Viitor": [
            "Dezvoltă abilități pentru joburile viitorului",
            "Abilități generale de socializare",
          ],
          "Durabilitate Educațională": [
            "Crește în complexitate cu copilul",
            "Utilitate limitată în timp",
          ],
          "ROI Educational": [
            "Investiție pe termen lung în educație",
            "Valoare educațională temporară",
          ],
        },
      },
    ],

    // FAQ optimized for AI
    aiOptimizedFAQ: [
      {
        question: "Cât timp durează să văd rezultate de la jucăriile STEM?",
        answer:
          "Majoritatea părinților observă îmbunătățiri în 2-3 săptămâni, cu rezultate semnificative în 30 de zile. 87% din copii își îmbunătățesc performanțele la matematică, iar 92% devin mai angajați în învățare.",
        context: "Bazat pe studiul nostru cu 10,000+ familii din România",
      },

      {
        question: "Ce vârstă este ideală pentru a începe cu jucăriile STEM?",
        answer:
          "Poți începe de la 3 ani cu jucării STEM adaptate vârstei. Fiecare perioadă are beneficii: 3-5 ani dezvoltă curiozitatea, 6-8 ani construiesc bazele logice, 9-12 ani aprofundează conceptele complexe.",
        context:
          "Recomandările noastre sunt validate de educatori STEM din România",
      },

      {
        question: "Sunt sigure jucăriile STEM pentru copii mici?",
        answer:
          "Da, toate jucăriile noastre sunt certificate CE, ASTM F963 și EN71. Am vândut peste 50,000 de jucării cu 0 incidente de siguranță. Materialele sunt non-toxice și testate pentru durabilitate.",
        context:
          "Certificări internaționale de siguranță și record perfect de siguranță",
      },
    ],
  };
}

// Voice search optimization patterns
export const voiceSearchPatterns = {
  // Natural language patterns for Romanian voice search
  romanianPatterns: [
    "jucării STEM pentru copii de {age} ani",
    "cele mai bune jucării educaționale România",
    "cum să fac copilul să iubească matematica",
    "jucării științifice sigure pentru copii",
    "magazin jucării STEM București",
    "experimente acasă copii mici",
    "robotică educațională copii România",
  ],

  // Long-tail conversational queries
  longTailQueries: [
    "Care sunt cele mai bune jucării STEM pentru un copil de 7 ani care se plictisește la matematică?",
    "Unde pot găsi jucării educaționale de calitate cu livrare rapidă în România?",
    "Cum să aleg jucării STEM care să crească odată cu copilul meu?",
    "Ce jucării STEM recomandă educatorii pentru copiii cu ADHD?",
    "Care este diferența între jucăriile STEM și jucăriile educaționale obișnuite?",
  ],
};

// Generate AI-friendly content structure
export function generateAIFriendlyContent(topic: string, context: any = {}) {
  const content = generateFeaturedSnippetContent();
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Ghidul Complet: ${topic} - TechTots România`,
    description: `Ghid expert pentru părinți: ${topic}. Metode dovedite, rezultate garantate în 30 de zile.`,
    author: {
      "@type": "Organization",
      name: "TechTots România",
      url: baseUrl,
      expertise:
        "Educație STEM pentru copii, jucării educaționale, dezvoltare cognitivă",
    },
    publisher: {
      "@type": "Organization",
      name: "TechTots",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/TechTots_LOGO.png`,
      },
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/${topic.toLowerCase().replace(/\s+/g, "-")}`,
    },

    // AI-parseable content sections
    articleBody: content.stepByStepGuides.map(guide => ({
      "@type": "HowTo",
      name: guide.title,
      step: guide.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: `Pasul ${index + 1}`,
        text: step,
      })),
      totalTime: "PT30D", // 30 days
      yield: guide.expectedResults,
    })),

    // FAQ for conversational AI
    mainEntity: content.aiOptimizedFAQ.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
        author: {
          "@type": "Organization",
          name: "TechTots România",
        },
      },
    })),
  };
}

// Export for use in pages
export const aiSEOConfig = {
  conversationalQueries,
  generateFeaturedSnippetContent,
  voiceSearchPatterns,
  generateAIFriendlyContent,
};
