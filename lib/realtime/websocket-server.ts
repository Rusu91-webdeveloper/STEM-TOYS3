import { IncomingMessage } from "http";
import { URL } from "url";

import { WebSocketServer, WebSocket } from "ws";

import { performanceMonitor } from "../monitoring/performance-monitor";
import { redisCache } from "../redis-enhanced";

export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  sessionId?: string;
  subscriptions: Set<string>;
  lastPing: number;
  isAlive: boolean;
}

export interface WebSocketConfig {
  port: number;
  path: string;
  heartbeatInterval: number;
  maxClients: number;
  enableCompression: boolean;
  enableLogging: boolean;
}

const DEFAULT_CONFIG: WebSocketConfig = {
  port: 3002,
  path: "/ws",
  heartbeatInterval: 30000, // 30 seconds
  maxClients: 1000,
  enableCompression: true,
  enableLogging: true,
};

class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private config: WebSocketConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<WebSocketConfig>): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(config);
    }
    return WebSocketManager.instance;
  }

  start(server?: unknown): Promise<void> {
    if (this.wss) {
      console.warn("WebSocket server is already running");
      return;
    }

    try {
      if (server) {
        this.wss = new WebSocketServer({
          server,
          path: this.config.path,
          perMessageDeflate: this.config.enableCompression,
        });
      } else {
        this.wss = new WebSocketServer({
          port: this.config.port,
          path: this.config.path,
          perMessageDeflate: this.config.enableCompression,
        });
      }

      this.setupEventHandlers();
      this.startHeartbeat();

      if (this.config.enableLogging) {
        console.warn(`WebSocket server started on port ${this.config.port}`);
      }

      // Record startup metric
      performanceMonitor.recordMetric("websocket", "startup", Date.now(), {
        port: this.config.port,
        path: this.config.path,
      });
    } catch (error) {
      console.error("Failed to start WebSocket server:", error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.wss) return;

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    this.wss.on("error", error => {
      console.error("WebSocket server error:", error);
      performanceMonitor.recordMetric("websocket", "error", Date.now(), {
        error: error.message,
      });
    });
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = this.generateClientId();
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);

    // Extract user info from query parameters or headers
    const userId =
      url.searchParams.get("userId") ?? (req.headers["x-user-id"] as string);
    const sessionId =
      url.searchParams.get("sessionId") ??
      (req.headers["x-session-id"] as string);

    const client: WebSocketClient = {
      id: clientId,
      ws,
      userId,
      sessionId,
      subscriptions: new Set(),
      lastPing: Date.now(),
      isAlive: true,
    };

    this.clients.set(clientId, client);

    // Send welcome message
    this.sendToClient(clientId, {
      type: "connection",
      data: { clientId, status: "connected" },
      timestamp: Date.now(),
    });

    // Setup client event handlers
    ws.on("message", (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    ws.on("close", () => {
      this.handleDisconnection(clientId);
    });

    ws.on("error", error => {
      console.error(`WebSocket client ${clientId} error:`, error);
      this.handleDisconnection(clientId);
    });

    ws.on("pong", () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
        client.lastPing = Date.now();
      }
    });

    // Record connection metric
    performanceMonitor.recordMetric("websocket", "connection", Date.now(), {
      clientId,
      userId,
      totalClients: this.clients.size,
    });

    if (this.config.enableLogging) {
      console.warn(
        `WebSocket client connected: ${clientId} (User: ${userId ?? "anonymous"})`
      );
    }
  }

  private handleMessage(clientId: string, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) {
        console.warn(`Received message from unknown client: ${clientId}`);
        return;
      }

      // Update message with client info
      message.userId = client.userId;
      message.sessionId = client.sessionId;
      message.timestamp = Date.now();

      switch (message.type) {
        case "subscribe":
          this.handleSubscribe(clientId, message.data);
          break;
        case "unsubscribe":
          this.handleUnsubscribe(clientId, message.data);
          break;
        case "ping":
          this.sendToClient(clientId, {
            type: "pong",
            data: { timestamp: Date.now() },
            timestamp: Date.now(),
          });
          break;
        case "inventory_update":
          this.handleInventoryUpdate(clientId, message.data);
          break;
        case "chat_message":
          this.handleChatMessage(clientId, message.data);
          break;
        default:
          // Broadcast to all subscribed clients
          this.broadcastToSubscribers(message.type, message);
      }

      // Record message metric
      performanceMonitor.recordMetric("websocket", "message", Date.now(), {
        clientId,
        messageType: message.type,
        dataSize: data.length,
      });
    } catch (error) {
      console.error(`Error handling message from ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: "error",
        data: { message: "Invalid message format" },
        timestamp: Date.now(),
      });
    }
  }

  private handleSubscribe(clientId: string, data: { channel: string }): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { channel } = data;
    client.subscriptions.add(channel);

    // Send confirmation
    this.sendToClient(clientId, {
      type: "subscribed",
      data: { channel },
      timestamp: Date.now(),
    });

    if (this.config.enableLogging) {
      console.warn(`Client ${clientId} subscribed to channel: ${channel}`);
    }
  }

  private handleUnsubscribe(clientId: string, data: { channel: string }): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { channel } = data;
    client.subscriptions.delete(channel);

    // Send confirmation
    this.sendToClient(clientId, {
      type: "unsubscribed",
      data: { channel },
      timestamp: Date.now(),
    });

    if (this.config.enableLogging) {
      console.warn(`Client ${clientId} unsubscribed from channel: ${channel}`);
    }
  }

  private handleInventoryUpdate(
    clientId: string,
    data: Record<string, unknown>
  ): void {
    // Store inventory update in Redis for persistence
    const key = `inventory:${data.productId}`;
    redisCache.set(
      key,
      {
        ...data,
        updatedBy: clientId,
        timestamp: Date.now(),
      },
      3600
    ); // Cache for 1 hour

    // Broadcast to inventory subscribers
    this.broadcastToSubscribers("inventory", {
      type: "inventory_update",
      data,
      timestamp: Date.now(),
    });
  }

  private handleChatMessage(
    clientId: string,
    data: Record<string, unknown>
  ): void {
    // Store chat message in Redis
    const chatKey = `chat:${data.roomId}`;
    const message = {
      id: this.generateMessageId(),
      sender: clientId,
      content: data.content,
      timestamp: Date.now(),
      type: data.type ?? "text",
    };

    // Add to chat history (keep last 100 messages)
    redisCache.get(chatKey).then((history: Record<string, unknown>[]) => {
      const messages = history ?? [];
      messages.push(message);

      // Keep only last 100 messages
      if (messages.length > 100) {
        messages.splice(0, messages.length - 100);
      }

      redisCache.set(chatKey, messages, 86400); // Cache for 24 hours
    });

    // Broadcast to chat room subscribers
    this.broadcastToSubscribers(`chat:${data.roomId}`, {
      type: "chat_message",
      data: message,
      timestamp: Date.now(),
    });
  }

  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Clean up client
    this.clients.delete(clientId);
    client.ws.terminate();

    // Record disconnection metric
    performanceMonitor.recordMetric("websocket", "disconnection", Date.now(), {
      clientId,
      userId: client.userId,
      totalClients: this.clients.size,
    });

    if (this.config.enableLogging) {
      console.warn(`WebSocket client disconnected: ${clientId}`);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const _now = Date.now();

      for (const [clientId, client] of this.clients.entries()) {
        if (!client.isAlive) {
          console.warn(`Terminating inactive client: ${clientId}`);
          this.handleDisconnection(clientId);
          continue;
        }

        client.isAlive = false;
        client.ws.ping();
      }
    }, this.config.heartbeatInterval);
  }

  // Public methods for external use
  sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to ${clientId}:`, error);
      this.handleDisconnection(clientId);
    }
  }

  broadcastToSubscribers(channel: string, message: WebSocketMessage): void {
    let subscriberCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (
        client.subscriptions.has(channel) &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        try {
          client.ws.send(JSON.stringify(message));
          subscriberCount++;
        } catch (error) {
          console.error(`Error broadcasting to ${clientId}:`, error);
          this.handleDisconnection(clientId);
        }
      }
    }

    // Record broadcast metric
    performanceMonitor.recordMetric("websocket", "broadcast", Date.now(), {
      channel,
      subscriberCount,
      messageType: message.type,
    });
  }

  broadcastToAll(message: WebSocketMessage): void {
    let recipientCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          recipientCount++;
        } catch (error) {
          console.error(`Error broadcasting to ${clientId}:`, error);
          this.handleDisconnection(clientId);
        }
      }
    }

    // Record broadcast metric
    performanceMonitor.recordMetric("websocket", "broadcast_all", Date.now(), {
      recipientCount,
      messageType: message.type,
    });
  }

  getClientInfo(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getClientSubscriptions(clientId: string): string[] {
    const client = this.clients.get(clientId);
    return client ? Array.from(client.subscriptions) : [];
  }

  stop(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.wss) {
      // Close all client connections
      for (const [clientId] of this.clients.entries()) {
        this.handleDisconnection(clientId);
      }

      this.wss.close();
      this.wss = null;
    }

    if (this.config.enableLogging) {
      console.warn("WebSocket server stopped");
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const websocketManager = WebSocketManager.getInstance();

// Convenience functions
export const startWebSocketServer = (config?: Partial<WebSocketConfig>) =>
  WebSocketManager.getInstance(config).start();

export const sendToClient = (clientId: string, message: WebSocketMessage) =>
  websocketManager.sendToClient(clientId, message);

export const broadcastToSubscribers = (
  channel: string,
  message: WebSocketMessage
) => websocketManager.broadcastToSubscribers(channel, message);

export const broadcastToAll = (message: WebSocketMessage) =>
  websocketManager.broadcastToAll(message);
