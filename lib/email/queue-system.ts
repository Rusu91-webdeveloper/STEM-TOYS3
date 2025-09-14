import Queue from "bull";
import { prisma } from "@/lib/prisma";
import { UnifiedEmailService } from "./unified-service";
import { BrevoProvider } from "./providers/brevo";
import { ResendProvider } from "./providers/resend";
import { GmailProvider } from "./providers/gmail";
import { TemplateEngine } from "./template-engine";
import { EmailDeliveryStatus, EmailEventType } from "./types";

// Queue configuration
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const MAX_CONCURRENT_JOBS = 3; // Reduced to help with memory usage
const RATE_LIMIT_PER_MINUTE = 60;
const BATCH_SIZE = 25; // Reduced batch size to help with memory

// Email job data interface
export interface EmailJobData {
  to: string | string[];
  template: string;
  variables: Record<string, unknown>;
  subject?: string;
  html?: string;
  text?: string;
  priority?: 1 | 2 | 3;
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

// Queue instance
let emailQueue: Queue.Queue<EmailJobData> | null = null;

/**
 * Initialize the email queue system
 */
export function initializeEmailQueue(): Queue.Queue<EmailJobData> {
  if (emailQueue) {
    return emailQueue;
  }

  emailQueue = new Queue<EmailJobData>("email-queue", REDIS_URL, {
    defaultJobOptions: {
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50, // Keep last 50 failed jobs
      attempts: 3, // Retry failed jobs 3 times
      backoff: {
        type: "exponential",
        delay: 2000, // Start with 2 second delay
      },
    },
    settings: {
      stalledInterval: 30 * 1000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 1, // Mark job as failed after 1 stalled check
    },
  });

  // Process email jobs
  emailQueue.process(MAX_CONCURRENT_JOBS, processEmailJob);

  // Add rate limiting
  emailQueue.add = (function (originalAdd) {
    return function (
      name: string,
      data: EmailJobData,
      opts?: Queue.JobOptions
    ) {
      // Add rate limiting delay based on priority
      const delay = calculateRateLimitDelay(data.priority || 2);
      return originalAdd.call(this, name, data, { ...opts, delay });
    };
  })(emailQueue.add.bind(emailQueue));

  // Event listeners for monitoring
  emailQueue.on("completed", job => {
    console.log(`✅ Email job ${job.id} completed successfully`);
  });

  emailQueue.on("failed", (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err.message);
  });

  emailQueue.on("stalled", job => {
    console.warn(`⚠️ Email job ${job.id} stalled`);
  });

  return emailQueue;
}

/**
 * Calculate rate limiting delay based on priority
 */
function calculateRateLimitDelay(priority: 1 | 2 | 3): number {
  const baseDelay = 1000; // 1 second base delay
  const priorityMultiplier = {
    1: 0, // High priority - no additional delay
    2: 1, // Normal priority - 1 second delay
    3: 5, // Low priority - 5 second delay
  };

  return baseDelay * priorityMultiplier[priority];
}

/**
 * Process a single email job
 */
async function processEmailJob(job: Queue.Job<EmailJobData>): Promise<void> {
  const startTime = Date.now();
  const { data } = job;

  try {
    // Create email service with providers
    const { primary, fallback } = createProviderFromEnv();
    const service = new UnifiedEmailService({
      primaryProvider: primary,
      fallbackProvider: fallback,
      fromEmail: process.env.EMAIL_FROM as string,
      fromName: process.env.EMAIL_FROM_NAME,
      replyTo: process.env.EMAIL_REPLY_TO,
    });

    // Render template if HTML not provided
    let html = data.html;
    if (!html && data.template) {
      const engine = new TemplateEngine();
      html = await engine.renderTemplate(data.template, data.variables || {});
    }

    // Send email
    const response = await service.sendEmail({ ...data, html });

    // Track email event in database
    await trackEmailEvent({
      emailId: response.emailId,
      userId: data.variables?.user?.id as string,
      email: Array.isArray(data.to) ? data.to[0] : data.to,
      eventType: response.success ? EmailEventType.SENT : EmailEventType.FAILED,
      deliveryStatus: response.success
        ? EmailDeliveryStatus.SENT
        : EmailDeliveryStatus.FAILED,
      campaignId: data.campaignId,
      templateId: data.template,
      metadata: {
        provider: response.provider,
        messageId: response.messageId,
        deliveryTime: response.metrics.deliveryTime,
        retryCount: response.metrics.retryCount,
        queueTime: response.metrics.queueTime,
        jobId: job.id,
        processedAt: new Date().toISOString(),
      },
    });

    // Update job progress
    job.progress(100);

    const processingTime = Date.now() - startTime;
    console.log(
      `📧 Email sent via ${response.provider} in ${processingTime}ms`
    );

    // Clean up memory
    if (global.gc) {
      global.gc();
    }
  } catch (error) {
    console.error("❌ Error processing email job:", error);

    // Track failed email event
    await trackEmailEvent({
      emailId: `failed-${job.id}-${Date.now()}`,
      userId: data.variables?.user?.id as string,
      email: Array.isArray(data.to) ? data.to[0] : data.to,
      eventType: EmailEventType.FAILED,
      deliveryStatus: EmailDeliveryStatus.FAILED,
      campaignId: data.campaignId,
      templateId: data.template,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
        jobId: job.id,
        failedAt: new Date().toISOString(),
      },
    });

    // Clean up memory on error
    if (global.gc) {
      global.gc();
    }

    throw error; // Re-throw to mark job as failed
  }
}

/**
 * Create provider instances from environment
 */
function createProviderFromEnv() {
  const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  const primary =
    provider === "brevo"
      ? new BrevoProvider()
      : provider === "gmail"
        ? new GmailProvider()
        : new ResendProvider();

  // Configure fallback
  let fallback = undefined as any;
  if (primary instanceof ResendProvider) fallback = new BrevoProvider();
  else if (primary instanceof BrevoProvider) fallback = new ResendProvider();
  else fallback = new ResendProvider();

  return { primary, fallback } as const;
}

/**
 * Track email event in database
 */
async function trackEmailEvent(eventData: {
  emailId: string;
  userId?: string;
  email: string;
  eventType: EmailEventType;
  deliveryStatus: EmailDeliveryStatus;
  campaignId?: string;
  templateId?: string;
  metadata?: any;
}) {
  try {
    await prisma.emailEvent.create({
      data: {
        emailId: eventData.emailId,
        userId: eventData.userId,
        email: eventData.email,
        eventType: eventData.eventType,
        deliveryStatus: eventData.deliveryStatus,
        campaignId: eventData.campaignId,
        templateId: eventData.templateId,
        metadata: eventData.metadata,
      },
    });
  } catch (error) {
    console.error("❌ Error tracking email event:", error);
    // Don't throw - email tracking failure shouldn't break email sending
  }
}

/**
 * Add email job to queue
 */
export async function addEmailJob(
  data: EmailJobData,
  options?: Queue.JobOptions
): Promise<Queue.Job<EmailJobData>> {
  const queue = initializeEmailQueue();

  // Calculate priority-based delay
  const delay = calculateRateLimitDelay(data.priority || 2);

  return queue.add("send-email", data, {
    ...options,
    delay,
    priority: data.priority || 2,
  });
}

/**
 * Add batch of emails to queue
 */
export async function addBatchEmailJobs(
  emails: EmailJobData[],
  options?: Queue.JobOptions
): Promise<Queue.Job<EmailJobData>[]> {
  const queue = initializeEmailQueue();

  // Process in batches to avoid overwhelming the queue
  const batches = [];
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const jobs = batch.map((email, index) => ({
      name: "send-email",
      data: email,
      opts: {
        ...options,
        delay: calculateRateLimitDelay(email.priority || 2) + index * 100, // Stagger batch jobs
        priority: email.priority || 2,
      },
    }));

    batches.push(...jobs);
  }

  return queue.addBulk(batches);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = initializeEmailQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
}

/**
 * Pause queue processing
 */
export async function pauseQueue(): Promise<void> {
  const queue = initializeEmailQueue();
  await queue.pause();
}

/**
 * Resume queue processing
 */
export async function resumeQueue(): Promise<void> {
  const queue = initializeEmailQueue();
  await queue.resume();
}

/**
 * Clean up completed and failed jobs
 */
export async function cleanQueue(): Promise<void> {
  const queue = initializeEmailQueue();
  await queue.clean(24 * 60 * 60 * 1000, "completed"); // Clean completed jobs older than 24 hours
  await queue.clean(7 * 24 * 60 * 60 * 1000, "failed"); // Clean failed jobs older than 7 days
}

/**
 * Close queue connection
 */
export async function closeQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
}
