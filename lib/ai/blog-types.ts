/**
 * AI Blog Generation Types
 * Type definitions for AI-powered blog generation
 */

import { StemCategory } from "@prisma/client";

export interface BlogGenerationPrompt {
  prompt: string;
  targetStemCategory?: StemCategory;
  targetAudience?: string;
  tone?: "educational" | "professional" | "conversational" | "expert";
  includeCallToAction?: boolean;
  keywordFocus?: string[];
}

export interface BlogSEOMetadata {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImage?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  readabilityScore?: number;
  seoScore?: number;
}

export interface GeneratedBlogContent {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  stemCategory: StemCategory;
  readingTime: number;
  language: "ro" | "en";
  wordCount: number;
  seoMetadata: BlogSEOMetadata;
  aiMetadata: {
    aiGenerated: true;
    generatedBy: string;
    generationTimestamp: string;
    originalPrompt: string;
    processingTime: number;
    refinementApplied: boolean;
    fallbackUsed?: boolean;
    modelVersion?: string;
  };
}

export interface BlogGenerationOptions {
  includeSEO: boolean;
  includeCoverImage: boolean;
  targetStemCategory?: StemCategory;
  targetAudience?: string;
  tone?: "educational" | "professional" | "conversational" | "expert";
  includeCallToAction: boolean;
  keywordFocus?: string[];
  saveToDatabase: boolean;
  autoPublish?: boolean;
}

export interface BlogGenerationProgress {
  stage:
    | "analyzing_prompt"
    | "generating_content"
    | "optimizing_seo"
    | "refining_language"
    | "finalizing"
    | "complete";
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number;
  error?: string;
}

export interface BlogGenerationResult {
  success: boolean;
  generatedBlog?: GeneratedBlogContent;
  error?: string;
  processingTime: number;
  seoScore?: number;
  suggestions?: string[];
  warnings?: string[];
}

export interface BatchBlogGenerationRequest {
  prompts: BlogGenerationPrompt[];
  options: BlogGenerationOptions;
}

export interface BatchBlogGenerationResult {
  results: BlogGenerationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
    totalWordCount: number;
  };
  errors: Array<{ prompt: string; error: string }>;
}

// Romanian-specific types
export interface RomanianSTEMKeywords {
  primary: string[];
  secondary: string[];
  longTail: string[];
  educational: string[];
  commercial: string[];
}

export interface RomanianContentOptimization {
  curriculumAlignment?: string[];
  educationalLevel?: string;
  regionalContext?: string;
  localKeywords?: RomanianSTEMKeywords;
}

// AI Service interfaces
export interface BlogGenerationPrompts {
  content: BlogPromptTemplate;
  seo: BlogPromptTemplate;
  romanian: BlogPromptTemplate;
  refinement: BlogPromptTemplate;
  title: BlogPromptTemplate;
  excerpt: BlogPromptTemplate;
}

export interface BlogPromptTemplate {
  system: string;
  user: string;
  variables?: string[];
}

export interface BlogEnhancementConfig {
  primaryProvider: "openai" | "gemini" | "anthropic";
  primaryModel: string;
  secondaryProvider: "openai" | "gemini" | "anthropic";
  secondaryModel: string;
  romanianOptimization: boolean;
  seoOptimization: boolean;
  contentQualityChecks: boolean;
  maxRetries: number;
  timeoutMs: number;
}

// API interfaces
export interface BlogGenerationRequest {
  prompt: string;
  options: BlogGenerationOptions;
}

export interface BlogGenerationResponse {
  success: boolean;
  generatedBlog?: GeneratedBlogContent;
  processingTime: number;
  seoScore?: number;
  suggestions?: string[];
  warnings?: string[];
  progress?: BlogGenerationProgress;
}

// Database integration types
export interface BlogDatabasePayload
  extends Omit<GeneratedBlogContent, "aiMetadata" | "seoMetadata"> {
  categoryId: string;
  authorId: string;
  isPublished: boolean;
  publishedAt?: Date;
  metadata: {
    seo: BlogSEOMetadata;
    ai: GeneratedBlogContent["aiMetadata"];
  };
}

// Validation types
export interface BlogValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedBlog?: Partial<GeneratedBlogContent>;
  score: number; // 0-100 validation score
}

// Analytics and monitoring
export interface BlogGenerationMetrics {
  prompt: string;
  processingTime: number;
  contentLength: number;
  seoScore: number;
  language: string;
  stemCategory: StemCategory;
  success: boolean;
  error?: string;
  userId?: string;
  timestamp: Date;
  modelUsed: string;
  tokensUsed?: number;
}
