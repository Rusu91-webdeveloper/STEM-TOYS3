/**
 * Gemini Service Implementation
 * Handles communication with Google's Generative AI API (Gemini)
 */

import { BaseAIService, AIRequestOptions, AIResponse } from "./base-ai-service";
import { AIConfig } from "./config";
import { ApiErrors } from "@/lib/api-error-handler";
import { simpleAIMonitoring } from "./monitoring-simple";

const aiMonitoring = simpleAIMonitoring;

interface GeminiRequest {
  contents: Array<{
    role?: "user" | "model";
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP?: number;
    topK?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      role?: string;
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiService extends BaseAIService {
  protected provider = "gemini";
  protected model: string;
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor() {
    super();

    const config = AIConfig.getProviderConfig("gemini");

    if (!config.apiKey) {
      throw ApiErrors.unauthorized("Gemini API key not configured");
    }

    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  /**
   * Make a request to Gemini API
   */
  protected async makeRequest(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    const validatedOptions = this.validateOptions(options);

    // Map model name - if the model is from the default config,
    // ensure it's in the correct format (without 'models/' prefix as we'll add that in the URL)
    let modelName = validatedOptions.model || this.model;
    if (modelName.startsWith("models/")) {
      // Remove models/ prefix if present
      modelName = modelName.substring(7);
    }

    // Prepare the request
    const requestBody: GeminiRequest = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: validatedOptions.temperature!,
        maxOutputTokens: validatedOptions.maxTokens!,
      },
    };

    // Add system prompt if provided (Gemini doesn't have a dedicated system prompt,
    // so we prepend it to the user message)
    if (validatedOptions.systemPrompt) {
      // Add system instructions at the beginning
      const systemInstruction = `${validatedOptions.systemPrompt}\n\nUser prompt: `;
      requestBody.contents[0].parts[0].text = systemInstruction + prompt;
    }

    try {
      const url = `${this.baseUrl}/models/${modelName}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || "";

        // Handle specific error cases
        if (response.status === 400) {
          throw new Error(
            `Gemini API bad request: ${errorMessage}. Possible issues: invalid parameters or content policy violation.`
          );
        } else if (response.status === 401) {
          throw new Error(
            `Gemini API authentication error: Invalid API key. Please check your GEMINI_API_KEY.`
          );
        } else if (response.status === 403) {
          throw new Error(
            `Gemini API authorization error: ${errorMessage}. Your API key may not have access to this model or feature.`
          );
        } else if (response.status === 404) {
          throw new Error(
            `Gemini API model not found: ${modelName} is not available. Please check your AI_MODEL setting.`
          );
        } else if (response.status === 429) {
          throw new Error(
            `Gemini API rate limit exceeded: ${errorMessage}. Please try again later or upgrade your plan.`
          );
        } else if (response.status >= 500) {
          throw new Error(
            `Gemini API server error: ${errorMessage}. The service may be experiencing issues.`
          );
        } else {
          throw new Error(
            `Gemini API error (${response.status}): ${errorMessage || response.statusText}`
          );
        }
      }

      const data: GeminiResponse = await response.json();

      // Check for safety filtering
      if (data.promptFeedback?.blockReason) {
        throw new Error(
          `Gemini API content filtering: The request was blocked due to ${data.promptFeedback.blockReason}`
        );
      }

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from Gemini API");
      }

      const candidate = data.candidates[0];
      const content = candidate.content.parts[0]?.text || "";

      // Calculate token usage
      // If usage metadata is not available, make a rough estimate
      const inputTokens =
        data.usageMetadata?.promptTokenCount || this.estimateTokenCount(prompt);
      const outputTokens =
        data.usageMetadata?.candidatesTokenCount ||
        this.estimateTokenCount(content);
      const totalTokens =
        data.usageMetadata?.totalTokenCount || inputTokens + outputTokens;

      // Calculate cost based on token usage (Gemini has lower rates than OpenAI)
      // Pricing per 1K tokens (simplified rates, these may change)
      const inputRate = 0.00025; // Gemini Pro input rate
      const outputRate = 0.0005; // Gemini Pro output rate

      // Calculate cost in USD
      const cost =
        (inputTokens / 1000) * inputRate + (outputTokens / 1000) * outputRate;

      // Track the token usage and cost with monitoring service
      await aiMonitoring.recordRequest(
        this.provider,
        true,
        0, // Response time tracked separately
        totalTokens,
        cost
      );

      return {
        content,
        usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens,
        },
        model: modelName,
        finishReason: candidate.finishReason,
        cost,
        inputTokens,
        outputTokens,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Gemini API request failed: ${error}`);
    }
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
   * Get available models (for future use)
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models.map((model: any) => model.name);
    } catch (error) {
      console.error("Failed to fetch Gemini models:", error);
      return ["gemini-pro", "gemini-pro-vision"]; // Fallback to known models
    }
  }
}
