import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";

// Validation schema
const productSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be 1000 characters or less"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  priceCurrency: z.enum(["EUR", "RON"]),
  stockQuantity: z.number().min(0, "Stock cannot be negative"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  sku: z.string().max(50, "SKU must be 50 characters or less").optional(),
  categoryId: z.string().optional(),
  compareAtPrice: z.number().min(0.01).optional(),
  weight: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  ageGroup: z
    .enum([
      "TODDLERS_1_3",
      "PRESCHOOL_3_5",
      "ELEMENTARY_6_8",
      "MIDDLE_SCHOOL_9_12",
      "TEENS_13_PLUS",
    ])
    .optional(),
  stemDiscipline: z
    .enum(["SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"])
    .optional(),
  productType: z
    .enum([
      "ROBOTICS",
      "PUZZLES",
      "CONSTRUCTION_SETS",
      "EXPERIMENT_KITS",
      "BOARD_GAMES",
    ])
    .optional(),
  learningOutcomes: z
    .array(
      z.enum([
        "PROBLEM_SOLVING",
        "CREATIVITY",
        "CRITICAL_THINKING",
        "MOTOR_SKILLS",
        "LOGIC",
      ])
    )
    .optional(),
  specialCategories: z
    .array(z.enum(["NEW_ARRIVALS", "BEST_SELLERS", "GIFT_IDEAS", "SALE_ITEMS"]))
    .optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();

    // Validate
    try {
      productSchema.parse(body);

      // Additional custom validations
      const warnings = [];

      if (body.compareAtPrice && body.compareAtPrice <= body.price) {
        warnings.push({
          field: "compareAtPrice",
          message: "Compare at price should be greater than regular price",
          code: "INVALID_DISCOUNT",
        });
      }

      if (!body.ageGroup) {
        warnings.push({
          field: "ageGroup",
          message: "Age group not set - recommended for better visibility",
          code: "MISSING_RECOMMENDED",
        });
      }

      if (!body.stemDiscipline || body.stemDiscipline === "GENERAL") {
        warnings.push({
          field: "stemDiscipline",
          message:
            "STEM discipline not specified - recommended for educational products",
          code: "MISSING_RECOMMENDED",
        });
      }

      return NextResponse.json({
        valid: true,
        errors: [],
        warnings,
        summary: {
          totalErrors: 0,
          totalWarnings: warnings.length,
          isValid: true,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return NextResponse.json({
          valid: false,
          errors: formattedErrors,
          warnings: [],
          summary: {
            totalErrors: formattedErrors.length,
            totalWarnings: 0,
            isValid: false,
          },
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Error validating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
