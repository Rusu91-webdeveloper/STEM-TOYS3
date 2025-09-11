/**
 * AI Module Exports
 * Centralized exports for AI services and utilities
 */

// Core services
export { BaseAIService } from "./base-ai-service";
export { OpenAIService } from "./openai-service";
export { AIServiceFactory } from "./ai-service-factory";

// Product enhancement services
export { ProductEnhancementService } from "./product-enhancement-service";
export { BatchEnhancementService } from "./batch-enhancement-service";

// Configuration
export { AIConfig } from "./config";
export type { AIProvider } from "./config";

// Types
export type { AIRequestOptions, AIResponse } from "./base-ai-service";
export type {
  BasicProduct,
  EnhancedProduct,
  EnhancementOptions,
  EnhancementProgress,
  EnhancementResult,
  BatchEnhancementResult,
  AIEnhancementRequest,
  AIEnhancementResponse,
} from "./types";

// Prompts
export { STEM_TOYS_PROMPTS, formatPrompt } from "./prompts/stem-toys-prompts";

// Convenience function for getting the default AI service
export const getAIService = () => AIServiceFactory.getDefaultService();

// Convenience function for testing AI service health
export const testAIService = async () => {
  const service = getAIService();
  return service.testConnection();
};

// Convenience function for getting the product enhancement service
export const getProductEnhancementService = () =>
  new ProductEnhancementService();

// Convenience function for getting the batch enhancement service
export const getBatchEnhancementService = () => new BatchEnhancementService();
