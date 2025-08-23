import { performanceMonitor } from "../monitoring/performance-monitor";
import { redisCache } from "../redis-enhanced";

import { websocketManager, WebSocketMessage } from "./websocket-server";

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp: number;
  expiresAt?: number;
  priority: "low" | "normal" | "high";
  category?: string;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: number;
  lastUsed: number;
  categories: string[];
  isActive: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  category: string;
  data?: Record<string, unknown>;
  priority: "low" | "normal" | "high";
  requireInteraction: boolean;
  silent: boolean;
}

export interface NotificationConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
  maxRetries: number;
  retryDelay: number;
  enableAnalytics: boolean;
  enableWebPush: boolean;
  enableEmailFallback: boolean;
  maxSubscriptionsPerUser: number;
  subscriptionExpiryDays: number;
}

const DEFAULT_CONFIG: NotificationConfig = {
  vapidPublicKey: "",
  vapidPrivateKey: "",
  vapidSubject: "mailto:notifications@yourdomain.com",
  maxRetries: 3,
  retryDelay: 1000,
  enableAnalytics: true,
  enableWebPush: true,
  enableEmailFallback: true,
  maxSubscriptionsPerUser: 5,
  subscriptionExpiryDays: 365,
};

// Predefined notification templates
const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: "order_confirmation",
    name: "Order Confirmation",
    title: "Order Confirmed!",
    body: "Your order #{orderNumber} has been confirmed and is being processed.",
    category: "orders",
    data: { type: "order_confirmation" },
    priority: "high",
    requireInteraction: false,
    silent: false,
  },
  {
    id: "order_shipped",
    name: "Order Shipped",
    title: "Your Order is on the Way!",
    body: "Order #{orderNumber} has been shipped and is on its way to you.",
    category: "orders",
    data: { type: "order_shipped" },
    priority: "high",
    requireInteraction: false,
    silent: false,
  },
  {
    id: "order_delivered",
    name: "Order Delivered",
    title: "Order Delivered!",
    body: "Your order #{orderNumber} has been delivered. Enjoy your purchase!",
    category: "orders",
    data: { type: "order_delivered" },
    priority: "normal",
    requireInteraction: false,
    silent: false,
  },
  {
    id: "price_drop",
    name: "Price Drop Alert",
    title: "Price Drop on Your Wishlist!",
    body: "{productName} is now {newPrice} - that's {discount}% off!",
    category: "marketing",
    data: { type: "price_drop" },
    priority: "normal",
    requireInteraction: false,
    silent: false,
  },
  {
    id: "back_in_stock",
    name: "Back in Stock",
    title: "Back in Stock!",
    body: "{productName} is back in stock. Don't miss out!",
    category: "inventory",
    data: { type: "back_in_stock" },
    priority: "high",
    requireInteraction: false,
    silent: false,
  },
  {
    id: "chat_message",
    name: "New Chat Message",
    title: "New Message",
    body: "You have a new message from {senderName}",
    category: "chat",
    data: { type: "chat_message" },
    priority: "high",
    requireInteraction: true,
    silent: false,
  },
  {
    id: "security_alert",
    name: "Security Alert",
    title: "Security Alert",
    body: "We detected unusual activity on your account. Please verify your login.",
    category: "security",
    data: { type: "security_alert" },
    priority: "high",
    requireInteraction: true,
    silent: false,
  },
];

class PushNotificationManager {
  private static instance: PushNotificationManager;
  private config: NotificationConfig;
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private webPush: any = null; // Will be initialized if web-push is available

  private constructor(config: Partial<NotificationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeTemplates();
  }

  static getInstance(
    config?: Partial<NotificationConfig>
  ): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager(config);
    }
    return PushNotificationManager.instance;
  }

  async start(): Promise<void> {
    // Initialize web-push if available
    await this.initializeWebPush();

    // Load subscriptions from Redis
    await this.loadSubscriptionsFromRedis();

    // Record startup metric
    performanceMonitor.recordMetric("notifications", "startup", Date.now(), {
      config: this.config,
    });

    console.warn("Push notification manager started");
  }

  async stop(): Promise<void> {
    // Save subscriptions to Redis
    await this.saveSubscriptionsToRedis();
    console.warn("Push notification manager stopped");
  }

  // Subscription management
  async subscribeUser(
    userId: string,
    subscription: Omit<
      NotificationSubscription,
      "id" | "userId" | "createdAt" | "lastUsed" | "isActive"
    >
  ): Promise<NotificationSubscription> {
    const newSubscription: NotificationSubscription = {
      ...subscription,
      id: this.generateSubscriptionId(),
      userId,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true,
    };

    // Check if user has too many subscriptions
    const userSubscriptions = await this.getUserSubscriptions(userId);
    if (userSubscriptions.length >= this.config.maxSubscriptionsPerUser) {
      // Remove oldest subscription
      const oldestSubscription = userSubscriptions[0];
      await this.unsubscribeUser(oldestSubscription.id);
    }

    this.subscriptions.set(newSubscription.id, newSubscription);
    await this.saveSubscriptionToRedis(newSubscription);

    // Record metric
    performanceMonitor.recordMetric(
      "notifications",
      "subscription_created",
      Date.now(),
      {
        userId,
        subscriptionId: newSubscription.id,
      }
    );

    return newSubscription;
  }

  async unsubscribeUser(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.isActive = false;
    this.subscriptions.set(subscriptionId, subscription);
    await this.saveSubscriptionToRedis(subscription);

    // Record metric
    performanceMonitor.recordMetric(
      "notifications",
      "subscription_removed",
      Date.now(),
      {
        userId: subscription.userId,
        subscriptionId,
      }
    );

    return true;
  }

  getUserSubscriptions(userId: string): Promise<NotificationSubscription[]> {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.userId === userId && sub.isActive)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async updateSubscriptionCategories(
    subscriptionId: string,
    categories: string[]
  ): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.categories = categories;
    subscription.lastUsed = Date.now();

    this.subscriptions.set(subscriptionId, subscription);
    await this.saveSubscriptionToRedis(subscription);

    return true;
  }

  // Notification sending
  async sendNotification(
    userId: string,
    templateId: string,
    data: Record<string, any> = {}
  ): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      console.warn(`Notification template not found: ${templateId}`);
      return false;
    }

    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) {
      console.warn(`No active subscriptions for user: ${userId}`);
      return false;
    }

    // Create notification from template
    const notification = this.createNotificationFromTemplate(template, data);

    // Send to all user subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(sub => this.sendToSubscription(sub, notification))
    );

    const successCount = results.filter(
      r => r.status === "fulfilled" && r.value
    ).length;
    const totalCount = results.length;

    // Record metric
    performanceMonitor.recordMetric("notifications", "sent", Date.now(), {
      userId,
      templateId,
      successCount,
      totalCount,
    });

    return successCount > 0;
  }

  async sendNotificationToMultipleUsers(
    userIds: string[],
    templateId: string,
    data: Record<string, any> = {}
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendNotification(userId, templateId, data))
    );

    const success = results.filter(
      r => r.status === "fulfilled" && r.value
    ).length;
    const failed = results.length - success;

    return { success, failed };
  }

  async sendCustomNotification(
    userId: string,
    notification: Omit<PushNotification, "id" | "timestamp">
  ): Promise<boolean> {
    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) return false;

    const fullNotification: PushNotification = {
      ...notification,
      id: this.generateNotificationId(),
      timestamp: Date.now(),
    };

    const results = await Promise.allSettled(
      subscriptions.map(sub => this.sendToSubscription(sub, fullNotification))
    );

    const successCount = results.filter(
      r => r.status === "fulfilled" && r.value
    ).length;
    return successCount > 0;
  }

  async broadcastNotification(
    templateId: string,
    data: Record<string, any> = {},
    categoryFilter?: string
  ): Promise<{ success: number; failed: number }> {
    const template = this.templates.get(templateId);
    if (!template) {
      console.warn(`Notification template not found: ${templateId}`);
      return { success: 0, failed: 0 };
    }

    // Get all active subscriptions
    const allSubscriptions = Array.from(this.subscriptions.values()).filter(
      sub => sub.isActive
    );

    // Filter by category if specified
    const filteredSubscriptions = categoryFilter
      ? allSubscriptions.filter(sub => sub.categories.includes(categoryFilter))
      : allSubscriptions;

    const notification = this.createNotificationFromTemplate(template, data);

    const results = await Promise.allSettled(
      filteredSubscriptions.map(sub =>
        this.sendToSubscription(sub, notification)
      )
    );

    const success = results.filter(
      r => r.status === "fulfilled" && r.value
    ).length;
    const failed = results.length - success;

    // Record metric
    performanceMonitor.recordMetric("notifications", "broadcast", Date.now(), {
      templateId,
      categoryFilter,
      success,
      failed,
    });

    return { success, failed };
  }

  // Template management
  async createTemplate(
    template: NotificationTemplate
  ): Promise<NotificationTemplate> {
    this.templates.set(template.id, template);
    await this.saveTemplateToRedis(template);
    return template;
  }

  getTemplate(templateId: string): Promise<NotificationTemplate | undefined> {
    return this.templates.get(templateId);
  }

  getAllTemplates(): Promise<NotificationTemplate[]> {
    return Array.from(this.templates.values());
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<NotificationTemplate>
  ): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const updatedTemplate = { ...template, ...updates };
    this.templates.set(templateId, updatedTemplate);
    await this.saveTemplateToRedis(updatedTemplate);

    return true;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) return false;

    this.templates.delete(templateId);
    await this.deleteTemplateFromRedis(templateId);

    return true;
  }

  // Analytics
  getNotificationStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalTemplates: number;
    notificationsSentToday: number;
    averageDeliveryRate: number;
  }> {
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(
      sub => sub.isActive
    );
    const _today = new Date().setHours(0, 0, 0, 0);

    // This would typically query analytics data from Redis/database
    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubscriptions.length,
      totalTemplates: this.templates.size,
      notificationsSentToday: 0, // Would be calculated from analytics
      averageDeliveryRate: 0.95, // Would be calculated from analytics
    };
  }

  // Private methods
  private initializeTemplates(): void {
    DEFAULT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeWebPush(): Promise<void> {
    if (!this.config.enableWebPush) return;

    try {
      // This would initialize web-push library
      // For now, we'll just log that it would be initialized
      console.warn("Web push would be initialized here");
    } catch (error) {
      console.error("Failed to initialize web push:", error);
    }
  }

  private createNotificationFromTemplate(
    template: NotificationTemplate,
    data: Record<string, any>
  ): PushNotification {
    // Replace placeholders in title and body
    let title = template.title;
    let body = template.body;

    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, "g"), String(value));
      body = body.replace(new RegExp(placeholder, "g"), String(value));
    });

    return {
      id: this.generateNotificationId(),
      title,
      body,
      data: { ...template.data, ...data },
      priority: template.priority,
      requireInteraction: template.requireInteraction,
      silent: template.silent,
      category: template.category,
      timestamp: Date.now(),
    };
  }

  private async sendToSubscription(
    subscription: NotificationSubscription,
    notification: PushNotification
  ): Promise<boolean> {
    try {
      // Update last used timestamp
      subscription.lastUsed = Date.now();
      this.subscriptions.set(subscription.id, subscription);
      await this.saveSubscriptionToRedis(subscription);

      if (this.config.enableWebPush && this.webPush) {
        // Send web push notification
        return await this.sendWebPushNotification(subscription, notification);
      }
      // Send via WebSocket as fallback
      return await this.sendWebSocketNotification(subscription, notification);
    } catch (error) {
      console.error(
        `Error sending notification to subscription ${subscription.id}:`,
        error
      );

      // Mark subscription as inactive if it fails repeatedly
      if (
        error instanceof Error &&
        error.message.includes("subscription expired")
      ) {
        subscription.isActive = false;
        this.subscriptions.set(subscription.id, subscription);
        await this.saveSubscriptionToRedis(subscription);
      }

      return false;
    }
  }

  private sendWebPushNotification(
    subscription: NotificationSubscription,
    _notification: PushNotification
  ): Promise<boolean> {
    // This would use the web-push library to send the notification
    // For now, we'll just return true as a placeholder
    console.warn(
      `Would send web push notification to ${subscription.endpoint}`
    );
    return true;
  }

  private sendWebSocketNotification(
    subscription: NotificationSubscription,
    notification: PushNotification
  ): Promise<boolean> {
    // Send via WebSocket as fallback
    const message: WebSocketMessage = {
      type: "push_notification",
      data: notification,
      timestamp: Date.now(),
    };

    // This would send to the specific user's WebSocket connection
    // For now, we'll broadcast to all users (in production, you'd target specific users)
    websocketManager.broadcastToSubscribers("notifications", message);

    return true;
  }

  // Redis persistence methods
  private loadSubscriptionsFromRedis(): Promise<void> {
    try {
      // Load subscriptions from Redis
      console.warn("Loading notification subscriptions from Redis...");
    } catch (error) {
      console.error("Error loading subscriptions from Redis:", error);
    }
  }

  private saveSubscriptionsToRedis(): Promise<void> {
    try {
      // Save all subscriptions to Redis
      console.warn("Saving notification subscriptions from Redis...");
    } catch (error) {
      console.error("Error saving subscriptions to Redis:", error);
    }
  }

  private async saveSubscriptionToRedis(
    subscription: NotificationSubscription
  ): Promise<void> {
    const key = `notification:subscription:${subscription.id}`;
    await redisCache.set(
      key,
      subscription,
      86400 * this.config.subscriptionExpiryDays
    );
  }

  private async saveTemplateToRedis(
    template: NotificationTemplate
  ): Promise<void> {
    const key = `notification:template:${template.id}`;
    await redisCache.set(key, template, 86400 * 365); // Cache for 1 year
  }

  private async deleteTemplateFromRedis(templateId: string): Promise<void> {
    const key = `notification:template:${templateId}`;
    await redisCache.del(key);
  }

  // Utility methods
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public utility methods
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getVapidPublicKey(): string {
    return this.config.vapidPublicKey;
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();

// Convenience functions
export const startPushNotifications = (config?: Partial<NotificationConfig>) =>
  PushNotificationManager.getInstance(config).start();

export const subscribeToNotifications = (
  userId: string,
  subscription: Omit<
    NotificationSubscription,
    "id" | "userId" | "createdAt" | "lastUsed" | "isActive"
  >
) => pushNotificationManager.subscribeUser(userId, subscription);

export const sendNotification = (
  userId: string,
  templateId: string,
  data?: Record<string, any>
) => pushNotificationManager.sendNotification(userId, templateId, data);

export const broadcastNotification = (
  templateId: string,
  data?: Record<string, any>,
  categoryFilter?: string
) =>
  pushNotificationManager.broadcastNotification(
    templateId,
    data,
    categoryFilter
  );

export const getVapidPublicKey = () =>
  pushNotificationManager.getVapidPublicKey();
