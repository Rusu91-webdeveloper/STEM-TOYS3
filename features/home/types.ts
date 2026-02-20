export interface HomeBundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  bundleDiscount?: number | null;
  stockQuantity: number;
}
