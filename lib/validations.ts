import { z } from "zod";

// Common validation schemas that can be reused across the application

// User validation schemas
export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Address validation schemas
export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  addressLine1: z.string().min(5, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Please enter a valid Romanian postal code (6 digits)"),
  country: z.string().min(2, "Country is required"),
  phone: z
    .string()
    .regex(
      /^(07\d{8}|\+407\d{8}|0\d{9})$/,
      "Please enter a valid Romanian phone number"
    ),
});

// Product validation schemas
export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url("Please enter a valid URL")).optional(),
  stock: z.number().int().nonnegative("Stock must be zero or positive"),
  dimensions: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
      depth: z.number().positive(),
    })
    .optional(),
  weight: z.number().positive().optional(),
  ageRange: z
    .object({
      min: z.number().int().nonnegative(),
      max: z.number().int().positive(),
    })
    .refine((data) => data.min < data.max, {
      message: "Minimum age must be less than maximum age",
    })
    .optional(),
});

// Cart validation schemas
export const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
});

export const cartSchema = z.array(cartItemSchema);

// Shipping validation schemas
export const shippingMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
  estimatedDelivery: z.string(),
});

// Payment validation schemas
export const cardSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, "Card number must be 16 digits")
    .or(z.string().regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)),
  cardholderName: z.string().min(2, "Cardholder name is required"),
  expiryDate: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be in MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
});

// Order validation schemas
export const orderSchema = z.object({
  shippingAddress: addressSchema,
  shippingMethod: shippingMethodSchema,
  billingAddressSameAsShipping: z.boolean().default(true),
  billingAddress: addressSchema.optional(),
  orderDate: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});
