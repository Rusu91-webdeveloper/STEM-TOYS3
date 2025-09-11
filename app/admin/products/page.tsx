import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import {
  getAgeGroupDisplayName,
  getStemDisciplineDisplayName,
  getProductTypeDisplayName,
  getLearningOutcomeDisplayName,
  getSpecialCategoryDisplayName,
} from "@/lib/utils/product-categorization";

import { ProductDeleteButton } from "./components/ProductDeleteButton";
import { ProductStatusActions } from "./components/ProductStatusActions";
import { ProductFilterBar } from "./components/ProductFilterBar";
import { BulkUploadModal } from "./components/BulkUploadModal";

// Force this page to be dynamic and not cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Add this interface at the top of the file with the imports
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  parentId?: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  priceCurrency?: string; // Currency of the price (EUR or RON)
  description: string;
  category: {
    name: string;
  };
  stockQuantity?: number;
  isActive: boolean;
  images: string[];
  tags?: string[];
  createdAt: Date;
  // New categorization fields
  ageGroup?: string;
  stemDiscipline?: string;
  learningOutcomes?: string[];
  productType?: string;
  specialCategories?: string[];
  status?: string;
  supplier?: {
    id: string;
    companyName: string;
  } | null;
  _count: {
    orderItems: number;
  };
}

// And update the getCategories function return type
async function getCategories(): Promise<Category[]> {
  try {
    // Use db client directly in server component
    const categories = await db.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Function to fetch products from the database
async function getProducts(filters?: {
  q?: string;
  status?: string;
  supplierId?: string;
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
}): Promise<Product[]> {
  try {
    const where: any = {
      isActive: true,
      category: { slug: { not: "educational-books" } },
    };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.supplierId) where.supplierId = filters.supplierId;
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.priceMin != null || filters.priceMax != null) {
        where.price = {} as any;
        if (filters.priceMin != null) where.price.gte = filters.priceMin;
        if (filters.priceMax != null) where.price.lte = filters.priceMax;
      }
      if (filters.q) {
        where.OR = [
          { name: { contains: filters.q, mode: "insensitive" } },
          { description: { contains: filters.q, mode: "insensitive" } },
          { sku: { contains: filters.q, mode: "insensitive" } },
        ];
      }
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        supplier: { select: { id: true, companyName: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return products as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getSuppliers() {
  try {
    const suppliers = await db.supplier.findMany({
      where: { status: { in: ["APPROVED", "PENDING"] } },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    });
    return suppliers;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [] as { id: string; companyName: string }[];
  }
}

// Main component now returns a server component that wraps the client component with CurrencyProvider
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const _categories = await getCategories();
  const resolvedSearchParams = await searchParams;

  const q = (resolvedSearchParams?.q as string) || undefined;
  const status = (resolvedSearchParams?.status as string) || undefined;
  const supplierId = (resolvedSearchParams?.supplierId as string) || undefined;
  const categoryId = (resolvedSearchParams?.categoryId as string) || undefined;
  const priceMin = resolvedSearchParams?.priceMin
    ? Number(resolvedSearchParams.priceMin)
    : undefined;
  const priceMax = resolvedSearchParams?.priceMax
    ? Number(resolvedSearchParams.priceMax)
    : undefined;

  const products = await getProducts({
    q,
    status,
    supplierId,
    categoryId,
    priceMin,
    priceMax,
  });
  const suppliers = await getSuppliers();
  // Get STEM categories for info display
  const stemCategories = await db.category.findMany({
    where: {
      slug: {
        in: [
          "science-kits",
          "engineering-robotics",
          "technology-programming",
          "mathematics",
          "general-stem",
        ],
      },
      isActive: true,
    },
  });

  const formatPrice = (price: number) => {
    // All prices are now stored in RON
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produse STEM</h1>
          <p className="text-muted-foreground">
            Gestionează produsele fizice STEM (jucării educaționale, kituri,
            materiale)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkUploadModal />
          <Button asChild>
            <Link href="/admin/products/create">
              <Plus className="h-4 w-4 mr-2" />
              Adaugă Produs Nou
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtre</CardTitle>
          <CardDescription>Filtrează produsele după criterii</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductFilterBar suppliers={suppliers} categories={_categories} />
        </CardContent>
      </Card>

      {/* STEM Categories Info */}
      {stemCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Categorii STEM Disponibile
            </CardTitle>
            <CardDescription>
              Produsele sunt organizate în aceste categorii STEM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {stemCategories.map(category => (
                <Badge key={category.id} variant="outline">
                  {category.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nu există produse STEM
              </h3>
              <p className="text-muted-foreground mb-4">
                Nu ai încă niciun produs STEM în sistem. Creează primul tău
                produs educațional.
              </p>
              <Button asChild>
                <Link href="/admin/products/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Creează Primul Produs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* Approved */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Aprobate</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products
                .filter(p => p.status === "APPROVED")
                .map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {product.images && product.images.length > 0 ? (
                          <div className="relative w-16 h-20">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover rounded-md border"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-20 bg-muted rounded-md border flex items-center justify-center">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {product.category.name}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="default" className="bg-purple-600">
                              STEM
                            </Badge>
                            <Badge variant="default">Aprobat</Badge>
                            {product.supplier?.companyName && (
                              <Badge variant="outline">
                                {product.supplier.companyName}
                              </Badge>
                            )}
                            <span className="text-sm font-medium text-green-600">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Product Info */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Detalii Produs
                            </span>
                            <Badge variant="outline">
                              {product.stockQuantity ?? 0} în stoc
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        {/* Categorization Badges */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {product.ageGroup && (
                              <Badge variant="secondary" className="text-xs">
                                {getAgeGroupDisplayName(
                                  product.ageGroup as any
                                )}
                              </Badge>
                            )}
                            {product.stemDiscipline && (
                              <Badge variant="secondary" className="text-xs">
                                {getStemDisciplineDisplayName(
                                  product.stemDiscipline as any
                                )}
                              </Badge>
                            )}
                            {product.productType && (
                              <Badge variant="secondary" className="text-xs">
                                {getProductTypeDisplayName(
                                  product.productType as any
                                )}
                              </Badge>
                            )}
                          </div>

                          {/* Learning Outcomes */}
                          {product.learningOutcomes &&
                            product.learningOutcomes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {product.learningOutcomes
                                  .slice(0, 3)
                                  .map(outcome => (
                                    <Badge
                                      key={outcome}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {getLearningOutcomeDisplayName(
                                        outcome as any
                                      )}
                                    </Badge>
                                  ))}
                                {product.learningOutcomes.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.learningOutcomes.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}

                          {/* Special Categories */}
                          {product.specialCategories &&
                            product.specialCategories.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {product.specialCategories.map(category => (
                                  <Badge
                                    key={category}
                                    variant="default"
                                    className="text-xs bg-orange-500"
                                  >
                                    {getSpecialCategoryDisplayName(
                                      category as any
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            )}
                        </div>

                        {/* Sales Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>📦 {product._count.orderItems} vânzări</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🏷️ {product.tags?.length ?? 0} etichete</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <ProductStatusActions productId={product.id} />
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="flex-1"
                          >
                            <Link href={`/admin/products/${product.id}`}>
                              Editează
                            </Link>
                          </Button>

                          <Button asChild variant="outline" size="sm">
                            <Link href={`/products/${product.slug}`}>
                              Vizualizează
                            </Link>
                          </Button>
                        </div>

                        {/* Delete Button - Need client component for functionality */}
                        <div className="pt-2">
                          <ProductDeleteButton
                            productId={product.id}
                            productName={product.name}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Creat la{" "}
                          {new Date(product.createdAt).toLocaleDateString(
                            "ro-RO"
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Pending */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">În Așteptare</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products
                .filter(p => p.status === "PENDING_APPROVAL")
                .map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {product.images && product.images.length > 0 ? (
                          <div className="relative w-16 h-20">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover rounded-md border"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-20 bg-muted rounded-md border flex items-center justify-center">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {product.category.name}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="default" className="bg-purple-600">
                              STEM
                            </Badge>
                            <Badge variant="secondary">În așteptare</Badge>
                            {product.supplier?.companyName && (
                              <Badge variant="outline">
                                {product.supplier.companyName}
                              </Badge>
                            )}
                            <span className="text-sm font-medium text-green-600">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Product Info */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Detalii Produs
                            </span>
                            <Badge variant="outline">
                              {product.stockQuantity ?? 0} în stoc
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        {/* Categorization Badges */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {product.ageGroup && (
                              <Badge variant="secondary" className="text-xs">
                                {getAgeGroupDisplayName(
                                  product.ageGroup as any
                                )}
                              </Badge>
                            )}
                            {product.stemDiscipline && (
                              <Badge variant="secondary" className="text-xs">
                                {getStemDisciplineDisplayName(
                                  product.stemDiscipline as any
                                )}
                              </Badge>
                            )}
                            {product.productType && (
                              <Badge variant="secondary" className="text-xs">
                                {getProductTypeDisplayName(
                                  product.productType as any
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Sales Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>📦 {product._count.orderItems} vânzări</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🏷️ {product.tags?.length ?? 0} etichete</span>
                          </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <ProductStatusActions productId={product.id} />
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="flex-1"
                          >
                            <Link href={`/admin/products/${product.id}`}>
                              Editează
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/products/${product.slug}`}>
                              Vizualizează
                            </Link>
                          </Button>
                        </div>
                        <div className="pt-2">
                          <ProductDeleteButton
                            productId={product.id}
                            productName={product.name}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Creat la{" "}
                          {new Date(product.createdAt).toLocaleDateString(
                            "ro-RO"
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Rejected */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Respinse</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products
                .filter(p => p.status === "REJECTED")
                .map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {product.images && product.images.length > 0 ? (
                          <div className="relative w-16 h-20">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover rounded-md border"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-20 bg-muted rounded-md border flex items-center justify-center">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {product.category.name}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="default" className="bg-purple-600">
                              STEM
                            </Badge>
                            <Badge variant="destructive">Respins</Badge>
                            {product.supplier?.companyName && (
                              <Badge variant="outline">
                                {product.supplier.companyName}
                              </Badge>
                            )}
                            <span className="text-sm font-medium text-green-600">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Detalii Produs
                            </span>
                            <Badge variant="outline">
                              {product.stockQuantity ?? 0} în stoc
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>📦 {product._count.orderItems} vânzări</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🏷️ {product.tags?.length ?? 0} etichete</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <ProductStatusActions productId={product.id} />
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="flex-1"
                          >
                            <Link href={`/admin/products/${product.id}`}>
                              Editează
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/products/${product.slug}`}>
                              Vizualizează
                            </Link>
                          </Button>
                        </div>
                        <div className="pt-2">
                          <ProductDeleteButton
                            productId={product.id}
                            productName={product.name}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Creat la{" "}
                          {new Date(product.createdAt).toLocaleDateString(
                            "ro-RO"
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
