import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

export interface ReplicaConfig {
  id: string;
  url: string;
  priority: number; // Higher priority = preferred for reads
  region: string;
  isActive: boolean;
  lastHealthCheck: Date;
  replicationLag: number; // Seconds behind primary
}

export interface ReplicationHealth {
  primary: {
    url: string;
    isHealthy: boolean;
    lastChecked: Date;
  };
  replicas: ReplicaConfig[];
  overallHealth: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  failoverInProgress: boolean;
}

/**
 * Database Replication Manager for Phase 5 High Availability
 * Manages read replicas and automatic failover for user operations
 */
export class ReplicationManager {
  private primaryClient: PrismaClient;
  private replicaClients: Map<string, PrismaClient> = new Map();
  private replicas: ReplicaConfig[] = [];
  private currentPrimaryUrl: string;
  private failoverInProgress = false;

  constructor(primaryUrl: string, replicaConfigs: ReplicaConfig[] = []) {
    this.currentPrimaryUrl = primaryUrl;
    this.primaryClient = new PrismaClient({
      datasourceUrl: primaryUrl,
    });

    // Initialize replica clients
    this.initializeReplicas(replicaConfigs);
  }

  /**
   * Initialize replica connections
   */
  private initializeReplicas(replicaConfigs: ReplicaConfig[]): void {
    this.replicas = replicaConfigs;

    for (const replica of replicaConfigs) {
      if (replica.isActive) {
        try {
          const client = new PrismaClient({
            datasourceUrl: replica.url,
          });
          this.replicaClients.set(replica.id, client);
          logger.info("Replica client initialized", {
            replicaId: replica.id,
            url: replica.url,
          });
        } catch (error) {
          logger.error("Failed to initialize replica client", {
            replicaId: replica.id,
            error,
          });
        }
      }
    }
  }

  /**
   * Get appropriate client for read operations (load balanced)
   */
  async getReadClient(): Promise<PrismaClient> {
    // If failover is in progress, use primary
    if (this.failoverInProgress) {
      return this.primaryClient;
    }

    // Get healthy replicas sorted by priority
    const healthyReplicas = await this.getHealthyReplicas();

    if (healthyReplicas.length === 0) {
      // No healthy replicas, use primary
      return this.primaryClient;
    }

    // Simple load balancing: round-robin based on timestamp
    const replicaIndex =
      Math.floor(Date.now() / 10000) % healthyReplicas.length; // Change every 10 seconds
    const selectedReplica = healthyReplicas[replicaIndex];

    const client = this.replicaClients.get(selectedReplica.id);
    if (client) {
      return client;
    }

    // Fallback to primary if replica client not found
    return this.primaryClient;
  }

  /**
   * Get primary client for write operations
   */
  getWriteClient(): PrismaClient {
    return this.primaryClient;
  }

  /**
   * Get healthy replicas based on health checks
   */
  private async getHealthyReplicas(): Promise<ReplicaConfig[]> {
    const healthyReplicas: ReplicaConfig[] = [];

    for (const replica of this.replicas) {
      if (!replica.isActive) continue;

      try {
        // Quick health check - try to execute a simple query
        const client = this.replicaClients.get(replica.id);
        if (client) {
          await client.$queryRaw`SELECT 1`;

          // Check replication lag (in a real implementation, you'd check actual lag)
          if (replica.replicationLag < 30) {
            // Less than 30 seconds lag
            healthyReplicas.push(replica);
          }
        }
      } catch (error) {
        logger.warn("Replica health check failed", {
          replicaId: replica.id,
          error: error.message,
        });
      }
    }

    // Sort by priority (highest first)
    return healthyReplicas.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check overall replication health
   */
  async getReplicationHealth(): Promise<ReplicationHealth> {
    const primaryHealth = await this.checkPrimaryHealth();
    const replicaHealths = await Promise.all(
      this.replicas.map(replica => this.checkReplicaHealth(replica))
    );

    const healthyReplicas = replicaHealths.filter(
      r => r.isActive && r.replicationLag < 60
    );
    const overallHealth = this.determineOverallHealth(
      primaryHealth,
      healthyReplicas
    );

    return {
      primary: primaryHealth,
      replicas: replicaHealths,
      overallHealth,
      failoverInProgress: this.failoverInProgress,
    };
  }

  /**
   * Check primary database health
   */
  private async checkPrimaryHealth(): Promise<{
    url: string;
    isHealthy: boolean;
    lastChecked: Date;
  }> {
    const lastChecked = new Date();

    try {
      await this.primaryClient.$queryRaw`SELECT 1`;
      return {
        url: this.currentPrimaryUrl,
        isHealthy: true,
        lastChecked,
      };
    } catch (error) {
      logger.error("Primary health check failed", { error });
      return {
        url: this.currentPrimaryUrl,
        isHealthy: false,
        lastChecked,
      };
    }
  }

  /**
   * Check replica health
   */
  private async checkReplicaHealth(
    replica: ReplicaConfig
  ): Promise<ReplicaConfig> {
    const client = this.replicaClients.get(replica.id);

    if (!client) {
      return { ...replica, isActive: false, lastHealthCheck: new Date() };
    }

    try {
      // Check if replica is responding
      await client.$queryRaw`SELECT 1`;

      // In a real implementation, you'd check actual replication lag
      // For now, simulate lag check
      const lag = Math.random() * 10; // 0-10 seconds simulated lag

      return {
        ...replica,
        isActive: true,
        lastHealthCheck: new Date(),
        replicationLag: lag,
      };
    } catch (error) {
      return {
        ...replica,
        isActive: false,
        lastHealthCheck: new Date(),
        replicationLag: 999, // High lag indicates unhealthy
      };
    }
  }

  /**
   * Determine overall system health
   */
  private determineOverallHealth(
    primaryHealth: any,
    healthyReplicas: ReplicaConfig[]
  ): "HEALTHY" | "DEGRADED" | "UNHEALTHY" {
    if (!primaryHealth.isHealthy) {
      return "UNHEALTHY"; // Primary down is critical
    }

    if (healthyReplicas.length === 0) {
      return "DEGRADED"; // No healthy replicas
    }

    if (healthyReplicas.length < this.replicas.length / 2) {
      return "DEGRADED"; // Less than half replicas healthy
    }

    return "HEALTHY";
  }

  /**
   * Initiate failover to a new primary
   */
  async initiateFailover(newPrimaryUrl: string): Promise<boolean> {
    if (this.failoverInProgress) {
      logger.warn("Failover already in progress");
      return false;
    }

    try {
      this.failoverInProgress = true;
      logger.info("Starting database failover", {
        oldPrimary: this.currentPrimaryUrl,
        newPrimary: newPrimaryUrl,
      });

      // Promote a replica to primary (in a real implementation)
      // This would involve:
      // 1. Stop replication on the selected replica
      // 2. Promote it to primary
      // 3. Redirect other replicas to the new primary
      // 4. Update application configuration

      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate failover time

      // Update primary client
      this.primaryClient = new PrismaClient({
        datasourceUrl: newPrimaryUrl,
      });

      this.currentPrimaryUrl = newPrimaryUrl;

      logger.info("Database failover completed", { newPrimary: newPrimaryUrl });
      return true;
    } catch (error) {
      logger.error("Database failover failed", {
        error,
        newPrimary: newPrimaryUrl,
      });
      return false;
    } finally {
      this.failoverInProgress = false;
    }
  }

  /**
   * Get replication lag statistics
   */
  async getReplicationStats(): Promise<{
    averageLag: number;
    maxLag: number;
    minLag: number;
    healthyReplicaCount: number;
    totalReplicaCount: number;
  }> {
    const health = await this.getReplicationHealth();

    const lags = health.replicas
      .filter(r => r.isActive)
      .map(r => r.replicationLag);

    if (lags.length === 0) {
      return {
        averageLag: 0,
        maxLag: 0,
        minLag: 0,
        healthyReplicaCount: 0,
        totalReplicaCount: health.replicas.length,
      };
    }

    return {
      averageLag: lags.reduce((a, b) => a + b, 0) / lags.length,
      maxLag: Math.max(...lags),
      minLag: Math.min(...lags),
      healthyReplicaCount: lags.length,
      totalReplicaCount: health.replicas.length,
    };
  }

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    await this.primaryClient.$disconnect();

    for (const client of this.replicaClients.values()) {
      await client.$disconnect();
    }

    this.replicaClients.clear();
    logger.info("Replication manager connections closed");
  }
}

// Singleton instance
let replicationManagerInstance: ReplicationManager | null = null;

/**
 * Get the global replication manager instance
 */
export function getReplicationManager(): ReplicationManager {
  if (!replicationManagerInstance) {
    // Initialize with environment configuration
    const primaryUrl = process.env.DATABASE_URL!;
    const replicaUrls = process.env.DATABASE_REPLICAS?.split(",") || [];

    const replicas: ReplicaConfig[] = replicaUrls.map((url, index) => ({
      id: `replica-${index + 1}`,
      url: url.trim(),
      priority: replicaUrls.length - index, // Higher index = lower priority
      region: process.env[`REPLICA_${index + 1}_REGION`] || "us-east-1",
      isActive: true,
      lastHealthCheck: new Date(),
      replicationLag: 0,
    }));

    replicationManagerInstance = new ReplicationManager(primaryUrl, replicas);
  }

  return replicationManagerInstance;
}
