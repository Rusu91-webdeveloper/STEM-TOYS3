export interface ConversionEvent {
  id: string;
  timestamp: string;
  type: 'click' | 'form_submit' | 'purchase' | 'signup' | 'download' | 'scroll' | 'time_on_page';
  category: 'cta' | 'navigation' | 'form' | 'ecommerce' | 'engagement';
  action: string;
  element: {
    id?: string;
    className?: string;
    tagName: string;
    text?: string;
    href?: string;
    type?: string;
  };
  page: {
    url: string;
    title: string;
    referrer?: string;
  };
  user: {
    id?: string;
    sessionId?: string;
    isAuthenticated: boolean;
    userAgent: string;
    ip?: string;
  };
  context: {
    scrollDepth?: number;
    timeOnPage?: number;
    previousActions?: string[];
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  };
  metadata: Record<string, any>;
}

export interface ConversionReport {
  totalConversions: number;
  conversionRate: number;
  conversionsByType: Record<string, number>;
  conversionsByCategory: Record<string, number>;
  topPerformingElements: Array<{
    element: string;
    conversions: number;
    conversionRate: number;
  }>;
  userJourney: Array<{
    step: string;
    conversions: number;
    dropoffRate: number;
  }>;
  timeBasedAnalysis: {
    hourly: Record<string, number>;
    daily: Record<string, number>;
    weekly: Record<string, number>;
  };
  revenueImpact?: {
    totalRevenue: number;
    averageOrderValue: number;
    revenuePerConversion: number;
  };
}

export interface ConversionTrackingConfig {
  enabled: boolean;
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  trackScrollDepth: boolean;
  trackTimeOnPage: boolean;
  trackUserJourney: boolean;
  includeUTMParams: boolean;
  includeRevenue: boolean;
  debug: boolean;
}

class ConversionTracker {
  private conversions: ConversionEvent[] = [];
  private config: ConversionTrackingConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private pageStartTime: number = Date.now();
  private scrollDepth: number = 0;
  private userActions: string[] = [];

  constructor(config: Partial<ConversionTrackingConfig> = {}) {
    this.config = {
      enabled: true,
      endpoint: '/api/analytics/conversions',
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      trackScrollDepth: true,
      trackTimeOnPage: true,
      trackUserJourney: true,
      includeUTMParams: true,
      includeRevenue: false,
      debug: false,
      ...config
    };

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  /**
   * Track a CTA button click
   */
  trackCTAClick(
    element: HTMLElement,
    action: string,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.config.enabled) return;

    const conversionEvent: ConversionEvent = {
      id: this.generateConversionId(),
      timestamp: new Date().toISOString(),
      type: 'click',
      category: 'cta',
      action,
      element: this.extractElementInfo(element),
      page: this.getPageInfo(),
      user: this.getUserInfo(),
      context: this.getContextInfo(),
      metadata: {
        ...metadata,
        trackingMethod: 'manual'
      }
    };

    this.addConversion(conversionEvent);
  }

  /**
   * Track a form submission
   */
  trackFormSubmit(
    form: HTMLFormElement,
    action: string,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.config.enabled) return;

    const conversionEvent: ConversionEvent = {
      id: this.generateConversionId(),
      timestamp: new Date().toISOString(),
      type: 'form_submit',
      category: 'form',
      action,
      element: this.extractElementInfo(form),
      page: this.getPageInfo(),
      user: this.getUserInfo(),
      context: this.getContextInfo(),
      metadata: {
        ...metadata,
        formFields: this.extractFormFields(form),
        trackingMethod: 'manual'
      }
    };

    this.addConversion(conversionEvent);
  }

  /**
   * Track a purchase conversion
   */
  trackPurchase(
    orderId: string,
    amount: number,
    currency: string = 'USD',
    metadata: Record<string, any> = {}
  ): void {
    if (!this.config.enabled) return;

    const conversionEvent: ConversionEvent = {
      id: this.generateConversionId(),
      timestamp: new Date().toISOString(),
      type: 'purchase',
      category: 'ecommerce',
      action: 'purchase_completed',
      element: {
        tagName: 'div',
        text: `Order ${orderId}`
      },
      page: this.getPageInfo(),
      user: this.getUserInfo(),
      context: this.getContextInfo(),
      metadata: {
        ...metadata,
        orderId,
        amount,
        currency,
        trackingMethod: 'manual'
      }
    };

    this.addConversion(conversionEvent);
  }

  /**
   * Track a signup conversion
   */
  trackSignup(
    method: string,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.config.enabled) return;

    const conversionEvent: ConversionEvent = {
      id: this.generateConversionId(),
      timestamp: new Date().toISOString(),
      type: 'signup',
      category: 'form',
      action: 'user_registration',
      element: {
        tagName: 'form',
        text: `${method} signup`
      },
      page: this.getPageInfo(),
      user: this.getUserInfo(),
      context: this.getContextInfo(),
      metadata: {
        ...metadata,
        signupMethod: method,
        trackingMethod: 'manual'
      }
    };

    this.addConversion(conversionEvent);
  }

  /**
   * Track a download conversion
   */
  trackDownload(
    fileName: string,
    fileType: string,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.config.enabled) return;

    const conversionEvent: ConversionEvent = {
      id: this.generateConversionId(),
      timestamp: new Date().toISOString(),
      type: 'download',
      category: 'engagement',
      action: 'file_download',
      element: {
        tagName: 'a',
        text: fileName
      },
      page: this.getPageInfo(),
      user: this.getUserInfo(),
      context: this.getContextInfo(),
      metadata: {
        ...metadata,
        fileName,
        fileType,
        trackingMethod: 'manual'
      }
    };

    this.addConversion(conversionEvent);
  }

  /**
   * Get conversion statistics
   */
  getConversionReport(): ConversionReport {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentConversions = this.conversions.filter(
      c => new Date(c.timestamp) > oneDayAgo
    );

    const conversionsByType = this.conversions.reduce((acc, conversion) => {
      acc[conversion.type] = (acc[conversion.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conversionsByCategory = this.conversions.reduce((acc, conversion) => {
      acc[conversion.category] = (acc[conversion.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate top performing elements
    const elementPerformance = this.conversions.reduce((acc, conversion) => {
      const elementKey = `${conversion.element.tagName}-${conversion.action}`;
      if (!acc[elementKey]) {
        acc[elementKey] = { conversions: 0, element: elementKey };
      }
      acc[elementKey].conversions++;
      return acc;
    }, {} as Record<string, { conversions: number; element: string }>);

    const topPerformingElements = Object.values(elementPerformance)
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10)
      .map(item => ({
        element: item.element,
        conversions: item.conversions,
        conversionRate: (item.conversions / this.conversions.length) * 100
      }));

    // Calculate user journey
    const userJourney = this.calculateUserJourney();

    // Time-based analysis
    const timeBasedAnalysis = this.calculateTimeBasedAnalysis();

    // Calculate conversion rate (simplified)
    const totalPageViews = this.conversions.length + recentConversions.length; // This would need actual page view count
    const conversionRate = totalPageViews > 0 ? (this.conversions.length / totalPageViews) * 100 : 0;

    return {
      totalConversions: this.conversions.length,
      conversionRate,
      conversionsByType,
      conversionsByCategory,
      topPerformingElements,
      userJourney,
      timeBasedAnalysis
    };
  }

  /**
   * Clear all conversions
   */
  clearConversions(): void {
    this.conversions = [];
  }

  /**
   * Force flush conversions to server
   */
  async flushConversions(): Promise<void> {
    if (this.isFlushing || this.conversions.length === 0) return;

    this.isFlushing = true;
    const conversionsToSend = this.conversions.splice(0, this.config.batchSize);

    try {
      await this.sendConversionsToServer(conversionsToSend);
    } catch (error) {
      // Re-add conversions to queue if sending failed
      this.conversions.unshift(...conversionsToSend);
      console.error('Failed to send conversions to server:', error);
    } finally {
      this.isFlushing = false;
    }
  }

  private initializeTracking(): void {
    // Track scroll depth
    if (this.config.trackScrollDepth) {
      window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    // Track time on page
    if (this.config.trackTimeOnPage) {
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    }

    // Auto-track CTA clicks
    this.setupAutoTracking();

    // Start periodic flush
    this.startPeriodicFlush();
  }

  private setupAutoTracking(): void {
    // Track all button clicks with data-conversion attributes
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const conversionAction = target.getAttribute('data-conversion');
      if (conversionAction) {
        this.trackCTAClick(target, conversionAction, {
          autoTracked: true,
          eventType: 'click'
        });
      }

      // Track form submissions
      if (target.tagName === 'FORM' || target.closest('form')) {
        const form = target.tagName === 'FORM' ? target : target.closest('form') as HTMLFormElement;
        if (form) {
          const formAction = form.getAttribute('data-conversion') || 'form_submit';
          this.trackFormSubmit(form, formAction, {
            autoTracked: true,
            eventType: 'submit'
          });
        }
      }
    });
  }

  private handleScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;

    // Track scroll milestones
    const milestones = [25, 50, 75, 90];
    milestones.forEach(milestone => {
      if (scrollPercent >= milestone && this.scrollDepth < milestone) {
        this.scrollDepth = milestone;
        this.trackScrollMilestone(milestone);
      }
    });
  }

  private trackScrollMilestone(milestone: number): void {
    const conversionEvent: ConversionEvent = {
      id: this.generateConversionId(),
      timestamp: new Date().toISOString(),
      type: 'scroll',
      category: 'engagement',
      action: `scroll_${milestone}%`,
      element: {
        tagName: 'body',
        text: 'Page scroll'
      },
      page: this.getPageInfo(),
      user: this.getUserInfo(),
      context: this.getContextInfo(),
      metadata: {
        scrollDepth: milestone,
        trackingMethod: 'auto'
      }
    };

    this.addConversion(conversionEvent);
  }

  private handlePageUnload(): void {
    const timeOnPage = Date.now() - this.pageStartTime;
    
    const conversionEvent: ConversionEvent = {
      id: this.generateConversionId(),
      timestamp: new Date().toISOString(),
      type: 'time_on_page',
      category: 'engagement',
      action: 'page_exit',
      element: {
        tagName: 'body',
        text: 'Page exit'
      },
      page: this.getPageInfo(),
      user: this.getUserInfo(),
      context: {
        ...this.getContextInfo(),
        timeOnPage
      },
      metadata: {
        timeOnPage,
        trackingMethod: 'auto'
      }
    };

    this.addConversion(conversionEvent);
  }

  private addConversion(conversion: ConversionEvent): void {
    this.conversions.push(conversion);
    this.userActions.push(conversion.action);

    if (this.config.debug) {
      console.log('Conversion tracked:', conversion);
    }

    // Flush if batch size reached
    if (this.conversions.length >= this.config.batchSize) {
      this.flushConversions();
    }
  }

  private generateConversionId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractElementInfo(element: HTMLElement): ConversionEvent['element'] {
    return {
      id: element.id || undefined,
      className: element.className || undefined,
      tagName: element.tagName.toLowerCase(),
      text: element.textContent?.trim().substring(0, 100) || undefined,
      href: (element as HTMLAnchorElement).href || undefined,
      type: (element as HTMLInputElement).type || undefined
    };
  }

  private getPageInfo(): ConversionEvent['page'] {
    return {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer || undefined
    };
  }

  private getUserInfo(): ConversionEvent['user'] {
    return {
      userAgent: navigator.userAgent,
      isAuthenticated: false, // This would need to be determined by your auth system
      sessionId: this.getSessionId()
    };
  }

  private getContextInfo(): ConversionEvent['context'] {
    const context: ConversionEvent['context'] = {
      scrollDepth: this.scrollDepth,
      timeOnPage: Date.now() - this.pageStartTime,
      previousActions: [...this.userActions]
    };

    if (this.config.includeUTMParams) {
      const urlParams = new URLSearchParams(window.location.search);
      context.utmSource = urlParams.get('utm_source') || undefined;
      context.utmMedium = urlParams.get('utm_medium') || undefined;
      context.utmCampaign = urlParams.get('utm_campaign') || undefined;
      context.utmTerm = urlParams.get('utm_term') || undefined;
      context.utmContent = urlParams.get('utm_content') || undefined;
    }

    return context;
  }

  private extractFormFields(form: HTMLFormElement): Record<string, string> {
    const fields: Record<string, string> = {};
    const formData = new FormData(form);
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        fields[key] = value;
      }
    }

    return fields;
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('conversion_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('conversion_session_id', sessionId);
    }
    return sessionId;
  }

  private calculateUserJourney(): ConversionEvent['userJourney'] {
    // Simplified user journey calculation
    const journeySteps = ['page_view', 'scroll_25%', 'scroll_50%', 'cta_click', 'form_submit', 'purchase'];
    const journey: ConversionEvent['userJourney'] = [];

    journeySteps.forEach((step, index) => {
      const stepConversions = this.conversions.filter(c => c.action === step).length;
      const previousStep = index > 0 ? journeySteps[index - 1] : null;
      const previousConversions = previousStep 
        ? this.conversions.filter(c => c.action === previousStep).length 
        : this.conversions.length;

      const dropoffRate = previousConversions > 0 
        ? ((previousConversions - stepConversions) / previousConversions) * 100 
        : 0;

      journey.push({
        step,
        conversions: stepConversions,
        dropoffRate
      });
    });

    return journey;
  }

  private calculateTimeBasedAnalysis(): ConversionEvent['timeBasedAnalysis'] {
    const hourly: Record<string, number> = {};
    const daily: Record<string, number> = {};
    const weekly: Record<string, number> = {};

    this.conversions.forEach(conversion => {
      const date = new Date(conversion.timestamp);
      const hour = date.getHours().toString().padStart(2, '0');
      const day = date.toLocaleDateString();
      const week = this.getWeekNumber(date);

      hourly[hour] = (hourly[hour] || 0) + 1;
      daily[day] = (daily[day] || 0) + 1;
      weekly[week] = (weekly[week] || 0) + 1;
    });

    return { hourly, daily, weekly };
  }

  private getWeekNumber(date: Date): string {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    return `${date.getFullYear()}-W${weekNumber}`;
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushConversions();
    }, this.config.flushInterval);
  }

  private async sendConversionsToServer(conversions: ConversionEvent[]): Promise<void> {
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversions })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

// Global conversion tracker instance
export const conversionTracker = new ConversionTracker();

// Export convenience functions
export const trackCTAClick = (element: HTMLElement, action: string, metadata?: Record<string, any>) =>
  conversionTracker.trackCTAClick(element, action, metadata);

export const trackFormSubmit = (form: HTMLFormElement, action: string, metadata?: Record<string, any>) =>
  conversionTracker.trackFormSubmit(form, action, metadata);

export const trackPurchase = (orderId: string, amount: number, currency?: string, metadata?: Record<string, any>) =>
  conversionTracker.trackPurchase(orderId, amount, currency, metadata);

export const trackSignup = (method: string, metadata?: Record<string, any>) =>
  conversionTracker.trackSignup(method, metadata);

export const trackDownload = (fileName: string, fileType: string, metadata?: Record<string, any>) =>
  conversionTracker.trackDownload(fileName, fileType, metadata);

export const getConversionReport = () => conversionTracker.getConversionReport();
export const clearConversions = () => conversionTracker.clearConversions();
export const flushConversions = () => conversionTracker.flushConversions();
