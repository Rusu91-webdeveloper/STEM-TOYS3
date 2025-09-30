/**
 * Type definitions for product enhancement
 */

export interface ProductEnhancementPrompt {
  productData: string;
  includeCategorization?: boolean;
  includeRomanianOptimization?: boolean;
  includeLearningOutcomes?: boolean;
  includeStemDiscipline?: boolean;
  includeAgeGroup?: boolean;
  includeProductType?: boolean;
}

export interface ProductEnhancementOptions {
  includeCategorization?: boolean;
  includeRomanianOptimization?: boolean;
  includeLearningOutcomes?: boolean;
  includeStemDiscipline?: boolean;
  includeAgeGroup?: boolean;
  includeProductType?: boolean;
  includeSEO?: boolean;
  includeMetadata?: boolean;
}

export interface ProductEnhancementProgress {
  stage:
    | "analyzing_product"
    | "enhancing_product"
    | "finalizing"
    | "processing_batch"
    | "complete";
  progress: number;
  currentStep: string;
  estimatedTimeRemaining: number;
}

export interface ProductEnhancementResult {
  success: boolean;
  enhancedProduct?: any;
  error?: string;
  processingTime: number;
  fallbackUsed?: boolean;
  warnings?: string[];
  suggestions?: string[];
}

export interface ProductValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  correctedProduct?: any;
}
