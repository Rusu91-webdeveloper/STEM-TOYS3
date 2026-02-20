export interface HomeBundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  nameRo?: string | null;
  descriptionRo?: string | null;
  nameEn?: string | null;
  descriptionEn?: string | null;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  bundleDiscount?: number | null;
  stockQuantity: number;
}
