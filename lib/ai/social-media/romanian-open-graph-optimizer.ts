/**
 * ROMANIAN OPEN GRAPH OPTIMIZER FOR VIRAL SOCIAL MEDIA SHARING
 * Advanced Open Graph meta tags optimized for Romanian Facebook/Instagram sharing
 *
 * Generates viral-ready meta tags that maximize click-through rates and shares
 * on Romanian social media platforms
 */

export interface OpenGraphMetaTags {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "article" | "website" | "product";
  siteName: string;
  locale: string;
  article?: {
    publishedTime: string;
    modifiedTime: string;
    author: string;
    section: string;
    tags: string[];
  };
}

export interface InstagramOptimization {
  image: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
}

export interface FacebookOptimization {
  title: string;
  description: string;
  image: string;
  link: string;
  callToAction: string;
}

export interface TikTokReadyContent {
  hook: string;
  description: string;
  hashtags: string[];
  trendingSound?: string;
}

export interface LinkedInOptimization {
  title: string;
  description: string;
  image: string;
  articleUrl: string;
  author: string;
  publishedDate: string;
}

export class RomanianOpenGraphOptimizer {
  /**
   * Generate optimized Open Graph meta tags for Romanian viral sharing
   */
  static generateOpenGraphTags(
    blogTitle: string,
    excerpt: string,
    keywords: string[],
    imageUrl?: string,
    articleUrl?: string,
    publishedDate?: string
  ): OpenGraphMetaTags {
    // Optimize title for social media (Facebook shows ~40 characters)
    const optimizedTitle = this.optimizeTitleForSocial(blogTitle);

    // Create viral description with Romanian emotional triggers
    const viralDescription = this.createViralDescription(excerpt, keywords);

    // Generate optimal image URL (fallback to default)
    const ogImage = imageUrl || this.generateDefaultImageUrl(keywords);

    // Ensure URL is properly formatted
    const canonicalUrl = articleUrl || "https://techtots.ro";

    // Romanian locale for Facebook
    const locale = "ro_RO";

    const ogTags: OpenGraphMetaTags = {
      title: optimizedTitle,
      description: viralDescription,
      image: ogImage,
      url: canonicalUrl,
      type: "article",
      siteName: "TechTots România",
      locale,
    };

    // Add article-specific metadata if available
    if (publishedDate) {
      ogTags.article = {
        publishedTime: publishedDate,
        modifiedTime: publishedDate,
        author: "TechTots România",
        section: "Educație STEM",
        tags: keywords.slice(0, 5),
      };
    }

    return ogTags;
  }

  /**
   * Optimize title for social media character limits and engagement
   */
  private static optimizeTitleForSocial(title: string): string {
    // Facebook shows ~40 characters in feed, ~60 in preview
    // Instagram shows ~50-60 characters
    const maxLength = 55; // Safe limit for both platforms

    if (title.length <= maxLength) {
      return title;
    }

    // Try to cut at word boundary
    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + "...";
    }

    return truncated + "...";
  }

  /**
   * Create viral description with Romanian emotional triggers
   */
  private static createViralDescription(
    excerpt: string,
    keywords: string[]
  ): string {
    // Facebook shows ~160 characters, Instagram ~125
    const maxLength = 140;

    // Add emotional hooks that drive clicks
    const emotionalTriggers = [
      "ȘOCANT: ",
      "Adevărul dureros: ",
      "Ce nu vă spune nimeni: ",
      "Secretul părinților români: ",
      "Soluția pe care o căutați: ",
    ];

    const trigger =
      emotionalTriggers[Math.floor(Math.random() * emotionalTriggers.length)];

    let viralDescription = trigger + excerpt;

    // Add primary keyword if not present
    if (
      keywords.length > 0 &&
      !viralDescription.toLowerCase().includes(keywords[0].toLowerCase())
    ) {
      viralDescription += ` #${keywords[0]}`;
    }

    // Ensure it fits within limits
    if (viralDescription.length > maxLength) {
      viralDescription = viralDescription.substring(0, maxLength - 3) + "...";
    }

    return viralDescription;
  }

  /**
   * Generate default image URL based on keywords
   */
  private static generateDefaultImageUrl(keywords: string[]): string {
    // Map keywords to appropriate images
    const keywordMappings: Record<string, string> = {
      matematică: "matematica-stem-romania-2025.jpg",
      știință: "stiinta-experimente-copii.jpg",
      programare: "programare-codare-copii-romania.jpg",
      robotica: "robotica-stem-romania.jpg",
      educație: "educatie-stem-romania.jpg",
      copii: "copii-joaca-stem.jpg",
      școală: "scoala-stem-romania.jpg",
      părinți: "parinti-educatie-copii.jpg",
    };

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      for (const [key, image] of Object.entries(keywordMappings)) {
        if (lowerKeyword.includes(key)) {
          return `https://techtots.ro/images/og/${image}`;
        }
      }
    }

    // Default image
    return "https://techtots.ro/images/og/stem-educatie-romania-2025.jpg";
  }

  /**
   * Generate Instagram-optimized content
   */
  static generateInstagramOptimization(
    blogTitle: string,
    excerpt: string,
    keywords: string[]
  ): InstagramOptimization {
    // Instagram favors vertical images and emotional captions
    const image = this.generateInstagramImageUrl(keywords);

    // Create engaging caption with emojis and questions
    const caption = this.createInstagramCaption(blogTitle, excerpt, keywords);

    // Generate Romanian-relevant hashtags
    const hashtags = this.generateRomanianHashtags(keywords);

    // Add viral call-to-action
    const callToAction = this.generateInstagramCTA(keywords);

    return {
      image,
      caption,
      hashtags,
      callToAction,
    };
  }

  /**
   * Generate Instagram image URL (vertical format preferred)
   */
  private static generateInstagramImageUrl(keywords: string[]): string {
    // Instagram prefers 1080x1920 (9:16) aspect ratio
    return `https://techtots.ro/images/instagram/${keywords[0] || "stem"}-romania-vertical.jpg`;
  }

  /**
   * Create engaging Instagram caption with Romanian emotional triggers
   */
  private static createInstagramCaption(
    title: string,
    excerpt: string,
    keywords: string[]
  ): string {
    const hooks = [
      "😱 ȘOCAți de realitatea educației românești?",
      "💡 Descoperiți ce NU vă spune nimeni despre copiii voștri!",
      "🚀 Secretul părinților români de succes!",
      "📚 Adevărul despre școlile din România 2025!",
      "👨‍👩‍👧‍👦 Povestea care vă va schimba perspectiva asupra educației!",
    ];

    const hook = hooks[Math.floor(Math.random() * hooks.length)];

    const caption = `${hook}\n\n${title}\n\n${excerpt.substring(0, 100)}...\n\n`;

    return caption;
  }

  /**
   * Generate Romanian-relevant hashtags for Instagram
   */
  private static generateRomanianHashtags(keywords: string[]): string[] {
    const baseHashtags = [
      "#STEMRomânia",
      "#EducațieRomânească",
      "#CopiiRomâni",
      "#PărințiRomâni",
      "#ȘcoalăRomânească",
      "#ViitorulRomâniei",
      "#Educație2025",
      "#STEM",
      "#Educație",
      "#Copii",
      "#Învățare",
      "#Dezvoltare",
      "#Succes",
      "#România",
      "#FamilieRomânească",
    ];

    // Add keyword-specific hashtags
    const keywordHashtags = keywords.map(
      k =>
        "#" +
        k.replace(/\s+/g, "").replace(/[ăâîșț]/g, match => {
          const replacements: Record<string, string> = {
            ă: "a",
            â: "a",
            î: "i",
            ș: "s",
            ț: "t",
          };
          return replacements[match] || match;
        })
    );

    return [...baseHashtags, ...keywordHashtags].slice(0, 15);
  }

  /**
   * Generate Instagram call-to-action
   */
  private static generateInstagramCTA(keywords: string[]): string {
    const ctas = [
      "👉 Citiți articolul complet în linkul din bio!",
      "👉 Descoperiți soluția în linkul din bio!",
      "👉 Salvați postarea și citiți articolul complet!",
      "👉 Tagați un părinte care trebuie să vadă asta!",
      "👉 Link în bio pentru întreaga poveste!",
    ];

    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  /**
   * Generate Facebook optimization
   */
  static generateFacebookOptimization(
    blogTitle: string,
    excerpt: string,
    keywords: string[],
    articleUrl: string
  ): FacebookOptimization {
    return {
      title: this.optimizeTitleForSocial(blogTitle),
      description: this.createViralDescription(excerpt, keywords),
      image: this.generateDefaultImageUrl(keywords),
      link: articleUrl,
      callToAction: "Citiți acum",
    };
  }

  /**
   * Generate TikTok-ready content for Gen Z parents
   */
  static generateTikTokContent(
    blogTitle: string,
    excerpt: string,
    keywords: string[]
  ): TikTokReadyContent {
    const hooks = [
      "ȘOCANT: Ce se întâmplă cu educația copiilor noștri! 👀",
      "Părinții români, UITAȚI-VĂ de ce tocmai ați citit! 💥",
      "Adevărul DUREROS despre școlile românești în 2025! 😱",
      "Ce NU vă spune nimeni despre viitorul copiilor voștri! 🤫",
      "Secretul pe care toți părinții români trebuie să-l știe! 🔑",
    ];

    const trendingSounds = [
      "original sound - poveste adevărată",
      "original sound - părinți români",
      "original sound - educație 2025",
      "Sad Romanian Folk Song - pentru emoție",
      "original sound - șocant",
    ];

    return {
      hook: hooks[Math.floor(Math.random() * hooks.length)],
      description: `${blogTitle}\n\n${excerpt.substring(0, 80)}...\n\n#PărințiRomâni #Educație #STEM #România`,
      hashtags: this.generateRomanianHashtags(keywords).slice(0, 10),
      trendingSound:
        trendingSounds[Math.floor(Math.random() * trendingSounds.length)],
    };
  }

  /**
   * Generate LinkedIn optimization for B2B educational content
   */
  static generateLinkedInOptimization(
    blogTitle: string,
    excerpt: string,
    keywords: string[],
    articleUrl: string,
    publishedDate: string
  ): LinkedInOptimization {
    return {
      title:
        blogTitle.length > 70 ? blogTitle.substring(0, 67) + "..." : blogTitle,
      description:
        excerpt.length > 160 ? excerpt.substring(0, 157) + "..." : excerpt,
      image: this.generateDefaultImageUrl(keywords),
      articleUrl,
      author: "TechTots România",
      publishedDate,
    };
  }

  /**
   * Generate complete social media optimization package
   */
  static generateCompleteSocialOptimization(
    blogTitle: string,
    excerpt: string,
    keywords: string[],
    articleUrl: string,
    publishedDate: string
  ) {
    return {
      openGraph: this.generateOpenGraphTags(
        blogTitle,
        excerpt,
        keywords,
        undefined,
        articleUrl,
        publishedDate
      ),
      facebook: this.generateFacebookOptimization(
        blogTitle,
        excerpt,
        keywords,
        articleUrl
      ),
      instagram: this.generateInstagramOptimization(
        blogTitle,
        excerpt,
        keywords
      ),
      tiktok: this.generateTikTokContent(blogTitle, excerpt, keywords),
      linkedin: this.generateLinkedInOptimization(
        blogTitle,
        excerpt,
        keywords,
        articleUrl,
        publishedDate
      ),
    };
  }

  /**
   * Validate social media optimization
   */
  static validateSocialOptimization(
    optimization: ReturnType<typeof generateCompleteSocialOptimization>
  ): boolean {
    try {
      // Check Open Graph requirements
      if (
        !optimization.openGraph.title ||
        !optimization.openGraph.description ||
        !optimization.openGraph.image
      ) {
        throw new Error("Missing required Open Graph fields");
      }

      // Check character limits
      if (optimization.openGraph.title.length > 60) {
        throw new Error("Open Graph title too long");
      }
      if (optimization.openGraph.description.length > 160) {
        throw new Error("Open Graph description too long");
      }

      // Check Facebook optimization
      if (!optimization.facebook.title || !optimization.facebook.link) {
        throw new Error("Missing required Facebook fields");
      }

      // Check Instagram optimization
      if (
        !optimization.instagram.caption ||
        optimization.instagram.hashtags.length === 0
      ) {
        throw new Error("Missing required Instagram fields");
      }

      // Check Romanian characters
      const hasRomanianChars = [
        optimization.openGraph.title,
        optimization.openGraph.description,
        optimization.facebook.description,
        optimization.instagram.caption,
      ].some(text => /[ăâîșțĂÂÎȘȚ]/.test(text));

      if (!hasRomanianChars) {
        throw new Error("No Romanian characters found in social optimization");
      }

      return true;
    } catch (error) {
      console.error("Social optimization validation failed:", error);
      return false;
    }
  }
}
