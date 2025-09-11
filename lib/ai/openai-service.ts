/**
 * OpenAI Service Implementation
 * Handles communication with OpenAI's API
 */

import { BaseAIService, AIRequestOptions, AIResponse } from "./base-ai-service";
import { AIConfig } from "./config";
import { ApiErrors } from "@/lib/api-error-handler";

interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService extends BaseAIService {
  protected provider = "openai";
  protected model: string;
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor() {
    super();

    const config = AIConfig.getProviderConfig("openai");

    if (!config.apiKey) {
      throw ApiErrors.unauthorized("OpenAI API key not configured");
    }

    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  /**
   * Make a request to OpenAI API
   */
  protected async makeRequest(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    const validatedOptions = this.validateOptions(options);

    // Prepare the request
    const requestBody: OpenAIRequest = {
      model: validatedOptions.model!,
      messages: this.prepareMessages(prompt, validatedOptions),
      max_tokens: validatedOptions.maxTokens!,
      temperature: validatedOptions.temperature!,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ""}`
        );
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenAI API");
      }

      const choice = data.choices[0];

      return {
        content: choice.message.content,
        usage: data.usage,
        model: data.model,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`OpenAI API request failed: ${error}`);
    }
  }

  /**
   * Prepare messages for OpenAI API
   */
  private prepareMessages(
    prompt: string,
    options: AIRequestOptions
  ): Array<{ role: "system" | "user" | "assistant"; content: string }> {
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];

    // Add system prompt if provided
    if (options.systemPrompt) {
      messages.push({
        role: "system",
        content: options.systemPrompt,
      });
    }

    // Add user prompt
    messages.push({
      role: "user",
      content: prompt,
    });

    return messages;
  }

  /**
   * Generate content with specific system prompt
   */
  async generateWithSystemPrompt(
    systemPrompt: string,
    userPrompt: string,
    options?: AIRequestOptions
  ): Promise<string> {
    const validatedOptions = this.validateOptions(options);
    validatedOptions.systemPrompt = systemPrompt;

    return this.generateContent(userPrompt, validatedOptions);
  }

  /**
   * Generate structured JSON response
   */
  async generateJSON<T>(
    prompt: string,
    schema?: any,
    options?: AIRequestOptions
  ): Promise<T> {
    const validatedOptions = this.validateOptions(options);

    // Add JSON formatting instruction to the prompt
    const jsonPrompt = `${prompt}\n\nPlease respond with valid JSON only. ${
      schema ? `Follow this schema: ${JSON.stringify(schema)}` : ""
    }`;

    const response = await this.generateContent(jsonPrompt, validatedOptions);

    try {
      return JSON.parse(response) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }

  /**
   * Generate content with retry logic
   */
  async generateWithRetry(
    prompt: string,
    options?: AIRequestOptions,
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateContent(prompt, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        console.warn(
          `OpenAI request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
        );
      }
    }

    throw lastError || new Error("OpenAI request failed after all retries");
  }

  /**
   * Get available models (for future use)
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data
        .filter((model: any) => model.id.startsWith("gpt"))
        .map((model: any) => model.id);
    } catch (error) {
      console.error("Failed to fetch OpenAI models:", error);
      return ["gpt-4", "gpt-3.5-turbo"]; // Fallback to known models
    }
  }
}
