import { getReplicationManager } from "@/lib/database/replication-manager";
import { getUserPerformanceMonitor } from "@/lib/monitoring/user-performance-monitor";
import { logger } from "@/lib/logger";

export interface ScalingConfig {
  minReplicas: number;
  maxReplicas: number;
  scaleUpThreshold: number; // CPU/memory usage threshold for scaling up
  scaleDownThreshold: number; // CPU/memory usage threshold for scaling down
  cooldownPeriod: number; // Minutes to wait between scaling actions
  evaluationPeriod: number; // Minutes to evaluate metrics over
}

export interface ScalingDecision {
  action: "SCALE_UP" | "SCALE_DOWN" | "NO_ACTION";
  reason: string;
  currentReplicas: number;
  targetReplicas: number;
  metrics: Record<string, any>;
  timestamp: Date;
}

/**
 * Auto Scaler for Phase 5 High Availability
 * Automatically scales database replicas and application instances based on load
 */
export class AutoScaler {
  private lastScalingAction = 0;
  private currentReplicas = 1;

  constructor(private config: ScalingConfig) {}

  /**
   * Evaluate current system load and make scaling decisions
   */
  async evaluateScaling(): Promise<ScalingDecision> {
    const now = Date.now();
    const timeSinceLastAction = (now - this.lastScalingAction) / (1000 * 60); // minutes

    // Check cooldown period
    if (timeSinceLastAction < this.config.cooldownPeriod) {
      return {
        action: "NO_ACTION",
        reason: `Cooldown period active (${Math.round(this.config.cooldownPeriod - timeSinceLastAction)} minutes remaining)`,
        currentReplicas: this.currentReplicas,
        targetReplicas: this.currentReplicas,
        metrics: {},
        timestamp: new Date(),
      };
    }

    // Gather metrics
    const metrics = await this.gatherScalingMetrics();

    // Evaluate scaling decision
    const decision = this.makeScalingDecision(metrics);

    // Execute scaling action if needed
    if (decision.action !== "NO_ACTION") {
      await this.executeScalingAction(decision);
      this.lastScalingAction = now;
    }

    return decision;
  }

  /**
   * Gather metrics for scaling evaluation
   */
  private async gatherScalingMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    try {
      // Database metrics
      const replicationManager = getReplicationManager();
      const replicationStats = await replicationManager.getReplicationStats();
      metrics.database = {
        healthyReplicas: replicationStats.healthyReplicaCount,
        totalReplicas: replicationStats.totalReplicaCount,
        averageLag: replicationStats.averageLag,
      };

      // Performance metrics
      const performanceMonitor = getUserPerformanceMonitor();
      const performanceStats = await performanceMonitor.getPerformanceStats();

      // Calculate average response times and throughput
      const userOperationStats = performanceStats.find(s =>
        s.operation.includes("user")
      );
      metrics.performance = {
        avgResponseTime: userOperationStats?.avgDuration || 0,
        p95ResponseTime: userOperationStats?.p95Duration || 0,
        throughput: await performanceMonitor.getThroughputStats(),
      };

      // System resource metrics
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      metrics.system = {
        memoryUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        cpuUserPercent: (cpuUsage.user / 1000000) * 100, // Convert to percentage
        uptime: process.uptime(),
      };

      // User load metrics
      metrics.userLoad = await this.getUserLoadMetrics();
    } catch (error) {
      logger.error("Failed to gather scaling metrics", { error });
      // Return default metrics on error
      metrics.error = error.message;
    }

    return metrics;
  }

  /**
   * Get user-specific load metrics
   */
  private async getUserLoadMetrics(): Promise<Record<string, any>> {
    // In a real implementation, this would query actual user activity
    // For now, return simulated metrics
    return {
      activeUsers: Math.floor(Math.random() * 10000) + 1000,
      concurrentSessions: Math.floor(Math.random() * 1000) + 100,
      apiRequestsPerMinute: Math.floor(Math.random() * 5000) + 500,
    };
  }

  /**
   * Make scaling decision based on metrics
   */
  private makeScalingDecision(metrics: Record<string, any>): ScalingDecision {
    const { system, database, performance, userLoad } = metrics;

    // Scale up conditions
    const scaleUpConditions = [
      system.memoryUsagePercent > this.config.scaleUpThreshold,
      system.cpuUserPercent > this.config.scaleUpThreshold,
      performance.avgResponseTime > 1000, // > 1 second average response time
      userLoad.concurrentSessions > 500,
      database.averageLag > 10, // > 10 seconds replication lag
    ];

    // Scale down conditions
    const scaleDownConditions = [
      system.memoryUsagePercent < this.config.scaleDownThreshold,
      system.cpuUserPercent < this.config.scaleDownThreshold,
      performance.avgResponseTime < 200, // < 200ms average response time
      userLoad.concurrentSessions < 100,
      this.currentReplicas > this.config.minReplicas,
    ];

    const shouldScaleUp = scaleUpConditions.some(condition => condition);
    const shouldScaleDown = scaleDownConditions.every(condition => condition);

    let action: "SCALE_UP" | "SCALE_DOWN" | "NO_ACTION" = "NO_ACTION";
    let reason = "System operating within normal parameters";
    let targetReplicas = this.currentReplicas;

    if (shouldScaleUp && this.currentReplicas < this.config.maxReplicas) {
      action = "SCALE_UP";
      targetReplicas = Math.min(
        this.currentReplicas + 1,
        this.config.maxReplicas
      );
      reason = this.determineScaleUpReason(metrics);
    } else if (
      shouldScaleDown &&
      this.currentReplicas > this.config.minReplicas
    ) {
      action = "SCALE_DOWN";
      targetReplicas = Math.max(
        this.currentReplicas - 1,
        this.config.minReplicas
      );
      reason = this.determineScaleDownReason(metrics);
    }

    return {
      action,
      reason,
      currentReplicas: this.currentReplicas,
      targetReplicas,
      metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Determine reason for scaling up
   */
  private determineScaleUpReason(metrics: Record<string, any>): string {
    const reasons: string[] = [];

    if (metrics.system.memoryUsagePercent > this.config.scaleUpThreshold) {
      reasons.push(
        `High memory usage (${Math.round(metrics.system.memoryUsagePercent)}%)`
      );
    }

    if (metrics.system.cpuUserPercent > this.config.scaleUpThreshold) {
      reasons.push(
        `High CPU usage (${Math.round(metrics.system.cpuUserPercent)}%)`
      );
    }

    if (metrics.performance.avgResponseTime > 1000) {
      reasons.push(
        `Slow response times (${Math.round(metrics.performance.avgResponseTime)}ms)`
      );
    }

    if (metrics.userLoad.concurrentSessions > 500) {
      reasons.push(
        `High concurrent sessions (${metrics.userLoad.concurrentSessions})`
      );
    }

    return reasons.length > 0
      ? reasons.join(", ")
      : "Multiple scaling thresholds exceeded";
  }

  /**
   * Determine reason for scaling down
   */
  private determineScaleDownReason(metrics: Record<string, any>): string {
    const reasons: string[] = [];

    if (metrics.system.memoryUsagePercent < this.config.scaleDownThreshold) {
      reasons.push(
        `Low memory usage (${Math.round(metrics.system.memoryUsagePercent)}%)`
      );
    }

    if (metrics.system.cpuUserPercent < this.config.scaleDownThreshold) {
      reasons.push(
        `Low CPU usage (${Math.round(metrics.system.cpuUserPercent)}%)`
      );
    }

    if (metrics.performance.avgResponseTime < 200) {
      reasons.push(
        `Fast response times (${Math.round(metrics.performance.avgResponseTime)}ms)`
      );
    }

    if (metrics.userLoad.concurrentSessions < 100) {
      reasons.push(
        `Low concurrent sessions (${metrics.userLoad.concurrentSessions})`
      );
    }

    return reasons.length > 0 ? reasons.join(", ") : "Resources underutilized";
  }

  /**
   * Execute scaling action
   */
  private async executeScalingAction(decision: ScalingDecision): Promise<void> {
    try {
      logger.info("Executing scaling action", {
        action: decision.action,
        currentReplicas: decision.currentReplicas,
        targetReplicas: decision.targetReplicas,
        reason: decision.reason,
      });

      if (decision.action === "SCALE_UP") {
        await this.scaleUpReplicas(
          decision.targetReplicas - decision.currentReplicas
        );
      } else if (decision.action === "SCALE_DOWN") {
        await this.scaleDownReplicas(
          decision.currentReplicas - decision.targetReplicas
        );
      }

      this.currentReplicas = decision.targetReplicas;
    } catch (error) {
      logger.error("Scaling action failed", {
        action: decision.action,
        error: error.message,
        decision,
      });
    }
  }

  /**
   * Scale up database replicas
   */
  private async scaleUpReplicas(count: number): Promise<void> {
    // In a real implementation, this would:
    // 1. Provision new database instances
    // 2. Configure replication
    // 3. Add to replication manager
    // 4. Update load balancer configuration

    logger.info("Scaling up replicas", { count });

    // Simulate scaling time
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    // Update replication manager with new replicas
    const replicationManager = getReplicationManager();
    // This would add new replica configurations

    logger.info("Replica scaling up completed", { count });
  }

  /**
   * Scale down database replicas
   */
  private async scaleDownReplicas(count: number): Promise<void> {
    // In a real implementation, this would:
    // 1. Identify replicas to remove (least loaded)
    // 2. Stop replication
    // 3. Remove from load balancer
    // 4. Terminate instances

    logger.info("Scaling down replicas", { count });

    // Simulate scaling time
    await new Promise(resolve => setTimeout(resolve, 20000)); // 20 seconds

    // Update replication manager
    const replicationManager = getReplicationManager();
    // This would remove replica configurations

    logger.info("Replica scaling down completed", { count });
  }

  /**
   * Get current scaling status
   */
  getScalingStatus(): {
    currentReplicas: number;
    minReplicas: number;
    maxReplicas: number;
    lastScalingAction: Date;
    cooldownRemaining: number;
  } {
    const cooldownRemaining = Math.max(
      0,
      this.config.cooldownPeriod -
        (Date.now() - this.lastScalingAction) / (1000 * 60)
    );

    return {
      currentReplicas: this.currentReplicas,
      minReplicas: this.config.minReplicas,
      maxReplicas: this.config.maxReplicas,
      lastScalingAction: new Date(this.lastScalingAction),
      cooldownRemaining: Math.round(cooldownRemaining),
    };
  }

  /**
   * Force manual scaling (for emergency situations)
   */
  async forceScaling(targetReplicas: number, reason: string): Promise<boolean> {
    try {
      if (
        targetReplicas < this.config.minReplicas ||
        targetReplicas > this.config.maxReplicas
      ) {
        throw new Error(
          `Target replicas ${targetReplicas} outside allowed range [${this.config.minReplicas}, ${this.config.maxReplicas}]`
        );
      }

      const difference = targetReplicas - this.currentReplicas;

      if (difference > 0) {
        await this.scaleUpReplicas(difference);
      } else if (difference < 0) {
        await this.scaleDownReplicas(Math.abs(difference));
      }

      this.currentReplicas = targetReplicas;
      this.lastScalingAction = Date.now();

      logger.info("Manual scaling completed", {
        targetReplicas,
        previousReplicas: this.currentReplicas,
        reason,
      });

      return true;
    } catch (error) {
      logger.error("Manual scaling failed", { targetReplicas, reason, error });
      return false;
    }
  }
}

// Default scaling configuration
export const DefaultScalingConfig: ScalingConfig = {
  minReplicas: 1,
  maxReplicas: 5,
  scaleUpThreshold: 70, // 70% resource usage
  scaleDownThreshold: 30, // 30% resource usage
  cooldownPeriod: 10, // 10 minutes
  evaluationPeriod: 5, // 5 minutes
};

// Singleton instance
let autoScalerInstance: AutoScaler | null = null;

/**
 * Get the global auto scaler instance
 */
export function getAutoScaler(): AutoScaler {
  if (!autoScalerInstance) {
    const config = {
      ...DefaultScalingConfig,
      minReplicas: parseInt(process.env.AUTO_SCALING_MIN_REPLICAS || "1"),
      maxReplicas: parseInt(process.env.AUTO_SCALING_MAX_REPLICAS || "5"),
      scaleUpThreshold: parseInt(process.env.AUTO_SCALING_UP_THRESHOLD || "70"),
      scaleDownThreshold: parseInt(
        process.env.AUTO_SCALING_DOWN_THRESHOLD || "30"
      ),
      cooldownPeriod: parseInt(
        process.env.AUTO_SCALING_COOLDOWN_MINUTES || "10"
      ),
    };

    autoScalerInstance = new AutoScaler(config);
  }

  return autoScalerInstance;
}
