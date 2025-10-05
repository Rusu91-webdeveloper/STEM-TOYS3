/**
 * OpenAI Service Implementation
 * Handles communication with OpenAI's API
 */

import { BaseAIService, AIRequestOptions, AIResponse } from "./base-ai-service";
import { AIConfig } from "./config";
import { ApiErrors } from "@/lib/api-error-handler";
import { simpleAIMonitoring } from "./monitoring-simple";

const aiMonitoring = simpleAIMonitoring;

interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens?: number; // For older models
  max_completion_tokens?: number; // For newer models
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

  constructor(modelOverride?: string) {
    super();

    const config = AIConfig.getProviderConfig("openai");

    if (!config.apiKey) {
      throw ApiErrors.unauthorized("OpenAI API key not configured");
    }

    this.apiKey = config.apiKey;
    this.model = modelOverride || config.model;
  }

  /**
   * Make a request to OpenAI API
   */
  protected async makeRequest(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    const validatedOptions = this.validateOptions(options);

    // Prepare the request - use correct parameters based on model
    const isNewerModel =
      validatedOptions.model?.includes("gpt-5") ||
      validatedOptions.model?.includes("gpt-4o") ||
      validatedOptions.model?.startsWith("gpt-4-turbo");

    // Some newer models only support temperature=1 (default)
    const supportedTemperature = isNewerModel
      ? 1
      : validatedOptions.temperature!;

    const requestBody: OpenAIRequest = {
      model: validatedOptions.model!,
      messages: this.prepareMessages(prompt, validatedOptions),
      temperature: supportedTemperature,
    };

    // Debug logging to see what model is being sent
    console.log("🔍 OpenAI API Request Debug:");
    console.log("- Model:", validatedOptions.model);
    console.log("- Is newer model:", isNewerModel);
    console.log("- Environment:", process.env.NODE_ENV || "unknown");
    console.log("- API Key exists:", !!this.apiKey);
    console.log(
      "- API Key prefix:",
      this.apiKey ? this.apiKey.substring(0, 10) + "..." : "none"
    );
    console.log("- Full request body:", JSON.stringify(requestBody, null, 2));

    // Use correct max_tokens parameter based on model version
    if (isNewerModel) {
      (requestBody as any).max_completion_tokens = validatedOptions.maxTokens!;
    } else {
      (requestBody as any).max_tokens = validatedOptions.maxTokens!;
    }

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
        // Try to parse as JSON first, but fallback to text if it fails
        let errorData: any = {};
        let errorMessage = "";
        try {
          errorData = await response.json();
          errorMessage = errorData.error?.message || "";
        } catch (jsonError) {
          // If JSON parsing fails, get the response as text
          const errorText = await response.text();
          console.error(
            "OpenAI API returned non-JSON error response:",
            errorText.substring(0, 500)
          );
          console.error("Response status:", response.status);
          console.error(
            "Response headers:",
            Object.fromEntries(response.headers.entries())
          );
          errorMessage = errorText || "Unknown error";
        }

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error(
            `OpenAI API authentication error: Invalid API key or token. Please check your OPENAI_API_KEY.`
          );
        } else if (response.status === 429) {
          throw new Error(
            `OpenAI API rate limit exceeded: ${errorMessage}. Please try again later or upgrade your plan.`
          );
        } else if (response.status === 404) {
          throw new Error(
            `OpenAI API model not found: ${this.model} is not available. Please check your AI_MODEL setting. Raw error: ${errorMessage}`
          );
        } else if (response.status === 400) {
          throw new Error(
            `OpenAI API bad request: ${errorMessage}. Possible issues: invalid parameters or content policy violation.`
          );
        } else if (response.status >= 500) {
          throw new Error(
            `OpenAI API server error: ${errorMessage}. The service may be experiencing issues.`
          );
        } else {
          throw new Error(
            `OpenAI API error (${response.status}): ${errorMessage || response.statusText}`
          );
        }
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenAI API");
      }

      const choice = data.choices[0];

      // Calculate cost based on token usage
      const inputTokens = data.usage.prompt_tokens;
      const outputTokens = data.usage.completion_tokens;

      // Pricing per 1K tokens (simplified rates, these may change)
      let inputRate = 0.0005; // Default to gpt-3.5-turbo rate
      let outputRate = 0.0015; // Default to gpt-3.5-turbo rate

      // Adjust rates based on the model
      if (data.model.includes("gpt-5")) {
        // GPT-5 pricing (estimated - adjust as needed)
        inputRate = 0.01; // $0.01 per 1K input tokens
        outputRate = 0.03; // $0.03 per 1K output tokens
      } else if (data.model.includes("gpt-4")) {
        inputRate = data.model.includes("turbo") ? 0.01 : 0.03;
        outputRate = data.model.includes("turbo") ? 0.03 : 0.06;
      }

      // Calculate cost in USD
      const cost =
        (inputTokens / 1000) * inputRate + (outputTokens / 1000) * outputRate;

      // Track the token usage and cost with monitoring service
      await aiMonitoring.recordRequest(
        this.provider,
        true,
        0, // Response time already tracked separately
        data.usage.total_tokens,
        cost
      );

      // Handle GPT-5 models (reasoning models that may need different parameters)
      if (data.model.includes("gpt-5")) {
        // GPT-5 models appear to be reasoning models that don't return visible content
        // They use all tokens for internal reasoning
        if (
          !choice.message.content ||
          choice.message.content.trim().length === 0
        ) {
          console.warn(
            "⚠️ GPT-5 returned empty content - this will trigger fallback logic in blog service"
          );
          // Don't throw error here - let the blog service handle the fallback
        }
      }

      return {
        content: choice.message.content,
        usage: data.usage,
        model: data.model,
        finishReason: choice.finish_reason,
        cost: cost,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
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
      return ["gpt-5", "gpt-4", "gpt-3.5-turbo"]; // Fallback to known models
    }
  }
}
