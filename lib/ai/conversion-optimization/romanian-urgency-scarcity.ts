/**
 * ROMANIAN URGENCY & SCARCITY OPTIMIZATION FOR CONVERSION MAXIMIZATION
 * Advanced psychological triggers designed for Romanian buyer behavior
 *
 * These elements create FOMO (Fear Of Missing Out) and urgency to drive
 * immediate action and increase conversion rates
 */

export interface UrgencyElement {
  type:
    | "deadline"
    | "limited_stock"
    | "exclusive_offer"
    | "seasonal"
    | "social_proof_urgency"
    | "price_increase";
  trigger: string;
  context: string;
  placement: "introduction" | "middle" | "conclusion" | "cta";
  intensity: "low" | "medium" | "high";
  romanian: boolean;
}

export interface ScarcityElement {
  type:
    | "limited_quantity"
    | "time_limited"
    | "exclusive_access"
    | "last_chance"
    | "sold_out_risk";
  trigger: string;
  context: string;
  placement: "introduction" | "middle" | "conclusion" | "cta";
  intensity: "low" | "medium" | "high";
  romanian: boolean;
}

export interface RomanianBuyerPsychology {
  primaryTrigger:
    | "fear_of_missing_out"
    | "social_comparison"
    | "status_anxiety"
    | "economic_practicality";
  secondaryTrigger:
    | "authority_trust"
    | "social_proof"
    | "scarcity_value"
    | "urgency_action";
  culturalContext: string;
  conversionHook: string;
}

// URGENCY ELEMENTS - Create immediate action pressure
export const ROMANIAN_URGENCY_ELEMENTS: UrgencyElement[] = [
  {
    type: "deadline",
    trigger: "🚨 OFERTA LIMITATĂ: Doar până mâine seară!",
    context:
      "Prețul special pentru jucăriile STEM se termină mâine la ora 23:59",
    placement: "conclusion",
    intensity: "high",
    romanian: true,
  },
  {
    type: "deadline",
    trigger: "⏰ ULTIMA ZI: Economisiți 30% până la miezul nopții!",
    context:
      "Oferta specială de Black Friday pentru părinții români se încheie azi",
    placement: "cta",
    intensity: "high",
    romanian: true,
  },
  {
    type: "deadline",
    trigger: "📅 Săptămâna viitoare prețul crește cu 20%!",
    context:
      "Fără promoție specială pentru Back to School, economisiți acum sau plătiți mai mult",
    placement: "middle",
    intensity: "medium",
    romanian: true,
  },
  {
    type: "limited_stock",
    trigger: "⚠️ Mai avem doar 15 seturi STEM în stoc!",
    context:
      "Seturile populare de robotică se vând rapid - asigurați-vă că nu rămâneți fără",
    placement: "introduction",
    intensity: "high",
    romanian: true,
  },
  {
    type: "exclusive_offer",
    trigger: "🎯 Ofertă exclusivă doar pentru părinții din România!",
    context:
      "Promoție specială creată special pentru comunitatea părintelui român",
    placement: "introduction",
    intensity: "medium",
    romanian: true,
  },
  {
    type: "seasonal",
    trigger: "❄️ Crăciunul vine repede - cadoul perfect se termină!",
    context:
      "Nu ratați șansa să oferiți copiilor voștri cel mai dorit cadou de sărbători",
    placement: "conclusion",
    intensity: "medium",
    romanian: true,
  },
  {
    type: "social_proof_urgency",
    trigger: "🔥 50+ părinți au comandat azi - alăturați-vă lor!",
    context: "Când toată lumea vorbește despre STEM, nu rămâneți în urmă",
    placement: "middle",
    intensity: "high",
    romanian: true,
  },
  {
    type: "price_increase",
    trigger: "💰 Prețul va crește săptămâna viitoare!",
    context:
      "Economisiți acum sau plătiți cu 25% mai mult în perioada următoare",
    placement: "cta",
    intensity: "high",
    romanian: true,
  },
];

// SCARCITY ELEMENTS - Create perception of limited availability
export const ROMANIAN_SCARCITY_ELEMENTS: ScarcityElement[] = [
  {
    type: "limited_quantity",
    trigger: "🎁 Doar 50 de seturi STEM disponibile azi!",
    context:
      "Seturile populare se epuizează rapid - asigurați-vă că luați parte la reducere",
    placement: "introduction",
    intensity: "high",
    romanian: true,
  },
  {
    type: "time_limited",
    trigger: "⏳ Oferta dispare în 24 de ore!",
    context: "Fereastra de timp pentru prețul special se închide rapid",
    placement: "conclusion",
    intensity: "high",
    romanian: true,
  },
  {
    type: "exclusive_access",
    trigger: "🔒 Acces exclusiv pentru membrii comunității!",
    context:
      "Numai părinții care citesc articolul nostru au acces la această ofertă specială",
    placement: "middle",
    intensity: "medium",
    romanian: true,
  },
  {
    type: "last_chance",
    trigger: "🏁 ULTIMA ȘANSĂ să economisiți 200 lei!",
    context:
      "Aceasta este ultima săptămână când puteți beneficia de reducerea specială",
    placement: "cta",
    intensity: "high",
    romanian: true,
  },
  {
    type: "sold_out_risk",
    trigger: "❌ NU RISCAȚI să rămâneți fără STEM toys!",
    context:
      "Sute de părinți au rămas fără produsele preferate - nu fiți următorul",
    placement: "introduction",
    intensity: "high",
    romanian: true,
  },
];

// ROMANIAN BUYER PSYCHOLOGY PROFILES
export const ROMANIAN_BUYER_PSYCHOLOGY: RomanianBuyerPsychology[] = [
  {
    primaryTrigger: "fear_of_missing_out",
    secondaryTrigger: "social_proof",
    culturalContext:
      "Părinte român anxios că fiul/fiica rămâne în urmă față de colegi",
    conversionHook: "Copiii celorlalți părinți au STEM toys - al vostru nu?",
  },
  {
    primaryTrigger: "economic_practicality",
    secondaryTrigger: "authority_trust",
    culturalContext:
      "Părinte român practic care caută valoare reală pentru bani",
    conversionHook:
      "Investiția în educație care vă aduce bani înapoi prin rezultatele școlare",
  },
  {
    primaryTrigger: "status_anxiety",
    secondaryTrigger: "social_comparison",
    culturalContext:
      "Părinte român preocupat de statutul social prin educația copiilor",
    conversionHook:
      "Copilul vostru va fi printre primii din clasă - garanție STEM",
  },
  {
    primaryTrigger: "social_comparison",
    secondaryTrigger: "scarcity_value",
    culturalContext: "Părinte român care compară mereu cu vecinii și familia",
    conversionHook:
      "Nu fiți singurii părinți din cartier fără STEM toys moderne",
  },
];

export class RomanianUrgencyScarcityOptimizer {
  /**
   * Generate urgency elements for content placement
   */
  static generateUrgencyElements(
    contentLength: "short" | "medium" | "long",
    topic: string,
    intensity: "low" | "medium" | "high" = "medium"
  ): UrgencyElement[] {
    const elements = ROMANIAN_URGENCY_ELEMENTS.filter(
      el => el.intensity === intensity
    );

    // Topic-specific selection
    const topicElements = elements.filter(el =>
      el.trigger
        .toLowerCase()
        .includes(this.getTopicKeyword(topic).toLowerCase())
    );

    // Return 2-4 elements based on content length
    const count =
      contentLength === "short" ? 2 : contentLength === "medium" ? 3 : 4;
    return [...topicElements, ...elements].slice(0, count);
  }

  /**
   * Generate scarcity elements for conversion optimization
   */
  static generateScarcityElements(
    contentLength: "short" | "medium" | "long",
    topic: string,
    intensity: "low" | "medium" | "high" = "medium"
  ): ScarcityElement[] {
    const elements = ROMANIAN_SCARCITY_ELEMENTS.filter(
      el => el.intensity === intensity
    );

    // Topic-specific selection
    const topicElements = elements.filter(el =>
      el.trigger
        .toLowerCase()
        .includes(this.getTopicKeyword(topic).toLowerCase())
    );

    // Return 1-3 elements based on content length
    const count =
      contentLength === "short" ? 1 : contentLength === "medium" ? 2 : 3;
    return [...topicElements, ...elements].slice(0, count);
  }

  /**
   * Get optimal buyer psychology profile for Romanian market
   */
  static getBuyerPsychologyProfile(
    topic: string,
    audienceType:
      | "anxious_parents"
      | "practical_parents"
      | "status_conscious"
      | "social_comparers"
  ): RomanianBuyerPsychology {
    const profileMap = {
      anxious_parents: ROMANIAN_BUYER_PSYCHOLOGY[0], // FOMO + Social Proof
      practical_parents: ROMANIAN_BUYER_PSYCHOLOGY[1], // Economic + Authority
      status_conscious: ROMANIAN_BUYER_PSYCHOLOGY[2], // Status Anxiety + Social Comparison
      social_comparers: ROMANIAN_BUYER_PSYCHOLOGY[3], // Social Comparison + Scarcity
    };

    return profileMap[audienceType];
  }

  /**
   * Generate complete conversion optimization package
   */
  static generateConversionOptimization(
    contentLength: "short" | "medium" | "long",
    topic: string,
    audienceType:
      | "anxious_parents"
      | "practical_parents"
      | "status_conscious"
      | "social_comparers",
    intensity: "low" | "medium" | "high" = "medium"
  ) {
    const urgencyElements = this.generateUrgencyElements(
      contentLength,
      topic,
      intensity
    );
    const scarcityElements = this.generateScarcityElements(
      contentLength,
      topic,
      intensity
    );
    const psychology = this.getBuyerPsychologyProfile(topic, audienceType);

    return {
      urgencyElements,
      scarcityElements,
      buyerPsychology: psychology,
      conversionHooks: this.generateConversionHooks(psychology, topic),
      ctaOptimization: this.generateCTAs(intensity, topic),
    };
  }

  /**
   * Generate conversion hooks based on buyer psychology
   */
  private static generateConversionHooks(
    psychology: RomanianBuyerPsychology,
    topic: string
  ): string[] {
    const hooks = [
      psychology.conversionHook,
      `Nu ratați șansa să oferiți copiilor voștri ${topic} de calitate!`,
      `Investiția în viitorul copilului dumneavoastră începe acum!`,
      `Alăturați-vă miilor de părinți români care au ales ${topic}!`,
      `Transformați educația acasă cu ${topic} profesional!`,
    ];

    return hooks;
  }

  /**
   * Generate optimized CTAs based on intensity and topic
   */
  private static generateCTAs(
    intensity: "low" | "medium" | "high",
    topic: string
  ): string[] {
    const baseCTAs = {
      low: [
        "Descoperiți mai multe detalii",
        "Aflați mai multe despre beneficiile STEM",
        "Explorați colecția noastră",
      ],
      medium: [
        "Comandați acum cu reducere!",
        "Beneficiați de oferta specială!",
        "Rezervați setul STEM acum!",
      ],
      high: [
        "COMANDAȚI ACUM - stoc limitat!",
        "NU RATAȚI oferta specială!",
        "APĂSAȚI AICI pentru prețul special!",
        "ULTIMA ȘANSĂ să economisiți!",
      ],
    };

    return baseCTAs[intensity].map(cta =>
      cta.replace("STEM", topic).replace("setul STEM", `setul ${topic}`)
    );
  }

  /**
   * Get topic-specific keyword for filtering
   */
  private static getTopicKeyword(topic: string): string {
    const topicMap: Record<string, string> = {
      matematică: "matematică",
      știință: "știință",
      programare: "programare",
      robotica: "robotică",
      STEM: "STEM",
      educație: "educație",
      copii: "copii",
      școală: "școală",
    };

    return topicMap[topic.toLowerCase()] || topic.toLowerCase();
  }

  /**
   * Optimize content with urgency and scarcity elements
   */
  static optimizeContentWithUrgencyScarcity(
    content: string,
    optimization: ReturnType<typeof generateConversionOptimization>
  ): string {
    let optimizedContent = content;

    // Add urgency elements at strategic points
    const contentSections = optimizedContent.split("\n\n");
    const insertionPoints = [
      Math.floor(contentSections.length * 0.3), // 30% through
      Math.floor(contentSections.length * 0.7), // 70% through
    ];

    // Insert urgency elements
    optimization.urgencyElements.forEach((element, index) => {
      const insertPoint = insertionPoints[index] || contentSections.length - 2;
      if (insertPoint < contentSections.length) {
        contentSections.splice(
          insertPoint,
          0,
          `\n\n**${element.trigger}**\n${element.context}\n`
        );
      }
    });

    // Add scarcity elements near conclusion
    const scarcityPoint = contentSections.length - 3;
    if (optimization.scarcityElements.length > 0) {
      const scarcityElement = optimization.scarcityElements[0];
      contentSections.splice(
        scarcityPoint,
        0,
        `\n\n**${scarcityElement.trigger}**\n${scarcityElement.context}\n`
      );
    }

    return contentSections.join("\n\n");
  }

  /**
   * Generate Romanian-specific pricing context
   */
  static generatePricingContext(
    productCategory: string,
    originalPrice: number,
    discountPrice: number
  ): string {
    const savings = originalPrice - discountPrice;
    const savingsPercent = Math.round((savings / originalPrice) * 100);

    return `**ECONOMISIȚI ${savingsPercent}%!**\n\nPreț normal: ${originalPrice} lei\nPreț special: ${discountPrice} lei\n**Economisiți ${savings} lei!**\n\n*Comparați cu cursurile particulare care costă 50-80 lei/oră!*`;
  }

  /**
   * Validate urgency and scarcity elements
   */
  static validateUrgencyScarcityElements(): boolean {
    try {
      // Check if all urgency elements have required fields
      for (const element of ROMANIAN_URGENCY_ELEMENTS) {
        if (!element.trigger || !element.context) {
          throw new Error(
            `Missing required fields in urgency element: ${element.trigger}`
          );
        }
      }

      // Check if all scarcity elements have required fields
      for (const element of ROMANIAN_SCARCITY_ELEMENTS) {
        if (!element.trigger || !element.context) {
          throw new Error(
            `Missing required fields in scarcity element: ${element.trigger}`
          );
        }
      }

      // Check if buyer psychology profiles are complete
      for (const profile of ROMANIAN_BUYER_PSYCHOLOGY) {
        if (!profile.primaryTrigger || !profile.conversionHook) {
          throw new Error(
            `Incomplete buyer psychology profile: ${profile.primaryTrigger}`
          );
        }
      }

      // Check Romanian character encoding
      const allText = [
        ...ROMANIAN_URGENCY_ELEMENTS.map(e => e.trigger + e.context),
        ...ROMANIAN_SCARCITY_ELEMENTS.map(e => e.trigger + e.context),
        ...ROMANIAN_BUYER_PSYCHOLOGY.map(
          p => p.culturalContext + p.conversionHook
        ),
      ].join("");

      const hasRomanianChars = /[ăâîșțĂÂÎȘȚ]/.test(allText);
      if (!hasRomanianChars) {
        throw new Error(
          "No Romanian characters found in urgency/scarcity elements"
        );
      }

      return true;
    } catch (error) {
      console.error("Urgency/scarcity validation failed:", error);
      return false;
    }
  }
}
