/**
 * AI Configuration Service
 * Provides centralized configuration management for AI services
 */

import { getAIConfig } from "@/lib/config/environment";

export type AIProvider = "openai" | "anthropic" | "gemini";

export class AIConfig {
  /**
   * Get the configured AI provider
   */
  static getProvider(): AIProvider {
    return getAIConfig().provider as AIProvider;
  }

  /**
   * Get the API key for the configured provider
   */
  static getApiKey(): string {
    const config = getAIConfig();
    const provider = this.getProvider();

    switch (provider) {
      case "openai":
        return config.openaiApiKey || "";
      case "anthropic":
        return config.anthropicApiKey || "";
      case "gemini":
        return config.geminiApiKey || "";
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Get the AI model configuration
   */
  static getModel(): string {
    return getAIConfig().model;
  }

  /**
   * Get the maximum tokens configuration
   */
  static getMaxTokens(): number {
    return getAIConfig().maxTokens;
  }

  /**
   * Get the temperature configuration
   */
  static getTemperature(): number {
    return getAIConfig().temperature;
  }

  /**
   * Check if AI enhancement is enabled
   */
  static isEnhancementEnabled(): boolean {
    return getAIConfig().enhancementEnabled;
  }

  /**
   * Check if AI service is properly configured
   */
  static isConfigured(): boolean {
    return getAIConfig().isConfigured;
  }

  /**
   * Get all AI configuration
   */
  static getAllConfig() {
    return getAIConfig();
  }

  /**
   * Validate AI configuration
   */
  static validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = getAIConfig();

    if (!config.isConfigured) {
      errors.push("No AI API keys configured");
    }

    if (config.isConfigured) {
      const provider = this.getProvider();
      const apiKey = this.getApiKey();

      if (!apiKey) {
        errors.push(`API key not found for provider: ${provider}`);
      }

      if (config.maxTokens <= 0) {
        errors.push("Max tokens must be greater than 0");
      }

      if (config.temperature < 0 || config.temperature > 2) {
        errors.push("Temperature must be between 0 and 2");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get the primary AI provider for dual-provider systems
   */
  static getPrimaryProvider(): AIProvider {
    return getAIConfig().primaryProvider as AIProvider;
  }

  /**
   * Get the primary AI model for dual-provider systems
   */
  static getPrimaryModel(): string {
    return getAIConfig().primaryModel;
  }

  /**
   * Get the secondary AI provider for dual-provider systems
   */
  static getSecondaryProvider(): AIProvider {
    return getAIConfig().secondaryProvider as AIProvider;
  }

  /**
   * Get the secondary AI model for dual-provider systems
   */
  static getSecondaryModel(): string {
    return getAIConfig().secondaryModel;
  }

  /**
   * Get the fallback AI model for dual-provider systems
   */
  static getFallbackModel(): string {
    return getAIConfig().fallbackModel;
  }

  /**
   * Check if dual-provider configuration is available
   */
  static isDualProviderConfigured(): boolean {
    const config = getAIConfig();
    return !!(
      config.primaryProvider &&
      config.secondaryProvider &&
      config.primaryModel &&
      config.secondaryModel
    );
  }

  /**
   * Get provider-specific configuration
   */
  static getProviderConfig(provider: AIProvider) {
    const config = getAIConfig();

    switch (provider) {
      case "openai":
        return {
          apiKey: config.openaiApiKey,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        };
      case "anthropic":
        return {
          apiKey: config.anthropicApiKey,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        };
      case "gemini":
        return {
          apiKey: config.geminiApiKey,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        };
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Get dual-provider configuration
   */
  static getDualProviderConfig() {
    const config = getAIConfig();
    return {
      primaryProvider: config.primaryProvider,
      primaryModel: config.primaryModel,
      secondaryProvider: config.secondaryProvider,
      secondaryModel: config.secondaryModel,
      fallbackModel: config.fallbackModel,
    };
  }
}
