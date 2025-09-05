/**
 * Marketing Automation Service
 * Integrates marketing settings with actual automation functionality
 */

import {
  getMarketingSettings,
  isMarketingAutomationEnabled,
  isWorkflowEnabled,
  getWorkflowConfig,
  isTriggerEnabled,
} from "@/lib/utils/marketing-settings";
import { MarketingEmailService } from "@/lib/email/marketing-email-service";
import { SocialMediaService } from "@/lib/social-media/social-media-service";
import { prisma } from "@/lib/prisma";

export interface AutomationTrigger {
  type:
    | "newCustomer"
    | "cartAbandonment"
    | "orderCompletion"
    | "productView"
    | "categoryView"
    | "searchQuery";
  customerId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  type:
    | "welcomeSeries"
    | "abandonedCart"
    | "postPurchase"
    | "reEngagement"
    | "birthdayCampaign"
    | "seasonalPromotions";
  status: "active" | "paused" | "completed";
  customerId: string;
  currentStep: number;
  totalSteps: number;
  nextExecutionDate: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationResult {
  success: boolean;
  workflowId?: string;
  actionTaken?: string;
  error?: string;
}

export class MarketingAutomationService {
  /**
   * Process automation trigger
   */
  static async processTrigger(
    trigger: AutomationTrigger
  ): Promise<AutomationResult[]> {
    try {
      // Check if marketing automation is enabled
      const isEnabled = await isMarketingAutomationEnabled();
      if (!isEnabled) {
        return [
          {
            success: false,
            error: "Marketing automation is not enabled",
          },
        ];
      }

      // Check if trigger type is enabled
      const isTriggerTypeEnabled = await isTriggerEnabled(trigger.type);
      if (!isTriggerTypeEnabled) {
        return [
          {
            success: false,
            error: `Trigger type '${trigger.type}' is not enabled`,
          },
        ];
      }

      const results: AutomationResult[] = [];

      // Process different trigger types
      switch (trigger.type) {
        case "newCustomer":
          results.push(await this.processNewCustomerTrigger(trigger));
          break;
        case "cartAbandonment":
          results.push(await this.processCartAbandonmentTrigger(trigger));
          break;
        case "orderCompletion":
          results.push(await this.processOrderCompletionTrigger(trigger));
          break;
        case "productView":
          results.push(await this.processProductViewTrigger(trigger));
          break;
        case "categoryView":
          results.push(await this.processCategoryViewTrigger(trigger));
          break;
        case "searchQuery":
          results.push(await this.processSearchQueryTrigger(trigger));
          break;
      }

      return results;
    } catch (error) {
      console.error("Error processing automation trigger:", error);
      return [
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      ];
    }
  }

  /**
   * Process new customer trigger
   */
  private static async processNewCustomerTrigger(
    trigger: AutomationTrigger
  ): Promise<AutomationResult> {
    try {
      const isWorkflowEnabled = await isWorkflowEnabled("welcomeSeries");
      if (!isWorkflowEnabled) {
        return {
          success: false,
          error: "Welcome series workflow is not enabled",
        };
      }

      const config = await getWorkflowConfig("welcomeSeries");
      if (!config) {
        return {
          success: false,
          error: "Welcome series configuration not found",
        };
      }

      // Create welcome series workflow
      const workflow = await this.createWorkflow({
        name: "Welcome Series",
        type: "welcomeSeries",
        customerId: trigger.customerId,
        totalSteps: config.emails,
        interval: config.interval,
        metadata: {
          customerEmail: trigger.data.email,
          customerName: trigger.data.name,
        },
      });

      // Send first welcome email immediately
      const emailResult = await MarketingEmailService.sendWelcomeEmail(
        trigger.data.email,
        trigger.data.name
      );

      return {
        success: true,
        workflowId: workflow.id,
        actionTaken: "Welcome series workflow created and first email sent",
      };
    } catch (error) {
      console.error("Error processing new customer trigger:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process new customer trigger",
      };
    }
  }

  /**
   * Process cart abandonment trigger
   */
  private static async processCartAbandonmentTrigger(
    trigger: AutomationTrigger
  ): Promise<AutomationResult> {
    try {
      const isWorkflowEnabled = await isWorkflowEnabled("abandonedCart");
      if (!isWorkflowEnabled) {
        return {
          success: false,
          error: "Abandoned cart workflow is not enabled",
        };
      }

      const config = await getWorkflowConfig("abandonedCart");
      if (!config) {
        return {
          success: false,
          error: "Abandoned cart configuration not found",
        };
      }

      // Create abandoned cart workflow
      const workflow = await this.createWorkflow({
        name: "Abandoned Cart Recovery",
        type: "abandonedCart",
        customerId: trigger.customerId,
        totalSteps: config.emails,
        interval: config.interval,
        metadata: {
          customerEmail: trigger.data.email,
          cartItems: trigger.data.cartItems,
          cartTotal: trigger.data.cartTotal,
        },
      });

      // Schedule first abandoned cart email
      const firstEmailDate = new Date(
        Date.now() + config.interval * 60 * 60 * 1000
      ); // Convert hours to milliseconds
      await this.scheduleWorkflowStep(workflow.id, 1, firstEmailDate);

      return {
        success: true,
        workflowId: workflow.id,
        actionTaken: "Abandoned cart recovery workflow created",
      };
    } catch (error) {
      console.error("Error processing cart abandonment trigger:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process cart abandonment trigger",
      };
    }
  }

  /**
   * Process order completion trigger
   */
  private static async processOrderCompletionTrigger(
    trigger: AutomationTrigger
  ): Promise<AutomationResult> {
    try {
      const isWorkflowEnabled = await isWorkflowEnabled("postPurchase");
      if (!isWorkflowEnabled) {
        return {
          success: false,
          error: "Post-purchase workflow is not enabled",
        };
      }

      const config = await getWorkflowConfig("postPurchase");
      if (!config) {
        return {
          success: false,
          error: "Post-purchase configuration not found",
        };
      }

      // Create post-purchase workflow
      const workflow = await this.createWorkflow({
        name: "Post-Purchase Follow-up",
        type: "postPurchase",
        customerId: trigger.customerId,
        totalSteps: config.emails,
        interval: config.interval,
        metadata: {
          customerEmail: trigger.data.email,
          orderId: trigger.data.orderId,
          orderTotal: trigger.data.orderTotal,
          orderItems: trigger.data.orderItems,
        },
      });

      // Schedule first post-purchase email
      const firstEmailDate = new Date(
        Date.now() + config.interval * 24 * 60 * 60 * 1000
      ); // Convert days to milliseconds
      await this.scheduleWorkflowStep(workflow.id, 1, firstEmailDate);

      return {
        success: true,
        workflowId: workflow.id,
        actionTaken: "Post-purchase follow-up workflow created",
      };
    } catch (error) {
      console.error("Error processing order completion trigger:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process order completion trigger",
      };
    }
  }

  /**
   * Process product view trigger
   */
  private static async processProductViewTrigger(
    trigger: AutomationTrigger
  ): Promise<AutomationResult> {
    try {
      // For product view, we might want to send personalized recommendations
      // This is a simplified implementation
      return {
        success: true,
        actionTaken: "Product view tracked for personalization",
      };
    } catch (error) {
      console.error("Error processing product view trigger:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process product view trigger",
      };
    }
  }

  /**
   * Process category view trigger
   */
  private static async processCategoryViewTrigger(
    trigger: AutomationTrigger
  ): Promise<AutomationResult> {
    try {
      // For category view, we might want to send category-specific recommendations
      // This is a simplified implementation
      return {
        success: true,
        actionTaken: "Category view tracked for personalization",
      };
    } catch (error) {
      console.error("Error processing category view trigger:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process category view trigger",
      };
    }
  }

  /**
   * Process search query trigger
   */
  private static async processSearchQueryTrigger(
    trigger: AutomationTrigger
  ): Promise<AutomationResult> {
    try {
      // For search query, we might want to send search result recommendations
      // This is a simplified implementation
      return {
        success: true,
        actionTaken: "Search query tracked for personalization",
      };
    } catch (error) {
      console.error("Error processing search query trigger:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process search query trigger",
      };
    }
  }

  /**
   * Create automation workflow
   */
  private static async createWorkflow(params: {
    name: string;
    type: string;
    customerId: string;
    totalSteps: number;
    interval: number;
    metadata: Record<string, any>;
  }): Promise<AutomationWorkflow> {
    const workflow = await prisma.automationWorkflow.create({
      data: {
        name: params.name,
        type: params.type,
        status: "active",
        customerId: params.customerId,
        currentStep: 0,
        totalSteps: params.totalSteps,
        nextExecutionDate: new Date(),
        metadata: params.metadata,
      },
    });

    return workflow as AutomationWorkflow;
  }

  /**
   * Schedule workflow step execution
   */
  private static async scheduleWorkflowStep(
    workflowId: string,
    step: number,
    executionDate: Date
  ): Promise<void> {
    await prisma.automationWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStep: step,
        nextExecutionDate: executionDate,
      },
    });
  }

  /**
   * Execute scheduled workflow steps
   */
  static async executeScheduledWorkflows(): Promise<void> {
    try {
      const now = new Date();
      const workflows = await prisma.automationWorkflow.findMany({
        where: {
          status: "active",
          nextExecutionDate: { lte: now },
          currentStep: { lt: prisma.automationWorkflow.fields.totalSteps },
        },
      });

      for (const workflow of workflows) {
        await this.executeWorkflowStep(workflow as AutomationWorkflow);
      }
    } catch (error) {
      console.error("Error executing scheduled workflows:", error);
    }
  }

  /**
   * Execute individual workflow step
   */
  private static async executeWorkflowStep(
    workflow: AutomationWorkflow
  ): Promise<void> {
    try {
      const nextStep = workflow.currentStep + 1;
      const config = await getWorkflowConfig(workflow.type as any);

      if (!config) {
        console.error(
          `Configuration not found for workflow type: ${workflow.type}`
        );
        return;
      }

      // Execute step based on workflow type
      switch (workflow.type) {
        case "welcomeSeries":
          await this.executeWelcomeSeriesStep(workflow, nextStep);
          break;
        case "abandonedCart":
          await this.executeAbandonedCartStep(workflow, nextStep);
          break;
        case "postPurchase":
          await this.executePostPurchaseStep(workflow, nextStep);
          break;
        case "reEngagement":
          await this.executeReEngagementStep(workflow, nextStep);
          break;
        case "birthdayCampaign":
          await this.executeBirthdayCampaignStep(workflow, nextStep);
          break;
        case "seasonalPromotions":
          await this.executeSeasonalPromotionsStep(workflow, nextStep);
          break;
      }

      // Schedule next step or complete workflow
      if (nextStep < workflow.totalSteps) {
        const nextExecutionDate = new Date(
          Date.now() + config.interval * 24 * 60 * 60 * 1000
        );
        await this.scheduleWorkflowStep(
          workflow.id,
          nextStep,
          nextExecutionDate
        );
      } else {
        // Complete workflow
        await prisma.automationWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: "completed",
            currentStep: nextStep,
          },
        });
      }
    } catch (error) {
      console.error(`Error executing workflow step for ${workflow.id}:`, error);
    }
  }

  /**
   * Execute welcome series step
   */
  private static async executeWelcomeSeriesStep(
    workflow: AutomationWorkflow,
    step: number
  ): Promise<void> {
    const emailResult = await MarketingEmailService.sendMarketingEmail({
      to: workflow.metadata.customerEmail,
      templateType: "welcome",
      variables: {
        customerName: workflow.metadata.customerName,
        step: step,
      },
    });

    console.log(
      `Welcome series step ${step} executed for workflow ${workflow.id}:`,
      emailResult
    );
  }

  /**
   * Execute abandoned cart step
   */
  private static async executeAbandonedCartStep(
    workflow: AutomationWorkflow,
    step: number
  ): Promise<void> {
    const emailResult = await MarketingEmailService.sendAbandonedCartEmail(
      workflow.metadata.customerEmail,
      workflow.metadata.cartItems,
      workflow.metadata.cartTotal
    );

    console.log(
      `Abandoned cart step ${step} executed for workflow ${workflow.id}:`,
      emailResult
    );
  }

  /**
   * Execute post-purchase step
   */
  private static async executePostPurchaseStep(
    workflow: AutomationWorkflow,
    step: number
  ): Promise<void> {
    const emailResult = await MarketingEmailService.sendReviewRequestEmail(
      workflow.metadata.customerEmail,
      {
        orderNumber: workflow.metadata.orderId,
        total: workflow.metadata.orderTotal,
      },
      workflow.metadata.orderItems[0] // Simplified - would need proper order structure
    );

    console.log(
      `Post-purchase step ${step} executed for workflow ${workflow.id}:`,
      emailResult
    );
  }

  /**
   * Execute re-engagement step
   */
  private static async executeReEngagementStep(
    workflow: AutomationWorkflow,
    step: number
  ): Promise<void> {
    const emailResult = await MarketingEmailService.sendReEngagementEmail(
      workflow.metadata.customerEmail,
      workflow.metadata.customerName,
      workflow.metadata.lastOrderDate
    );

    console.log(
      `Re-engagement step ${step} executed for workflow ${workflow.id}:`,
      emailResult
    );
  }

  /**
   * Execute birthday campaign step
   */
  private static async executeBirthdayCampaignStep(
    workflow: AutomationWorkflow,
    step: number
  ): Promise<void> {
    const emailResult = await MarketingEmailService.sendBirthdayEmail(
      workflow.metadata.customerEmail,
      workflow.metadata.customerName,
      workflow.metadata.discountCode
    );

    console.log(
      `Birthday campaign step ${step} executed for workflow ${workflow.id}:`,
      emailResult
    );
  }

  /**
   * Execute seasonal promotions step
   */
  private static async executeSeasonalPromotionsStep(
    workflow: AutomationWorkflow,
    step: number
  ): Promise<void> {
    const emailResult = await MarketingEmailService.sendMarketingEmail({
      to: workflow.metadata.customerEmail,
      templateType: "reEngagement",
      variables: {
        customerName: workflow.metadata.customerName,
        promotionType: "seasonal",
      },
    });

    console.log(
      `Seasonal promotions step ${step} executed for workflow ${workflow.id}:`,
      emailResult
    );
  }

  /**
   * Get customer automation workflows
   */
  static async getCustomerWorkflows(
    customerId: string
  ): Promise<AutomationWorkflow[]> {
    try {
      const workflows = await prisma.automationWorkflow.findMany({
        where: { customerId: customerId },
        orderBy: { createdAt: "desc" },
      });

      return workflows as AutomationWorkflow[];
    } catch (error) {
      console.error("Error getting customer workflows:", error);
      return [];
    }
  }

  /**
   * Pause customer workflow
   */
  static async pauseWorkflow(workflowId: string): Promise<boolean> {
    try {
      await prisma.automationWorkflow.update({
        where: { id: workflowId },
        data: { status: "paused" },
      });

      return true;
    } catch (error) {
      console.error("Error pausing workflow:", error);
      return false;
    }
  }

  /**
   * Resume customer workflow
   */
  static async resumeWorkflow(workflowId: string): Promise<boolean> {
    try {
      await prisma.automationWorkflow.update({
        where: { id: workflowId },
        data: { status: "active" },
      });

      return true;
    } catch (error) {
      console.error("Error resuming workflow:", error);
      return false;
    }
  }
}
