/**
 * Base AI Service
 * Abstract base class for AI service implementations
 */

import { ApiError, ApiErrors } from "@/lib/api-error-handler";

export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  model?: string;
  finishReason?: string;
  cost?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export abstract class BaseAIService {
  protected abstract provider: string;
  protected abstract model: string;

  /**
   * Make a request to the AI service
   */
  protected abstract makeRequest(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<AIResponse>;

  /**
   * Generate content using the AI service
   */
  async generateContent(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<string> {
    try {
      const response = await this.makeRequest(prompt, options);
      return response.content;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate content with structured output
   */
  async generateStructuredContent<T>(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<T> {
    try {
      const response = await this.makeRequest(prompt, options);

      // Try to parse JSON response
      try {
        return JSON.parse(response.content) as T;
      } catch (parseError) {
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Test the AI service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateContent(
        "Hello, this is a test message."
      );
      return response.length > 0;
    } catch (error) {
      console.error("AI service connection test failed:", error);
      return false;
    }
  }

  /**
   * Get the provider name
   */
  getProvider(): string {
    return this.provider;
  }

  /**
   * Get the model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Handle errors from AI service
   */
  protected handleError(error: any): never {
    console.error(`AI Service Error (${this.provider}):`, error);

    // Handle specific error types
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle API-specific errors
    if (error?.status === 401) {
      throw ApiErrors.unauthorized("Invalid AI API key");
    }

    if (error?.status === 429) {
      throw ApiErrors.rateLimited();
    }

    if (error?.status === 500) {
      throw ApiErrors.serviceUnavailable("AI service");
    }

    // Handle network errors
    if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED") {
      throw ApiErrors.serviceUnavailable("AI service");
    }

    // Handle timeout errors
    if (error?.code === "ETIMEDOUT") {
      throw ApiErrors.timeout("AI service request");
    }

    // Generic error
    throw ApiErrors.externalServiceError(
      "AI service",
      error?.message || "Unknown error"
    );
  }

  /**
   * Validate request options
   */
  protected validateOptions(options?: AIRequestOptions): AIRequestOptions {
    const validatedOptions: AIRequestOptions = {
      maxTokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7,
      model: options?.model || this.model,
      systemPrompt: options?.systemPrompt,
      userPrompt: options?.userPrompt,
    };

    // Validate maxTokens
    if (
      validatedOptions.maxTokens! <= 0 ||
      validatedOptions.maxTokens! > 4000
    ) {
      throw ApiErrors.invalidInput("maxTokens", "Must be between 1 and 4000");
    }

    // Validate temperature
    if (
      validatedOptions.temperature! < 0 ||
      validatedOptions.temperature! > 2
    ) {
      throw ApiErrors.invalidInput("temperature", "Must be between 0 and 2");
    }

    return validatedOptions;
  }

  /**
   * Create a standardized prompt
   */
  protected createPrompt(systemPrompt: string, userPrompt: string): string {
    return `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`;
  }

  /**
   * Truncate text to fit within token limits
   */
  protected truncateText(text: string, maxTokens: number): string {
    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;

    if (text.length <= maxChars) {
      return text;
    }

    return text.substring(0, maxChars - 3) + "...";
  }

  /**
   * Estimate token count (rough approximation)
   */
  protected estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
