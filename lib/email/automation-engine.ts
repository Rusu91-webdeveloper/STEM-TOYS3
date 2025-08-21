/**
 * Advanced Email Automation Engine
 * Provides automated email sequences, triggers, and workflows
 * for enterprise-grade email automation
 */

import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { personalizationEngine } from "./personalization-engine";
import { emailAnalyticsEngine } from "./analytics-engine";

export interface EmailTrigger {
  id: string;
  name: string;
  type: "user_action" | "time_based" | "behavioral" | "system";
  conditions: TriggerCondition[];
  actions: EmailAction[];
  isActive: boolean;
  priority: number;
}

export interface TriggerCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in"
    | "exists"
    | "not_exists";
  value: any;
  timeWindow?: number; // in minutes
}

export interface EmailAction {
  type:
    | "send_email"
    | "add_to_segment"
    | "remove_from_segment"
    | "update_user"
    | "delay"
    | "condition";
  templateId?: string;
  delayMinutes?: number;
  segmentId?: string;
  userId?: string;
  data?: Record<string, any>;
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  trigger: EmailTrigger;
  steps: EmailSequenceStep[];
  isActive: boolean;
  maxEmails: number;
  cooldownHours: number;
}

export interface EmailSequenceStep {
  id: string;
  order: number;
  action: EmailAction;
  conditions?: TriggerCondition[];
  delayHours: number;
  templateId: string;
  subject: string;
  content: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: EmailTrigger[];
  sequences: EmailSequence[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Advanced Email Automation Engine
 */
export class EmailAutomationEngine {
  private readonly CACHE_TTL = 1800; // 30 minutes
  private readonly TRIGGER_CACHE_TTL = 900; // 15 minutes

  /**
   * Process user action and trigger relevant automations
   */
  async processUserAction(
    userId: string,
    action: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      console.log(`🔄 Processing user action: ${action} for user: ${userId}`);

      // Get active triggers
      const triggers = await this.getActiveTriggers();

      // Check each trigger for conditions
      for (const trigger of triggers) {
        if (await this.shouldTrigger(trigger, userId, action, data)) {
          await this.executeTrigger(trigger, userId, data);
        }
      }
    } catch (error) {
      console.error("Error processing user action:", error);
    }
  }

  /**
   * Execute email sequence
   */
  async executeEmailSequence(
    sequenceId: string,
    userId: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    try {
      const sequence = await this.getEmailSequence(sequenceId);
      if (!sequence || !sequence.isActive) {
        console.log(`Sequence ${sequenceId} not found or inactive`);
        return;
      }

      // Check if user is already in this sequence
      const isInSequence = await this.isUserInSequence(sequenceId, userId);
      if (isInSequence) {
        console.log(`User ${userId} already in sequence ${sequenceId}`);
        return;
      }

      // Add user to sequence
      await this.addUserToSequence(sequenceId, userId);

      // Execute first step
      const firstStep = sequence.steps[0];
      if (firstStep) {
        await this.executeSequenceStep(firstStep, userId, context);
      }
    } catch (error) {
      console.error("Error executing email sequence:", error);
    }
  }

  /**
   * Process time-based triggers
   */
  async processTimeBasedTriggers(): Promise<void> {
    try {
      console.log("🕐 Processing time-based triggers");

      const timeBasedTriggers = await this.getTimeBasedTriggers();

      for (const trigger of timeBasedTriggers) {
        await this.processTimeBasedTrigger(trigger);
      }
    } catch (error) {
      console.error("Error processing time-based triggers:", error);
    }
  }

  /**
   * Create welcome series for new user
   */
  async createWelcomeSeries(userId: string): Promise<void> {
    try {
      const welcomeSequence = await this.getWelcomeSequence();
      if (welcomeSequence) {
        await this.executeEmailSequence(welcomeSequence.id, userId);
      }
    } catch (error) {
      console.error("Error creating welcome series:", error);
    }
  }

  /**
   * Create abandoned cart recovery sequence
   */
  async createAbandonedCartSequence(
    userId: string,
    cartData: any
  ): Promise<void> {
    try {
      const abandonedCartSequence = await this.getAbandonedCartSequence();
      if (abandonedCartSequence) {
        await this.executeEmailSequence(abandonedCartSequence.id, userId, {
          cartData,
          abandonedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error creating abandoned cart sequence:", error);
    }
  }

  /**
   * Create post-purchase sequence
   */
  async createPostPurchaseSequence(
    userId: string,
    orderData: any
  ): Promise<void> {
    try {
      const postPurchaseSequence = await this.getPostPurchaseSequence();
      if (postPurchaseSequence) {
        await this.executeEmailSequence(postPurchaseSequence.id, userId, {
          orderData,
          purchasedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error creating post-purchase sequence:", error);
    }
  }

  /**
   * Create re-engagement sequence for inactive users
   */
  async createReEngagementSequence(userId: string): Promise<void> {
    try {
      const reEngagementSequence = await this.getReEngagementSequence();
      if (reEngagementSequence) {
        await this.executeEmailSequence(reEngagementSequence.id, userId);
      }
    } catch (error) {
      console.error("Error creating re-engagement sequence:", error);
    }
  }

  /**
   * Process next step in sequence for user
   */
  async processNextSequenceStep(
    sequenceId: string,
    userId: string,
    currentStepId: string
  ): Promise<void> {
    try {
      const sequence = await this.getEmailSequence(sequenceId);
      if (!sequence) return;

      const currentStepIndex = sequence.steps.findIndex(
        step => step.id === currentStepId
      );
      if (
        currentStepIndex === -1 ||
        currentStepIndex >= sequence.steps.length - 1
      ) {
        // Sequence completed
        await this.completeSequence(sequenceId, userId);
        return;
      }

      const nextStep = sequence.steps[currentStepIndex + 1];
      if (nextStep) {
        // Check if enough time has passed
        const lastEmailSent = await this.getLastEmailSent(sequenceId, userId);
        if (lastEmailSent) {
          const timeSinceLastEmail = Date.now() - lastEmailSent.getTime();
          const requiredDelay = nextStep.delayHours * 60 * 60 * 1000;

          if (timeSinceLastEmail < requiredDelay) {
            // Schedule for later
            setTimeout(
              () => this.executeSequenceStep(nextStep, userId, {}),
              requiredDelay - timeSinceLastEmail
            );
            return;
          }
        }

        await this.executeSequenceStep(nextStep, userId, {});
      }
    } catch (error) {
      console.error("Error processing next sequence step:", error);
    }
  }

  // Private helper methods

  private async shouldTrigger(
    trigger: EmailTrigger,
    userId: string,
    action: string,
    data: Record<string, any>
  ): Promise<boolean> {
    if (!trigger.isActive) return false;

    // Check if trigger type matches action
    if (trigger.type === "user_action" && action !== data.action) {
      return false;
    }

    // Check conditions
    for (const condition of trigger.conditions) {
      const value = this.getFieldValue(condition.field, userId, data);
      if (!this.evaluateCondition(condition, value)) {
        return false;
      }
    }

    return true;
  }

  private async executeTrigger(
    trigger: EmailTrigger,
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    console.log(`⚡ Executing trigger: ${trigger.name} for user: ${userId}`);

    for (const action of trigger.actions) {
      await this.executeAction(action, userId, data);
    }
  }

  private async executeAction(
    action: EmailAction,
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    switch (action.type) {
      case "send_email":
        await this.sendAutomatedEmail(action, userId, data);
        break;
      case "add_to_segment":
        await this.addUserToSegment(action.segmentId!, userId);
        break;
      case "remove_from_segment":
        await this.removeUserFromSegment(action.segmentId!, userId);
        break;
      case "update_user":
        await this.updateUserData(userId, action.data || {});
        break;
      case "delay":
        // Delay is handled in sequence processing
        break;
      case "condition":
        // Conditional logic is handled in trigger evaluation
        break;
    }
  }

  private async sendAutomatedEmail(
    action: EmailAction,
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Get user profile for personalization
      const userProfile = await personalizationEngine.getUserProfile(userId);
      if (!userProfile) return;

      // Get personalization context
      const context =
        await personalizationEngine.getPersonalizationContext(userId);

      // Generate personalized content
      const personalizedContent =
        await personalizationEngine.generatePersonalizedContent(
          action.data?.content || "",
          userProfile,
          context
        );

      // Get personalized subject
      const personalizedSubject =
        await personalizationEngine.getPersonalizedSubject(
          action.data?.subject || "",
          userProfile,
          context
        );

      // Send email
      await this.sendEmail(userId, personalizedSubject, personalizedContent);

      // Track email event
      await emailAnalyticsEngine.trackEmailEvent({
        emailId: this.generateEmailId(),
        userId,
        email: userProfile.email,
        eventType: "sent",
        metadata: {
          templateId: action.templateId,
          subject: personalizedSubject,
          campaignId: action.data?.campaignId,
        },
      });
    } catch (error) {
      console.error("Error sending automated email:", error);
    }
  }

  private async executeSequenceStep(
    step: EmailSequenceStep,
    userId: string,
    context: Record<string, any>
  ): Promise<void> {
    try {
      // Check conditions
      if (step.conditions) {
        for (const condition of step.conditions) {
          const value = this.getFieldValue(condition.field, userId, context);
          if (!this.evaluateCondition(condition, value)) {
            console.log(
              `Step ${step.id} conditions not met for user ${userId}`
            );
            return;
          }
        }
      }

      // Execute step action
      await this.executeAction(step.action, userId, context);

      // Update sequence progress
      await this.updateSequenceProgress(step.id, userId);

      // Schedule next step
      if (step.delayHours > 0) {
        setTimeout(
          () => this.processNextSequenceStep(step.id, userId, step.id),
          step.delayHours * 60 * 60 * 1000
        );
      } else {
        await this.processNextSequenceStep(step.id, userId, step.id);
      }
    } catch (error) {
      console.error("Error executing sequence step:", error);
    }
  }

  private async getActiveTriggers(): Promise<EmailTrigger[]> {
    const cacheKey = "active-triggers";

    // Check cache first
    const cached = await cache.get<EmailTrigger[]>(cacheKey);
    if (cached) return cached;

    // This would query the database for active triggers
    // For now, return mock data
    const triggers: EmailTrigger[] = [
      {
        id: "welcome-trigger",
        name: "Welcome Trigger",
        type: "user_action",
        conditions: [
          {
            field: "action",
            operator: "equals",
            value: "user_registered",
          },
        ],
        actions: [
          {
            type: "send_email",
            templateId: "welcome-email",
            data: {
              subject: "Bine ai venit la {storeName}!",
              content: "Mulțumim că te-ai înregistrat...",
            },
          },
        ],
        isActive: true,
        priority: 1,
      },
      {
        id: "abandoned-cart-trigger",
        name: "Abandoned Cart Trigger",
        type: "behavioral",
        conditions: [
          {
            field: "cart_abandoned",
            operator: "equals",
            value: true,
          },
        ],
        actions: [
          {
            type: "send_email",
            templateId: "abandoned-cart",
            data: {
              subject: "Ai uitat ceva în coșul tău!",
              content: "Văd că ai lăsat produse în coș...",
            },
          },
        ],
        isActive: true,
        priority: 2,
      },
    ];

    // Cache the triggers
    await cache.set(cacheKey, triggers, this.TRIGGER_CACHE_TTL);

    return triggers;
  }

  private async getTimeBasedTriggers(): Promise<EmailTrigger[]> {
    // This would return time-based triggers
    return [];
  }

  private async processTimeBasedTrigger(trigger: EmailTrigger): Promise<void> {
    // Process time-based trigger logic
    console.log(`Processing time-based trigger: ${trigger.name}`);
  }

  private async getEmailSequence(
    sequenceId: string
  ): Promise<EmailSequence | null> {
    // This would query the database for email sequence
    // For now, return mock data
    return null;
  }

  private async getWelcomeSequence(): Promise<EmailSequence | null> {
    // This would return the welcome sequence configuration
    return null;
  }

  private async getAbandonedCartSequence(): Promise<EmailSequence | null> {
    // This would return the abandoned cart sequence configuration
    return null;
  }

  private async getPostPurchaseSequence(): Promise<EmailSequence | null> {
    // This would return the post-purchase sequence configuration
    return null;
  }

  private async getReEngagementSequence(): Promise<EmailSequence | null> {
    // This would return the re-engagement sequence configuration
    return null;
  }

  private async isUserInSequence(
    sequenceId: string,
    userId: string
  ): Promise<boolean> {
    // This would check if user is already in the sequence
    return false;
  }

  private async addUserToSequence(
    sequenceId: string,
    userId: string
  ): Promise<void> {
    // This would add user to the sequence
    console.log(`Adding user ${userId} to sequence ${sequenceId}`);
  }

  private async completeSequence(
    sequenceId: string,
    userId: string
  ): Promise<void> {
    // This would mark sequence as completed for user
    console.log(`Completing sequence ${sequenceId} for user ${userId}`);
  }

  private async getLastEmailSent(
    sequenceId: string,
    userId: string
  ): Promise<Date | null> {
    // This would get the last email sent time for user in sequence
    return null;
  }

  private async updateSequenceProgress(
    stepId: string,
    userId: string
  ): Promise<void> {
    // This would update sequence progress for user
    console.log(
      `Updating sequence progress for step ${stepId} and user ${userId}`
    );
  }

  private async addUserToSegment(
    segmentId: string,
    userId: string
  ): Promise<void> {
    // This would add user to segment
    console.log(`Adding user ${userId} to segment ${segmentId}`);
  }

  private async removeUserFromSegment(
    segmentId: string,
    userId: string
  ): Promise<void> {
    // This would remove user from segment
    console.log(`Removing user ${userId} from segment ${segmentId}`);
  }

  private async updateUserData(
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    // This would update user data
    console.log(`Updating user ${userId} data:`, data);
  }

  private async sendEmail(
    userId: string,
    subject: string,
    content: string
  ): Promise<void> {
    // This would send the email
    console.log(`Sending email to user ${userId}: ${subject}`);
  }

  private generateEmailId(): string {
    return `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFieldValue(
    field: string,
    userId: string,
    data: Record<string, any>
  ): any {
    // This would get the field value from user data or context
    return data[field];
  }

  private evaluateCondition(condition: TriggerCondition, value: any): boolean {
    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "contains":
        return String(value).includes(condition.value);
      case "not_contains":
        return !String(value).includes(condition.value);
      case "greater_than":
        return Number(value) > Number(condition.value);
      case "less_than":
        return Number(value) < Number(condition.value);
      case "in":
        return Array.isArray(condition.value)
          ? condition.value.includes(value)
          : false;
      case "not_in":
        return Array.isArray(condition.value)
          ? !condition.value.includes(value)
          : true;
      case "exists":
        return value !== undefined && value !== null;
      case "not_exists":
        return value === undefined || value === null;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const emailAutomationEngine = new EmailAutomationEngine();
