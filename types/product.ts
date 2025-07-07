import { Book } from "./book";

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
  translationKey?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  categoryId?: string;
  category?: string;
  tags?: string[];
  attributes?: {
    [key: string]: string;
  };
  variants?: ProductVariant[];
  isActive?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  ageRange?: string;
  stemCategory?:
    | "science"
    | "technology"
    | "engineering"
    | "mathematics"
    | string;
  rating?: number;
  reviewCount?: number;
  stockQuantity?: number;
  reservedQuantity?: number;
  isBook?: boolean;
  book?: Book;
}
