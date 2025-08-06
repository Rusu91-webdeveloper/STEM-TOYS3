import {
  AgeGroup,
  LearningOutcome,
  ProductType,
  SpecialCategory,
  StemCategory,
} from "@prisma/client";

// Age Group Constants
export const AGE_GROUPS = {
  TODDLERS_1_3: "TODDLERS_1_3",
  PRESCHOOL_3_5: "PRESCHOOL_3_5",
  ELEMENTARY_6_8: "ELEMENTARY_6_8",
  MIDDLE_SCHOOL_9_12: "MIDDLE_SCHOOL_9_12",
  TEENS_13_PLUS: "TEENS_13_PLUS",
} as const;

// Age Group Display Names
export const AGE_GROUP_DISPLAY_NAMES: Record<AgeGroup, string> = {
  TODDLERS_1_3: "Toddlers (1-3)",
  PRESCHOOL_3_5: "Preschool (3-5)",
  ELEMENTARY_6_8: "Elementary (6-8)",
  MIDDLE_SCHOOL_9_12: "Middle School (9-12)",
  TEENS_13_PLUS: "Teens (13+)",
};

// STEM Discipline Display Names
export const STEM_DISCIPLINE_DISPLAY_NAMES: Record<StemCategory, string> = {
  SCIENCE: "Science",
  TECHNOLOGY: "Technology",
  ENGINEERING: "Engineering",
  MATHEMATICS: "Mathematics",
  GENERAL: "General",
};

// Learning Outcome Display Names
export const LEARNING_OUTCOME_DISPLAY_NAMES: Record<LearningOutcome, string> = {
  PROBLEM_SOLVING: "Problem Solving",
  CREATIVITY: "Creativity",
  CRITICAL_THINKING: "Critical Thinking",
  MOTOR_SKILLS: "Motor Skills",
  LOGIC: "Logic",
};

// Product Type Display Names
export const PRODUCT_TYPE_DISPLAY_NAMES: Record<ProductType, string> = {
  ROBOTICS: "Robotics",
  PUZZLES: "Puzzles",
  CONSTRUCTION_SETS: "Construction Sets",
  EXPERIMENT_KITS: "Experiment Kits",
  BOARD_GAMES: "Board Games",
};

// Special Category Display Names
export const SPECIAL_CATEGORY_DISPLAY_NAMES: Record<SpecialCategory, string> = {
  NEW_ARRIVALS: "New Arrivals",
  BEST_SELLERS: "Best Sellers",
  GIFT_IDEAS: "Gift Ideas",
  SALE_ITEMS: "Sale Items",
};

// Helper Functions
export function getAgeGroupDisplayName(ageGroup: AgeGroup): string {
  return AGE_GROUP_DISPLAY_NAMES[ageGroup];
}

export function getStemDisciplineDisplayName(
  stemDiscipline: StemCategory
): string {
  return STEM_DISCIPLINE_DISPLAY_NAMES[stemDiscipline];
}

export function getLearningOutcomeDisplayName(
  learningOutcome: LearningOutcome
): string {
  return LEARNING_OUTCOME_DISPLAY_NAMES[learningOutcome];
}

export function getProductTypeDisplayName(productType: ProductType): string {
  return PRODUCT_TYPE_DISPLAY_NAMES[productType];
}

export function getSpecialCategoryDisplayName(
  specialCategory: SpecialCategory
): string {
  return SPECIAL_CATEGORY_DISPLAY_NAMES[specialCategory];
}

// Filter Helper Functions
export function filterProductsByAgeGroup(products: any[], ageGroup: AgeGroup) {
  return products.filter(product => product.ageGroup === ageGroup);
}

export function filterProductsByStemDiscipline(
  products: any[],
  stemDiscipline: StemCategory
) {
  return products.filter(product => product.stemDiscipline === stemDiscipline);
}

export function filterProductsByLearningOutcome(
  products: any[],
  learningOutcome: LearningOutcome
) {
  return products.filter(product =>
    product.learningOutcomes?.includes(learningOutcome)
  );
}

export function filterProductsByProductType(
  products: any[],
  productType: ProductType
) {
  return products.filter(product => product.productType === productType);
}

export function filterProductsBySpecialCategory(
  products: any[],
  specialCategory: SpecialCategory
) {
  return products.filter(product =>
    product.specialCategories?.includes(specialCategory)
  );
}

// Multi-filter function
export function filterProductsByMultipleCriteria(
  products: any[],
  filters: {
    ageGroup?: AgeGroup;
    stemDiscipline?: StemCategory;
    learningOutcomes?: LearningOutcome[];
    productType?: ProductType;
    specialCategories?: SpecialCategory[];
  }
) {
  return products.filter(product => {
    if (filters.ageGroup && product.ageGroup !== filters.ageGroup) return false;
    if (
      filters.stemDiscipline &&
      product.stemDiscipline !== filters.stemDiscipline
    )
      return false;
    if (filters.learningOutcomes && filters.learningOutcomes.length > 0) {
      const hasLearningOutcome = filters.learningOutcomes.some(outcome =>
        product.learningOutcomes?.includes(outcome)
      );
      if (!hasLearningOutcome) return false;
    }
    if (filters.productType && product.productType !== filters.productType)
      return false;
    if (filters.specialCategories && filters.specialCategories.length > 0) {
      const hasSpecialCategory = filters.specialCategories.some(category =>
        product.specialCategories?.includes(category)
      );
      if (!hasSpecialCategory) return false;
    }
    return true;
  });
}

// Get all available options for filters
export function getAvailableFilterOptions(products: any[]) {
  const ageGroups = new Set<AgeGroup>();
  const stemDisciplines = new Set<StemCategory>();
  const learningOutcomes = new Set<LearningOutcome>();
  const productTypes = new Set<ProductType>();
  const specialCategories = new Set<SpecialCategory>();

  products.forEach(product => {
    if (product.ageGroup) ageGroups.add(product.ageGroup);
    if (product.stemDiscipline) stemDisciplines.add(product.stemDiscipline);
    if (product.learningOutcomes) {
      product.learningOutcomes.forEach((outcome: LearningOutcome) =>
        learningOutcomes.add(outcome)
      );
    }
    if (product.productType) productTypes.add(product.productType);
    if (product.specialCategories) {
      product.specialCategories.forEach((category: SpecialCategory) =>
        specialCategories.add(category)
      );
    }
  });

  return {
    ageGroups: Array.from(ageGroups),
    stemDisciplines: Array.from(stemDisciplines),
    learningOutcomes: Array.from(learningOutcomes),
    productTypes: Array.from(productTypes),
    specialCategories: Array.from(specialCategories),
  };
}
