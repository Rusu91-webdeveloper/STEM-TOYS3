import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

import { EnhancedProductFilter } from "@/components/admin/EnhancedProductFilter";
import { ProductGrid } from "@/components/admin/ProductGrid";
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
  featured?: boolean;
  status?: string;
  supplier?: {
    id: string;
    name?: string;
    companyName?: string;
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
    console.error("Admin catalog data failed:", error);
    throw error;
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

    // Include inactive records; educational books have their own catalog.
    const baseConditions: any[] = [
      {
        OR: [
          // Products with no category
          { categoryId: null },
          // Products with category that is not educational-books
          { category: { slug: { not: "educational-books" } } },
        ],
      },
    ];

    // Add search query conditions if provided
    if (filters?.q) {
      baseConditions.push({
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { description: { contains: filters.q, mode: "insensitive" } },
          { sku: { contains: filters.q, mode: "insensitive" } },
        ],
      });
    }

    const where: any = {
      AND: baseConditions,
    };

    // Add additional filters
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.supplierId) {
        where.supplierId = filters.supplierId;
      }
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        where.price = {} as any;
        if (filters.priceMin !== undefined) where.price.gte = filters.priceMin;
        if (filters.priceMax !== undefined) where.price.lte = filters.priceMax;
      }
    }

    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          supplier: {
            select: { id: true, name: true, companyName: true },
          },
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
    console.error("Admin catalog data failed:", error);
    throw error;
  }
}

async function getSuppliers() {
  try {
    const suppliers = await db.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true, companyName: true },
      orderBy: { companyName: "asc" },
    });
    return suppliers;
  } catch (error) {
    console.error("Admin catalog data failed:", error);
    throw error;
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
  const requestedStatus = resolvedSearchParams?.status as string;
  const status = [
    "PUBLISHED",
    "APPROVED",
    "IN_PENDING",
    "REJECTED",
    "DENIED",
  ].includes(requestedStatus)
    ? requestedStatus
    : undefined;
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
          "science",
          "technology",
          "engineering",
          "math",
          "educational-books",
        ],
      },
      isActive: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Produse STEM
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestionează produsele fizice STEM (jucării educaționale, kituri,
            materiale)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BulkUploadModal />
          <Button asChild>
            <Link href="/admin/products/create">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Adaugă Produs Nou</span>
              <span className="sm:hidden">Adaugă</span>
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
                Nu există produse pentru filtrele alese
              </h3>
              <p className="text-muted-foreground mb-4">
                Schimbă filtrele sau adaugă un produs nou în catalog.
              </p>
              <Button asChild>
                <Link href="/admin/products/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă un produs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          <ProductGrid
            products={products}
            status="PUBLISHED"
            title="Publicate"
          />
          <ProductGrid products={products} status="APPROVED" title="Aprobate" />

          <ProductGrid
            products={products}
            status="IN_PENDING"
            title="În Așteptare"
          />

          <ProductGrid products={products} status="REJECTED" title="Respinse" />

          <ProductGrid products={products} status="DENIED" title="Refuzate" />

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
