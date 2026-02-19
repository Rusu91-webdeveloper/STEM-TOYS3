// import { Book } from "./book";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  inventory?: number;
  attributes?: {
    [key: string]: string;
  };
  isAvailable?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceCurrency?: string; // Currency of the price (EUR or RON)
  compareAtPrice?: number;
  compareAtPriceCurrency?: string; // Currency of compare price
  sku?: string;
  barcode?: string; // GTIN-compatible identifier
  images: string[];
  metadata?: Record<string, any> | string;
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
  tags: string[];
  attributes?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stockQuantity: number;
  reservedQuantity: number;
  featured: boolean;
  isBundle?: boolean;
  bundleItems?: string[];
  bundleDiscount?: number;
  isBook?: boolean;
  // Logistics / physical specs
  weight?: number;
  dimensions?: Record<string, any>;
  // Ratings
  averageRating?: number;
  reviewCount?: number;
  totalSold?: number;
  // Supplier / brand
  supplier?: {
    id?: string;
    companyName: string;
    companySlug: string;
  };
  // Media metadata
  imageMetadata?: Array<{
    originalUrl?: string;
    alt?: string;
    tags?: string[];
  }>;
  // stemCategory?: string; // DEPRECATED: Use stemDiscipline instead
  ageRange?: string;
  // Enhanced categorization fields
  ageGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  stemDiscipline?:
    | "SCIENCE"
    | "TECHNOLOGY"
    | "ENGINEERING"
    | "MATHEMATICS"
    | "GENERAL";
  learningOutcomes?: (
    | "PROBLEM_SOLVING"
    | "CREATIVITY"
    | "CRITICAL_THINKING"
    | "MOTOR_SKILLS"
    | "LOGIC"
  )[];
  productType?:
    | "ROBOTICS"
    | "PUZZLES"
    | "CONSTRUCTION_SETS"
    | "EXPERIMENT_KITS"
    | "BOARD_GAMES";
  specialCategories?: (
    | "NEW_ARRIVALS"
    | "BEST_SELLERS"
    | "GIFT_IDEAS"
    | "SALE_ITEMS"
  )[];
  // Romanian education context
  romanianCompetencies?: string[];
  romanianCurriculumAlignment?: string[];
  romanianEducationalCertification?: string;
  romanianEducationalLevel?:
    | "GRADINITA"
    | "PRIMAR"
    | "GIMNAZIU"
    | "LICEU"
    | "UNIVERSITATE";
  romanianMinistryApproval?: boolean;
  romanianParentGuides?: string[];
  romanianSubjectAreas?: string[];
  romanianTeacherResources?: string[];
}
