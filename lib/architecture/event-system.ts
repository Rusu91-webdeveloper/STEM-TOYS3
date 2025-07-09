import { logger } from "@/lib/logger";

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: any;
  metadata?: {
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
    correlationId?: string;
    causationId?: string;
    timestamp: Date;
  };
  timestamp: Date;
}

export interface EventHandler<T = any> {
  handle(event: DomainEvent<T>): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}

/**
 * In-memory event bus implementation
 * For production, this could be replaced with Redis, RabbitMQ, or other message brokers
 */
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private eventHistory: DomainEvent[] = [];
  private readonly maxHistorySize = 1000;

  async publish(event: DomainEvent): Promise<void> {
    logger.info("Publishing domain event", {
      eventType: event.type,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventId: event.id,
    });

    // Store event in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get handlers for this event type
    const eventHandlers = this.handlers.get(event.type) || new Set();

    // Execute all handlers concurrently
    const promises = Array.from(eventHandlers).map(async handler => {
      try {
        await handler.handle(event);
        logger.debug("Event handler completed successfully", {
          eventType: event.type,
          handlerName: handler.constructor.name,
        });
      } catch (error) {
        logger.error("Event handler failed", {
          eventType: event.type,
          handlerName: handler.constructor.name,
          error: error instanceof Error ? error.message : String(error),
          eventId: event.id,
        });
        // Continue with other handlers even if one fails
      }
    });

    await Promise.allSettled(promises);
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    const promises = events.map(event => this.publish(event));
    await Promise.allSettled(promises);
  }

  subscribe<T>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler as EventHandler);

    logger.debug("Event handler subscribed", {
      eventType,
      handlerName: handler.constructor.name,
    });
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }

    logger.debug("Event handler unsubscribed", {
      eventType,
      handlerName: handler.constructor.name,
    });
  }

  getEventHistory(limit?: number): DomainEvent[] {
    return limit ? this.eventHistory.slice(-limit) : [...this.eventHistory];
  }

  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.size || 0;
    }
    return Array.from(this.handlers.values()).reduce(
      (total, handlers) => total + handlers.size,
      0
    );
  }
}

/**
 * Event factory for creating domain events
 */
export class EventFactory {
  private static generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static create<T = any>(
    type: string,
    aggregateId: string,
    aggregateType: string,
    data: T,
    metadata?: Partial<DomainEvent["metadata"]>
  ): DomainEvent<T> {
    return {
      id: this.generateId(),
      type,
      aggregateId,
      aggregateType,
      version: 1,
      data,
      metadata: {
        timestamp: new Date(),
        ...metadata,
      },
      timestamp: new Date(),
    };
  }
}

/**
 * Abstract base class for event handlers
 */
export abstract class BaseEventHandler<T = any> implements EventHandler<T> {
  abstract handle(event: DomainEvent<T>): Promise<void>;

  protected log(message: string, data?: any): void {
    logger.info(`[${this.constructor.name}] ${message}`, data);
  }

  protected logError(message: string, error: any, data?: any): void {
    logger.error(`[${this.constructor.name}] ${message}`, {
      ...data,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Singleton instance of the event bus
 */
export const eventBus = new InMemoryEventBus();

/**
 * Domain event types - centralized event type definitions
 */
export const EventTypes = {
  // User events
  USER_REGISTERED: "user.registered",
  USER_EMAIL_VERIFIED: "user.email_verified",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_PROFILE_UPDATED: "user.profile_updated",
  USER_DEACTIVATED: "user.deactivated",

  // Product events
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",
  PRODUCT_STOCK_UPDATED: "product.stock_updated",
  PRODUCT_PRICE_CHANGED: "product.price_changed",

  // Order events
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_COMPLETED: "order.completed",
  ORDER_SHIPPED: "order.shipped",
  ORDER_DELIVERED: "order.delivered",

  // Cart events
  CART_ITEM_ADDED: "cart.item_added",
  CART_ITEM_REMOVED: "cart.item_removed",
  CART_ITEM_UPDATED: "cart.item_updated",
  CART_CLEARED: "cart.cleared",

  // Review events
  REVIEW_CREATED: "review.created",
  REVIEW_UPDATED: "review.updated",
  REVIEW_DELETED: "review.deleted",

  // Wishlist events
  WISHLIST_ITEM_ADDED: "wishlist.item_added",
  WISHLIST_ITEM_REMOVED: "wishlist.item_removed",

  // Payment events
  PAYMENT_PROCESSED: "payment.processed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",

  // Email events
  EMAIL_VERIFICATION_SENT: "email.verification_sent",
  EMAIL_PASSWORD_RESET_SENT: "email.password_reset_sent",
  EMAIL_ORDER_CONFIRMATION_SENT: "email.order_confirmation_sent",
  EMAIL_SHIPPING_NOTIFICATION_SENT: "email.shipping_notification_sent",

  // Analytics events
  PAGE_VIEWED: "analytics.page_viewed",
  PRODUCT_VIEWED: "analytics.product_viewed",
  SEARCH_PERFORMED: "analytics.search_performed",
  CONVERSION_TRACKED: "analytics.conversion_tracked",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

/**
 * Event metadata builder for common patterns
 */
export class EventMetadata {
  static fromRequest(
    req?: any,
    userId?: string
  ): Partial<DomainEvent["metadata"]> {
    return {
      userId,
      userAgent: req?.headers?.["user-agent"],
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"]?.split(",")[0],
      correlationId: req?.headers?.["x-correlation-id"],
      timestamp: new Date(),
    };
  }

  static withCorrelation(
    correlationId: string,
    causationId?: string,
    userId?: string
  ): Partial<DomainEvent["metadata"]> {
    return {
      correlationId,
      causationId,
      userId,
      timestamp: new Date(),
    };
  }
}
