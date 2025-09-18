/**
 * AI Product Enhancement Types
 * Type definitions for AI-powered product enhancement
 */

export interface BasicProduct {
  name: string;
  price: number;
  category: string;
  images?: string[];
  description?: string;
  sku?: string;
  stockQuantity?: number;
  weight?: number;
  tags?: string[];
}

export interface SEOMetadata {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
}

export interface RomanianContent {
  romanianCompetencies: string[];
  romanianCurriculumAlignment: string[];
  romanianEducationalLevel?: string;
  romanianSubjectAreas: string[];
  romanianMinistryApproval: boolean;
  romanianEducationalCertification?: string;
}

export interface EnhancedProduct extends BasicProduct {
  enhancedDescription: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  tags: string[];
  ageGroup?: string;
  stemDiscipline?: string;
  productType?: string;
  learningOutcomes: string[];
  romanianCompetencies?: string[];
  romanianCurriculumAlignment?: string[];
  romanianEducationalLevel?: string;
  romanianSubjectAreas?: string[];
  romanianMinistryApproval?: boolean;
  romanianEducationalCertification?: string;
  
  // Fallback tracking
  fallbackUsed?: boolean;
  fallbackReason?: string;
  generatedByFallback?: boolean;
  dualProviderEnhancement?: boolean;
  refinements?: string[];
  
  // Error tracking
  error?: boolean;
  errorMessage?: string;
  parseError?: boolean;
}

export interface EnhancementOptions {
  includeRomanianOptimization: boolean;
  includeSEOMetadata: boolean;
  includeLearningOutcomes: boolean;
  includeAgeGroup: boolean;
  includeStemDiscipline: boolean;
  includeProductType: boolean;
}

export interface EnhancementProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentProduct?: string;
  errors: Array<{ product: string; error: string }>;
  startTime: number;
  estimatedTimeRemaining?: number;
  fallbackUsed?: number;
}

export interface EnhancementResult {
  success: boolean;
  enhancedProduct?: EnhancedProduct;
  error?: string;
  processingTime: number;
}

export interface BatchEnhancementResult {
  results: EnhancementResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
  };
  errors: Array<{ product: string; error: string }>;
}

export interface AIEnhancementRequest {
  products: BasicProduct[];
  options?: Partial<EnhancementOptions>;
}

export interface AIEnhancementResponse {
  success: boolean;
  enhancedProducts: EnhancedProduct[];
  processingTime: number;
  errors: Array<{ product: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
    fallbackUsed?: number;
  };
  dualProviderInfo?: {
    primaryProvider: string;
    secondaryProvider: string;
    refinementApplied: boolean;
    fallbackToSecondary?: boolean;
    fallbackCount?: number;
  };
}

// STEM-specific types
export type AgeGroup =
  | "TODDLERS_1_3"
  | "PRESCHOOL_3_5"
  | "ELEMENTARY_6_8"
  | "MIDDLE_SCHOOL_9_12"
  | "TEENS_13_PLUS";

export type StemDiscipline =
  | "SCIENCE"
  | "TECHNOLOGY"
  | "ENGINEERING"
  | "MATHEMATICS"
  | "GENERAL";

export type ProductType =
  | "ROBOTICS"
  | "PUZZLES"
  | "CONSTRUCTION_SETS"
  | "EXPERIMENT_KITS"
  | "BOARD_GAMES";

export type LearningOutcome =
  | "PROBLEM_SOLVING"
  | "CREATIVITY"
  | "CRITICAL_THINKING"
  | "MOTOR_SKILLS"
  | "LOGIC"
  | "ANALYTICAL_THINKING"
  | "COLLABORATION"
  | "COMMUNICATION"
  | "DIGITAL_LITERACY"
  | "CODING_THINKING";

export type RomanianEducationalLevel =
  | "PRESCOLAR"
  | "PRIMAR"
  | "GIMNAZIAL"
  | "LICEAL"
  | "UNIVERSITAR";

// Prompt templates
export interface PromptTemplate {
  system: string;
  user: string;
}

export interface EnhancementPrompts {
  description: PromptTemplate;
  seoMetadata: PromptTemplate;
  romanianOptimization: PromptTemplate;
  categorization: PromptTemplate;
  learningOutcomes: PromptTemplate;
}
