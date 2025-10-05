import {
  PrismaClient,
  EmailTriggerType,
  EmailTriggerStatus,
  UserSegment,
  LifecycleStage,
} from "@prisma/client";

export interface TriggerCondition {
  segment?: string;
  previousSegment?: string;
  lifecycleStage?: string;
  previousLifecycleStage?: string;
  inactiveDays?: number;
  event?: string;
  [key: string]: any;
}

export interface TriggerAction {
  templateId?: string;
  sequenceId?: string;
  subject?: string;
  tags?: string[];
  [key: string]: any;
}

export interface EmailTriggerData {
  name: string;
  description?: string;
  type: EmailTriggerType;
  conditions: TriggerCondition;
  actionType: "send_email" | "start_sequence" | "update_user";
  actionData: TriggerAction;
  priority?: number;
  cooldownHours?: number;
  maxExecutions?: number;
  segmentFilter?: string;
  lifecycleFilter?: string;
  tags?: string[];
}

export class EmailTriggerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new email trigger
   */
  async createTrigger(
    data: EmailTriggerData,
    createdBy: string = "system"
  ): Promise<any> {
    return this.prisma.emailTrigger.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        status: EmailTriggerStatus.DRAFT,
        conditions: data.conditions,
        actionType: data.actionType,
        actionData: data.actionData,
        priority: data.priority || 0,
        cooldownHours: data.cooldownHours || 24,
        maxExecutions: data.maxExecutions,
        segmentFilter: data.segmentFilter,
        lifecycleFilter: data.lifecycleFilter,
        tags: data.tags || [],
        createdBy,
      },
    });
  }

  /**
   * Update trigger status
   */
  async updateTriggerStatus(
    triggerId: string,
    status: EmailTriggerStatus
  ): Promise<any> {
    return this.prisma.emailTrigger.update({
      where: { id: triggerId },
      data: { status, isActive: status === EmailTriggerStatus.ACTIVE },
    });
  }

  /**
   * Process triggers for a user based on segment change
   */
  async processSegmentTriggers(
    userId: string,
    newSegment: UserSegment,
    previousSegment?: UserSegment
  ): Promise<void> {
    const triggers = await this.prisma.emailTrigger.findMany({
      where: {
        type: EmailTriggerType.SEGMENT_ENTER,
        isActive: true,
      },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as TriggerCondition;

      // Check if this trigger applies to the segment change
      if (
        conditions.segment === newSegment &&
        (!conditions.previousSegment ||
          conditions.previousSegment === previousSegment)
      ) {
        // Check segment filter
        if (trigger.segmentFilter && trigger.segmentFilter !== newSegment)
          continue;

        // Check if user qualifies for this trigger
        if (await this.canExecuteTrigger(trigger.id, userId)) {
          await this.executeTrigger(trigger, userId, {
            newSegment,
            previousSegment,
            triggerType: "segment_change",
          });
        }
      }
    }
  }

  /**
   * Process triggers for lifecycle stage changes
   */
  async processLifecycleTriggers(
    userId: string,
    newStage: LifecycleStage,
    previousStage?: LifecycleStage
  ): Promise<void> {
    const triggers = await this.prisma.emailTrigger.findMany({
      where: {
        type: EmailTriggerType.LIFECYCLE_CHANGE,
        isActive: true,
      },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as TriggerCondition;

      if (
        conditions.lifecycleStage === newStage &&
        (!conditions.previousLifecycleStage ||
          conditions.previousLifecycleStage === previousStage)
      ) {
        if (trigger.lifecycleFilter && trigger.lifecycleFilter !== newStage)
          continue;

        if (await this.canExecuteTrigger(trigger.id, userId)) {
          await this.executeTrigger(trigger, userId, {
            newLifecycleStage: newStage,
            previousLifecycleStage: previousStage,
            triggerType: "lifecycle_change",
          });
        }
      }
    }
  }

  /**
   * Process behavior-based triggers (like cart abandonment)
   */
  async processBehaviorTriggers(
    userId: string,
    event: string,
    eventData: any = {}
  ): Promise<void> {
    const triggers = await this.prisma.emailTrigger.findMany({
      where: {
        type: EmailTriggerType.BEHAVIOR_EVENT,
        isActive: true,
      },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as TriggerCondition;

      if (conditions.event === event) {
        // Additional validation based on event data
        if (this.validateBehaviorConditions(conditions, eventData)) {
          if (await this.canExecuteTrigger(trigger.id, userId)) {
            await this.executeTrigger(trigger, userId, {
              event,
              eventData,
              triggerType: "behavior_event",
            });
          }
        }
      }
    }
  }

  /**
   * Process time-based triggers (inactive users, etc.)
   */
  async processTimeBasedTriggers(): Promise<void> {
    const triggers = await this.prisma.emailTrigger.findMany({
      where: {
        type: EmailTriggerType.TIME_BASED,
        isActive: true,
      },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as TriggerCondition;

      if (conditions.inactiveDays) {
        const inactiveUsers = await this.findInactiveUsers(
          conditions.inactiveDays,
          conditions.segment as UserSegment
        );

        for (const userId of inactiveUsers) {
          if (await this.canExecuteTrigger(trigger.id, userId)) {
            await this.executeTrigger(trigger, userId, {
              inactiveDays: conditions.inactiveDays,
              triggerType: "time_based",
            });
          }
        }
      }
    }
  }

  /**
   * Execute a trigger for a specific user
   */
  private async executeTrigger(
    trigger: any,
    userId: string,
    executionData: any
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) return;

      let actionResult: any = {};

      switch (trigger.actionType) {
        case "send_email":
          actionResult = await this.sendEmail(
            trigger,
            userId,
            user.email,
            executionData
          );
          break;

        case "start_sequence":
          actionResult = await this.startSequence(
            trigger,
            userId,
            executionData
          );
          break;

        case "update_user":
          actionResult = await this.updateUser(trigger, userId, executionData);
          break;
      }

      // Log the execution
      await this.prisma.emailTriggerExecution.create({
        data: {
          triggerId: trigger.id,
          userId,
          executionData,
          actionResult,
          status: "success",
        },
      });
    } catch (error) {
      console.error(
        `Error executing trigger ${trigger.id} for user ${userId}:`,
        error
      );

      // Log the failed execution
      await this.prisma.emailTriggerExecution.create({
        data: {
          triggerId: trigger.id,
          userId,
          executionData,
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  /**
   * Send email using template
   */
  private async sendEmail(
    trigger: any,
    userId: string,
    userEmail: string,
    executionData: any
  ): Promise<any> {
    const actionData = trigger.actionData as TriggerAction;

    if (!actionData.templateId) {
      throw new Error("Template ID is required for send_email action");
    }

    // Get the email template
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: actionData.templateId },
    });

    if (!template) {
      throw new Error(`Email template ${actionData.templateId} not found`);
    }

    // Create email log entry (you would integrate with your email service here)
    const emailLog = await this.prisma.emailLog.create({
      data: {
        templateId: template.id,
        to: userEmail,
        subject: actionData.subject || template.subject,
        status: "pending",
      },
    });

    // TODO: Integrate with your email service (Brevo, SendGrid, etc.)
    // For now, we'll just mark it as sent
    await this.prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    return {
      emailLogId: emailLog.id,
      templateId: template.id,
      subject: actionData.subject || template.subject,
    };
  }

  /**
   * Start an email sequence for the user
   */
  private async startSequence(
    trigger: any,
    userId: string,
    executionData: any
  ): Promise<any> {
    const actionData = trigger.actionData as TriggerAction;

    if (!actionData.sequenceId) {
      throw new Error("Sequence ID is required for start_sequence action");
    }

    // Check if user is already in this sequence
    const existing = await this.prisma.emailSequenceUser.findFirst({
      where: {
        sequenceId: actionData.sequenceId,
        userId,
      },
    });

    if (existing) {
      return {
        message: "User already in sequence",
        sequenceUserId: existing.id,
      };
    }

    // Add user to sequence
    const sequenceUser = await this.prisma.emailSequenceUser.create({
      data: {
        sequenceId: actionData.sequenceId,
        userId,
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });

    return {
      sequenceId: actionData.sequenceId,
      sequenceUserId: sequenceUser.id,
    };
  }

  /**
   * Update user data (add tags, etc.)
   */
  private async updateUser(
    trigger: any,
    userId: string,
    executionData: any
  ): Promise<any> {
    const actionData = trigger.actionData as TriggerAction;
    const updateData: any = {};

    if (actionData.tags) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tags: true },
      });

      const currentTags = user?.tags || [];
      updateData.tags = [...new Set([...currentTags, ...actionData.tags])];
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return { updatedFields: Object.keys(updateData) };
  }

  /**
   * Check if a trigger can be executed for a user (cooldown, max executions, etc.)
   */
  private async canExecuteTrigger(
    triggerId: string,
    userId: string
  ): Promise<boolean> {
    const trigger = await this.prisma.emailTrigger.findUnique({
      where: { id: triggerId },
    });

    if (!trigger) return false;

    // Check cooldown
    if (trigger.cooldownHours > 0) {
      const lastExecution = await this.prisma.emailTriggerExecution.findFirst({
        where: {
          triggerId,
          userId,
          status: "success",
        },
        orderBy: { executedAt: "desc" },
      });

      if (lastExecution) {
        const hoursSinceLastExecution =
          (Date.now() - lastExecution.executedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastExecution < trigger.cooldownHours) {
          return false;
        }
      }
    }

    // Check max executions
    if (trigger.maxExecutions) {
      const executionCount = await this.prisma.emailTriggerExecution.count({
        where: {
          triggerId,
          userId,
          status: "success",
        },
      });

      if (executionCount >= trigger.maxExecutions) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate behavior event conditions
   */
  private validateBehaviorConditions(
    conditions: TriggerCondition,
    eventData: any
  ): boolean {
    // Add specific validation logic based on event type
    if (conditions.event === "cart_abandoned") {
      return eventData.minItems
        ? (eventData.items?.length || 0) >= eventData.minItems
        : true;
    }

    return true;
  }

  /**
   * Find users who have been inactive for specified days
   */
  private async findInactiveUsers(
    inactiveDays: number,
    segment?: UserSegment
  ): Promise<string[]> {
    const cutoffDate = new Date(
      Date.now() - inactiveDays * 24 * 60 * 60 * 1000
    );

    const users = await this.prisma.user.findMany({
      where: {
        lastActivityAt: {
          lt: cutoffDate,
        },
        ...(segment && { segment }),
      },
      select: { id: true },
    });

    return users.map(u => u.id);
  }

  /**
   * Get trigger analytics
   */
  async getTriggerAnalytics(triggerId?: string) {
    const whereClause = triggerId ? { triggerId } : {};

    const executions = await this.prisma.emailTriggerExecution.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { id: true },
    });

    const recentExecutions = await this.prisma.emailTriggerExecution.findMany({
      where: whereClause,
      include: {
        trigger: {
          select: { name: true, type: true },
        },
      },
      orderBy: { executedAt: "desc" },
      take: 50,
    });

    return {
      executions,
      recentExecutions,
    };
  }
}
