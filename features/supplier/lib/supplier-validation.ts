import { z } from "zod";

// Supplier registration validation schema - International friendly
export const supplierRegistrationSchema = z.object({
  // Company Information
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  website: z
    .string()
    .url("Please enter a valid website URL")
    .optional()
    .or(z.literal("")),

  // Phone - International format
  phone: z
    .string()
    .min(8, "Phone number must be at least 8 characters")
    .max(20, "Phone number must be less than 20 characters")
    .regex(
      /^[\+]?[1-9][\d]{0,15}$/,
      "Please enter a valid international phone number"
    ),

  // VAT/Tax ID - Any country format
  vatNumber: z
    .string()
    .max(50, "VAT/Tax ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  // Tax ID - Any country format
  taxId: z
    .string()
    .max(50, "Tax ID must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  // Business Address - Flexible international format
  businessAddress: z
    .string()
    .min(5, "Business address must be at least 5 characters")
    .max(200, "Business address must be less than 200 characters"),
  businessCity: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must be less than 50 characters"),
  businessState: z
    .string()
    .min(2, "State/Province must be at least 2 characters")
    .max(50, "State/Province must be less than 50 characters"),
  businessCountry: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(50, "Country must be less than 50 characters"),

  // Postal Code - Flexible international format
  businessPostalCode: z
    .string()
    .min(3, "Postal code must be at least 3 characters")
    .max(15, "Postal code must be less than 15 characters"),

  // Contact Person
  contactPersonName: z
    .string()
    .min(2, "Contact person name must be at least 2 characters")
    .max(100, "Contact person name must be less than 100 characters"),
  contactPersonEmail: z.string().email("Please enter a valid email address"),

  // Contact Phone - International format
  contactPersonPhone: z
    .string()
    .min(8, "Contact phone must be at least 8 characters")
    .max(20, "Contact phone must be less than 20 characters")
    .regex(
      /^[\+]?[1-9][\d]{0,15}$/,
      "Please enter a valid international phone number"
    ),

  // Business Details - All optional
  yearEstablished: z
    .number()
    .min(1900, "Year established must be after 1900")
    .max(new Date().getFullYear(), "Year established cannot be in the future")
    .optional(),
  employeeCount: z
    .number()
    .min(1, "Employee count must be at least 1")
    .max(100000, "Employee count must be less than 100,000")
    .optional(),
  annualRevenue: z
    .string()
    .max(50, "Annual revenue must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  certifications: z
    .array(z.string())
    .max(10, "Maximum 10 certifications allowed")
    .default([]),
  productCategories: z
    .array(z.string())
    .min(1, "At least one product category is required")
    .max(20, "Maximum 20 product categories allowed"),

  // Legal - Required
  termsAccepted: z.boolean().refine(value => value === true, {
    message: "You must accept the terms and conditions",
  }),
  privacyAccepted: z.boolean().refine(value => value === true, {
    message: "You must accept the privacy policy",
  }),
});

// Supplier profile update schema (for existing suppliers)
export const supplierProfileUpdateSchema = supplierRegistrationSchema
  .partial()
  .extend({
    logo: z
      .instanceof(File)
      .refine(
        file => file.size <= 5 * 1024 * 1024,
        "Logo must be less than 5MB"
      )
      .refine(
        file => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
        "Logo must be a JPEG, PNG, or WebP image"
      )
      .optional(),
    catalogUrl: z
      .string()
      .url("Please enter a valid catalog URL")
      .optional()
      .or(z.literal("")),
  });

// Supplier order status update schema
export const supplierOrderStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PRODUCTION",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  trackingNumber: z
    .string()
    .max(100, "Tracking number must be less than 100 characters")
    .optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// Product upload schema
export const supplierProductSchema = z
  .object({
    name: z
      .string()
      .min(3, "Product name must be at least 3 characters")
      .max(200, "Product name must be less than 200 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be less than 2000 characters"),
    price: z
      .number()
      .positive("Price must be a positive number")
      .max(10000, "Price must be less than 10,000"),
    categoryId: z.string().min(1, "Category is required"),
    stock: z
      .number()
      .int()
      .nonnegative("Stock must be zero or positive")
      .max(10000, "Stock must be less than 10,000"),
    images: z
      .array(z.string().url("Please enter a valid image URL"))
      .max(10, "Maximum 10 images allowed")
      .optional(),
    tags: z.array(z.string()).max(20, "Maximum 20 tags allowed").optional(),
    ageRangeMin: z
      .number()
      .int()
      .nonnegative("Minimum age must be zero or positive")
      .max(18, "Minimum age must be 18 or less")
      .optional(),
    ageRangeMax: z
      .number()
      .int()
      .positive("Maximum age must be positive")
      .max(18, "Maximum age must be 18 or less")
      .optional(),
  })
  .refine(
    data => {
      if (data.ageRangeMin !== undefined && data.ageRangeMax !== undefined) {
        return data.ageRangeMin < data.ageRangeMax;
      }
      return true;
    },
    {
      message: "Minimum age must be less than maximum age",
      path: ["ageRangeMax"],
    }
  );

export type SupplierRegistrationFormData = z.infer<
  typeof supplierRegistrationSchema
>;
export type SupplierProfileUpdateFormData = z.infer<
  typeof supplierProfileUpdateSchema
>;
export type SupplierOrderStatusUpdateFormData = z.infer<
  typeof supplierOrderStatusUpdateSchema
>;
export type SupplierProductFormData = z.infer<typeof supplierProductSchema>;
