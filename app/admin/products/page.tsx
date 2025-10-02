import { Plus } from "lucide-react";
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
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";

import { EnhancedProductFilter } from "@/components/admin/EnhancedProductFilter";
import { ProductGrid } from "@/components/admin/ProductGrid";
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

// Function to fetch products from the database with pagination
async function getProducts(filters?: {
  q?: string;
  status?: string;
  supplierId?: string;
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; pagination: any }> {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

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

    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          supplier: { select: { id: true, companyName: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return {
      products: products as Product[],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: offset + limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
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
  const page = resolvedSearchParams?.page
    ? Number(resolvedSearchParams.page)
    : 1;
  const limit = resolvedSearchParams?.limit
    ? Number(resolvedSearchParams.limit)
    : 20;

  const { products, pagination } = await getProducts({
    q,
    status,
    supplierId,
    categoryId,
    priceMin,
    priceMax,
    page,
    limit,
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
          <EnhancedProductFilter
            suppliers={suppliers}
            categories={_categories}
            totalResults={pagination.totalCount}
          />
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
          <ProductGrid products={products} status="APPROVED" title="Aprobate" />

          <ProductGrid
            products={products}
            status="PENDING_APPROVAL"
            title="În Așteptare"
          />

          <ProductGrid products={products} status="REJECTED" title="Respinse" />

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                baseUrl="/admin/products"
                searchParams={{
                  ...(q && { q }),
                  ...(status && status !== "all" && { status }),
                  ...(supplierId && supplierId !== "all" && { supplierId }),
                  ...(categoryId && categoryId !== "all" && { categoryId }),
                  ...(priceMin && { priceMin: priceMin.toString() }),
                  ...(priceMax && { priceMax: priceMax.toString() }),
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
