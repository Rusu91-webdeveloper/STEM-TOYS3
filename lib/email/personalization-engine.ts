/**
 * Advanced Email Personalization Engine
 * Provides dynamic content, user segmentation, and behavioral targeting
 * for enterprise-grade email personalization
 */

import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    ageGroup?: "toddler" | "preschool" | "elementary" | "middle" | "high";
    interests: string[];
  };
  behavior: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    favoriteCategories: string[];
    abandonedCarts: number;
    emailOpenRate: number;
    emailClickRate: number;
    preferredEmailTime?: string;
    preferredEmailFrequency: "daily" | "weekly" | "monthly";
  };
  segments: string[];
  tags: string[];
}

export interface PersonalizationContext {
  userId?: string;
  email: string;
  sessionId?: string;
  currentPage?: string;
  referrer?: string;
  deviceType?: "mobile" | "desktop" | "tablet";
  location?: {
    country: string;
    city?: string;
    timezone?: string;
  };
  weather?: {
    condition: string;
    temperature: number;
  };
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  dayOfWeek: number;
  isHoliday: boolean;
  season: "spring" | "summer" | "autumn" | "winter";
}

export interface DynamicContent {
  type: "text" | "image" | "product" | "offer" | "cta" | "testimonial";
  content: string;
  fallback: string;
  conditions: PersonalizationRule[];
  priority: number;
}

export interface PersonalizationRule {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "in" | "not_in";
  value: any;
  weight: number;
}

export interface EmailVariant {
  id: string;
  name: string;
  subject: string;
  content: string;
  weight: number;
  conditions?: PersonalizationRule[];
}

/**
 * Advanced Personalization Engine
 */
export class PersonalizationEngine {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly USER_PROFILE_TTL = 1800; // 30 minutes

  /**
   * Get comprehensive user profile for personalization
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `user-profile:${userId}`;
    
    // Check cache first
    const cached = await cache.get<UserProfile>(cacheKey);
    if (cached) return cached;

    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  product: {
                    include: { category: true },
                  },
                },
              },
            },
          },
          newsletter: true,
          cartItems: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });

      if (!user) return null;

      // Calculate behavior metrics
      const totalOrders = user.orders.length;
      const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = user.orders.length > 0 
        ? user.orders[user.orders.length - 1].createdAt 
        : undefined;

      // Analyze favorite categories
      const categoryCounts = new Map<string, number>();
      user.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.product?.category) {
            const categoryId = item.product.category.id;
            categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
          }
        });
      });

      const favoriteCategories = Array.from(categoryCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([categoryId]) => categoryId);

      // Determine user segments
      const segments = this.determineUserSegments({
        totalOrders,
        totalSpent,
        averageOrderValue,
        favoriteCategories,
        lastOrderDate,
      });

      // Generate tags
      const tags = this.generateUserTags({
        totalOrders,
        totalSpent,
        favoriteCategories,
        user.newsletter?.isActive || false,
      });

      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        preferences: {
          categories: favoriteCategories,
          priceRange: this.calculatePriceRange(user.orders),
          ageGroup: this.determineAgeGroup(favoriteCategories),
          interests: this.extractInterests(favoriteCategories),
        },
        behavior: {
          totalOrders,
          totalSpent,
          averageOrderValue,
          lastOrderDate,
          favoriteCategories,
          abandonedCarts: user.cartItems.length,
          emailOpenRate: 0.25, // This would come from email analytics
          emailClickRate: 0.05, // This would come from email analytics
          preferredEmailTime: "09:00", // Default, would be calculated from analytics
          preferredEmailFrequency: "weekly",
        },
        segments,
        tags,
      };

      // Cache the profile
      await cache.set(cacheKey, profile, this.USER_PROFILE_TTL);
      return profile;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  /**
   * Get personalization context for current session
   */
  async getPersonalizationContext(
    userId?: string,
    email?: string,
    sessionId?: string
  ): Promise<PersonalizationContext> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Determine time of day
    let timeOfDay: "morning" | "afternoon" | "evening" | "night";
    if (hour >= 6 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 22) timeOfDay = "evening";
    else timeOfDay = "night";

    // Determine season
    const month = now.getMonth();
    let season: "spring" | "summer" | "autumn" | "winter";
    if (month >= 2 && month <= 4) season = "spring";
    else if (month >= 5 && month <= 7) season = "summer";
    else if (month >= 8 && month <= 10) season = "autumn";
    else season = "winter";

    // Check if it's a holiday (simplified)
    const isHoliday = this.isHoliday(now);

    return {
      userId,
      email,
      sessionId,
      timeOfDay,
      dayOfWeek,
      isHoliday,
      season,
    };
  }

  /**
   * Generate personalized content based on user profile and context
   */
  async generatePersonalizedContent(
    template: string,
    userProfile: UserProfile,
    context: PersonalizationContext
  ): Promise<string> {
    let personalizedContent = template;

    // Personalize greeting
    personalizedContent = this.personalizeGreeting(personalizedContent, userProfile, context);

    // Personalize product recommendations
    personalizedContent = await this.personalizeProductRecommendations(
      personalizedContent,
      userProfile
    );

    // Personalize offers
    personalizedContent = this.personalizeOffers(personalizedContent, userProfile, context);

    // Personalize CTAs
    personalizedContent = this.personalizeCTAs(personalizedContent, userProfile, context);

    // Personalize testimonials
    personalizedContent = this.personalizeTestimonials(personalizedContent, userProfile);

    // Personalize urgency elements
    personalizedContent = this.personalizeUrgency(personalizedContent, userProfile, context);

    return personalizedContent;
  }

  /**
   * Get A/B test variant for user
   */
  async getABTestVariant(
    testId: string,
    userProfile: UserProfile,
    context: PersonalizationContext
  ): Promise<EmailVariant | null> {
    const cacheKey = `ab-test:${testId}:${userProfile.id}`;
    
    // Check cache for existing assignment
    const cached = await cache.get<EmailVariant>(cacheKey);
    if (cached) return cached;

    try {
      // Get test configuration (this would come from database)
      const test = await this.getABTestConfiguration(testId);
      if (!test || !test.isActive) return null;

      // Check if user matches test conditions
      if (!this.matchesTestConditions(test.conditions, userProfile, context)) {
        return null;
      }

      // Assign variant based on user characteristics
      const variant = this.assignVariant(test.variants, userProfile);
      
      if (variant) {
        // Cache the assignment
        await cache.set(cacheKey, variant, 86400); // 24 hours
      }

      return variant;
    } catch (error) {
      console.error("Error getting A/B test variant:", error);
      return null;
    }
  }

  /**
   * Get personalized subject line
   */
  async getPersonalizedSubject(
    baseSubject: string,
    userProfile: UserProfile,
    context: PersonalizationContext
  ): Promise<string> {
    let subject = baseSubject;

    // Add personalization tokens
    if (userProfile.firstName) {
      subject = subject.replace(/\{firstName\}/g, userProfile.firstName);
    }

    // Add urgency based on user behavior
    if (userProfile.behavior.totalOrders === 0) {
      subject = subject.replace(/\{urgency\}/g, "Exclusiv pentru tine");
    } else if (userProfile.behavior.lastOrderDate) {
      const daysSinceLastOrder = Math.floor(
        (Date.now() - userProfile.behavior.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastOrder > 30) {
        subject = subject.replace(/\{urgency\}/g, "Îți lipsești ceva?");
      }
    }

    // Add seasonal elements
    if (context.season === "winter") {
      subject = subject.replace(/\{season\}/g, "🎄");
    } else if (context.season === "spring") {
      subject = subject.replace(/\{season\}/g, "🌸");
    }

    return subject;
  }

  /**
   * Get optimal send time for user
   */
  async getOptimalSendTime(userProfile: UserProfile): Promise<Date> {
    // This would be calculated based on user's email open patterns
    // For now, return a default time
    const now = new Date();
    const optimalHour = 9; // 9 AM
    const optimalMinute = 0;
    
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      optimalHour,
      optimalMinute
    );
  }

  // Private helper methods

  private determineUserSegments(behavior: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    favoriteCategories: string[];
    lastOrderDate?: Date;
  }): string[] {
    const segments: string[] = [];

    // High-value customer
    if (behavior.totalSpent > 500) {
      segments.push("high-value");
    }

    // Frequent buyer
    if (behavior.totalOrders > 5) {
      segments.push("frequent-buyer");
    }

    // New customer
    if (behavior.totalOrders === 0) {
      segments.push("new-customer");
    }

    // At-risk customer (no orders in 90 days)
    if (behavior.lastOrderDate) {
      const daysSinceLastOrder = Math.floor(
        (Date.now() - behavior.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastOrder > 90) {
        segments.push("at-risk");
      }
    }

    // Category-specific segments
    if (behavior.favoriteCategories.includes("robotics")) {
      segments.push("robotics-enthusiast");
    }
    if (behavior.favoriteCategories.includes("chemistry")) {
      segments.push("science-lover");
    }

    return segments;
  }

  private generateUserTags(behavior: {
    totalOrders: number;
    totalSpent: number;
    favoriteCategories: string[];
    isNewsletterSubscriber: boolean;
  }): string[] {
    const tags: string[] = [];

    if (behavior.isNewsletterSubscriber) {
      tags.push("newsletter-subscriber");
    }

    if (behavior.totalSpent > 200) {
      tags.push("big-spender");
    }

    if (behavior.totalOrders > 3) {
      tags.push("returning-customer");
    }

    behavior.favoriteCategories.forEach(category => {
      tags.push(`category-${category}`);
    });

    return tags;
  }

  private calculatePriceRange(orders: any[]): { min: number; max: number } {
    if (orders.length === 0) {
      return { min: 0, max: 100 };
    }

    const prices = orders.map(order => order.total);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  private determineAgeGroup(favoriteCategories: string[]): "toddler" | "preschool" | "elementary" | "middle" | "high" | undefined {
    // This would be determined based on product categories
    // For now, return undefined
    return undefined;
  }

  private extractInterests(favoriteCategories: string[]): string[] {
    // Map categories to interests
    const categoryToInterest: Record<string, string> = {
      robotics: "tehnologie",
      chemistry: "știință",
      physics: "fizică",
      mathematics: "matematică",
      engineering: "inginerie",
    };

    return favoriteCategories
      .map(category => categoryToInterest[category])
      .filter(Boolean);
  }

  private isHoliday(date: Date): boolean {
    // Simplified holiday check
    const month = date.getMonth();
    const day = date.getDate();
    
    // Christmas
    if (month === 11 && day >= 20) return true;
    // Easter (simplified)
    if (month === 3 && day >= 15 && day <= 25) return true;
    
    return false;
  }

  private personalizeGreeting(
    content: string,
    userProfile: UserProfile,
    context: PersonalizationContext
  ): string {
    let greeting = "Salut";

    if (userProfile.firstName) {
      greeting = `Salut ${userProfile.firstName}`;
    }

    // Add time-based greeting
    if (context.timeOfDay === "morning") {
      greeting += ", bună dimineața";
    } else if (context.timeOfDay === "afternoon") {
      greeting += ", bună ziua";
    } else if (context.timeOfDay === "evening") {
      greeting += ", bună seara";
    }

    return content.replace(/\{greeting\}/g, greeting);
  }

  private async personalizeProductRecommendations(
    content: string,
    userProfile: UserProfile
  ): Promise<string> {
    // Get personalized product recommendations
    const recommendations = await this.getPersonalizedProducts(userProfile);
    
    if (recommendations.length > 0) {
      const productHtml = recommendations
        .map(product => `
          <div style="background: white; border-radius: 8px; padding: 16px; margin: 8px 0; border: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">${product.name}</h4>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${product.description}</p>
            <p style="margin: 0; font-weight: bold; color: #059669;">${product.price} LEI</p>
          </div>
        `)
        .join("");

      return content.replace(/\{personalizedProducts\}/g, productHtml);
    }

    return content.replace(/\{personalizedProducts\}/g, "");
  }

  private async getPersonalizedProducts(userProfile: UserProfile): Promise<any[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          categoryId: { in: userProfile.preferences.categories },
          price: {
            gte: userProfile.preferences.priceRange.min,
            lte: userProfile.preferences.priceRange.max,
          },
        },
        take: 3,
        include: {
          category: true,
        },
      });

      return products;
    } catch (error) {
      console.error("Error getting personalized products:", error);
      return [];
    }
  }

  private personalizeOffers(
    content: string,
    userProfile: UserProfile,
    context: PersonalizationContext
  ): string {
    let offer = "";

    // New customer offer
    if (userProfile.behavior.totalOrders === 0) {
      offer = "Primești 15% reducere la prima comandă!";
    }
    // Returning customer offer
    else if (userProfile.behavior.totalOrders > 3) {
      offer = "Pentru că ești un client fidel, primești 10% reducere!";
    }
    // At-risk customer offer
    else if (userProfile.segments.includes("at-risk")) {
      offer = "Îți lipsești ceva? Primești 20% reducere pentru a te readuce!";
    }

    return content.replace(/\{personalizedOffer\}/g, offer);
  }

  private personalizeCTAs(
    content: string,
    userProfile: UserProfile,
    context: PersonalizationContext
  ): string {
    let ctaText = "Cumpără Acum";

    // New customer
    if (userProfile.behavior.totalOrders === 0) {
      ctaText = "Începe Să Cumperi";
    }
    // Returning customer
    else if (userProfile.behavior.totalOrders > 3) {
      ctaText = "Continuă Să Explorezi";
    }
    // At-risk customer
    else if (userProfile.segments.includes("at-risk")) {
      ctaText = "Revino la Noi";
    }

    return content.replace(/\{personalizedCTA\}/g, ctaText);
  }

  private personalizeTestimonials(
    content: string,
    userProfile: UserProfile
  ): string {
    // Select testimonial based on user segments
    let testimonial = "";

    if (userProfile.segments.includes("robotics-enthusiast")) {
      testimonial = "Produsele de robotică sunt minunate! Copilul meu învață în fiecare zi.";
    } else if (userProfile.segments.includes("science-lover")) {
      testimonial = "Experimentele de chimie sunt atât de educaționale și distractive!";
    } else {
      testimonial = "Produsele STEM de la TechTots sunt de calitate superioară!";
    }

    return content.replace(/\{personalizedTestimonial\}/g, testimonial);
  }

  private personalizeUrgency(
    content: string,
    userProfile: UserProfile,
    context: PersonalizationContext
  ): string {
    let urgency = "";

    // New customer urgency
    if (userProfile.behavior.totalOrders === 0) {
      urgency = "Ofertă exclusivă pentru clienții noi - expiră în 24 de ore!";
    }
    // Holiday urgency
    else if (context.isHoliday) {
      urgency = "Ofertă de sărbători - expiră în 48 de ore!";
    }
    // Seasonal urgency
    else if (context.season === "winter") {
      urgency = "Ofertă de iarnă - expiră în 72 de ore!";
    }

    return content.replace(/\{personalizedUrgency\}/g, urgency);
  }

  private matchesTestConditions(
    conditions: PersonalizationRule[],
    userProfile: UserProfile,
    context: PersonalizationContext
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = this.getFieldValue(condition.field, userProfile, context);
      return this.evaluateCondition(condition, value);
    });
  }

  private getFieldValue(field: string, userProfile: UserProfile, context: PersonalizationContext): any {
    const fieldMap: Record<string, any> = {
      "segments": userProfile.segments,
      "totalOrders": userProfile.behavior.totalOrders,
      "totalSpent": userProfile.behavior.totalSpent,
      "timeOfDay": context.timeOfDay,
      "season": context.season,
      "isHoliday": context.isHoliday,
    };

    return fieldMap[field];
  }

  private evaluateCondition(condition: PersonalizationRule, value: any): boolean {
    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "contains":
        return Array.isArray(value) ? value.includes(condition.value) : String(value).includes(condition.value);
      case "not_contains":
        return Array.isArray(value) ? !value.includes(condition.value) : !String(value).includes(condition.value);
      case "greater_than":
        return Number(value) > Number(condition.value);
      case "less_than":
        return Number(value) < Number(condition.value);
      case "in":
        return Array.isArray(condition.value) ? condition.value.includes(value) : false;
      case "not_in":
        return Array.isArray(condition.value) ? !condition.value.includes(value) : true;
      default:
        return false;
    }
  }

  private assignVariant(variants: EmailVariant[], userProfile: UserProfile): EmailVariant | null {
    if (!variants || variants.length === 0) return null;

    // Simple hash-based assignment for consistent user experience
    const hash = this.hashString(userProfile.id);
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let weightSum = 0;

    for (const variant of variants) {
      weightSum += variant.weight;
      if (hash <= weightSum / totalWeight) {
        return variant;
      }
    }

    return variants[0]; // Fallback
  }

  private async getABTestConfiguration(testId: string): Promise<any> {
    // This would come from database
    // For now, return a mock configuration
    return {
      id: testId,
      isActive: true,
      conditions: [],
      variants: [
        { id: "control", name: "Control", weight: 50 },
        { id: "variant-a", name: "Variant A", weight: 50 },
      ],
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const personalizationEngine = new PersonalizationEngine();
