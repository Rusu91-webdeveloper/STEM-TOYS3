export type EmailPriority = 1 | 2 | 3; // 1=high, 2=normal, 3=low

export interface UnifiedEmailRequest {
  to: string | string[];
  template: string;
  variables: Record<string, unknown>;
  subject?: string;
  html?: string; // For raw HTML sends during migration
  text?: string;
  priority?: EmailPriority;
  scheduledAt?: Date;
  campaignId?: string;
  segmentId?: string;
  tracking?: boolean;
  personalization?: boolean;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
    encoding?: string;
  }>;
}

export interface UnifiedEmailResponse {
  success: boolean;
  emailId: string;
  provider: string;
  messageId?: string | null;
  error?: string;
  metrics: {
    deliveryTime: number;
    retryCount: number;
    queueTime: number;
  };
}

export enum EmailDeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  OPENED = "OPENED",
  CLICKED = "CLICKED",
  BOUNCED = "BOUNCED",
  FAILED = "FAILED",
  UNSUBSCRIBED = "UNSUBSCRIBED",
  SPAM_REPORTED = "SPAM_REPORTED",
}

export enum EmailEventType {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  OPENED = "OPENED",
  CLICKED = "CLICKED",
  BOUNCED = "BOUNCED",
  FAILED = "FAILED",
  UNSUBSCRIBED = "UNSUBSCRIBED",
  SPAM_REPORTED = "SPAM_REPORTED",
}

export interface EmailProviderSendResult {
  success: boolean;
  messageId?: string | null;
  raw?: unknown;
}

export interface EmailProvider {
  readonly name: string;
  send(request: UnifiedEmailRequest): Promise<EmailProviderSendResult>;
}

export interface EmailServiceOptions {
  primaryProvider: EmailProvider;
  fallbackProvider?: EmailProvider;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}
