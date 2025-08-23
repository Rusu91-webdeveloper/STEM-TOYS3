/**
 * Load Balancer for server distribution and health monitoring
 */

interface Server {
  id: string;
  url: string;
  weight: number;
  health: boolean;
  responseTime: number;
  load: number;
  lastCheck: Date;
}

interface LoadBalancerConfig {
  algorithm: "round-robin" | "least-connections" | "weighted" | "ip-hash";
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxRetries: number;
  stickySessions: boolean;
  autoScaling: boolean;
}

interface AutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
}

class LoadBalancer {
  private servers: Map<string, Server> = new Map();
  private config: LoadBalancerConfig;
  private autoScaling: AutoScalingConfig;
  private currentIndex = 0;
  private connectionCounts: Map<string, number> = new Map();

  constructor() {
    this.config = {
      algorithm: "round-robin",
      healthCheckInterval: 30000, // 30 seconds
      healthCheckTimeout: 5000,   // 5 seconds
      maxRetries: 3,
      stickySessions: false,
      autoScaling: false,
    };

    this.autoScaling = {
      enabled: false,
      minInstances: 1,
      maxInstances: 10,
      scaleUpThreshold: 80,
      scaleDownThreshold: 20,
      cooldownPeriod: 300000, // 5 minutes
    };
  }

  getConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  getStats(): { totalServers: number; healthyServers: number; averageResponseTime: number } {
    const servers = Array.from(this.servers.values());
    const healthyServers = servers.filter(s => s.health).length;
    const avgResponseTime = servers.reduce((sum, s) => sum + s.responseTime, 0) / servers.length || 0;

    return {
      totalServers: servers.length,
      healthyServers,
      averageResponseTime: avgResponseTime,
    };
  }

  getServers(): Server[] {
    return Array.from(this.servers.values());
  }

  updateConfig(newConfig: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  setAlgorithm(algorithm: LoadBalancerConfig["algorithm"], options?: any): void {
    this.config.algorithm = algorithm;
  }

  enableStickySessions(config?: any): void {
    this.config.stickySessions = true;
  }

  disableStickySessions(): void {
    this.config.stickySessions = false;
  }

  async checkHealth(): Promise<{ status: string; details: string }> {
    try {
      const healthyCount = Array.from(this.servers.values()).filter(s => s.health).length;
      const totalCount = this.servers.size;
      
      return {
        status: healthyCount > 0 ? "healthy" : "unhealthy",
        details: `${healthyCount}/${totalCount} servers healthy`,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        details: `Load balancer error: ${error}`,
      };
    }
  }

  getAutoScalingStatus(): AutoScalingConfig {
    return { ...this.autoScaling };
  }

  enableAutoScaling(): void {
    this.autoScaling.enabled = true;
  }

  disableAutoScaling(): void {
    this.autoScaling.enabled = false;
  }

  setServerWeight(serverId: string, weight: number): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.weight = weight;
    }
  }

  enableServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.health = true;
    }
  }

  disableServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.health = false;
    }
  }

  async scaleUp(count: number = 1): Promise<number> {
    // Simulate scaling up
    return count;
  }

  async scaleDown(count: number = 1): Promise<number> {
    // Simulate scaling down
    return count;
  }

  async removeAllServers(): Promise<number> {
    const count = this.servers.size;
    this.servers.clear();
    this.connectionCounts.clear();
    return count;
  }
}

// Export singleton instance
export const loadBalancer = new LoadBalancer();

// Export utility functions
export async function addServer(serverData: Partial<Server>): Promise<boolean> {
  const server: Server = {
    id: serverData.id || `server-${Date.now()}`,
    url: serverData.url || "",
    weight: serverData.weight || 1,
    health: serverData.health ?? true,
    responseTime: serverData.responseTime || 0,
    load: serverData.load || 0,
    lastCheck: serverData.lastCheck || new Date(),
  };

  loadBalancer.getServers().push(server);
  return true;
}

export async function removeServer(serverId: string): Promise<boolean> {
  // Simulate server removal
  return true;
}

export async function updateHealthCheck(serverId: string, healthCheck: any): Promise<void> {
  // Simulate health check update
  console.log(`Updated health check for server ${serverId}`);
}

export async function getServerStats(serverId: string): Promise<Server | null> {
  // Simulate getting server stats
  return {
    id: serverId,
    url: `https://server-${serverId}.example.com`,
    weight: 1,
    health: true,
    responseTime: 50,
    load: 30,
    lastCheck: new Date(),
  };
}

export async function setAutoScaling(config: AutoScalingConfig): Promise<void> {
  // Simulate auto-scaling configuration
  console.log("Auto-scaling configured:", config);
}
