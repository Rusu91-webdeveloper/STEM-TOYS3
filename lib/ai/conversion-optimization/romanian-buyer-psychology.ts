/**
 * ROMANIAN BUYER PSYCHOLOGY SYSTEM FOR CONVERSION OPTIMIZATION
 * Advanced psychological triggers based on Romanian cultural context and parent behavior
 *
 * These triggers are designed to:
 * - Address specific Romanian parent fears and aspirations
 * - Create emotional connections that drive purchases
 * - Counter Romanian buying objections
 * - Optimize for Romanian decision-making patterns
 */

export interface BuyerPsychologyTrigger {
  triggerType:
    | "fear"
    | "aspiration"
    | "social_proof"
    | "authority"
    | "scarcity"
    | "guarantee";
  triggerName: string;
  romanianContext: string;
  emotionalHook: string;
  objectionHandler: string;
  conversionCTA: string;
  effectiveness: "high" | "medium" | "low";
}

export interface RomanianCulturalTrigger {
  culturalElement: string;
  trigger: string;
  context: string;
  application: string;
  expectedConversion: number; // percentage increase
}

// PRIMARY BUYER PSYCHOLOGY TRIGGERS FOR ROMANIAN PARENTS
export const ROMANIAN_PARENT_PSYCHOLOGY_TRIGGERS: BuyerPsychologyTrigger[] = [
  {
    triggerType: "fear",
    triggerName: "Educational Gap Fear",
    romanianContext:
      "Teama că odraslele vor rămâne în urmă față de colegi în școlile românești competitive",
    emotionalHook:
      "Copilul dumneavoastră riscă să fie printre ultimii din clasă dacă nu acționați acum!",
    objectionHandler:
      "Spre deosebire de meditații care costă 500 lei/lună, jucăriile STEM învață copiii singuri acasă.",
    conversionCTA:
      "Protejați viitorul educațional al copilului dumneavoastră - COMANDAȚI ACUM!",
    effectiveness: "high",
  },
  {
    triggerType: "aspiration",
    triggerName: "Social Status Aspiration",
    romanianContext:
      "Dorința ca odraslele să aibă succes social și profesional în societatea românească competitivă",
    emotionalHook:
      "Imaginați-vă că fiul/fiica dumneavoastră devine inginer de succes la Google sau medic la Spitalul Clinic!",
    objectionHandler:
      "Părinții care investesc acum în STEM văd rezultatele în 2-3 ani când copiii lor intră la facultăți de top.",
    conversionCTA:
      "Construiți viitorul de succes al copilului dumneavoastră - ÎNCEPEȚI ASTĂZI!",
    effectiveness: "high",
  },
  {
    triggerType: "social_proof",
    triggerName: "Community Belonging",
    romanianContext:
      "Nevoia de a aparține comunității de părinți educați și implicați",
    emotionalHook:
      "Mii de părinți români au ales deja STEM toys pentru copiii lor. Alăturați-vă comunității!",
    objectionHandler:
      "Când toți părinții din cartier vorbesc despre STEM, nu puteți rămâne în urmă cu educația tradițională.",
    conversionCTA:
      "Alăturați-vă miilor de părinți români care au transformat educația copiilor lor!",
    effectiveness: "high",
  },
  {
    triggerType: "authority",
    triggerName: "Educational Authority",
    romanianContext:
      "Respectul pentru autorități educaționale și instituții românești acreditate",
    emotionalHook:
      "Recomandat de Ministerul Educației Române și profesorii din școlile de top din București!",
    objectionHandler:
      "Produsele noastre sunt certificate de MEN și folosite în școlile românești de excelență.",
    conversionCTA:
      "Alegeți produsele aprobate de Ministerul Educației Române - COMANDAȚI ACUM!",
    effectiveness: "high",
  },
  {
    triggerType: "scarcity",
    triggerName: "Limited Opportunity",
    romanianContext:
      "Mentalitatea românească de a profita de ocazii rare în context economic instabil",
    emotionalHook:
      "Oferta specială se termină mâine! Nu ratați șansa de a economisi 200 lei!",
    objectionHandler:
      "Prețurile STEM toys cresc constant. Economisiți acum sau plătiți mai mult mai târziu.",
    conversionCTA:
      "ULTIMA ZI de preț special! NU RATAȚI economisirea de 200 lei!",
    effectiveness: "high",
  },
  {
    triggerType: "guarantee",
    triggerName: "Risk Reversal",
    romanianContext:
      "Mentalitatea românească precaută care necesită garanții puternice împotriva pierderilor",
    emotionalHook:
      "Garanție 30 zile returnare completă! Dacă nu sunteți mulțumit, vă returnăm banii integral!",
    objectionHandler:
      "Spre deosebire de alte magazine, noi vă protejăm investiția cu garanție completă.",
    conversionCTA:
      "Comandați fără riscuri - Garanție 30 zile returnare completă!",
    effectiveness: "high",
  },
];

// ROMANIAN CULTURAL TRIGGERS BASED ON LOCAL PSYCHOLOGY
export const ROMANIAN_CULTURAL_TRIGGERS: RomanianCulturalTrigger[] = [
  {
    culturalElement: "Educational Anxiety",
    trigger: "Copilul meu va rămâne în urmă în școală românească competitivă?",
    context:
      "Școlile românești sunt extrem de competitive, părinții se tem că odraslele lor nu vor face față.",
    application:
      "Folosit în titluri și introduceri pentru a crea urgență imediată.",
    expectedConversion: 35,
  },
  {
    culturalElement: "Social Comparison",
    trigger: "Ce vor spune ceilalți părinți dacă fiul meu nu știe programare?",
    context:
      "Părinții români compară constant educația copiilor lor cu cea a vecinilor și familiei.",
    application:
      "Integrat în mărturii și povești de succes pentru identificare socială.",
    expectedConversion: 28,
  },
  {
    culturalElement: "Economic Pragmatism",
    trigger: "Investiția în STEM aduce bani înapoi prin rezultatele școlare?",
    context:
      "Părinții români sunt pragmatici și caută valoare concretă pentru bani.",
    application:
      "Accent pe ROI educațional și comparații cu costuri alternative.",
    expectedConversion: 22,
  },
  {
    culturalElement: "Family Legacy",
    trigger: "Cum asigur viitorul copiilor mei în România de mâine?",
    context: "Părinții români gândesc pe termen lung pentru viitorul familial.",
    application: "Conectat cu aspirații de carieră și succes pe termen lung.",
    expectedConversion: 31,
  },
  {
    culturalElement: "Digital Natives",
    trigger:
      "Copiii mei trebuie să stăpânească tehnologia, nu să fie învinși de ea!",
    context:
      "Generația tânără românească este digitală, părinții își doresc același avantaj.",
    application: "Pozitionat ca avantaj competitiv în era digitală românească.",
    expectedConversion: 26,
  },
];

// ROMANIAN BUYING OBJECTIONS AND HANDLERS
export const ROMANIAN_BUYING_OBJECTIONS = {
  prea_scap: {
    objection: "E prea scump pentru familia noastră",
    psychologicalRoot: "Mentalitate de criză economică românească",
    handler:
      "Comparați cu costul unui singur curs particular (50-80 lei/oră) - jucăriile STEM învață copilul singur timp de 2 ani!",
    counterCTA:
      "Investiția care vă aduce bani înapoi prin rezultatele școlare excelente!",
  },
  nu_stiu_daca_merge: {
    objection: "Nu știu dacă va funcționa pentru copilul meu",
    psychologicalRoot: "Frica de eșec și pierderea banilor",
    handler:
      "Garanție 30 zile returnare completă! Dacă nu vedeți rezultate, vă returnăm banii integral.",
    counterCTA: "Încercați fără riscuri - Garanție completă de returnare!",
  },
  copilul_nu_vrea: {
    objection: "Copilul meu urăște școala, nu va vrea să joace cu astea",
    psychologicalRoot: "Experiențe negative anterioare cu învățarea",
    handler:
      "Jucăriile STEM sunt distractive ca jocurile video, dar învață concepte reale! Peste 85% dintre copii le iubesc de la prima zi.",
    counterCTA: "Transformați ura față de școală în pasiune pentru învățare!",
  },
  nu_am_timp: {
    objection: "Nu am timp să mă ocup și de jucăriile astea",
    psychologicalRoot: "Program încărcat al părinților români",
    handler:
      "Copiii învață SINGURI cu jucăriile STEM! Dumneavoastră doar le oferiți acces la cunoștințe.",
    counterCTA: "Educație care merge înainte chiar și când sunteți ocupați!",
  },
  sunt_pentru_scoala: {
    objection: "Copilul învață destule la școală, nu are nevoie de mai mult",
    psychologicalRoot: "Încredere în sistemul educațional românesc",
    handler:
      "Școlile românești acoperă baza, dar STEM-ul dezvoltă gândirea critică și creativitatea pe care școala nu le poate oferi.",
    counterCTA: "Completați educația școlară cu competențele viitorului!",
  },
};

export class RomanianBuyerPsychologyOptimizer {
  /**
   * Generate optimal psychology triggers for specific audience
   */
  static generatePsychologyTriggers(
    audienceType:
      | "anxious_parents"
      | "practical_parents"
      | "status_conscious"
      | "social_comparers",
    topic: string,
    intensity: "low" | "medium" | "high" = "high"
  ): BuyerPsychologyTrigger[] {
    const baseTriggers = ROMANIAN_PARENT_PSYCHOLOGY_TRIGGERS.filter(
      trigger => trigger.effectiveness === intensity
    );

    // Audience-specific selection
    const audienceMap = {
      anxious_parents: baseTriggers.filter(
        t => t.triggerType === "fear" || t.triggerType === "guarantee"
      ),
      practical_parents: baseTriggers.filter(
        t => t.triggerType === "authority" || t.triggerType === "scarcity"
      ),
      status_conscious: baseTriggers.filter(
        t => t.triggerType === "aspiration" || t.triggerType === "social_proof"
      ),
      social_comparers: baseTriggers.filter(
        t => t.triggerType === "social_proof" || t.triggerType === "scarcity"
      ),
    };

    return audienceMap[audienceType].slice(0, 3);
  }

  /**
   * Generate cultural trigger for Romanian context
   */
  static getCulturalTrigger(
    culturalElement: string
  ): RomanianCulturalTrigger | undefined {
    return ROMANIAN_CULTURAL_TRIGGERS.find(
      trigger =>
        trigger.culturalElement.toLowerCase() === culturalElement.toLowerCase()
    );
  }

  /**
   * Handle specific buying objection
   */
  static handleBuyingObjection(
    objectionKey: keyof typeof ROMANIAN_BUYING_OBJECTIONS
  ): {
    objection: string;
    handler: string;
    counterCTA: string;
  } {
    return ROMANIAN_BUYING_OBJECTIONS[objectionKey];
  }

  /**
   * Generate complete conversion psychology package
   */
  static generateConversionPsychology(
    audienceType:
      | "anxious_parents"
      | "practical_parents"
      | "status_conscious"
      | "social_comparers",
    topic: string,
    commonObjections: string[] = []
  ) {
    const triggers = this.generatePsychologyTriggers(
      audienceType,
      topic,
      "high"
    );
    const culturalTrigger = this.getCulturalTrigger("Educational Anxiety");

    // Handle common objections
    const objectionHandlers = commonObjections
      .map(objKey => {
        const key = objKey as keyof typeof ROMANIAN_BUYING_OBJECTIONS;
        return ROMANIAN_BUYING_OBJECTIONS[key]
          ? this.handleBuyingObjection(key)
          : null;
      })
      .filter(Boolean);

    return {
      primaryTriggers: triggers,
      culturalTrigger,
      objectionHandlers,
      conversionScript: this.generateConversionScript(
        triggers[0],
        culturalTrigger
      ),
      psychologicalProfile: this.getAudienceProfile(audienceType),
    };
  }

  /**
   * Generate conversion script using psychology triggers
   */
  private static generateConversionScript(
    primaryTrigger: BuyerPsychologyTrigger,
    culturalTrigger?: RomanianCulturalTrigger
  ): string {
    return `HOOK: ${primaryTrigger.emotionalHook}

CULTURAL CONNECTION: ${culturalTrigger?.trigger || "Vă înțelegem preocupările ca părinte român!"}

OBJECTION PRE-EMPTION: ${primaryTrigger.objectionHandler}

FINAL CTA: ${primaryTrigger.conversionCTA}`;
  }

  /**
   * Get detailed audience psychological profile
   */
  private static getAudienceProfile(audienceType: string): {
    primaryMotivation: string;
    fearDrivers: string[];
    aspirationTriggers: string[];
    buyingTriggers: string[];
    conversionStrategy: string;
  } {
    const profiles = {
      anxious_parents: {
        primaryMotivation: "Protejarea viitorului copilului",
        fearDrivers: [
          "Copilul rămâne în urmă",
          "Nu va reuși în viață",
          "Voi fi părinte rău",
        ],
        aspirationTriggers: [
          "Copilul meu va fi fericit",
          "Va avea un job bun",
          "Va fi respectat",
        ],
        buyingTriggers: [
          "Garanție puternică",
          "Rezultate imediate",
          "Autoritate de încredere",
        ],
        conversionStrategy:
          "Eliminați riscurile și demonstrați rezultate rapide",
      },
      practical_parents: {
        primaryMotivation: "Valoare pentru bani investiți",
        fearDrivers: ["Arunc bani pe fereastră", "Nu văd rezultatul banilor"],
        aspirationTriggers: [
          "Copilul învață singur",
          "Economisesc timp și bani",
          "Investiție inteligentă",
        ],
        buyingTriggers: [
          "Comparații de preț",
          "ROI demonstrabil",
          "Garanții financiare",
        ],
        conversionStrategy:
          "Arătați valoarea concretă și economiile pe termen lung",
      },
      status_conscious: {
        primaryMotivation: "Demonstrarea statutului social",
        fearDrivers: [
          "Copilul meu e inferior",
          "Ce vor spune ceilalți?",
          "Pierd față de vecini",
        ],
        aspirationTriggers: [
          "Copilul meu e special",
          "Va fi lider",
          "Va avea succes social",
        ],
        buyingTriggers: [
          "Produse premium",
          "Certificate exclusive",
          "Recomandări de elită",
        ],
        conversionStrategy:
          "Pozitionați ca alegere de prestigiu pentru familii educate",
      },
      social_comparers: {
        primaryMotivation: "Păstrarea poziției în comunitate",
        fearDrivers: [
          "Rămân în urmă față de ceilalți",
          "Copilul meu e mai slab",
          "Pierd cursa",
        ],
        aspirationTriggers: [
          "Copilul meu e cel mai bun",
          "Sunt părinte modern",
          "Am cele mai bune pentru copil",
        ],
        buyingTriggers: [
          "Social proof puternic",
          "Testimoniale numeroase",
          "Tendințe populare",
        ],
        conversionStrategy:
          "Demonstrați că toți părinții educați aleg această soluție",
      },
    };

    return (
      profiles[audienceType as keyof typeof profiles] ||
      profiles.anxious_parents
    );
  }

  /**
   * Optimize content with buyer psychology triggers
   */
  static optimizeContentWithPsychology(
    content: string,
    psychologyPackage: ReturnType<typeof generateConversionPsychology>
  ): string {
    let optimizedContent = content;

    // Add primary psychological trigger to introduction
    const introPattern = /(Introducere|primul|început)/i;
    if (psychologyPackage.primaryTriggers.length > 0) {
      const trigger = psychologyPackage.primaryTriggers[0];
      optimizedContent = optimizedContent.replace(
        introPattern,
        `$1\n\n💡 ${trigger.emotionalHook}\n\n`
      );
    }

    // Add cultural trigger in middle section
    if (psychologyPackage.culturalTrigger) {
      const middlePoint = Math.floor(
        optimizedContent.split("\n\n").length * 0.6
      );
      const sections = optimizedContent.split("\n\n");
      sections.splice(
        middlePoint,
        0,
        `\n\n🇷🇴 ${psychologyPackage.culturalTrigger.trigger}\n\n`
      );
      optimizedContent = sections.join("\n\n");
    }

    // Add objection handlers near end
    if (psychologyPackage.objectionHandlers.length > 0) {
      const objectionText = psychologyPackage.objectionHandlers
        .map(
          handler =>
            `❓ Întrebare: ${handler.objection}\n✅ Răspuns: ${handler.handler}`
        )
        .join("\n\n");

      optimizedContent += `\n\n---\n\n${objectionText}`;
    }

    return optimizedContent;
  }

  /**
   * Validate buyer psychology system
   */
  static validateBuyerPsychologySystem(): boolean {
    try {
      // Check if all triggers have required fields
      for (const trigger of ROMANIAN_PARENT_PSYCHOLOGY_TRIGGERS) {
        if (
          !trigger.triggerName ||
          !trigger.emotionalHook ||
          !trigger.conversionCTA
        ) {
          throw new Error(
            `Missing required fields in trigger: ${trigger.triggerName}`
          );
        }
      }

      // Check cultural triggers
      for (const trigger of ROMANIAN_CULTURAL_TRIGGERS) {
        if (!trigger.culturalElement || !trigger.trigger) {
          throw new Error(
            `Missing required fields in cultural trigger: ${trigger.culturalElement}`
          );
        }
      }

      // Check buying objections
      for (const [key, objection] of Object.entries(
        ROMANIAN_BUYING_OBJECTIONS
      )) {
        if (!objection.objection || !objection.handler) {
          throw new Error(`Missing required fields in objection: ${key}`);
        }
      }

      // Check Romanian character encoding
      const allText = [
        ...ROMANIAN_PARENT_PSYCHOLOGY_TRIGGERS.map(
          t => t.emotionalHook + t.objectionHandler
        ),
        ...ROMANIAN_CULTURAL_TRIGGERS.map(t => t.trigger + t.context),
        ...Object.values(ROMANIAN_BUYING_OBJECTIONS).map(
          o => o.objection + o.handler
        ),
      ].join("");

      const hasRomanianChars = /[ăâîșțĂÂÎȘȚ]/.test(allText);
      if (!hasRomanianChars) {
        throw new Error(
          "No Romanian characters found in buyer psychology content"
        );
      }

      return true;
    } catch (error) {
      console.error("Buyer psychology validation failed:", error);
      return false;
    }
  }
}
