import { NextRequest } from "next/server";
import { z } from "zod";

// Common validation patterns
const idSchema = z.string().min(1, "ID is required");
const emailSchema = z.string().email("Invalid email format");
const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone format")
  .optional();
const urlSchema = z.string().url("Invalid URL format").optional();

// Pagination schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

// Product API validation schemas
export const productQuerySchema = z
  .object({
    category: z.string().max(100).optional(),
    featured: z.enum(["true", "false"]).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(["name", "price", "created", "featured"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
  })
  .refine(
    (data) => {
      // Ensure maxPrice is greater than minPrice if both are provided
      if (data.minPrice && data.maxPrice) {
        return data.maxPrice >= data.minPrice;
      }
      return true;
    },
    {
      message: "maxPrice must be greater than or equal to minPrice",
      path: ["maxPrice"],
    }
  );

export const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z.string().min(1, "Product slug is required").max(200),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0).optional(),
  categoryId: idSchema,
  tags: z.array(z.string().max(50)).max(10).default([]),
  images: z.array(z.string().url()).max(10).default([]),
  attributes: z.record(z.any()).optional(),
  sku: z.string().max(100).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  weight: z.number().min(0).optional(),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// User/Auth API validation schemas
export const userRegistrationSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
  })
  .refine(
    (data) => {
      // Password strength validation
      const hasUpperCase = /[A-Z]/.test(data.password);
      const hasLowerCase = /[a-z]/.test(data.password);
      const hasNumbers = /\d/.test(data.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(data.password);

      return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    },
    {
      message:
        "Password must contain uppercase, lowercase, number, and special character",
      path: ["password"],
    }
  );

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const passwordResetSchema = z.object({
  email: emailSchema,
});

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
  })
  .refine(
    (data) => {
      // Password strength validation
      const hasUpperCase = /[A-Z]/.test(data.password);
      const hasLowerCase = /[a-z]/.test(data.password);
      const hasNumbers = /\d/.test(data.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(data.password);

      return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    },
    {
      message:
        "Password must contain uppercase, lowercase, number, and special character",
      path: ["password"],
    }
  );

// Order API validation schemas
export const orderCreateSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: idSchema.optional(),
          bookId: idSchema.optional(),
          quantity: z.number().int().min(1).max(100),
          price: z.number().min(0),
        })
      )
      .min(1, "At least one item is required"),
    shippingAddressId: idSchema,
    billingAddressId: idSchema.optional(),
    couponCode: z.string().max(50).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => 
      // Ensure each item has either productId or bookId
       data.items.every((item) => item.productId || item.bookId)
    ,
    {
      message: "Each item must have either productId or bookId",
      path: ["items"],
    }
  );

// Address validation schema
export const addressSchema = z.object({
  name: z.string().min(1, "Address name is required").max(50),
  fullName: z.string().min(1, "Full name is required").max(100),
  addressLine1: z.string().min(1, "Address line 1 is required").max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  phone: phoneSchema,
  isDefault: z.boolean().default(false),
});

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: emailSchema,
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(2000),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: emailSchema,
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  categories: z.array(z.string().max(50)).max(10).default([]),
});

// Review schema
export const reviewSchema = z.object({
  productId: idSchema,
  orderItemId: idSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1, "Review title is required").max(200),
  content: z.string().min(1, "Review content is required").max(2000),
});

// Coupon validation schema
export const couponValidationSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50),
  cartTotal: z.number().min(0).optional(),
});

// Admin schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  slug: z.string().min(1, "Category slug is required").max(100),
  description: z.string().max(500).optional(),
  parentId: idSchema.optional(),
  image: urlSchema,
  isActive: z.boolean().default(true),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .refine((file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      return allowedTypes.includes(file.type);
    }, "File must be an image (JPEG, PNG, WebP, or GIF)"),
});

// Helper function to validate query parameters from NextRequest
export function validateQueryParams<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[]> = {};

    // Convert URLSearchParams to object
    for (const [key, value] of searchParams.entries()) {
      if (params[key]) {
        // Handle multiple values for the same key
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    }

    const result = schema.parse(params);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}

// Helper function to validate JSON body from NextRequest
export async function validateRequestBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<
  { success: true; data: z.infer<T> } | { success: false; errors: string[] }
> {
  try {
    const body = await request.json();
    const result = schema.parse(body);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return { success: false, errors };
    }
    if (error instanceof SyntaxError) {
      return { success: false, errors: ["Invalid JSON format"] };
    }
    return { success: false, errors: ["Request body validation failed"] };
  }
}

// Common error response helper
export function createValidationErrorResponse(errors: string[]) {
  return Response.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status: 400 }
  );
}

// Common success response helper
export function createSuccessResponse<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}

// Types for commonly used validated data
export type ValidatedProductQuery = z.infer<typeof productQuerySchema>;
export type ValidatedProductCreate = z.infer<typeof productCreateSchema>;
export type ValidatedUserRegistration = z.infer<typeof userRegistrationSchema>;
export type ValidatedUserLogin = z.infer<typeof userLoginSchema>;
export type ValidatedAddress = z.infer<typeof addressSchema>;
export type ValidatedOrderCreate = z.infer<typeof orderCreateSchema>;
export type ValidatedContactForm = z.infer<typeof contactFormSchema>;
export type ValidatedNewsletter = z.infer<typeof newsletterSchema>;
export type ValidatedReview = z.infer<typeof reviewSchema>;
export type ValidatedCategoryCreate = z.infer<typeof categoryCreateSchema>;
