// Hormozi Style Conversion Tracking System
// Tracks all conversion events for optimization and A/B testing

export interface ConversionEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  element?: string;
  variant?: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-1, probability of being selected
  isControl?: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

// Active A/B Tests Configuration
export const AB_TESTS: Record<string, ABTest> = {
  hero_headline: {
    id: "hero_headline",
    name: "Hero Headline A/B Test",
    variants: [
      {
        id: "control",
        name: "Original Headline",
        weight: 0.5,
        isControl: true,
      },
      { id: "variant_a", name: "Transformation Focus", weight: 0.25 },
      { id: "variant_b", name: "Pain Point Focus", weight: 0.25 },
    ],
    isActive: true,
    startDate: new Date(),
  },
  cta_button: {
    id: "cta_button",
    name: "Primary CTA Button Text",
    variants: [
      {
        id: "control",
        name: "See How It Works",
        weight: 0.33,
        isControl: true,
      },
      { id: "variant_a", name: "Get Free Demo", weight: 0.33 },
      { id: "variant_b", name: "Start Transformation", weight: 0.34 },
    ],
    isActive: true,
    startDate: new Date(),
  },
  value_proposition: {
    id: "value_proposition",
    name: "Value Proposition Layout",
    variants: [
      { id: "control", name: "4 Cards Grid", weight: 0.5, isControl: true },
      {
        id: "variant_a",
        name: "3 Transformations + Social Proof",
        weight: 0.5,
      },
    ],
    isActive: true,
    startDate: new Date(),
  },
};

// Conversion Events Tracking
class ConversionTracker {
  private sessionId: string;
  private userId?: string;
  private events: ConversionEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredEvents();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredEvents(): void {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("conversion_events");
      if (stored) {
        try {
          this.events = JSON.parse(stored);
        } catch (e) {
          this.events = [];
        }
      }
    }
  }

  private saveEvents(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("conversion_events", JSON.stringify(this.events));
    }
  }

  // Track conversion event
  trackEvent(
    event: Omit<ConversionEvent, "timestamp" | "sessionId" | "userId">
  ): void {
    const fullEvent: ConversionEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.events.push(fullEvent);
    this.saveEvents();

    // Send to analytics
    this.sendToAnalytics(fullEvent);
  }

  // Send to Google Analytics, Facebook Pixel, etc.
  private sendToAnalytics(event: ConversionEvent): void {
    if (typeof window === "undefined") return;

    // Google Analytics 4
    if (window.gtag) {
      window.gtag("event", event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameter_element: event.element,
        custom_parameter_variant: event.variant,
      });
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq("track", "CustomEvent", {
        event_name: event.action,
        category: event.category,
        label: event.label,
        value: event.value,
        element: event.element,
        variant: event.variant,
      });
    }

    // Console log for development
    if (process.env.NODE_ENV === "development") {
      console.log("Conversion Event:", event);
    }
  }

  // A/B Testing Functions
  getVariant(testId: string): ABTestVariant | null {
    const test = AB_TESTS[testId];
    if (!test || !test.isActive) {
      return null;
    }

    // Check if user already has a variant assigned
    const storedVariant = this.getStoredVariant(testId);
    if (storedVariant) {
      return storedVariant;
    }

    // Assign new variant based on weights
    const variant = this.selectVariant(test.variants);

    // Store variant for consistency
    this.storeVariant(testId, variant);

    // Track variant assignment
    this.trackEvent({
      action: "variant_assigned",
      category: "ab_test",
      label: testId,
      element: variant.id,
      variant: variant.name,
    });

    return variant;
  }

  private selectVariant(variants: ABTestVariant[]): ABTestVariant {
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to first variant
    return variants[0];
  }

  private getStoredVariant(testId: string): ABTestVariant | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(`ab_test_${testId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private storeVariant(testId: string, variant: ABTestVariant): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(`ab_test_${testId}`, JSON.stringify(variant));
  }

  // Get conversion metrics
  getConversionMetrics(): {
    totalEvents: number;
    uniqueUsers: number;
    conversionRate: number;
    topEvents: Array<{ action: string; count: number }>;
  } {
    const totalEvents = this.events.length;
    const uniqueUsers = new Set(this.events.map(e => e.sessionId)).size;

    // Calculate conversion rate (events per session)
    const conversionRate = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0;

    // Get top events
    const eventCounts = this.events.reduce(
      (acc, event) => {
        acc[event.action] = (acc[event.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topEvents = Object.entries(eventCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents,
      uniqueUsers,
      conversionRate,
      topEvents,
    };
  }

  // Export events for analysis
  exportEvents(): ConversionEvent[] {
    return [...this.events];
  }

  // Clear events (for testing)
  clearEvents(): void {
    this.events = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("conversion_events");
    }
  }
}

// Global instance
export const conversionTracker = new ConversionTracker();

// React Hook for conversion tracking
export function useConversionTracking() {
  const trackConversion = (
    action: string,
    category: string,
    options?: {
      label?: string;
      value?: number;
      element?: string;
      variant?: string;
    }
  ) => {
    conversionTracker.trackEvent({
      action,
      category,
      ...options,
    });
  };

  const getVariant = (testId: string) => {
    return conversionTracker.getVariant(testId);
  };

  const getMetrics = () => {
    return conversionTracker.getConversionMetrics();
  };

  return {
    trackConversion,
    getVariant,
    getMetrics,
  };
}

// Declare global types for analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}
