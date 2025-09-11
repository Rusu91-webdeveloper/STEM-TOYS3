/**
 * Enhanced Product Processor
 * Handles all product data processing requirements for Romanian market
 */

import { AIServiceFactory } from "./ai-service-factory";
import { extractFileKeyFromUrl } from "@/lib/uploadthing";
import {
  PRODUCT_STRUCTURE_PROMPT,
  formatPrompt,
} from "./prompts/stem-toys-prompts";
import { CurrencyService } from "./currency-service";

export interface ProcessedProduct {
  // Core product fields
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  images: string[];
  categoryId?: string;
  tags: string[];
  attributes?: any;
  metadata?: any;
  isActive: boolean;
  featured: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  reorderPoint?: number;
  weight: number;
  dimensions?: any;
  averageRating?: number;
  reviewCount: number;
  totalSold: number;
  createdAt: Date;
  updatedAt: Date;
  barcode?: string;

  // Enhanced categorization
  ageGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  learningOutcomes: string[];
  productType?:
    | "ROBOTICS"
    | "PUZZLES"
    | "CONSTRUCTION_SETS"
    | "EXPERIMENT_KITS"
    | "BOARD_GAMES";
  specialCategories: string[];
  stemDiscipline:
    | "SCIENCE"
    | "TECHNOLOGY"
    | "ENGINEERING"
    | "MATHEMATICS"
    | "GENERAL";
  supplierId?: string;

  // Romanian educational fields
  romanianCompetencies: string[];
  romanianCurriculumAlignment: string[];
  romanianEducationalCertification?: string;
  romanianEducationalLevel?:
    | "GRADINITA"
    | "PRIMAR"
    | "GIMNAZIU"
    | "LICEU"
    | "UNIVERSITATE";
  romanianMinistryApproval: boolean;
  romanianParentGuides: string[];
  romanianSubjectAreas: string[];
  romanianTeacherResources: string[];
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  compareAtPriceCurrency: string;
  priceCurrency: string;
  imageMetadata: any[];
}

export interface ProductProcessingOptions {
  includeAIEnhancement?: boolean;
  applyRomanianDefaults?: boolean;
  processImages?: boolean;
  addMarkup?: boolean;
  markupPercentage?: number;
}

export class EnhancedProductProcessor {
  private aiService = AIServiceFactory.getDefaultService();
  private currencyService = CurrencyService.getInstance();
  private defaultMarkupPercentage = 20; // 20% markup as requested

  /**
   * Process a single product with all requirements
   */
  async processProduct(
    rawProduct: any,
    options: ProductProcessingOptions = {}
  ): Promise<ProcessedProduct> {
    const {
      includeAIEnhancement = true,
      applyRomanianDefaults = true,
      processImages = true,
      addMarkup = true,
      markupPercentage = this.defaultMarkupPercentage,
    } = options;

    // Step 1: Apply basic processing
    let processedProduct = await this.applyBasicProcessing(rawProduct, {
      addMarkup,
      markupPercentage,
      processImages,
    });

    // Step 2: Apply Romanian defaults
    if (applyRomanianDefaults) {
      processedProduct = this.applyRomanianDefaults(processedProduct);
    }

    // Step 3: AI Enhancement (if enabled)
    if (includeAIEnhancement) {
      try {
        processedProduct = await this.applyAIEnhancement(processedProduct);
      } catch (error) {
        console.warn("AI enhancement failed, using basic processing:", error);
      }
    }

    // Step 4: Final validation and cleanup
    processedProduct = this.finalizeProduct(processedProduct);

    return processedProduct;
  }

  /**
   * Apply basic processing (price conversion, images, etc.)
   */
  private async applyBasicProcessing(
    rawProduct: any,
    options: {
      addMarkup: boolean;
      markupPercentage: number;
      processImages: boolean;
    }
  ): Promise<ProcessedProduct> {
    const { addMarkup, markupPercentage, processImages } = options;

    // Enhanced price conversion with dynamic currency detection
    let price: number;
    let compareAtPrice: number | undefined;
    const detectedCurrency = this.currencyService.detectCurrency(rawProduct);

    try {
      const priceConversion = await this.currencyService.convertToRON(
        rawProduct.price,
        detectedCurrency,
        addMarkup ? markupPercentage : 0
      );
      price = priceConversion.finalAmount;

      if (rawProduct.compareAtPrice) {
        const compareAtPriceConversion =
          await this.currencyService.convertToRON(
            rawProduct.compareAtPrice,
            detectedCurrency,
            addMarkup ? markupPercentage : 0
          );
        compareAtPrice = compareAtPriceConversion.finalAmount;
      }
    } catch (error) {
      console.warn("Currency conversion failed, using fallback:", error);
      // Fallback to simple conversion
      const rate = detectedCurrency === "RON" ? 1 : 4.5; // Simple fallback
      price =
        rawProduct.price * rate * (addMarkup ? 1 + markupPercentage / 100 : 1);
      compareAtPrice = rawProduct.compareAtPrice
        ? rawProduct.compareAtPrice *
          rate *
          (addMarkup ? 1 + markupPercentage / 100 : 1)
        : undefined;
    }

    // Process images for UploadThing
    let images: string[] = [];
    if (processImages && rawProduct.images) {
      images = this.processImagesForUploadThing(rawProduct.images);
    }

    // Generate slug
    const slug = this.generateSlug(rawProduct.name);

    return {
      // Core fields
      name: rawProduct.name,
      slug,
      description: rawProduct.description || "",
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      compareAtPrice: compareAtPrice
        ? Math.round(compareAtPrice * 100) / 100
        : undefined,
      sku: rawProduct.sku || undefined,
      images,
      categoryId: rawProduct.categoryId,
      tags: rawProduct.tags || [],
      attributes: rawProduct.attributes || {},
      metadata: rawProduct.metadata || {},
      isActive: rawProduct.isActive !== undefined ? rawProduct.isActive : true,
      featured: false, // ALWAYS false for bulk uploads
      stockQuantity: rawProduct.stockQuantity || 0,
      reservedQuantity: 0, // Default as requested
      reorderPoint: rawProduct.reorderPoint,
      weight: rawProduct.weight || 0.8, // Default 0.8 kg as requested
      dimensions: rawProduct.dimensions,
      averageRating: undefined,
      reviewCount: 0, // Default as requested
      totalSold: 0, // Default as requested
      createdAt: new Date(),
      updatedAt: new Date(),
      barcode: rawProduct.barcode || null,

      // Enhanced categorization
      ageGroup: rawProduct.ageGroup,
      learningOutcomes: rawProduct.learningOutcomes || [],
      productType: rawProduct.productType,
      specialCategories: ["NEW_ARRIVALS"], // ALL products get NEW_ARRIVALS as requested
      stemDiscipline: rawProduct.stemDiscipline || "GENERAL",
      supplierId: rawProduct.supplierId || null,

      // Romanian educational fields
      romanianCompetencies: rawProduct.romanianCompetencies || [],
      romanianCurriculumAlignment: rawProduct.romanianCurriculumAlignment || [],
      romanianEducationalCertification:
        rawProduct.romanianEducationalCertification,
      romanianEducationalLevel: rawProduct.romanianEducationalLevel,
      romanianMinistryApproval: rawProduct.romanianMinistryApproval || false,
      romanianParentGuides: rawProduct.romanianParentGuides || [],
      romanianSubjectAreas: rawProduct.romanianSubjectAreas || [],
      romanianTeacherResources: rawProduct.romanianTeacherResources || [],
      status: "APPROVED", // Admin uploads are automatically approved
      compareAtPriceCurrency: "RON",
      priceCurrency: "RON",
      imageMetadata: [],
    };
  }

  /**
   * Apply Romanian market defaults
   */
  private applyRomanianDefaults(product: ProcessedProduct): ProcessedProduct {
    return {
      ...product,
      // Ensure Romanian compliance
      romanianMinistryApproval: product.romanianMinistryApproval || false,
      romanianEducationalCertification:
        product.romanianEducationalCertification || "Certificat MECTS",

      // Ensure proper currency
      priceCurrency: "RON",
      compareAtPriceCurrency: "RON",

      // Ensure proper status
      status: "APPROVED",

      // Ensure featured is false
      featured: false,

      // Ensure special categories include NEW_ARRIVALS
      specialCategories: product.specialCategories.includes("NEW_ARRIVALS")
        ? product.specialCategories
        : [...product.specialCategories, "NEW_ARRIVALS"],
    };
  }

  /**
   * Apply AI enhancement
   */
  private async applyAIEnhancement(
    product: ProcessedProduct
  ): Promise<ProcessedProduct> {
    try {
      // For testing, skip AI enhancement to avoid memory issues
      if (process.env.NODE_ENV === "development") {
        console.log("Skipping AI enhancement in development mode");
        return product;
      }

      const prompt = formatPrompt(PRODUCT_STRUCTURE_PROMPT.user, {
        productData: JSON.stringify(product, null, 2),
      });

      const aiResponse = await this.aiService.generateWithSystemPrompt(
        PRODUCT_STRUCTURE_PROMPT.system,
        prompt
      );

      // Parse AI response and merge with existing product
      const aiEnhancedData = this.parseAIResponse(aiResponse);

      return {
        ...product,
        ...aiEnhancedData,
        // Ensure critical fields are not overridden
        featured: false,
        reservedQuantity: 0,
        reviewCount: 0,
        totalSold: 0,
        status: "APPROVED",
        priceCurrency: "RON",
        compareAtPriceCurrency: "RON",
        specialCategories: ["NEW_ARRIVALS"],
      };
    } catch (error) {
      console.error("AI enhancement failed:", error);
      return product;
    }
  }

  /**
   * Finalize product with validation
   */
  private finalizeProduct(product: ProcessedProduct): ProcessedProduct {
    // Ensure productType is valid
    const validProductTypes = [
      "ROBOTICS",
      "PUZZLES",
      "CONSTRUCTION_SETS",
      "EXPERIMENT_KITS",
      "BOARD_GAMES",
    ];
    if (
      product.productType &&
      !validProductTypes.includes(product.productType)
    ) {
      product.productType = undefined;
    }

    // Ensure ageGroup is valid
    const validAgeGroups = [
      "TODDLERS_1_3",
      "PRESCHOOL_3_5",
      "ELEMENTARY_6_8",
      "MIDDLE_SCHOOL_9_12",
      "TEENS_13_PLUS",
    ];
    if (product.ageGroup && !validAgeGroups.includes(product.ageGroup)) {
      product.ageGroup = undefined;
    }

    // Ensure stemDiscipline is valid
    const validStemDisciplines = [
      "SCIENCE",
      "TECHNOLOGY",
      "ENGINEERING",
      "MATHEMATICS",
      "GENERAL",
    ];
    if (!validStemDisciplines.includes(product.stemDiscipline)) {
      product.stemDiscipline = "GENERAL";
    }

    // Ensure learningOutcomes are valid
    const validLearningOutcomes = [
      "PROBLEM_SOLVING",
      "CREATIVITY",
      "CRITICAL_THINKING",
      "MOTOR_SKILLS",
      "LOGIC",
      "ANALYTICAL_THINKING",
      "COLLABORATION",
      "COMMUNICATION",
      "DIGITAL_LITERACY",
      "CODING_THINKING",
    ];
    product.learningOutcomes = product.learningOutcomes.filter(outcome =>
      validLearningOutcomes.includes(outcome)
    );

    // Ensure specialCategories are valid
    const validSpecialCategories = [
      "NEW_ARRIVALS",
      "BEST_SELLERS",
      "GIFT_IDEAS",
      "SALE_ITEMS",
    ];
    product.specialCategories = product.specialCategories.filter(cat =>
      validSpecialCategories.includes(cat)
    );

    // Ensure NEW_ARRIVALS is always present
    if (!product.specialCategories.includes("NEW_ARRIVALS")) {
      product.specialCategories.push("NEW_ARRIVALS");
    }

    return product;
  }

  /**
   * Process images for UploadThing integration
   */
  private processImagesForUploadThing(images: string[]): string[] {
    return images.map(imageUrl => {
      // If it's already an UploadThing URL, return as is
      if (imageUrl.includes("ufs.sh") || imageUrl.includes("uploadthing")) {
        return imageUrl;
      }

      // If it's a regular URL, you might want to upload it to UploadThing
      // For now, we'll return the original URL
      return imageUrl;
    });
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Parse AI response (simplified - you might want to use JSON parsing)
   */
  private parseAIResponse(response: string): Partial<ProcessedProduct> {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      // If not JSON, try to extract key-value pairs
      const result: Partial<ProcessedProduct> = {};

      // Extract tags
      const tagsMatch = response.match(/tags?[:\s]*\[(.*?)\]/i);
      if (tagsMatch) {
        result.tags = tagsMatch[1]
          .split(",")
          .map(tag => tag.trim().replace(/['"]/g, ""))
          .filter(tag => tag.length > 0);
      }

      // Extract description
      const descMatch = response.match(/description[:\s]*["'](.*?)["']/i);
      if (descMatch) {
        result.description = descMatch[1];
      }

      return result;
    }
  }

  /**
   * Process multiple products in batch
   */
  async processProductsBatch(
    products: any[],
    options: ProductProcessingOptions = {}
  ): Promise<ProcessedProduct[]> {
    const results: ProcessedProduct[] = [];

    for (const product of products) {
      try {
        const processed = await this.processProduct(product, options);
        results.push(processed);
      } catch (error) {
        console.error(`Failed to process product ${product.name}:`, error);
        // Add a basic processed version as fallback
        results.push(
          await this.applyBasicProcessing(product, {
            addMarkup: options.addMarkup ?? true,
            markupPercentage:
              options.markupPercentage ?? this.defaultMarkupPercentage,
            processImages: options.processImages ?? true,
          })
        );
      }
    }

    return results;
  }
}
