import { performanceMonitor } from "../monitoring/performance-monitor";
import { redisCache } from "../redis-enhanced";

import { websocketManager, WebSocketMessage } from "./websocket-server";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  lastUpdated: number;
  updatedBy: string;
  category: string;
  sku: string;
  location?: string;
  supplier?: string;
  cost?: number;
  price?: number;
}

export interface InventoryUpdate {
  productId: string;
  quantity: number;
  operation: "add" | "subtract" | "reserve" | "release" | "set";
  reason: string;
  userId: string;
  orderId?: string;
  timestamp: number;
}

export interface InventoryAlert {
  type: "low_stock" | "out_of_stock" | "overstock" | "expiry_warning";
  productId: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  actionRequired: boolean;
}

export interface InventoryConfig {
  enableRealTimeUpdates: boolean;
  enableAlerts: boolean;
  lowStockThreshold: number;
  checkInterval: number;
  enableAnalytics: boolean;
  maxHistoryDays: number;
}

const DEFAULT_CONFIG: InventoryConfig = {
  enableRealTimeUpdates: true,
  enableAlerts: true,
  lowStockThreshold: 10,
  checkInterval: 60000, // 1 minute
  enableAnalytics: true,
  maxHistoryDays: 30,
};

class InventoryTracker {
  private static instance: InventoryTracker;
  private config: InventoryConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private alerts: Map<string, InventoryAlert> = new Map();

  private constructor(config: Partial<InventoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<InventoryConfig>): InventoryTracker {
    if (!InventoryTracker.instance) {
      InventoryTracker.instance = new InventoryTracker(config);
    }
    return InventoryTracker.instance;
  }

  start(): Promise<void> {
    if (this.checkInterval) {
      console.warn("Inventory tracker is already running");
      return Promise.resolve();
    }

    // Start periodic inventory checks
    this.checkInterval = setInterval(() => {
      this.checkInventoryLevels();
    }, this.config.checkInterval);

    // Record startup metric
    performanceMonitor.recordMetric({
      operation: "inventory_startup",
      duration: 0,
      timestamp: Date.now(),
      success: true,
    });

    console.warn("Inventory tracker started");
    return Promise.resolve();
  }

  stop(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.warn("Inventory tracker stopped");
    return Promise.resolve();
  }

  async updateInventory(
    update: InventoryUpdate
  ): Promise<InventoryItem | null> {
    const startTime = Date.now();

    try {
      // Get current inventory
      const currentItem = await this.getInventoryItem(update.productId);
      if (!currentItem) {
        console.warn(`Inventory item not found: ${update.productId}`);
        return null;
      }

      // Apply update based on operation
      let newQuantity = currentItem.quantity;
      let newReserved = currentItem.reserved;

      switch (update.operation) {
        case "add":
          newQuantity += update.quantity;
          break;
        case "subtract":
          newQuantity = Math.max(0, newQuantity - update.quantity);
          break;
        case "reserve":
          newReserved = Math.min(
            currentItem.available,
            newReserved + update.quantity
          );
          break;
        case "release":
          newReserved = Math.max(0, newReserved - update.quantity);
          break;
        case "set":
          newQuantity = update.quantity;
          break;
        default:
          console.warn(`Unknown inventory operation: ${update.operation}`);
          return null;
      }

      // Calculate available quantity
      const newAvailable = Math.max(0, newQuantity - newReserved);

      // Update inventory item
      const updatedItem: InventoryItem = {
        ...currentItem,
        quantity: newQuantity,
        reserved: newReserved,
        available: newAvailable,
        lastUpdated: Date.now(),
        updatedBy: update.userId,
      };

      // Save to Redis
      await this.saveInventoryItem(updatedItem);

      // Record inventory history
      await this.recordInventoryHistory(update);

      // Check for alerts
      await this.checkForAlerts(updatedItem);

      // Broadcast real-time update
      if (this.config.enableRealTimeUpdates) {
        this.broadcastInventoryUpdate(updatedItem, update);
      }

      // Record performance metric
      performanceMonitor.recordMetric({
        operation: "inventory_update",
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        success: true,
        metadata: {
          productId: update.productId,
          operation: update.operation,
          quantity: update.quantity,
        },
      });

      return updatedItem;
    } catch (error) {
      console.error("Error updating inventory:", error);
      performanceMonitor.recordMetric({
        operation: "inventory_error",
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          productId: update.productId,
        },
      });
      return null;
    }
  }

  async getInventoryItem(productId: string): Promise<InventoryItem | null> {
    try {
      const key = `inventory:item:${productId}`;
      const item = await redisCache.get<InventoryItem>(key);
      return item;
    } catch (error) {
      console.error(`Error getting inventory item ${productId}:`, error);
      return null;
    }
  }

  getAllInventoryItems(): Promise<InventoryItem[]> {
    try {
      // This would typically use Redis SCAN to get all inventory keys
      // For now, we'll return an empty array as this requires pattern matching
      return Promise.resolve([]);
    } catch (error) {
      console.error("Error getting all inventory items:", error);
      return Promise.resolve([]);
    }
  }

  async createInventoryItem(
    item: Omit<InventoryItem, "lastUpdated" | "updatedBy">
  ): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      lastUpdated: Date.now(),
      updatedBy: "system",
    };

    await this.saveInventoryItem(newItem);
    return newItem;
  }

  async deleteInventoryItem(productId: string): Promise<boolean> {
    try {
      const key = `inventory:item:${productId}`;
      await redisCache.del(key);

      // Also delete history
      const historyKey = `inventory:history:${productId}`;
      await redisCache.del(historyKey);

      return true;
    } catch (error) {
      console.error(`Error deleting inventory item ${productId}:`, error);
      return false;
    }
  }

  async getInventoryHistory(
    productId: string,
    days: number = 7
  ): Promise<InventoryUpdate[]> {
    try {
      const key = `inventory:history:${productId}`;
      const history = await redisCache.get<InventoryUpdate[]>(key);

      if (!history) return [];

      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      return history.filter(update => update.timestamp >= cutoffTime);
    } catch (error) {
      console.error(`Error getting inventory history for ${productId}:`, error);
      return [];
    }
  }

  getInventoryAnalytics(): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
    averageTurnover: number;
  }> {
    try {
      // This would aggregate data from all inventory items
      // For now, return basic structure
      return Promise.resolve({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        averageTurnover: 0,
      });
    } catch (error) {
      console.error("Error getting inventory analytics:", error);
      return Promise.resolve({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        averageTurnover: 0,
      });
    }
  }

  getAlerts(): Promise<InventoryAlert[]> {
    return Promise.resolve(Array.from(this.alerts.values()));
  }

  acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.actionRequired = false;
      this.alerts.set(alertId, alert);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  private async saveInventoryItem(item: InventoryItem): Promise<void> {
    const key = `inventory:item:${item.id}`;
    await redisCache.set(key, item, 86400); // Cache for 24 hours
  }

  private async recordInventoryHistory(update: InventoryUpdate): Promise<void> {
    try {
      const key = `inventory:history:${update.productId}`;
      const history = (await redisCache.get<InventoryUpdate[]>(key)) ?? [];

      history.push(update);

      // Keep only recent history (last 30 days by default)
      const cutoffTime =
        Date.now() - this.config.maxHistoryDays * 24 * 60 * 60 * 1000;
      const filteredHistory = history.filter(
        update => update.timestamp >= cutoffTime
      );

      await redisCache.set(
        key,
        filteredHistory,
        86400 * this.config.maxHistoryDays
      );
    } catch (error) {
      console.error("Error recording inventory history:", error);
    }
  }

  private checkForAlerts(item: InventoryItem): Promise<void> {
    if (!this.config.enableAlerts) return Promise.resolve();

    const alertId = `alert:${item.id}`;
    let alert: InventoryAlert | null = null;

    // Check for low stock
    if (item.available <= this.config.lowStockThreshold && item.available > 0) {
      alert = {
        type: "low_stock",
        productId: item.id,
        message: `Low stock alert: ${item.name} has ${item.available} units remaining`,
        severity: item.available <= 5 ? "high" : "medium",
        timestamp: Date.now(),
        actionRequired: true,
      };
    }
    // Check for out of stock
    else if (item.available <= 0) {
      alert = {
        type: "out_of_stock",
        productId: item.id,
        message: `Out of stock: ${item.name} is currently unavailable`,
        severity: "critical",
        timestamp: Date.now(),
        actionRequired: true,
      };
    }

    if (alert) {
      this.alerts.set(alertId, alert);

      // Broadcast alert to subscribers
      if (this.config.enableRealTimeUpdates) {
        this.broadcastAlert(alert);
      }
    } else {
      // Remove existing alert if conditions are resolved
      this.alerts.delete(alertId);
    }

    return Promise.resolve();
  }

  private checkInventoryLevels(): Promise<void> {
    try {
      // This would check all inventory items for alerts
      // For now, we'll just log that the check was performed
      if (this.config.enableAnalytics) {
        performanceMonitor.recordMetric({
          operation: "inventory_periodic_check",
          duration: 0,
          timestamp: Date.now(),
          success: true,
          metadata: {
            alertsCount: this.alerts.size,
          },
        });
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error during periodic inventory check:", error);
      return Promise.resolve();
    }
  }

  private broadcastInventoryUpdate(
    item: InventoryItem,
    update: InventoryUpdate
  ): void {
    const message: WebSocketMessage = {
      type: "inventory_update",
      data: {
        item,
        update,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    // Broadcast to inventory subscribers
    websocketManager.broadcastToSubscribers("inventory", message);

    // Also broadcast to product-specific subscribers
    websocketManager.broadcastToSubscribers(`inventory:${item.id}`, message);
  }

  private broadcastAlert(alert: InventoryAlert): void {
    const message: WebSocketMessage = {
      type: "inventory_alert",
      data: alert,
      timestamp: Date.now(),
    };

    // Broadcast to alert subscribers
    websocketManager.broadcastToSubscribers("inventory_alerts", message);

    // Also broadcast to admin subscribers
    websocketManager.broadcastToSubscribers("admin", message);
  }

  // Utility methods
  async reserveInventory(
    productId: string,
    quantity: number,
    userId: string,
    orderId?: string
  ): Promise<boolean> {
    const update: InventoryUpdate = {
      productId,
      quantity,
      operation: "reserve",
      reason: "Order reservation",
      userId,
      orderId,
      timestamp: Date.now(),
    };

    const result = await this.updateInventory(update);
    return result !== null;
  }

  async releaseInventory(
    productId: string,
    quantity: number,
    userId: string,
    orderId?: string
  ): Promise<boolean> {
    const update: InventoryUpdate = {
      productId,
      quantity,
      operation: "release",
      reason: "Order cancellation",
      userId,
      orderId,
      timestamp: Date.now(),
    };

    const result = await this.updateInventory(update);
    return result !== null;
  }

  async processOrder(
    productId: string,
    quantity: number,
    userId: string,
    orderId: string
  ): Promise<boolean> {
    const update: InventoryUpdate = {
      productId,
      quantity,
      operation: "subtract",
      reason: "Order fulfillment",
      userId,
      orderId,
      timestamp: Date.now(),
    };

    const result = await this.updateInventory(update);
    return result !== null;
  }
}

// Export singleton instance
export const inventoryTracker = InventoryTracker.getInstance();

// Convenience functions
export const startInventoryTracker = (config?: Partial<InventoryConfig>) =>
  InventoryTracker.getInstance(config).start();

export const updateInventory = (update: InventoryUpdate) =>
  inventoryTracker.updateInventory(update);

export const getInventoryItem = (productId: string) =>
  inventoryTracker.getInventoryItem(productId);

export const reserveInventory = (
  productId: string,
  quantity: number,
  userId: string,
  orderId?: string
) => inventoryTracker.reserveInventory(productId, quantity, userId, orderId);

export const processOrder = (
  productId: string,
  quantity: number,
  userId: string,
  orderId: string
) => inventoryTracker.processOrder(productId, quantity, userId, orderId);
