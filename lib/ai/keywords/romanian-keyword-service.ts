/**
 * ROMANIAN KEYWORD SERVICE FOR VIRAL SEO SUCCESS
 * Dynamic keyword selection and optimization for Romanian STEM content
 */

import {
  getKeywordsForTopic,
  getPrimaryKeywords,
  getCommercialKeywords,
  getLongTailKeywords,
  getPainPointKeywords,
  getVoiceSearchQuestions,
  getRegionalKeywords,
  getSeasonalKeywords,
  searchKeywords,
} from "./romanian-stem-keywords";
import { BlogGenerationPrompt } from "../blog-types";

export interface KeywordOptimization {
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  commercialKeywords: string[];
  voiceSearchKeywords: string[];
  painPointKeywords: string[];
  regionalKeywords: string[];
  seasonalKeywords: string[];
}

export interface ContentKeywordAnalysis {
  keywordDensity: {
    primary: number;
    secondary: number;
    commercial: number;
  };
  missingKeywords: string[];
  overusedKeywords: string[];
  suggestions: string[];
}

export class RomanianKeywordService {
  /**
   * Analyze prompt and select optimal keywords for content generation
   */
  static selectKeywordsForPrompt(
    prompt: BlogGenerationPrompt
  ): KeywordOptimization {
    const promptText = prompt.prompt.toLowerCase();

    // Determine topic from prompt
    const topic = this.identifyTopic(promptText);

    // Get topic-specific keywords
    const topicKeywords = getKeywordsForTopic(topic);

    // Select primary keyword (highest relevance)
    const primaryKeyword = this.selectPrimaryKeyword(
      promptText,
      topicKeywords.primary
    );

    // Select secondary keywords (5-8)
    const secondaryKeywords = this.selectSecondaryKeywords(
      promptText,
      topicKeywords.secondary
    );

    // Select long-tail keywords (8-12)
    const longTailKeywords = this.selectLongTailKeywords(
      promptText,
      topicKeywords.longTail
    );

    // Commercial keywords for conversion
    const commercialKeywords = getCommercialKeywords().slice(0, 5);

    // Voice search questions for featured snippets
    const voiceSearchKeywords = getVoiceSearchQuestions().slice(0, 8);

    // Pain point keywords for viral content
    const painPointKeywords = getPainPointKeywords().slice(0, 6);

    // Regional keywords (default to Bucharest)
    const regionalKeywords = getRegionalKeywords("bucuresti").slice(0, 4);

    // Seasonal keywords (determine current season)
    const seasonalKeywords = this.getCurrentSeasonKeywords().slice(0, 4);

    return {
      primaryKeyword,
      secondaryKeywords,
      longTailKeywords,
      commercialKeywords,
      voiceSearchKeywords,
      painPointKeywords,
      regionalKeywords,
      seasonalKeywords,
    };
  }

  /**
   * Identify the main topic from prompt text
   */
  private static identifyTopic(promptText: string): string {
    const topicKeywords = {
      matematică: [
        "matematică",
        "matematica",
        "mate",
        "calcul",
        "numere",
        "geometrie",
        "algebră",
      ],
      știință: [
        "știință",
        "stiinta",
        "chimie",
        "fizică",
        "biologie",
        "experiment",
        "laborator",
      ],
      programare: [
        "programare",
        "coding",
        "robotica",
        "roboți",
        "algoritm",
        "software",
        "aplicație",
      ],
      robotica: [
        "robotica",
        "roboți",
        "robot",
        "automate",
        "inteligență artificială",
        "ai",
      ],
      explorare: [
        "știință",
        "explorare",
        "descoperire",
        "natură",
        "mediu",
        "planetă",
      ],
      inginerie: [
        "inginerie",
        "construcție",
        "clădire",
        "mecanică",
        "electricitate",
      ],
      tehnologie: [
        "tehnologie",
        "digital",
        "gadget",
        "dispozitiv",
        "electronic",
      ],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => promptText.includes(keyword))) {
        return topic;
      }
    }

    return "general";
  }

  /**
   * Select the most relevant primary keyword
   */
  private static selectPrimaryKeyword(
    promptText: string,
    topicKeywords: string[]
  ): string {
    // First try topic-specific keywords
    for (const keyword of topicKeywords) {
      if (
        promptText.includes(
          keyword.replace("jucării ", "").replace("STEM ", "")
        )
      ) {
        return keyword;
      }
    }

    // Fallback to general primary keywords
    const primaryKeywords = getPrimaryKeywords();
    for (const keyword of primaryKeywords) {
      if (
        promptText.includes(
          keyword.replace("jucării ", "").replace("STEM ", "")
        )
      ) {
        return keyword;
      }
    }

    // Ultimate fallback
    return primaryKeywords[0];
  }

  /**
   * Select 5-8 relevant secondary keywords
   */
  private static selectSecondaryKeywords(
    promptText: string,
    topicKeywords: string[]
  ): string[] {
    const selected = [];

    // Add topic-specific keywords
    for (const keyword of topicKeywords.slice(0, 4)) {
      if (!selected.includes(keyword)) {
        selected.push(keyword);
      }
    }

    // Add general commercial keywords
    const commercial = getCommercialKeywords().slice(0, 4);
    for (const keyword of commercial) {
      if (!selected.includes(keyword) && selected.length < 8) {
        selected.push(keyword);
      }
    }

    return selected.slice(0, 8);
  }

  /**
   * Select 8-12 relevant long-tail keywords
   */
  private static selectLongTailKeywords(
    promptText: string,
    topicKeywords: string[]
  ): string[] {
    const selected = [];

    // Add topic-specific long-tail
    for (const keyword of topicKeywords.slice(0, 6)) {
      if (!selected.includes(keyword)) {
        selected.push(keyword);
      }
    }

    // Add general long-tail
    const longTail = getLongTailKeywords().slice(0, 6);
    for (const keyword of longTail) {
      if (!selected.includes(keyword) && selected.length < 12) {
        selected.push(keyword);
      }
    }

    return selected.slice(0, 12);
  }

  /**
   * Get current season keywords based on date
   */
  private static getCurrentSeasonKeywords(): string[] {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12

    if (month >= 9 && month <= 11) {
      return getSeasonalKeywords("backToSchool");
    } else if (month >= 12 || month <= 2) {
      return getSeasonalKeywords("winterHolidays");
    } else if (month >= 6 && month <= 8) {
      return getSeasonalKeywords("summerBreak");
    } else if (month >= 5 && month <= 6) {
      return getSeasonalKeywords("examSeason");
    } else {
      return getSeasonalKeywords("backToSchool"); // Default to back to school
    }
  }

  /**
   * Analyze content for keyword optimization
   */
  static analyzeContentKeywords(
    content: string,
    targetKeywords: KeywordOptimization
  ): ContentKeywordAnalysis {
    const contentLower = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;

    // Calculate keyword density
    const primaryCount = this.countKeywordOccurrences(
      contentLower,
      targetKeywords.primaryKeyword
    );
    const secondaryCount = targetKeywords.secondaryKeywords.reduce(
      (total, keyword) =>
        total + this.countKeywordOccurrences(contentLower, keyword),
      0
    );
    const commercialCount = targetKeywords.commercialKeywords.reduce(
      (total, keyword) =>
        total + this.countKeywordOccurrences(contentLower, keyword),
      0
    );

    const keywordDensity = {
      primary: (primaryCount / wordCount) * 100,
      secondary: (secondaryCount / wordCount) * 100,
      commercial: (commercialCount / wordCount) * 100,
    };

    // Find missing important keywords
    const missingKeywords = [];
    if (keywordDensity.primary < 0.5) {
      missingKeywords.push(targetKeywords.primaryKeyword);
    }
    if (keywordDensity.secondary < 0.3) {
      missingKeywords.push(...targetKeywords.secondaryKeywords.slice(0, 2));
    }

    // Find overused keywords
    const overusedKeywords = [];
    if (keywordDensity.primary > 3) {
      overusedKeywords.push(targetKeywords.primaryKeyword);
    }
    if (keywordDensity.secondary > 2) {
      overusedKeywords.push("secondary keywords");
    }

    // Generate suggestions
    const suggestions = [];
    if (missingKeywords.length > 0) {
      suggestions.push(
        `Add more instances of: ${missingKeywords.slice(0, 3).join(", ")}`
      );
    }
    if (overusedKeywords.length > 0) {
      suggestions.push(`Reduce usage of: ${overusedKeywords.join(", ")}`);
    }
    if (keywordDensity.primary < 1) {
      suggestions.push("Increase primary keyword density to 1-2%");
    }
    if (keywordDensity.secondary < 0.5) {
      suggestions.push("Add more secondary keywords for better SEO coverage");
    }

    return {
      keywordDensity,
      missingKeywords,
      overusedKeywords,
      suggestions,
    };
  }

  /**
   * Count occurrences of a keyword in content
   */
  private static countKeywordOccurrences(
    content: string,
    keyword: string
  ): number {
    const regex = new RegExp(
      keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  /**
   * Optimize content by adding missing keywords naturally
   */
  static optimizeContentKeywords(
    content: string,
    analysis: ContentKeywordAnalysis,
    targetKeywords: KeywordOptimization
  ): string {
    let optimizedContent = content;

    // Add missing primary keyword if density is too low
    if (
      analysis.keywordDensity.primary < 1 &&
      analysis.missingKeywords.includes(targetKeywords.primaryKeyword)
    ) {
      // Find a good place to add the primary keyword (e.g., in introduction or conclusion)
      const introPattern = /(Introducere|primul|început)/i;
      if (introPattern.test(optimizedContent)) {
        optimizedContent = optimizedContent.replace(
          introPattern,
          `$& ${targetKeywords.primaryKeyword}`
        );
      }
    }

    return optimizedContent;
  }

  /**
   * Generate keyword-rich title suggestions
   */
  static generateKeywordRichTitles(
    baseTitle: string,
    keywords: KeywordOptimization,
    count: number = 5
  ): string[] {
    const titles = [baseTitle]; // Keep original

    // Generate variations with primary keyword
    titles.push(`${keywords.primaryKeyword}: ${baseTitle}`);
    titles.push(`${baseTitle} - ${keywords.primaryKeyword}`);

    // Add pain point driven titles
    if (keywords.painPointKeywords.length > 0) {
      const painPoint = keywords.painPointKeywords[0];
      titles.push(
        `De ce ${painPoint}? ${keywords.primaryKeyword} este SOLUȚIA!`
      );
    }

    // Add question-based titles
    if (keywords.voiceSearchKeywords.length > 0) {
      const question = keywords.voiceSearchKeywords[0].replace("?", "").trim();
      titles.push(`${question}? DESCOPERĂ ${keywords.primaryKeyword}!`);
    }

    // Add commercial titles
    if (keywords.commercialKeywords.length > 0) {
      const commercial = keywords.commercialKeywords[0];
      titles.push(`${keywords.primaryKeyword} 2025: ${commercial}`);
    }

    // Ensure all titles are under 60 characters and unique
    return titles
      .filter(title => title.length <= 60)
      .filter((title, index, arr) => arr.indexOf(title) === index)
      .slice(0, count);
  }

  /**
   * Generate SEO-optimized excerpt with keywords
   */
  static generateKeywordRichExcerpt(
    content: string,
    keywords: KeywordOptimization
  ): string {
    // Extract first 150-200 characters and optimize with keywords
    const excerpt = content.substring(0, 180);
    let optimizedExcerpt = excerpt;

    // Try to include primary keyword if not present
    if (
      !excerpt.toLowerCase().includes(keywords.primaryKeyword.toLowerCase())
    ) {
      optimizedExcerpt = `${keywords.primaryKeyword} ${excerpt.toLowerCase()}`;
    }

    // Add a hook with secondary keyword
    if (keywords.secondaryKeywords.length > 0) {
      const secondaryKeyword = keywords.secondaryKeywords[0];
      optimizedExcerpt = optimizedExcerpt.replace(
        /(\w+)\s+(\w+)/,
        `$1 $2 ${secondaryKeyword}`
      );
    }

    // Ensure it's within limits
    return optimizedExcerpt.length > 200
      ? optimizedExcerpt.substring(0, 197) + "..."
      : optimizedExcerpt;
  }

  /**
   * Get keyword suggestions for a specific topic
   */
  static getKeywordSuggestions(
    topic: string,
    intent: "commercial" | "informational" | "navigational" = "commercial"
  ): string[] {
    switch (intent) {
      case "commercial":
        return getCommercialKeywords().slice(0, 10);
      case "informational":
        return getLongTailKeywords().slice(0, 10);
      case "navigational":
        return getPrimaryKeywords().slice(0, 10);
      default:
        return getKeywordsForTopic(topic).primary;
    }
  }
}
