/**
 * AI Enhancement Schema Validator
 * Validates AI-enhanced product data against database schema constraints
 */

import { z } from "zod";
import { EnhancedProduct } from "./types";

// Database enum values - must match Prisma schema exactly
export const DATABASE_ENUMS = {
  AgeGroup: [
    "TODDLERS_1_3",
    "PRESCHOOL_3_5",
    "ELEMENTARY_6_8",
    "MIDDLE_SCHOOL_9_12",
    "TEENS_13_PLUS",
  ] as const,

  StemCategory: [
    "SCIENCE",
    "TECHNOLOGY",
    "ENGINEERING",
    "MATHEMATICS",
    "GENERAL",
  ] as const,

  ProductType: [
    "ROBOTICS",
    "PUZZLES",
    "CONSTRUCTION_SETS",
    "EXPERIMENT_KITS",
    "BOARD_GAMES",
  ] as const,

  LearningOutcome: [
    "PROBLEM_SOLVING",
    "CREATIVITY",
    "CRITICAL_THINKING",
    "MOTOR_SKILLS",
    "LOGIC",
  ] as const,

  RomanianEducationalLevel: [
    "GRADINITA",
    "PRIMAR",
    "GIMNAZIU",
    "LICEU",
    "UNIVERSITATE",
  ] as const,
} as const;

// Zod schemas for validation
const ageGroupSchema = z
  .enum(DATABASE_ENUMS.AgeGroup)
  .optional()
  .refine(
    val => !val || DATABASE_ENUMS.AgeGroup.includes(val),
    "Invalid age group value"
  );

const stemDisciplineSchema = z
  .enum(DATABASE_ENUMS.StemCategory)
  .optional()
  .refine(
    val => !val || DATABASE_ENUMS.StemCategory.includes(val),
    "Invalid STEM discipline value"
  );

const productTypeSchema = z
  .enum(DATABASE_ENUMS.ProductType)
  .optional()
  .refine(
    val => !val || DATABASE_ENUMS.ProductType.includes(val),
    "Invalid product type value"
  );

const learningOutcomesSchema = z
  .array(z.enum(DATABASE_ENUMS.LearningOutcome))
  .optional()
  .refine(
    val =>
      !val ||
      val.every(outcome => DATABASE_ENUMS.LearningOutcome.includes(outcome)),
    "Invalid learning outcome value"
  );

const romanianEducationalLevelSchema = z
  .enum(DATABASE_ENUMS.RomanianEducationalLevel)
  .optional()
  .refine(
    val => !val || DATABASE_ENUMS.RomanianEducationalLevel.includes(val),
    "Invalid Romanian educational level value"
  );

// Complete enhanced product validation schema
export const enhancedProductSchema = z.object({
  // Basic product fields
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  category: z.string().min(1),
  images: z.array(z.string()).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  weight: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),

  // Enhanced fields
  enhancedDescription: z.string().min(1),
  metaTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(160),
  metaKeywords: z.array(z.string()),

  // Validated enum fields
  ageGroup: ageGroupSchema,
  stemDiscipline: stemDisciplineSchema,
  productType: productTypeSchema,
  learningOutcomes: learningOutcomesSchema,

  // Romanian fields
  romanianCompetencies: z.array(z.string()).optional(),
  romanianCurriculumAlignment: z.array(z.string()).optional(),
  romanianEducationalLevel: romanianEducationalLevelSchema,
  romanianSubjectAreas: z.array(z.string()).optional(),
  romanianMinistryApproval: z.boolean().optional(),
  romanianEducationalCertification: z.string().optional(),

  // Tracking fields
  fallbackUsed: z.boolean().optional(),
  fallbackReason: z.string().optional(),
  generatedByFallback: z.boolean().optional(),
  dualProviderEnhancement: z.boolean().optional(),
  refinements: z.array(z.string()).optional(),
  error: z.boolean().optional(),
  errorMessage: z.string().optional(),
  parseError: z.boolean().optional(),
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedProduct?: EnhancedProduct;
}

export class AISchemaValidator {
  /**
   * Validate an enhanced product against database schema
   */
  static validateEnhancedProduct(product: EnhancedProduct): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Validate with Zod schema
      enhancedProductSchema.parse(product);

      // Additional custom validations
      this.validateEnumValues(product, result);
      this.validateBusinessRules(product, result);

      // If there are errors, try to create a corrected version
      if (result.errors.length > 0) {
        result.isValid = false;
        result.correctedProduct = this.correctEnumValues(product);
      }
    } catch (error) {
      result.isValid = false;
      if (error instanceof z.ZodError) {
        result.errors = error.errors.map(
          e => `${e.path.join(".")}: ${e.message}`
        );
      } else {
        result.errors.push(`Validation error: ${error}`);
      }
    }

    return result;
  }

  /**
   * Validate enum values against database schema
   */
  private static validateEnumValues(
    product: EnhancedProduct,
    result: ValidationResult
  ): void {
    // Age Group validation
    if (
      product.ageGroup &&
      !DATABASE_ENUMS.AgeGroup.includes(product.ageGroup as any)
    ) {
      result.errors.push(
        `Invalid ageGroup: "${product.ageGroup}". Must be one of: ${DATABASE_ENUMS.AgeGroup.join(", ")}`
      );
    }

    // STEM Discipline validation
    if (
      product.stemDiscipline &&
      !DATABASE_ENUMS.StemCategory.includes(product.stemDiscipline as any)
    ) {
      result.errors.push(
        `Invalid stemDiscipline: "${product.stemDiscipline}". Must be one of: ${DATABASE_ENUMS.StemCategory.join(", ")}`
      );
    }

    // Product Type validation
    if (
      product.productType &&
      !DATABASE_ENUMS.ProductType.includes(product.productType as any)
    ) {
      result.errors.push(
        `Invalid productType: "${product.productType}". Must be one of: ${DATABASE_ENUMS.ProductType.join(", ")}`
      );
    }

    // Learning Outcomes validation
    if (product.learningOutcomes && product.learningOutcomes.length > 0) {
      const invalidOutcomes = product.learningOutcomes.filter(
        outcome => !DATABASE_ENUMS.LearningOutcome.includes(outcome as any)
      );
      if (invalidOutcomes.length > 0) {
        result.errors.push(
          `Invalid learningOutcomes: "${invalidOutcomes.join(", ")}". Must be from: ${DATABASE_ENUMS.LearningOutcome.join(", ")}`
        );
      }
    }

    // Romanian Educational Level validation
    if (
      product.romanianEducationalLevel &&
      !DATABASE_ENUMS.RomanianEducationalLevel.includes(
        product.romanianEducationalLevel as any
      )
    ) {
      result.errors.push(
        `Invalid romanianEducationalLevel: "${product.romanianEducationalLevel}". Must be one of: ${DATABASE_ENUMS.RomanianEducationalLevel.join(", ")}`
      );
    }
  }

  /**
   * Validate business rules
   */
  private static validateBusinessRules(
    product: EnhancedProduct,
    result: ValidationResult
  ): void {
    // Meta title length
    if (product.metaTitle && product.metaTitle.length > 70) {
      result.warnings.push(
        `Meta title is ${product.metaTitle.length} characters, recommended max is 70`
      );
    }

    // Meta description length
    if (product.metaDescription && product.metaDescription.length > 160) {
      result.warnings.push(
        `Meta description is ${product.metaDescription.length} characters, recommended max is 160`
      );
    }

    // Stock quantity
    if (product.stockQuantity === undefined || product.stockQuantity < 0) {
      result.warnings.push("Stock quantity should be a non-negative number");
    }

    // Enhanced description length
    if (
      product.enhancedDescription &&
      product.enhancedDescription.length < 100
    ) {
      result.warnings.push(
        "Enhanced description is quite short, consider expanding it"
      );
    }
  }

  /**
   * Attempt to correct invalid enum values with sensible defaults
   */
  private static correctEnumValues(product: EnhancedProduct): EnhancedProduct {
    const corrected = { ...product };

    // Age Group corrections
    if (
      product.ageGroup &&
      !DATABASE_ENUMS.AgeGroup.includes(product.ageGroup as any)
    ) {
      const ageMapping: Record<
        string,
        (typeof DATABASE_ENUMS.AgeGroup)[number]
      > = {
        "3_TO_5": "PRESCHOOL_3_5",
        "6_TO_8": "ELEMENTARY_6_8",
        "9_TO_12": "MIDDLE_SCHOOL_9_12",
        "13_PLUS": "TEENS_13_PLUS",
        ELEMENTARY: "ELEMENTARY_6_8",
        MIDDLE_SCHOOL: "MIDDLE_SCHOOL_9_12",
        PRESCHOOL: "PRESCHOOL_3_5",
        TODDLER: "TODDLERS_1_3",
        TEEN: "TEENS_13_PLUS",
      };
      corrected.ageGroup = ageMapping[product.ageGroup] || "ELEMENTARY_6_8";
    }

    // Product Type corrections
    if (
      product.productType &&
      !DATABASE_ENUMS.ProductType.includes(product.productType as any)
    ) {
      const typeMapping: Record<
        string,
        (typeof DATABASE_ENUMS.ProductType)[number]
      > = {
        BUILDING_TOY: "CONSTRUCTION_SETS",
        EDUCATIONAL_TOY: "EXPERIMENT_KITS",
        EDUCATIONAL_KIT: "EXPERIMENT_KITS",
        EDUCATIONAL_GAME: "BOARD_GAMES",
        SCIENCE_KIT: "EXPERIMENT_KITS",
        BUILDING_SET: "CONSTRUCTION_SETS",
      };
      corrected.productType =
        typeMapping[product.productType] || "EXPERIMENT_KITS";
    }

    // Learning Outcomes corrections
    if (product.learningOutcomes && product.learningOutcomes.length > 0) {
      corrected.learningOutcomes = product.learningOutcomes
        .map(outcome => {
          if (DATABASE_ENUMS.LearningOutcome.includes(outcome as any)) {
            return outcome;
          }
          // Map invalid outcomes to valid ones
          const outcomeMapping: Record<
            string,
            (typeof DATABASE_ENUMS.LearningOutcome)[number]
          > = {
            TECHNOLOGY: "PROBLEM_SOLVING",
            ENGINEERING: "PROBLEM_SOLVING",
            SCIENCE: "CRITICAL_THINKING",
            MATHEMATICS: "LOGIC",
            TECHNICAL_SKILLS: "PROBLEM_SOLVING",
            HANDS_ON_EXPERIMENTS: "CREATIVITY",
            SCIENTIFIC_KNOWLEDGE: "CRITICAL_THINKING",
            TECHNOLOGY_LITERACY: "PROBLEM_SOLVING",
          };
          return outcomeMapping[outcome] || "PROBLEM_SOLVING";
        })
        .filter((outcome, index, arr) => arr.indexOf(outcome) === index); // Remove duplicates
    }

    // Romanian Educational Level corrections
    if (
      product.romanianEducationalLevel &&
      !DATABASE_ENUMS.RomanianEducationalLevel.includes(
        product.romanianEducationalLevel as any
      )
    ) {
      const levelMapping: Record<
        string,
        (typeof DATABASE_ENUMS.RomanianEducationalLevel)[number]
      > = {
        ELEMENTARY: "PRIMAR",
        MIDDLE_SCHOOL: "GIMNAZIU",
        HIGH_SCHOOL: "LICEU",
        UNIVERSITY: "UNIVERSITATE",
        KINDERGARTEN: "GRADINITA",
        PRIMAR_SI_GIMNAZIAL: "PRIMAR",
      };
      corrected.romanianEducationalLevel =
        levelMapping[product.romanianEducationalLevel] || "PRIMAR";
    }

    return corrected;
  }

  /**
   * Validate a batch of enhanced products
   */
  static validateEnhancedProductsBatch(products: EnhancedProduct[]): {
    validProducts: EnhancedProduct[];
    invalidProducts: Array<{
      product: EnhancedProduct;
      errors: string[];
      warnings: string[];
    }>;
    correctedProducts: EnhancedProduct[];
  } {
    const validProducts: EnhancedProduct[] = [];
    const invalidProducts: Array<{
      product: EnhancedProduct;
      errors: string[];
      warnings: string[];
    }> = [];
    const correctedProducts: EnhancedProduct[] = [];

    for (const product of products) {
      const validation = this.validateEnhancedProduct(product);

      if (validation.isValid) {
        validProducts.push(product);
      } else {
        invalidProducts.push({
          product,
          errors: validation.errors,
          warnings: validation.warnings,
        });

        if (validation.correctedProduct) {
          correctedProducts.push(validation.correctedProduct);
        }
      }
    }

    return {
      validProducts,
      invalidProducts,
      correctedProducts,
    };
  }
}
