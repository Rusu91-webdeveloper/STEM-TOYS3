/**
 * AI Service Factory
 * Creates and manages AI service instances
 */

import { BaseAIService } from "./base-ai-service";
import { OpenAIService } from "./openai-service";
import { AIConfig, AIProvider } from "./config";
import { ApiErrors } from "@/lib/api-error-handler";

export class AIServiceFactory {
  private static instances: Map<AIProvider, BaseAIService> = new Map();

  /**
   * Create or get an AI service instance
   */
  static createService(provider?: AIProvider): BaseAIService {
    const targetProvider = provider || AIConfig.getProvider();

    // Return existing instance if available
    if (this.instances.has(targetProvider)) {
      return this.instances.get(targetProvider)!;
    }

    // Validate configuration
    const validation = AIConfig.validateConfig();
    if (!validation.isValid) {
      throw ApiErrors.unauthorized(
        `AI service not properly configured: ${validation.errors.join(", ")}`
      );
    }

    // Create new instance based on provider
    let service: BaseAIService;

    switch (targetProvider) {
      case "openai":
        service = new OpenAIService();
        break;
      case "anthropic":
        // TODO: Implement AnthropicService
        throw new Error("Anthropic service not yet implemented");
      case "gemini":
        // TODO: Implement GeminiService
        throw new Error("Gemini service not yet implemented");
      default:
        throw new Error(`Unsupported AI provider: ${targetProvider}`);
    }

    // Cache the instance
    this.instances.set(targetProvider, service);
    return service;
  }

  /**
   * Get the default AI service
   */
  static getDefaultService(): BaseAIService {
    return this.createService();
  }

  /**
   * Get a specific AI service by provider
   */
  static getService(provider: AIProvider): BaseAIService {
    return this.createService(provider);
  }

  /**
   * Check if a provider is available
   */
  static isProviderAvailable(provider: AIProvider): boolean {
    try {
      const config = AIConfig.getProviderConfig(provider);
      return !!config.apiKey;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all available providers
   */
  static getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];

    if (this.isProviderAvailable("openai")) {
      providers.push("openai");
    }

    if (this.isProviderAvailable("anthropic")) {
      providers.push("anthropic");
    }

    if (this.isProviderAvailable("gemini")) {
      providers.push("gemini");
    }

    return providers;
  }

  /**
   * Test all available AI services
   */
  static async testAllServices(): Promise<Record<AIProvider, boolean>> {
    const results: Record<AIProvider, boolean> = {} as Record<
      AIProvider,
      boolean
    >;
    const availableProviders = this.getAvailableProviders();

    for (const provider of availableProviders) {
      try {
        const service = this.createService(provider);
        results[provider] = await service.testConnection();
      } catch (error) {
        console.error(`Failed to test ${provider} service:`, error);
        results[provider] = false;
      }
    }

    return results;
  }

  /**
   * Clear cached instances (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Get service health status
   */
  static async getServiceHealth(): Promise<{
    configured: boolean;
    availableProviders: AIProvider[];
    defaultProvider: AIProvider | null;
    testResults: Record<AIProvider, boolean>;
  }> {
    const configured = AIConfig.isConfigured();
    const availableProviders = this.getAvailableProviders();
    const defaultProvider = configured ? AIConfig.getProvider() : null;
    const testResults = await this.testAllServices();

    return {
      configured,
      availableProviders,
      defaultProvider,
      testResults,
    };
  }

  /**
   * Create a service with fallback logic
   */
  static createServiceWithFallback(
    preferredProvider?: AIProvider,
    fallbackProviders: AIProvider[] = ["openai", "anthropic"]
  ): BaseAIService {
    // Try preferred provider first
    if (preferredProvider && this.isProviderAvailable(preferredProvider)) {
      try {
        return this.createService(preferredProvider);
      } catch (error) {
        console.warn(
          `Failed to create ${preferredProvider} service, trying fallbacks:`,
          error
        );
      }
    }

    // Try fallback providers
    for (const provider of fallbackProviders) {
      if (this.isProviderAvailable(provider)) {
        try {
          return this.createService(provider);
        } catch (error) {
          console.warn(`Failed to create ${provider} service:`, error);
        }
      }
    }

    throw ApiErrors.serviceUnavailable("AI service - no providers available");
  }
}
