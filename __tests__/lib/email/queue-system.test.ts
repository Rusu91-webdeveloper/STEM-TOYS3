/**
 * @jest-environment node
 */

import {
  addEmailJob,
  addBatchEmailJobs,
  getQueueStats,
  initializeEmailQueue,
  closeQueue,
} from "@/lib/email/queue-system";
import { EmailJobData } from "@/lib/email/queue-system";

// Mock Redis and Bull Queue
jest.mock("bull", () => {
  const mockQueue = {
    add: jest.fn(),
    addBulk: jest.fn(),
    process: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    clean: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    getWaiting: jest.fn().mockResolvedValue([]),
    getActive: jest.fn().mockResolvedValue([]),
    getCompleted: jest.fn().mockResolvedValue([]),
    getFailed: jest.fn().mockResolvedValue([]),
    getDelayed: jest.fn().mockResolvedValue([]),
  };

  return jest.fn(() => mockQueue);
});

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    emailEvent: {
      create: jest.fn(),
    },
  },
}));

// Mock email providers
jest.mock("@/lib/email/providers/resend", () => ({
  ResendProvider: class {
    name = "resend";
    async send() {
      return { success: true, messageId: "resend-123" };
    }
  },
}));

jest.mock("@/lib/email/providers/brevo", () => ({
  BrevoProvider: class {
    name = "brevo";
    async send() {
      return { success: true, messageId: "brevo-123" };
    }
  },
}));

jest.mock("@/lib/email/providers/gmail", () => ({
  GmailProvider: class {
    name = "gmail";
    async send() {
      return { success: true, messageId: "gmail-123" };
    }
  },
}));

// Mock template engine
jest.mock("@/lib/email/template-engine", () => ({
  TemplateEngine: class {
    async renderTemplate() {
      return "<p>Test email content</p>";
    }
  },
}));

describe("Email Queue System", () => {
  const mockEmailJob: EmailJobData = {
    to: "test@example.com",
    template: "welcome",
    variables: { name: "Test User" },
    subject: "Welcome!",
    html: "<p>Welcome to our service!</p>",
    priority: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set required environment variables
    process.env.EMAIL_FROM = "test@example.com";
    process.env.EMAIL_FROM_NAME = "Test Sender";
  });

  afterEach(async () => {
    await closeQueue();
  });

  describe("addEmailJob", () => {
    it("should add a single email job to the queue", async () => {
      const mockJob = { id: "job-123" };
      const mockQueue = {
        add: jest.fn().mockResolvedValue(mockJob),
      };

      // Mock the queue initialization
      (require("bull") as jest.Mock).mockReturnValue(mockQueue);

      const result = await addEmailJob(mockEmailJob);

      expect(mockQueue.add).toHaveBeenCalledWith(
        "send-email",
        mockEmailJob,
        expect.objectContaining({
          delay: expect.any(Number),
          priority: 2,
        })
      );
      expect(result).toBe(mockJob);
    });

    it("should calculate correct delay based on priority", async () => {
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: "job-123" }),
      };

      (require("bull") as jest.Mock).mockReturnValue(mockQueue);

      // Test high priority (no delay)
      await addEmailJob({ ...mockEmailJob, priority: 1 });
      expect(mockQueue.add).toHaveBeenCalledWith(
        "send-email",
        expect.any(Object),
        expect.objectContaining({ delay: 0 })
      );

      // Test normal priority (1 second delay)
      await addEmailJob({ ...mockEmailJob, priority: 2 });
      expect(mockQueue.add).toHaveBeenCalledWith(
        "send-email",
        expect.any(Object),
        expect.objectContaining({ delay: 1000 })
      );

      // Test low priority (5 second delay)
      await addEmailJob({ ...mockEmailJob, priority: 3 });
      expect(mockQueue.add).toHaveBeenCalledWith(
        "send-email",
        expect.any(Object),
        expect.objectContaining({ delay: 5000 })
      );
    });
  });

  describe("addBatchEmailJobs", () => {
    it("should add multiple email jobs to the queue", async () => {
      const mockJobs = [{ id: "job-1" }, { id: "job-2" }, { id: "job-3" }];

      const mockQueue = {
        addBulk: jest.fn().mockResolvedValue(mockJobs),
      };

      (require("bull") as jest.Mock).mockReturnValue(mockQueue);

      const emails = [
        { ...mockEmailJob, to: "user1@example.com" },
        { ...mockEmailJob, to: "user2@example.com" },
        { ...mockEmailJob, to: "user3@example.com" },
      ];

      const result = await addBatchEmailJobs(emails);

      expect(mockQueue.addBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "send-email",
            data: expect.any(Object),
            opts: expect.objectContaining({
              delay: expect.any(Number),
              priority: 2,
            }),
          }),
        ])
      );
      expect(result).toBe(mockJobs);
    });

    it("should process large batches in chunks", async () => {
      const mockQueue = {
        addBulk: jest.fn().mockResolvedValue([]),
      };

      (require("bull") as jest.Mock).mockReturnValue(mockQueue);

      // Create 150 emails (should be split into 3 batches of 50)
      const emails = Array.from({ length: 150 }, (_, i) => ({
        ...mockEmailJob,
        to: `user${i}@example.com`,
      }));

      await addBatchEmailJobs(emails);

      // Should be called 3 times (150 / 50 = 3 batches)
      expect(mockQueue.addBulk).toHaveBeenCalledTimes(3);
    });
  });

  describe("getQueueStats", () => {
    it("should return queue statistics", async () => {
      const mockStats = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      };

      const mockQueue = {
        getWaiting: jest.fn().mockResolvedValue(Array(mockStats.waiting)),
        getActive: jest.fn().mockResolvedValue(Array(mockStats.active)),
        getCompleted: jest.fn().mockResolvedValue(Array(mockStats.completed)),
        getFailed: jest.fn().mockResolvedValue(Array(mockStats.failed)),
        getDelayed: jest.fn().mockResolvedValue(Array(mockStats.delayed)),
      };

      (require("bull") as jest.Mock).mockReturnValue(mockQueue);

      const stats = await getQueueStats();

      expect(stats).toEqual(mockStats);
    });
  });

  describe("queue initialization", () => {
    it("should initialize queue with correct configuration", () => {
      const mockQueue = {
        add: jest.fn(),
        process: jest.fn(),
        on: jest.fn(),
      };

      (require("bull") as jest.Mock).mockReturnValue(mockQueue);

      initializeEmailQueue();

      expect(require("bull")).toHaveBeenCalledWith(
        "email-queue",
        process.env.REDIS_URL || "redis://localhost:6379",
        expect.objectContaining({
          defaultJobOptions: expect.objectContaining({
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
          }),
          settings: expect.objectContaining({
            stalledInterval: 30000,
            maxStalledCount: 1,
          }),
        })
      );

      expect(mockQueue.process).toHaveBeenCalledWith(5, expect.any(Function));
      expect(mockQueue.on).toHaveBeenCalledWith(
        "completed",
        expect.any(Function)
      );
      expect(mockQueue.on).toHaveBeenCalledWith("failed", expect.any(Function));
      expect(mockQueue.on).toHaveBeenCalledWith(
        "stalled",
        expect.any(Function)
      );
    });
  });

  describe("error handling", () => {
    it("should handle queue errors gracefully", async () => {
      const mockQueue = {
        add: jest.fn().mockRejectedValue(new Error("Queue error")),
      };

      (require("bull") as jest.Mock).mockReturnValue(mockQueue);

      await expect(addEmailJob(mockEmailJob)).rejects.toThrow("Queue error");
    });
  });
});
