import { logger } from "@/lib/logger";
import "reflect-metadata";

export type Constructor<T = {}> = new (...args: any[]) => T;
export type Factory<T = any> = () => T | Promise<T>;
export type ServiceIdentifier<T = any> = string | symbol | Constructor<T>;

export interface ServiceDefinition<T = any> {
  identifier: ServiceIdentifier<T>;
  factory: Factory<T>;
  singleton: boolean;
  dependencies?: ServiceIdentifier[];
}

export interface ContainerOptions {
  enableLogging?: boolean;
  enableCircularDependencyDetection?: boolean;
}

/**
 * Dependency Injection Container
 * Manages service registration, resolution, and lifecycle
 */
export class DIContainer {
  private services = new Map<ServiceIdentifier, ServiceDefinition>();
  private instances = new Map<ServiceIdentifier, any>();
  private resolutionStack: ServiceIdentifier[] = [];
  private readonly options: ContainerOptions;

  constructor(options: ContainerOptions = {}) {
    this.options = {
      enableLogging: true,
      enableCircularDependencyDetection: true,
      ...options,
    };
  }

  /**
   * Register a service with the container
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    options: { singleton?: boolean; dependencies?: ServiceIdentifier[] } = {}
  ): this {
    const definition: ServiceDefinition<T> = {
      identifier,
      factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies || [],
    };

    this.services.set(identifier, definition);

    if (this.options.enableLogging) {
      logger.debug("Service registered", {
        identifier: this.getIdentifierName(identifier),
        singleton: definition.singleton,
        dependencies: definition.dependencies?.map(dep =>
          this.getIdentifierName(dep)
        ),
      });
    }

    return this;
  }

  /**
   * Register a singleton service
   */
  singleton<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    dependencies?: ServiceIdentifier[]
  ): this {
    return this.register(identifier, factory, {
      singleton: true,
      dependencies,
    });
  }

  /**
   * Register a transient service (new instance each time)
   */
  transient<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    dependencies?: ServiceIdentifier[]
  ): this {
    return this.register(identifier, factory, {
      singleton: false,
      dependencies,
    });
  }

  /**
   * Register an instance directly
   */
  instance<T>(identifier: ServiceIdentifier<T>, instance: T): this {
    this.instances.set(identifier, instance);

    if (this.options.enableLogging) {
      logger.debug("Instance registered", {
        identifier: this.getIdentifierName(identifier),
      });
    }

    return this;
  }

  /**
   * Resolve a service from the container
   */
  async resolve<T>(identifier: ServiceIdentifier<T>): Promise<T> {
    // Check for circular dependencies
    if (this.options.enableCircularDependencyDetection) {
      if (this.resolutionStack.includes(identifier)) {
        const cycle = [...this.resolutionStack, identifier]
          .map(id => this.getIdentifierName(id))
          .join(" -> ");
        throw new Error(`Circular dependency detected: ${cycle}`);
      }
    }

    this.resolutionStack.push(identifier);

    try {
      // Check if we have a cached instance
      if (this.instances.has(identifier)) {
        const instance = this.instances.get(identifier);
        if (this.options.enableLogging) {
          logger.debug("Service resolved from cache", {
            identifier: this.getIdentifierName(identifier),
          });
        }
        return instance;
      }

      // Get service definition
      const definition = this.services.get(identifier);
      if (!definition) {
        throw new Error(
          `Service not registered: ${this.getIdentifierName(identifier)}`
        );
      }

      // Resolve dependencies first
      const dependencies: any[] = [];
      if (definition.dependencies) {
        for (const dep of definition.dependencies) {
          const resolvedDep = await this.resolve(dep);
          dependencies.push(resolvedDep);
        }
      }

      // Create instance
      const instance = await definition.factory();

      // Cache if singleton
      if (definition.singleton) {
        this.instances.set(identifier, instance);
      }

      if (this.options.enableLogging) {
        logger.debug("Service resolved", {
          identifier: this.getIdentifierName(identifier),
          singleton: definition.singleton,
        });
      }

      return instance;
    } finally {
      this.resolutionStack.pop();
    }
  }

  /**
   * Resolve multiple services
   */
  async resolveMany<T>(...identifiers: ServiceIdentifier<T>[]): Promise<T[]> {
    const promises = identifiers.map(id => this.resolve(id));
    return Promise.all(promises);
  }

  /**
   * Check if a service is registered
   */
  isRegistered(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier) || this.instances.has(identifier);
  }

  /**
   * Remove a service from the container
   */
  remove(identifier: ServiceIdentifier): boolean {
    const hasService = this.services.delete(identifier);
    const hasInstance = this.instances.delete(identifier);

    if ((hasService || hasInstance) && this.options.enableLogging) {
      logger.debug("Service removed", {
        identifier: this.getIdentifierName(identifier),
      });
    }

    return hasService || hasInstance;
  }

  /**
   * Clear all services and instances
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();

    if (this.options.enableLogging) {
      logger.debug("Container cleared");
    }
  }

  /**
   * Get container statistics
   */
  getStats() {
    return {
      registeredServices: this.services.size,
      cachedInstances: this.instances.size,
      services: Array.from(this.services.keys()).map(id => ({
        identifier: this.getIdentifierName(id),
        singleton: this.services.get(id)?.singleton,
        dependencies: this.services
          .get(id)
          ?.dependencies?.map(dep => this.getIdentifierName(dep)),
      })),
    };
  }

  private getIdentifierName(identifier: ServiceIdentifier): string {
    if (typeof identifier === "string") return identifier;
    if (typeof identifier === "symbol") return identifier.toString();
    if (typeof identifier === "function") return identifier.name;
    return String(identifier);
  }
}

/**
 * Service identifiers - centralized service registry
 */
export const ServiceIdentifiers = {
  // Repositories
  PRODUCT_REPOSITORY: Symbol("ProductRepository"),
  USER_REPOSITORY: Symbol("UserRepository"),
  ORDER_REPOSITORY: Symbol("OrderRepository"),
  CATEGORY_REPOSITORY: Symbol("CategoryRepository"),
  CART_REPOSITORY: Symbol("CartRepository"),
  REVIEW_REPOSITORY: Symbol("ReviewRepository"),

  // Services
  PRODUCT_SERVICE: Symbol("ProductService"),
  USER_SERVICE: Symbol("UserService"),
  ORDER_SERVICE: Symbol("OrderService"),
  EMAIL_SERVICE: Symbol("EmailService"),
  PAYMENT_SERVICE: Symbol("PaymentService"),
  ANALYTICS_SERVICE: Symbol("AnalyticsService"),

  // External Services
  STRIPE_SERVICE: Symbol("StripeService"),
  EMAIL_PROVIDER: Symbol("EmailProvider"),
  FILE_STORAGE: Symbol("FileStorage"),
  CACHE_SERVICE: Symbol("CacheService"),

  // Event System
  EVENT_BUS: Symbol("EventBus"),

  // Configuration
  APP_CONFIG: Symbol("AppConfig"),
  DATABASE: Symbol("Database"),
} as const;

/**
 * Decorators for dependency injection (if using experimental decorators)
 */
export function Injectable(identifier?: ServiceIdentifier) {
  return function <T extends Constructor>(target: T) {
    // Store metadata for automatic registration
    Reflect.defineMetadata("injectable", true, target);
    if (identifier) {
      Reflect.defineMetadata("identifier", identifier, target);
    }
    return target;
  };
}

export function Inject(identifier: ServiceIdentifier) {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    const existingTokens = Reflect.getMetadata("inject:tokens", target) || [];
    existingTokens[parameterIndex] = identifier;
    Reflect.defineMetadata("inject:tokens", existingTokens, target);
  };
}

/**
 * Global container instance
 */
export const container = new DIContainer({
  enableLogging: process.env.NODE_ENV === "development",
  enableCircularDependencyDetection: true,
});

/**
 * Helper functions for common patterns
 */
export const DI = {
  /**
   * Create a factory function that resolves dependencies
   */
  factory<T>(
    factory: Factory<T>,
    ...dependencies: ServiceIdentifier[]
  ): Factory<T> {
    return async () => {
      const resolvedDeps = await container.resolveMany(...dependencies);
      return (factory as any).apply(null, resolvedDeps);
    };
  },

  /**
   * Create a service class factory
   */
  classFactory<T>(
    ServiceClass: Constructor<T>,
    ...dependencies: ServiceIdentifier[]
  ): Factory<T> {
    return async () => {
      const resolvedDeps = await container.resolveMany(...dependencies);
      return new ServiceClass(...(resolvedDeps as any[]));
    };
  },

  /**
   * Register all services from a configuration object
   */
  registerServices(
    services: Array<{
      identifier: ServiceIdentifier;
      factory: Factory;
      singleton?: boolean;
      dependencies?: ServiceIdentifier[];
    }>
  ) {
    services.forEach(service => {
      container.register(service.identifier, service.factory, {
        singleton: service.singleton,
        dependencies: service.dependencies,
      });
    });
  },
};
