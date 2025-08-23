import { performanceMonitor } from "../monitoring/performance-monitor";
import { redisCache } from "../redis-enhanced";

import { websocketManager, WebSocketMessage } from "./websocket-server";

export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: "customer" | "agent" | "admin";
  isOnline: boolean;
  lastSeen: number;
  currentRoom?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  timestamp: number;
  isRead: boolean;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  type: "support" | "general" | "private";
  participants: string[];
  agents: string[];
  status: "open" | "closed" | "waiting";
  createdAt: number;
  lastActivity: number;
  customerId?: string;
  orderId?: string;
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
}

export interface ChatSession {
  id: string;
  userId: string;
  roomId: string;
  startTime: number;
  endTime?: number;
  agentId?: string;
  rating?: number;
  feedback?: string;
}

export interface ChatConfig {
  maxMessageLength: number;
  maxParticipantsPerRoom: number;
  messageRetentionDays: number;
  enableFileSharing: boolean;
  enableTypingIndicators: boolean;
  autoAssignAgents: boolean;
  enableChatHistory: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

const DEFAULT_CONFIG: ChatConfig = {
  maxMessageLength: 1000,
  maxParticipantsPerRoom: 10,
  messageRetentionDays: 30,
  enableFileSharing: true,
  enableTypingIndicators: true,
  autoAssignAgents: true,
  enableChatHistory: true,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
  ],
};

class LiveChatManager {
  private static instance: LiveChatManager;
  private config: ChatConfig;
  private users: Map<string, ChatUser> = new Map();
  private rooms: Map<string, ChatRoom> = new Map();
  private sessions: Map<string, ChatSession> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map(); // roomId -> Set of typing user IDs

  private constructor(config: Partial<ChatConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<ChatConfig>): LiveChatManager {
    if (!LiveChatManager.instance) {
      LiveChatManager.instance = new LiveChatManager(config);
    }
    return LiveChatManager.instance;
  }

  async start(): Promise<void> {
    // Load existing data from Redis
    await this.loadFromRedis();

    // Record startup metric
    performanceMonitor.recordMetric("chat", "startup", Date.now(), {
      config: this.config,
    });

    console.warn("Live chat manager started");
  }

  async stop(): Promise<void> {
    // Save current state to Redis
    await this.saveToRedis();
    console.warn("Live chat manager stopped");
  }

  // User management
  async registerUser(
    user: Omit<ChatUser, "isOnline" | "lastSeen">
  ): Promise<ChatUser> {
    const newUser: ChatUser = {
      ...user,
      isOnline: false,
      lastSeen: Date.now(),
    };

    this.users.set(user.id, newUser);
    await this.saveUserToRedis(newUser);

    // Record metric
    performanceMonitor.recordMetric("chat", "user_registered", Date.now(), {
      userId: user.id,
      role: user.role,
    });

    return newUser;
  }

  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    user.isOnline = isOnline;
    user.lastSeen = Date.now();

    this.users.set(userId, user);
    await this.saveUserToRedis(user);

    // Broadcast user status update
    this.broadcastUserStatus(user);
  }

  getUser(userId: string): Promise<ChatUser | undefined> {
    return this.users.get(userId);
  }

  getOnlineUsers(): Promise<ChatUser[]> {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }

  getOnlineAgents(): Promise<ChatUser[]> {
    return Array.from(this.users.values()).filter(
      user => user.isOnline && (user.role === "agent" || user.role === "admin")
    );
  }

  // Room management
  async createRoom(
    room: Omit<ChatRoom, "id" | "createdAt" | "lastActivity">
  ): Promise<ChatRoom> {
    const newRoom: ChatRoom = {
      ...room,
      id: this.generateRoomId(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.rooms.set(newRoom.id, newRoom);
    await this.saveRoomToRedis(newRoom);

    // Record metric
    performanceMonitor.recordMetric("chat", "room_created", Date.now(), {
      roomId: newRoom.id,
      type: newRoom.type,
      customerId: newRoom.customerId,
    });

    return newRoom;
  }

  async joinRoom(userId: string, roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    const user = this.users.get(userId);

    if (!room || !user) return false;

    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      room.lastActivity = Date.now();

      this.rooms.set(roomId, room);
      await this.saveRoomToRedis(room);

      // Broadcast join notification
      this.broadcastRoomUpdate(room, {
        type: "user_joined",
        data: { userId, userName: user.name },
        timestamp: Date.now(),
      });
    }

    // Update user's current room
    user.currentRoom = roomId;
    this.users.set(userId, user);
    await this.saveUserToRedis(user);

    return true;
  }

  async leaveRoom(userId: string, roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    const user = this.users.get(userId);

    if (!room || !user) return false;

    room.participants = room.participants.filter(id => id !== userId);
    room.lastActivity = Date.now();

    this.rooms.set(roomId, room);
    await this.saveRoomToRedis(room);

    // Update user's current room
    user.currentRoom = undefined;
    this.users.set(userId, user);
    await this.saveUserToRedis(user);

    // Broadcast leave notification
    this.broadcastRoomUpdate(room, {
      type: "user_left",
      data: { userId, userName: user.name },
      timestamp: Date.now(),
    });

    return true;
  }

  getRoom(roomId: string): Promise<ChatRoom | undefined> {
    return this.rooms.get(roomId);
  }

  getUserRooms(userId: string): Promise<ChatRoom[]> {
    return Array.from(this.rooms.values()).filter(room =>
      room.participants.includes(userId)
    );
  }

  getOpenSupportRooms(): Promise<ChatRoom[]> {
    return Array.from(this.rooms.values()).filter(
      room => room.type === "support" && room.status === "open"
    );
  }

  // Message management
  async sendMessage(
    message: Omit<ChatMessage, "id" | "timestamp" | "isRead">
  ): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      isRead: false,
    };

    // Validate message
    if (newMessage.content.length > this.config.maxMessageLength) {
      throw new Error("Message too long");
    }

    // Save message to Redis
    await this.saveMessageToRedis(newMessage);

    // Update room activity
    const room = this.rooms.get(message.roomId);
    if (room) {
      room.lastActivity = Date.now();
      this.rooms.set(message.roomId, room);
      await this.saveRoomToRedis(room);
    }

    // Broadcast message to room subscribers
    this.broadcastMessage(newMessage);

    // Record metric
    performanceMonitor.recordMetric("chat", "message_sent", Date.now(), {
      roomId: message.roomId,
      senderId: message.senderId,
      messageType: message.type,
    });

    return newMessage;
  }

  async getRoomMessages(
    roomId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const key = `chat:messages:${roomId}`;
      const messages = (await redisCache.get<ChatMessage[]>(key)) ?? [];

      // Return most recent messages
      return messages.slice(-limit);
    } catch (error) {
      console.error(`Error getting messages for room ${roomId}:`, error);
      return [];
    }
  }

  markMessageAsRead(messageId: string, userId: string): Promise<void> {
    // This would update the message in Redis
    // For now, we'll just log the action
    console.warn(`Message ${messageId} marked as read by ${userId}`);
  }

  // Typing indicators
  setTypingStatus(
    userId: string,
    roomId: string,
    isTyping: boolean
  ): Promise<void> {
    if (!this.config.enableTypingIndicators) return;

    if (isTyping) {
      if (!this.typingUsers.has(roomId)) {
        this.typingUsers.set(roomId, new Set());
      }
      this.typingUsers.get(roomId)!.add(userId);
    } else {
      this.typingUsers.get(roomId)?.delete(userId);
    }

    // Broadcast typing status
    this.broadcastTypingStatus(roomId, userId, isTyping);
  }

  // Session management
  async startSession(userId: string, roomId: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: this.generateSessionId(),
      userId,
      roomId,
      startTime: Date.now(),
    };

    this.sessions.set(session.id, session);
    await this.saveSessionToRedis(session);

    return session;
  }

  async endSession(
    sessionId: string,
    agentId?: string,
    rating?: number,
    feedback?: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = Date.now();
    session.agentId = agentId;
    session.rating = rating;
    session.feedback = feedback;

    this.sessions.set(sessionId, session);
    await this.saveSessionToRedis(session);

    // Record session metric
    performanceMonitor.recordMetric("chat", "session_ended", Date.now(), {
      sessionId,
      duration: session.endTime - session.startTime,
      rating,
    });
  }

  getSession(sessionId: string): Promise<ChatSession | undefined> {
    return this.sessions.get(sessionId);
  }

  getUserSessions(userId: string): Promise<ChatSession[]> {
    return Array.from(this.sessions.values()).filter(
      session => session.userId === userId
    );
  }

  // Agent assignment
  async assignAgentToRoom(roomId: string, agentId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    const agent = this.users.get(agentId);

    if (!room || !agent || agent.role !== "agent") return false;

    if (!room.agents.includes(agentId)) {
      room.agents.push(agentId);
      room.status = "open";
      room.lastActivity = Date.now();

      this.rooms.set(roomId, room);
      await this.saveRoomToRedis(room);

      // Broadcast agent assignment
      this.broadcastRoomUpdate(room, {
        type: "agent_assigned",
        data: { agentId, agentName: agent.name },
        timestamp: Date.now(),
      });
    }

    return true;
  }

  async autoAssignAgent(roomId: string): Promise<string | null> {
    if (!this.config.autoAssignAgents) return null;

    const availableAgents = await this.getOnlineAgents();
    if (availableAgents.length === 0) return null;

    // Simple round-robin assignment
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const assignedAgent = availableAgents.find(
      agent => !room.agents.includes(agent.id)
    );

    if (assignedAgent) {
      await this.assignAgentToRoom(roomId, assignedAgent.id);
      return assignedAgent.id;
    }

    return null;
  }

  // Broadcasting methods
  private broadcastMessage(message: ChatMessage): void {
    const wsMessage: WebSocketMessage = {
      type: "chat_message",
      data: message,
      timestamp: Date.now(),
    };

    websocketManager.broadcastToSubscribers(
      `chat:${message.roomId}`,
      wsMessage
    );
  }

  private broadcastRoomUpdate(room: ChatRoom, message: WebSocketMessage): void {
    websocketManager.broadcastToSubscribers(`chat:${room.id}`, message);
  }

  private broadcastUserStatus(user: ChatUser): void {
    const message: WebSocketMessage = {
      type: "user_status",
      data: {
        userId: user.id,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
      timestamp: Date.now(),
    };

    // Broadcast to all chat subscribers
    websocketManager.broadcastToSubscribers("chat", message);
  }

  private broadcastTypingStatus(
    roomId: string,
    userId: string,
    isTyping: boolean
  ): void {
    const message: WebSocketMessage = {
      type: "typing_status",
      data: {
        roomId,
        userId,
        isTyping,
      },
      timestamp: Date.now(),
    };

    websocketManager.broadcastToSubscribers(`chat:${roomId}`, message);
  }

  // Redis persistence methods
  private loadFromRedis(): Promise<void> {
    try {
      // Load users, rooms, and sessions from Redis
      // This would typically use pattern matching to get all keys
      console.warn("Loading chat data from Redis...");
    } catch (error) {
      console.error("Error loading chat data from Redis:", error);
    }
  }

  private saveToRedis(): Promise<void> {
    try {
      // Save all current state to Redis
      console.warn("Saving chat data to Redis...");
    } catch (error) {
      console.error("Error saving chat data to Redis:", error);
    }
  }

  private async saveUserToRedis(user: ChatUser): Promise<void> {
    const key = `chat:user:${user.id}`;
    await redisCache.set(key, user, 86400); // Cache for 24 hours
  }

  private async saveRoomToRedis(room: ChatRoom): Promise<void> {
    const key = `chat:room:${room.id}`;
    await redisCache.set(key, room, 86400); // Cache for 24 hours
  }

  private async saveMessageToRedis(message: ChatMessage): Promise<void> {
    const key = `chat:messages:${message.roomId}`;
    const messages = (await redisCache.get<ChatMessage[]>(key)) ?? [];

    messages.push(message);

    // Keep only recent messages (last 1000 messages)
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }

    await redisCache.set(
      key,
      messages,
      86400 * this.config.messageRetentionDays
    );
  }

  private async saveSessionToRedis(session: ChatSession): Promise<void> {
    const key = `chat:session:${session.id}`;
    await redisCache.set(key, session, 86400 * 30); // Cache for 30 days
  }

  // Utility methods
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public utility methods
  getConfig(): ChatConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ChatConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const liveChatManager = LiveChatManager.getInstance();

// Convenience functions
export const startLiveChat = (config?: Partial<ChatConfig>) =>
  LiveChatManager.getInstance(config).start();

export const sendChatMessage = (
  message: Omit<ChatMessage, "id" | "timestamp" | "isRead">
) => liveChatManager.sendMessage(message);

export const createChatRoom = (
  room: Omit<ChatRoom, "id" | "createdAt" | "lastActivity">
) => liveChatManager.createRoom(room);

export const joinChatRoom = (userId: string, roomId: string) =>
  liveChatManager.joinRoom(userId, roomId);

export const assignAgentToRoom = (roomId: string, agentId: string) =>
  liveChatManager.assignAgentToRoom(roomId, agentId);
